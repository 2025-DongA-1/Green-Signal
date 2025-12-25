const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * [이미지 컬럼 추가 및 데이터 업데이트 전용 스크립트]
 * 기존 데이터는 건드리지 않고, imgurl1 컬럼만 추가/업데이트합니다.
 */
async function updateImagesOnly() {
    // JSON 파일 경로 (필요하면 수정하세요: ../dist/products.json 등)
    const jsonPath = path.join(__dirname, '../project/public/products.json');
    
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ JSON 파일을 찾을 수 없습니다:', jsonPath);
        console.log('팁: 파일 위치가 다르다면 jsonPath 변수를 수정해주세요.');
        return;
    }

    console.log('📂 JSON 파일 읽는 중...');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const products = JSON.parse(rawData);
    console.log(`📦 총 ${products.length}개의 데이터를 읽었습니다.`);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'app_db'
    });

    try {
        console.log('🔗 MySQL에 연결되었습니다.');

        // 1. 컬럼 생성 (없을 경우에만)
        try {
            await connection.execute(`ALTER TABLE products ADD COLUMN imgurl1 VARCHAR(2048) DEFAULT NULL`);
            console.log('✅ imgurl1 컬럼이 성공적으로 생성되었습니다.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ imgurl1 컬럼이 이미 존재합니다. (생성 건너뜀)');
            } else {
                console.error('⚠️ 컬럼 생성 중 오류:', e.message);
            }
        }

        // 2. 이미지 업데이트
        console.log('🚀 이미지 데이터 업데이트 시작...');
        const query = `UPDATE products SET imgurl1 = ? WHERE report_no = ?`;
        
        let successCount = 0;

        for (const p of products) {
            const reportNo = (p.prdlstReportNo || '').trim();
            const imgUrl = (p.imgurl1 || '').trim();

            // 보고번호와 이미지가 모두 있을 때만 업데이트
            if (reportNo && imgUrl) {
                await connection.execute(query, [imgUrl, reportNo]);
                successCount++;
                
                if (successCount % 500 === 0) {
                    process.stdout.write(`.`); // 진행상황 표시
                }
            }
        }

        console.log(`\n\n✅ 작업 완료!`);
        console.log(`총 ${successCount}개의 상품에 이미지가 등록되었습니다.`);

    } catch (error) {
        console.error('\n❌ 치명적 오류 발생:', error);
    } finally {
        await connection.end();
    }
}

updateImagesOnly();

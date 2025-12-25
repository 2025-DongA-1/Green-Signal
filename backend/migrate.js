const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * [JSON 데이터를 MySQL로 마이그레이션하는 스크립트]
 */
async function migrate() {
    const jsonPath = path.join(__dirname, '../project/public/products.json');
    
    if (!fs.existsSync(jsonPath)) {
        console.error('❌ products.json 파일을 찾을 수 없습니다.');
        return;
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const products = JSON.parse(rawData);
    console.log(`📦 총 ${products.length}개의 데이터를 읽어왔습니다.`);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'app_db'
    });

    try {
        console.log('🔗 MySQL에 연결되었습니다.');

        // 0. (추가) imgurl1 컬럼이 없으면 자동으로 생성
        try {
            await connection.execute(`ALTER TABLE products ADD COLUMN imgurl1 VARCHAR(2048) DEFAULT NULL`);
            console.log('✅ imgurl1 컬럼이 생성되었습니다.');
        } catch (e) {
            // 컬럼이 이미 있으면 에러가 나는데 무시하면 됩니다.
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('ℹ️ 컬럼 생성 건너뜀 (이미 존재하거나 오류)');
        }

        // 1. 제품 정보 삽입 SQL (imgurl1 포함)
        const sqlProduct = `
            INSERT INTO products (
                report_no, product_gb, product_name, 
                raw_materials_text, allergy_text, nutrient_text, 
                kind_name, manufacturer, seller, capacity, imgurl1
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                product_name = VALUES(product_name), 
                imgurl1 = VALUES(imgurl1)
        `;

        // 2. 바코드 정보 삽입 SQL
        const sqlBarcode = `
            INSERT INTO product_barcodes (
                barcode, report_no, is_primary
            ) VALUES (?, ?, 1)
            ON DUPLICATE KEY UPDATE report_no = VALUES(report_no)
        `;

        let successCount = 0;
        let errorCount = 0;

        for (const p of products) {
            const reportNo = (p.prdlstReportNo || '').trim();
            const barcode = (p.barcode || '').trim();

            if (!reportNo) continue;

            try {
                // 제품 정보 삽입
                await connection.execute(sqlProduct, [
                    reportNo,
                    p.productGb || '식품',
                    p.prdlstNm || '',
                    p.rawmtrl || '',
                    p.allergy || '',
                    p.nutrient || '',
                    p.prdkind || '',
                    p.manufacture || '',
                    p.seller || '',
                    p.capacity || '',
                    p.imgurl1 || ''
                ]);

                // 바코드가 유효하면 삽입
                if (barcode && barcode !== '_' && barcode.length > 5) {
                    await connection.execute(sqlBarcode, [barcode, reportNo]);
                }

                successCount++;
                if (successCount % 500 === 0) {
                    console.log(`⏳ 진행 중... (${successCount}/${products.length})`);
                }
            } catch (err) {
                if (errorCount === 0) console.error('❌ 에러 발생:', err.message);
                errorCount++;
            }
        }

        console.log(`\n✅ 마이그레이션 완료!`);
        console.log(`성공: ${successCount}건`);
        console.log(`실패/중복: ${errorCount}건`);

    } catch (error) {
        console.error('❌ 치명적 오류:', error);
    } finally {
        await connection.end();
    }
}

migrate();

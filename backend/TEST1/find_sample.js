import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function findSample() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log("DATA CHECK: product_allergens 에 존재하는 제품 찾기...");
        
        // Find a report_no that is in product_allergens
        const [rows] = await conn.execute(`
            SELECT pa.report_no, pa.allergen_id, p.product_name 
            FROM product_allergens pa 
            LEFT JOIN products p ON pa.report_no = p.report_no 
            LIMIT 5
        `);

        if(rows.length === 0) {
            console.log("❌ product_allergens 테이블이 비어있거나 매칭되는 제품이 없습니다.");
        } else {
            console.log("✅ 유효한 데이터 샘플:");
            rows.forEach(r => {
                console.log(`   - 제품명: ${r.product_name || '(이름없음)'} / No: ${r.report_no} / AllergenID: ${r.allergen_id}`);
            });
        }

    } catch(e) {
        console.error(e);
    }
    conn.end();
}
findSample();

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkChoco() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log("Searching for '초코에몽'...");
    
    // 1. Find Product logic
    const [products] = await conn.execute("SELECT report_no, product_name FROM products WHERE product_name LIKE '%초코에몽%'");
    
    if (products.length === 0) {
        console.log("❌ '초코에몽' 제품을 products 테이블에서 찾을 수 없습니다.");
    } else {
        for (const p of products) {
            console.log(`\n📦 제품: ${p.product_name} (No: ${p.report_no})`);
            
            // 2. Check Allergens
            const [allergens] = await conn.execute("SELECT * FROM product_allergens WHERE report_no = ?", [p.report_no]);
            if (allergens.length > 0) {
                console.log(`   ✅ 알러지 데이터 존재: ${allergens.length}건`);
                console.log(allergens);
            } else {
                console.log(`   ❌ 알러지 데이터 없음 (product_allergens 테이블 비어있음)`);
            }
        }
    }
    conn.end();
}
checkChoco();

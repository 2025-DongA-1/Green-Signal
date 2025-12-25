import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testConnection() {
    console.log("🔌 DB 연결 테스트 시작...");
    console.log(`   Host: ${process.env.DB_HOST}`);
    console.log(`   User: ${process.env.DB_USER}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    
    try {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log("✅ DB 연결 성공!");
        
        const [rows] = await conn.execute("SELECT 1+1 AS result");
        console.log("   테스트 쿼리(SELECT 1+1) 결과:", rows[0].result);
        
        await conn.end();
    } catch(e) {
        console.error("❌ DB 연결 실패:", e.message);
    }
}

testConnection();

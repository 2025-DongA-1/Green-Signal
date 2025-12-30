import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// CSV 위치 (MySQL secure_file_priv 폴더)
const CSV_PATH = "C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/product_allergens.csv";

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  try {
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    await conn.query("TRUNCATE TABLE product_allergens");
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");

    // 스테이징 테이블에 로드
    await conn.query("DROP TEMPORARY TABLE IF EXISTS product_allergens_stage");
    await conn.query(`
      CREATE TEMPORARY TABLE product_allergens_stage (
        report_no VARCHAR(30),
        seq INT,
        allergen_id INT,
        raw_token TEXT
      )
    `);

    await conn.query(`
      LOAD DATA INFILE '${CSV_PATH.replace(/\\/g, '/')}'
      INTO TABLE product_allergens_stage
      CHARACTER SET utf8mb4
      FIELDS TERMINATED BY ',' ENCLOSED BY '"'
      LINES TERMINATED BY '\\r\\n'
      IGNORE 1 ROWS
    `);

    // 유효한 제품/알러지만 본 테이블로 삽입
    const [result] = await conn.query(`
      INSERT INTO product_allergens (report_no, seq, allergen_id, raw_token)
      SELECT s.report_no, s.seq, s.allergen_id, s.raw_token
      FROM product_allergens_stage s
      JOIN products p ON p.report_no = s.report_no
      JOIN allergens a ON a.allergen_id = s.allergen_id
    `);

    console.log(`✅ product_allergens inserted: ${result.affectedRows}`);
  } catch (err) {
    console.error("Import product_allergens failed:", err);
  } finally {
    await conn.end();
  }
}

main();

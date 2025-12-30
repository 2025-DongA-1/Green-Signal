import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const CSV_PATH = 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/product_allergens.csv';
const BATCH_SIZE = 1000;

function parseLine(line) {
  // split by comma but ignore commas inside quotes
  const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((s) => s.replace(/^"|"$/g, '').trim());
  return parts;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });

  try {
    const [allergens] = await conn.query('SELECT allergen_id, allergen_name FROM allergens');

    // helper: map raw_token to allergen_id by name
    const synonymMap = [
      { match: ['우유', '원유'], id: 2 },
    ];

    const resolveAllergenId = (rawToken, csvId) => {
      const token = (rawToken || '').trim();
      if (token) {
        const syn = synonymMap.find((s) => s.match.some((m) => token.includes(m)));
        if (syn) return syn.id;
        const found = allergens.find((a) => token.includes(a.allergen_name) || a.allergen_name.includes(token));
        if (found) return found.allergen_id;
      }
      const csv = parseInt(csvId, 10);
      if (allergens.some((a) => a.allergen_id === csv)) return csv;
      return null;
    };

    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE product_allergens');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const data = fs.readFileSync(CSV_PATH, 'utf8').split(/\r?\n/);
    data.shift(); // header

    let batch = [];
    let inserted = 0;
    for (const line of data) {
      if (!line.trim()) continue;
      const [report_no, seq, allergen_id_csv, raw_token = ''] = parseLine(line);
      if (!report_no) continue;

      const resolvedId = resolveAllergenId(raw_token, allergen_id_csv);
      if (!resolvedId) continue;

      batch.push([
        report_no,
        parseInt(seq || '0', 10) || 1,
        resolvedId,
        raw_token,
      ]);

      if (batch.length >= BATCH_SIZE) {
        await conn.query(
          'INSERT IGNORE INTO product_allergens (report_no, seq, allergen_id, raw_token) VALUES ?',
          [batch]
        );
        inserted += batch.length;
        batch = [];
      }
    }

    if (batch.length) {
      await conn.query(
        'INSERT IGNORE INTO product_allergens (report_no, seq, allergen_id, raw_token) VALUES ?',
        [batch]
      );
      inserted += batch.length;
    }

    console.log(`✅ Manual import complete. Inserted: ${inserted}`);
  } catch (err) {
    console.error('Manual import failed:', err);
  } finally {
    await conn.end();
  }
}

main();

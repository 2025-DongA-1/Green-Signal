import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const CSV_PATH = path.join(__dirname, '../../dist/테이블에 넣을 데이터들/product_allergens.csv');

async function importCSV() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log("Emptying table (TRUNCATE) before import...");
        await conn.query("SET FOREIGN_KEY_CHECKS = 0");
        await conn.query("TRUNCATE TABLE product_allergens");
        await conn.query("SET FOREIGN_KEY_CHECKS = 1");
        console.log("   Legacy data cleared.");

        console.log(`Reading CSV from: ${CSV_PATH}`);
        if (!fs.existsSync(CSV_PATH)) {
            console.error("❌ CSV File not found!");
            process.exit(1);
        }

        const fileStream = fs.createReadStream(CSV_PATH);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let count = 0;
        let inserted = 0;
        let skipped = 0;
        const batchSize = 1000;
        let batchParams = [];

        for await (const line of rl) {
            count++;
            if (count === 1) continue; // Skip Header

            // Header: report_no,seq,allergen_id,raw_token,collected_at...
            const cols = line.split(',');
            if (cols.length < 3) continue;

            const reportNo = cols[0].trim();
            const allergenIdStr = cols[2].trim();
            const rawToken = cols[3]?.trim() || '';

            if (!reportNo) continue;
            
            // Skip '998' (None) or non-numeric
            // User requested 998 inserted into allergens. 
            // BUT usually we don't insert a record into `product_allergens` that says "This product has NONE".
            // However, maybe the warning logic relies on EXISTENCE?
            // "If conflictAllergies.length > 0".
            // If I insert {reportNo, 998}, and User has Allergen 998? No user has allergy "None".
            // So inserting 998 is Harmless, but maybe useless row.
            // But having "Positive Confirmation of None" is good.
            // I'll insert it to be safe (since User added it to allergens table specifically).
            
            if (!allergenIdStr || isNaN(allergenIdStr)) {
                skipped++;
                continue;
            }

            const allergenId = parseInt(allergenIdStr, 10);
            
            batchParams.push([reportNo, allergenId, rawToken]);
            
            if (batchParams.length >= batchSize) {
                await insertBatch(conn, batchParams);
                inserted += batchParams.length;
                batchParams = [];
                process.stdout.write(`\rProcessed: ${count}, Inserted: ${inserted}`);
            }
        }

        if (batchParams.length > 0) {
            await insertBatch(conn, batchParams);
            inserted += batchParams.length;
        }

        console.log(`\n\n✅ Import Complete!`);
        console.log(`   Total Lines: ${count}`);
        console.log(`   Inserted: ${inserted}`);
        console.log(`   Skipped: ${skipped}`);

    } catch (e) {
        console.error("Error:", e);
    }
    conn.end();
}

async function insertBatch(conn, params) {
    if (params.length === 0) return;
    const sql = `INSERT IGNORE INTO product_allergens (report_no, allergen_id, raw_token, collected_at) VALUES ?`;
    const finalParams = params.map(p => [...p, new Date()]);
    await conn.query(sql, [finalParams]);
}

importCSV();

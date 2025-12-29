import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const data = [
        [31, "옥수수"],
        [32, "난각칼슘"],
        [33, "참깨"],
        [34, "무"],
        [35, "양파"],
        [36, "우류"],
        [37, "피칸"],
        [38, "아몬드"],
        [39, "헤이즐넛"],
        [40, "페닐알라닌"],
        [998, "없음"],
        [999, "알수없음"]
    ];

    console.log("Updating allergens table...");
    try {
        for (const [id, name] of data) {
            await conn.execute(
                "INSERT INTO allergens (allergen_id, allergen_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE allergen_name = ?", 
                [id, name, name]
            );
            console.log(`✅ ${id}: ${name}`);
        }
    } catch (e) {
        console.error(e);
    }
    conn.end();
}
main();

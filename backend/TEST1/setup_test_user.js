import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function setup() {
    const conn = await mysql.createConnection(DB_CONFIG);
    try {
        // 1. Check Allergens
        const [rows] = await conn.execute("SELECT * FROM allergens WHERE allergen_name LIKE '%우유%' OR allergen_name LIKE '%난류%'");
        console.log("Allergens found:", rows);

        if(rows.length > 0) {
            const milk = rows.find(r => r.allergen_name.includes('우유')) || rows[0];
            const userId = 1;
            
            // 2. Assign to User 1
            await conn.execute("INSERT IGNORE INTO user_allergens (user_id, allergen_id) VALUES (?, ?)", [userId, milk.allergen_id]);
            console.log(`✅ Assigned '${milk.allergen_name}' (ID: ${milk.allergen_id}) to User ${userId}`);
            
            // 3. Assign Diabetes (example) if exists
            const [diseases] = await conn.execute("SELECT * FROM diseases WHERE disease_name LIKE '%당뇨%'");
            if(diseases.length > 0) {
                 await conn.execute("INSERT IGNORE INTO user_diseases (user_id, disease_id) VALUES (?, ?)", [userId, diseases[0].disease_id]);
                 console.log(`✅ Assigned '${diseases[0].disease_name}' to User ${userId}`);
            }
        } else {
            console.log("❌ No allergens found. Is the table populated?");
        }

    } catch(e) {
        console.error(e);
    }
    conn.end();
}
setup();

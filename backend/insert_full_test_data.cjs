const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function insertFullTestData() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'app_db',
            port: process.env.DB_PORT || 3306
        });

        // 1. Insert Product (if not exists)
        // Using INSERT IGNORE to avoid error if duplicates exist
        console.log('Inserting into products...');
        await connection.execute(`
            INSERT IGNORE INTO products 
            (report_no, product_gb, product_name, manufacturer, seller, collected_at)
            VALUES 
            ('199902090001', 'processed', 'Test Milk Product', 'Test Factory', 'Test Seller', NOW())
        `);

        // 2. Insert Scan History
        console.log('Inserting into scan_history...');
        await connection.execute(`
            INSERT INTO scan_history (user_id, barcode, report_no, product_name_snapshot, scanned_at)
            VALUES (1, '8801234567890', '199902090001', 'Test Milk Product', NOW())
        `);

        // 3. Insert Favorites
        console.log('Inserting into favorites...');
        await connection.execute(`
            INSERT INTO favorites (user_id, report_no, product_name, manufacturer, grade, grade_text, created_at)
            VALUES (1, '199902090001', 'Test Milk Product', 'Test Factory', 'safe', '🟢 안전', NOW())
        `);

        console.log('✅ All test data inserted successfully!');
        await connection.end();
    } catch (e) {
        console.error('❌ Error inserting data:', e);
    }
}
insertFullTestData();

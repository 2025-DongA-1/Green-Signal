const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkData() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'app_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('--- SCAN HISTORY ---');
        const [historyCols] = await connection.query('SHOW COLUMNS FROM scan_history');
        console.log('Columns:', historyCols.map(c => c.Field));
        const [historyRows] = await connection.query('SELECT * FROM scan_history LIMIT 5');
        console.log('Data:', historyRows);

        console.log('\n--- FAVORITES ---');
        const [favCols] = await connection.query('SHOW COLUMNS FROM favorites');
        console.log('Columns:', favCols.map(c => c.Field));
        const [favRows] = await connection.query('SELECT * FROM favorites LIMIT 5');
        console.log('Data:', favRows);

        await connection.end();
    } catch (e) {
        console.error(e);
    }
}
checkData();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'app_db' 
    });

    try {
        console.log('--- Users Table Schema ---');
        const [rows] = await connection.execute('DESCRIBE users');
        console.table(rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkSchema();

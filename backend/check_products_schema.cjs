const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkProducts() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'app_db',
            port: process.env.DB_PORT || 3306
        });
        const [cols] = await connection.query('SHOW COLUMNS FROM products');
        console.log('Product Columns:', cols.map(c => c.Field));
        await connection.end();
    } catch (e) {
        console.error(e);
    }
}
checkProducts();

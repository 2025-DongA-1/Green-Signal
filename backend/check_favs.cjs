const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function checkFavorites() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'app_db',
            port: process.env.DB_PORT || 3306
        });
        const [rows] = await connection.query('SELECT * FROM favorites');
        console.log('Favorites in DB:', rows);
        await connection.end();
    } catch (e) {
        console.error(e);
    }
}
checkFavorites();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'app_db',
        port: process.env.DB_PORT || 3306
    });

    try {
        const [historyCols] = await connection.query("DESCRIBE scan_history");
        historyCols.forEach(c => console.log(c.Field, c.Type));

        console.log('\n--- favorites columns ---');
        const [favCols] = await connection.query("DESCRIBE favorites");
        favCols.forEach(c => console.log(c.Field, c.Type));

        console.log('\n--- users columns ---');
        const [userCols] = await connection.query("DESCRIBE users");
        userCols.forEach(c => console.log(c.Field, c.Type));
    } catch (e) {
        console.error(e);
    } finally {
        await connection.end();
    }
}

checkSchema();

const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUserData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'app_db' 
    });

    try {
        console.log('--- User Info ---');
        const [users] = await connection.execute('SELECT user_id, email, nickname FROM users');
        console.table(users);

        console.log('\n--- Favorites Count by User ID ---');
        const [favs] = await connection.execute('SELECT user_id, COUNT(*) as count FROM favorites GROUP BY user_id');
        console.table(favs);

        console.log('\n--- History Count by User ID ---');
        const [hist] = await connection.execute('SELECT user_id, COUNT(*) as count FROM scan_history GROUP BY user_id');
        console.table(hist);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkUserData();

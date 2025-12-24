const mysql = require('mysql2/promise');

async function checkDB() {
    console.log("🔍 Checking DB connection...");
    
    // 1. MySQL 접속 테스트 (DB 지정 없이)
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            port: 3306
        });
        console.log("✅ MySQL Login Success!");

        // 2. app_db 존재 확인
        const [rows] = await connection.query("SHOW DATABASES LIKE 'app_db'");
        if (rows.length === 0) {
            console.error("❌ Database 'app_db' NOT FOUND!");
            console.log("👉 Suggestion: Need to run 'CREATE DATABASE app_db;'");
            await connection.end();
            return;
        }
        console.log("✅ Database 'app_db' exists.");

        // 3. users 테이블 확인
        await connection.changeUser({ database: 'app_db' });
        const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
        if (tables.length === 0) {
            console.error("❌ Table 'users' NOT FOUND inside 'app_db'!");
            console.log("👉 Suggestion: Need to create 'users' table.");
        } else {
            console.log("✅ Table 'users' exists.");
            const [columns] = await connection.query("DESCRIBE users");
            console.log("📊 Columns in 'users':", columns.map(c => c.Field).join(', '));
        }

        await connection.end();
    } catch (err) {
        console.error("❌ Connection Failed:", err.message);
    }
}

checkDB();

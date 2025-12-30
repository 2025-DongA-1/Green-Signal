
import mysql from "mysql2/promise";

const config = {
  host: 'project-db-campus.smhrd.com',
  user: 'cgi_25K_donga1_p2_5',
  password: 'smhrd5',
  port: 3307
};

try {
  console.log("Connecting...");
  const connection = await mysql.createConnection(config);
  
  console.log("Attempting to create database cgi_25K_donga1_p2_5...");
  await connection.query("CREATE DATABASE IF NOT EXISTS `cgi_25K_donga1_p2_5`");
  console.log("Database created or already exists.");

  const [dbs] = await connection.query("SHOW DATABASES");
  console.table(dbs);
  
  await connection.end();
} catch (error) {
  console.error("Error:", error.message);
}

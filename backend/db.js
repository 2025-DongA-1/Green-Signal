import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

/*
[배포/운영 DB 접속 정보]
필요 시 .env 파일을 아래 정보로 수정하거나, 위 설정 값을 직접 변경하여 사용하세요.

URL (host) : project-db-campus.smhrd.com
PORT       : 3307
USER       : cgi_25K_donga1_p2_5
PW         : smhrd5
DataBase   : cgi_25K_donga1_p2_5
*/

export default db;

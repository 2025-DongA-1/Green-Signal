import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
const cfg = { host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: process.env.DB_PORT };
const run = async () => {
  const c = await mysql.createConnection(cfg);
  const [p] = await c.query("SELECT report_no, allergen_id, raw_token FROM product_allergens WHERE report_no IN ('196404480011','1964044800110')");
  console.log(p);
  await c.end();
};
run();

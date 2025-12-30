import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const allergens = [
  [1, '난류(가금류)'],
  [2, '우유'],
  [3, '메밀'],
  [4, '땅콩'],
  [5, '대두'],
  [6, '밀'],
  [7, '호두'],
  [8, '고등어'],
  [9, '게'],
  [10, '새우'],
  [11, '돼지고기'],
  [12, '복숭아'],
  [13, '토마토'],
  [14, '아황산류'],
  [15, '쇠고기'],
  [16, '닭고기'],
  [17, '조개류(굴, 전복, 홍합 포함)'],
  [18, '오징어'],
  [19, '잣'],
  [998, '해당 없음'],
  [999, '불명']
];

const diseases = [
  [1, '당뇨병'],
  [2, '고혈압'],
  [3, '고지혈증'],
  [4, '신장질환'],
  [5, '간질환'],
  [6, '심장질환'],
  [7, '갑상선질환'],
  [8, '임산부/수유부'],
  [9, '어린이'],
  [10, '노약자']
];

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'app_db',
    port: parseInt(process.env.DB_PORT, 10) || 3306
  });

  try {
    console.log('Seeding allergens...');
    for (const [id, name] of allergens) {
      await conn.execute(
        'INSERT INTO allergens (allergen_id, allergen_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE allergen_name = VALUES(allergen_name)',
        [id, name]
      );
    }

    console.log('Seeding diseases...');
    for (const [id, name] of diseases) {
      await conn.execute(
        'INSERT INTO diseases (disease_id, disease_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE disease_name = VALUES(disease_name)',
        [id, name]
      );
    }

    console.log('✅ Seeding completed');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await conn.end();
  }
}

seed();

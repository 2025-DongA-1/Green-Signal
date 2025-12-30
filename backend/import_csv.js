import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Absolute path where CSVs live (secure_file_priv)
const CSV_DIR = 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads';

const createStatements = `
CREATE DATABASE IF NOT EXISTS \`\${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE \`\${process.env.DB_NAME}\`;

CREATE TABLE IF NOT EXISTS users (
  user_id INT NOT NULL AUTO_INCREMENT,
  provider VARCHAR(20) NULL,
  social_id VARCHAR(100) NULL,
  email VARCHAR(250) NOT NULL,
  password VARCHAR(250) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  is_active TINYINT NOT NULL DEFAULT 1,
  refresh_token TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_provider_social (provider, social_id),
  KEY idx_users_provider (provider),
  KEY idx_users_social_id (social_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS products (
  report_no varchar(30) NOT NULL COMMENT '품목보고번호',
  product_gb varchar(20) NOT NULL COMMENT '축산/식품구분',
  product_name varchar(255) NOT NULL COMMENT '제품명',
  raw_materials_text text COMMENT '원재료(원문)',
  allergy_text text COMMENT '알레르기유발물질(원문)',
  nutrient_text text COMMENT '영양성분(원문)',
  kind_name varchar(100) DEFAULT NULL COMMENT '유형명',
  kind_state varchar(50) DEFAULT NULL COMMENT '유형의상태',
  manufacturer varchar(255) DEFAULT NULL COMMENT '제조원',
  seller varchar(255) DEFAULT NULL COMMENT '판매원',
  capacity varchar(100) DEFAULT NULL COMMENT '용량',
  imgurl1 text COMMENT '이미지',
  collected_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수집시간',
  PRIMARY KEY (report_no),
  KEY idx_products_name (product_name),
  KEY idx_products_kind (kind_name),
  KEY idx_products_gb (product_gb)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT='식품정보 테이블';

CREATE TABLE IF NOT EXISTS product_barcodes (
  barcode VARCHAR(30) NOT NULL,
  report_no VARCHAR(30) NOT NULL,
  is_primary TINYINT NOT NULL DEFAULT 0,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (barcode),
  CONSTRAINT fk_product_barcodes_report_no FOREIGN KEY (report_no)
    REFERENCES products (report_no)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  KEY idx_barcodes_report_no (report_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS product_ingredients (
  report_no VARCHAR(30) NOT NULL,
  seq INT NOT NULL,
  ingredient_name VARCHAR(255) NOT NULL,
  raw_token TEXT NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_no, seq),
  KEY idx_ingredients_name (ingredient_name),
  KEY idx_ingredients_report_seq (report_no, seq),
  CONSTRAINT fk_product_ingredients_report_no FOREIGN KEY (report_no)
    REFERENCES products (report_no)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS allergens (
  allergen_id INT NOT NULL AUTO_INCREMENT,
  allergen_name VARCHAR(100) NOT NULL,
  synonyms TEXT NULL,
  description TEXT NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (allergen_id),
  UNIQUE KEY uk_allergens_name (allergen_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS product_allergens (
  report_no VARCHAR(30) NOT NULL,
  seq INT NOT NULL,
  allergen_id INT NOT NULL,
  raw_token TEXT NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_no, seq),
  KEY idx_product_allergens_allergen (allergen_id),
  KEY idx_product_allergens_report (report_no),
  CONSTRAINT fk_product_allergens_report_no FOREIGN KEY (report_no)
    REFERENCES products (report_no)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_product_allergens_allergen_id FOREIGN KEY (allergen_id)
    REFERENCES allergens (allergen_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS diseases (
  disease_id INT NOT NULL AUTO_INCREMENT,
  disease_name VARCHAR(100) NOT NULL,
  description TEXT NULL,
  PRIMARY KEY (disease_id),
  UNIQUE KEY uk_diseases_name (disease_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_diseases (
  user_id INT NOT NULL,
  disease_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, disease_id),
  CONSTRAINT fk_user_diseases_user_id FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_user_diseases_disease_id FOREIGN KEY (disease_id)
    REFERENCES diseases (disease_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_allergens (
  user_id INT NOT NULL,
  allergen_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, allergen_id),
  CONSTRAINT fk_user_allergens_user_id FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_user_allergens_allergen_id FOREIGN KEY (allergen_id)
    REFERENCES allergens (allergen_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sweeteners (
  sweetener_id INT NOT NULL AUTO_INCREMENT,
  sweetener_name VARCHAR(100) NOT NULL,
  synonyms TEXT NULL,
  glycemic_impact VARCHAR(10) NOT NULL DEFAULT 'NEUTRAL',
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sweetener_id),
  UNIQUE KEY uk_sweeteners_name (sweetener_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS product_sweeteners (
  report_no VARCHAR(30) NOT NULL,
  seq INT NOT NULL,
  sweetener_id INT NOT NULL,
  raw_token TEXT NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_no, seq),
  KEY idx_product_sweeteners_sid (sweetener_id),
  KEY idx_product_sweeteners_report (report_no),
  CONSTRAINT fk_product_sweeteners_report_no FOREIGN KEY (report_no)
    REFERENCES products (report_no)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_product_sweeteners_sweetener_id FOREIGN KEY (sweetener_id)
    REFERENCES sweeteners (sweetener_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sweetener_disease_rules (
  rule_id INT NOT NULL AUTO_INCREMENT,
  sweetener_id INT NOT NULL,
  disease_id INT NOT NULL,
  restriction_level VARCHAR(20) NOT NULL,
  message VARCHAR(500) NOT NULL,
  evidence_note TEXT NULL,
  is_active TINYINT NOT NULL DEFAULT 1,
  PRIMARY KEY (rule_id),
  UNIQUE KEY uniq_rule (sweetener_id, disease_id),
  CONSTRAINT fk_sdr_sweetener_id FOREIGN KEY (sweetener_id)
    REFERENCES sweeteners (sweetener_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_sdr_disease_id FOREIGN KEY (disease_id)
    REFERENCES diseases (disease_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS warning_cache (
  user_id INT NOT NULL,
  report_no VARCHAR(30) NOT NULL,
  warning_level VARCHAR(20) NOT NULL,
  computed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, report_no),
  CONSTRAINT fk_warning_cache_user_id FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_warning_cache_report_no FOREIGN KEY (report_no)
    REFERENCES products (report_no)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS favorites (
  user_id INT NOT NULL,
  report_no VARCHAR(30) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, report_no),
  CONSTRAINT fk_favorites_user_id FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_favorites_report_no FOREIGN KEY (report_no)
    REFERENCES products (report_no)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS scan_history (
  scan_id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  barcode VARCHAR(30) NULL,
  report_no VARCHAR(30) NULL,
  product_name_snapshot VARCHAR(255) NULL,
  warning_level_snapshot VARCHAR(20) NULL,
  scanned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (scan_id),
  KEY idx_scan_history_scanned_at (scanned_at),
  KEY idx_scan_history_user_scanned_at (user_id, scanned_at),
  KEY idx_scan_history_barcode (barcode),
  KEY idx_scan_history_report_no (report_no),
  CONSTRAINT fk_scan_history_user_id FOREIGN KEY (user_id)
    REFERENCES users (user_id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_scan_history_report_no FOREIGN KEY (report_no)
    REFERENCES products (report_no)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS nutrition_facts_raw (
  report_no VARCHAR(30) NOT NULL,
  num VARCHAR(30) NOT NULL,
  food_cd VARCHAR(50) NULL,
  serving_size VARCHAR(50) NULL,
  amt_num1  VARCHAR(50) NULL,
  amt_num2  VARCHAR(50) NULL,
  amt_num3  VARCHAR(50) NULL,
  amt_num4  VARCHAR(50) NULL,
  amt_num5  VARCHAR(50) NULL,
  amt_num6  VARCHAR(50) NULL,
  amt_num7  VARCHAR(50) NULL,
  amt_num8  VARCHAR(50) NULL,
  amt_num9  VARCHAR(50) NULL,
  amt_num10 VARCHAR(50) NULL,
  amt_num11 VARCHAR(50) NULL,
  amt_num12 VARCHAR(50) NULL,
  amt_num13 VARCHAR(50) NULL,
  amt_num14 VARCHAR(50) NULL,
  amt_num15 VARCHAR(50) NULL,
  amt_num16 VARCHAR(50) NULL,
  amt_num17 VARCHAR(50) NULL,
  amt_num18 VARCHAR(50) NULL,
  amt_num19 VARCHAR(50) NULL,
  amt_num20 VARCHAR(50) NULL,
  amt_num21 VARCHAR(50) NULL,
  amt_num22 VARCHAR(50) NULL,
  amt_num23 VARCHAR(50) NULL,
  amt_num24 VARCHAR(50) NULL,
  amt_num25 VARCHAR(50) NULL,
  amt_num26 VARCHAR(50) NULL,
  amt_num27 VARCHAR(50) NULL,
  amt_num28 VARCHAR(50) NULL,
  amt_num29 VARCHAR(50) NULL,
  amt_num30 VARCHAR(50) NULL,
  amt_num31 VARCHAR(50) NULL,
  amt_num32 VARCHAR(50) NULL,
  amt_num33 VARCHAR(50) NULL,
  amt_num34 VARCHAR(50) NULL,
  amt_num35 VARCHAR(50) NULL,
  amt_num36 VARCHAR(50) NULL,
  amt_num37 VARCHAR(50) NULL,
  amt_num38 VARCHAR(50) NULL,
  amt_num39 VARCHAR(50) NULL,
  amt_num40 VARCHAR(50) NULL,
  amt_num41 VARCHAR(50) NULL,
  amt_num42 VARCHAR(50) NULL,
  amt_num43 VARCHAR(50) NULL,
  amt_num44 VARCHAR(50) NULL,
  amt_num45 VARCHAR(50) NULL,
  amt_num46 VARCHAR(50) NULL,
  amt_num47 VARCHAR(50) NULL,
  amt_num48 VARCHAR(50) NULL,
  amt_num49 VARCHAR(50) NULL,
  amt_num50 VARCHAR(50) NULL,
  amt_num51 VARCHAR(50) NULL,
  amt_num52 VARCHAR(50) NULL,
  amt_num53 VARCHAR(50) NULL,
  amt_num54 VARCHAR(50) NULL,
  amt_num55 VARCHAR(50) NULL,
  amt_num56 VARCHAR(50) NULL,
  amt_num57 VARCHAR(50) NULL,
  amt_num58 VARCHAR(50) NULL,
  amt_num59 VARCHAR(50) NULL,
  amt_num60 VARCHAR(50) NULL,
  amt_num61 VARCHAR(50) NULL,
  amt_num62 VARCHAR(50) NULL,
  amt_num63 VARCHAR(50) NULL,
  amt_num64 VARCHAR(50) NULL,
  amt_num65 VARCHAR(50) NULL,
  amt_num66 VARCHAR(50) NULL,
  amt_num67 VARCHAR(50) NULL,
  amt_num68 VARCHAR(50) NULL,
  amt_num69 VARCHAR(50) NULL,
  amt_num70 VARCHAR(50) NULL,
  amt_num71 VARCHAR(50) NULL,
  amt_num72 VARCHAR(50) NULL,
  amt_num73 VARCHAR(50) NULL,
  amt_num74 VARCHAR(50) NULL,
  amt_num75 VARCHAR(50) NULL,
  amt_num76 VARCHAR(50) NULL,
  amt_num77 VARCHAR(50) NULL,
  amt_num78 VARCHAR(50) NULL,
  amt_num79 VARCHAR(50) NULL,
  amt_num80 VARCHAR(50) NULL,
  amt_num81 VARCHAR(50) NULL,
  amt_num82 VARCHAR(50) NULL,
  amt_num83 VARCHAR(50) NULL,
  amt_num84 VARCHAR(50) NULL,
  amt_num85 VARCHAR(50) NULL,
  amt_num86 VARCHAR(50) NULL,
  amt_num87 VARCHAR(50) NULL,
  amt_num88 VARCHAR(50) NULL,
  amt_num89 VARCHAR(50) NULL,
  amt_num90 VARCHAR(50) NULL,
  amt_num91 VARCHAR(50) NULL,
  amt_num92 VARCHAR(50) NULL,
  amt_num93 VARCHAR(50) NULL,
  amt_num94 VARCHAR(50) NULL,
  amt_num95 VARCHAR(50) NULL,
  amt_num96 VARCHAR(50) NULL,
  amt_num97 VARCHAR(50) NULL,
  amt_num98 VARCHAR(50) NULL,
  amt_num99 VARCHAR(50) NULL,
  amt_num100 VARCHAR(50) NULL,
  amt_num101 VARCHAR(50) NULL,
  amt_num102 VARCHAR(50) NULL,
  amt_num103 VARCHAR(50) NULL,
  amt_num104 VARCHAR(50) NULL,
  amt_num105 VARCHAR(50) NULL,
  amt_num106 VARCHAR(50) NULL,
  amt_num107 VARCHAR(50) NULL,
  amt_num108 VARCHAR(50) NULL,
  amt_num109 VARCHAR(50) NULL,
  amt_num110 VARCHAR(50) NULL,
  amt_num111 VARCHAR(50) NULL,
  amt_num112 VARCHAR(50) NULL,
  amt_num113 VARCHAR(50) NULL,
  amt_num114 VARCHAR(50) NULL,
  amt_num115 VARCHAR(50) NULL,
  amt_num116 VARCHAR(50) NULL,
  amt_num117 VARCHAR(50) NULL,
  amt_num118 VARCHAR(50) NULL,
  amt_num119 VARCHAR(50) NULL,
  amt_num120 VARCHAR(50) NULL,
  amt_num121 VARCHAR(50) NULL,
  amt_num122 VARCHAR(50) NULL,
  amt_num123 VARCHAR(50) NULL,
  amt_num124 VARCHAR(50) NULL,
  amt_num125 VARCHAR(50) NULL,
  amt_num126 VARCHAR(50) NULL,
  amt_num127 VARCHAR(50) NULL,
  amt_num128 VARCHAR(50) NULL,
  amt_num129 VARCHAR(50) NULL,
  amt_num130 VARCHAR(50) NULL,
  amt_num131 VARCHAR(50) NULL,
  amt_num132 VARCHAR(50) NULL,
  amt_num133 VARCHAR(50) NULL,
  amt_num134 VARCHAR(50) NULL,
  amt_num135 VARCHAR(50) NULL,
  amt_num136 VARCHAR(50) NULL,
  amt_num137 VARCHAR(50) NULL,
  amt_num138 VARCHAR(50) NULL,
  amt_num139 VARCHAR(50) NULL,
  amt_num140 VARCHAR(50) NULL,
  amt_num141 VARCHAR(50) NULL,
  amt_num142 VARCHAR(50) NULL,
  amt_num143 VARCHAR(50) NULL,
  amt_num144 VARCHAR(50) NULL,
  amt_num145 VARCHAR(50) NULL,
  amt_num146 VARCHAR(50) NULL,
  amt_num147 VARCHAR(50) NULL,
  amt_num148 VARCHAR(50) NULL,
  amt_num149 VARCHAR(50) NULL,
  amt_num150 VARCHAR(50) NULL,
  amt_num151 VARCHAR(50) NULL,
  amt_num152 VARCHAR(50) NULL,
  amt_num153 VARCHAR(50) NULL,
  amt_num154 VARCHAR(50) NULL,
  amt_num155 VARCHAR(50) NULL,
  amt_num156 VARCHAR(50) NULL,
  amt_num157 VARCHAR(50) NULL,
  sub_ref_cm VARCHAR(30) NULL,
  sub_ref_name VARCHAR(200) NULL,
  nutri_amount_serving VARCHAR(255) NULL,
  z10500 VARCHAR(255) NULL,
  dish_one_serving VARCHAR(255) NULL,
  item_report_no VARCHAR(30) NULL,
  imp_yn VARCHAR(10) NULL,
  nation_cm VARCHAR(10) NULL,
  nation_nm VARCHAR(100) NULL,
  research_ymd VARCHAR(20) NULL,
  update_date VARCHAR(20) NULL,
  collected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_no, num),
  CONSTRAINT fk_nutrition_facts_raw_report_no FOREIGN KEY (report_no)
    REFERENCES products (report_no)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_0900_ai_ci;
`;

const loadCommands = [
  { table: 'allergens', file: 'allergens.csv', cols: '(allergen_id, allergen_name, synonyms, description)' },
  { table: 'diseases', file: 'diseases.csv', cols: '(disease_id, disease_name, description)' },
  { table: 'sweeteners', file: 'sweeteners.csv', cols: '(sweetener_id, sweetener_name, synonyms, glycemic_impact)' },
  { table: 'sweetener_disease_rules', file: 'sweetener_rules.csv', cols: '(sweetener_id, disease_id, restriction_level, message, evidence_note, is_active)' },
  { table: 'products', file: 'product.csv', cols: '(report_no, product_gb, product_name, raw_materials_text, allergy_text, nutrient_text, kind_name, kind_state, manufacturer, seller, capacity)' },
];

const nutritionCols = (() => {
  const cols = ['report_no', 'num', 'food_cd', 'serving_size'];
  for (let i = 1; i <= 157; i++) cols.push(`amt_num${i}`);
  cols.push('sub_ref_cm', 'sub_ref_name', 'nutri_amount_serving', 'z10500', 'dish_one_serving', 'item_report_no', 'imp_yn', 'nation_cm', 'nation_nm', 'research_ymd', 'update_date', 'collected_at');
  return cols;
})();

async function loadDirect(conn, cmd) {
  const filePath = path.join(CSV_DIR, cmd.file).replace(/\\/g, '/');
  const sql = `
    LOAD DATA INFILE '${filePath}'
    INTO TABLE ${cmd.table}
    CHARACTER SET utf8mb4
    FIELDS TERMINATED BY ',' ENCLOSED BY '"'
    LINES TERMINATED BY '\\r\\n'
    IGNORE 1 ROWS
    ${cmd.cols};
  `;
  await conn.query(sql);
}

async function loadWithStage(conn, stageName, createDDL, file, targetInsertSQL) {
  const filePath = path.join(CSV_DIR, file).replace(/\\/g, '/');
  await conn.query(`DROP TEMPORARY TABLE IF EXISTS ${stageName}`);
  await conn.query(createDDL);
  const sql = `
    LOAD DATA INFILE '${filePath}'
    INTO TABLE ${stageName}
    CHARACTER SET utf8mb4
    FIELDS TERMINATED BY ',' ENCLOSED BY '"'
    LINES TERMINATED BY '\\r\\n'
    IGNORE 1 ROWS;
  `;
  await conn.query(sql);
  await conn.query(targetInsertSQL);
  await conn.query(`DROP TEMPORARY TABLE IF EXISTS ${stageName}`);
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    console.log('Ensuring schema exists...');
    await conn.query(createStatements);

    await conn.changeUser({ database: process.env.DB_NAME || 'app_db' });
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    const truncateOrder = [
      'warning_cache',
      'favorites',
      'scan_history',
      'user_allergens',
      'user_diseases',
      'product_allergens',
      'product_ingredients',
      'product_barcodes',
      'product_sweeteners',
      'sweetener_disease_rules',
      'sweeteners',
      'diseases',
      'allergens',
      'nutrition_facts_raw',
      'products',
    ];
    for (const t of truncateOrder) {
      await conn.query(`TRUNCATE TABLE ${t}`);
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    for (const cmd of loadCommands) {
      console.log(`Loading ${cmd.table} ...`);
      await loadDirect(conn, cmd);
    }

    console.log('Loading product_barcodes (stage)...');
    await loadWithStage(
      conn,
      'product_barcodes_stage',
      `CREATE TEMPORARY TABLE product_barcodes_stage (
        barcode VARCHAR(30),
        report_no VARCHAR(30),
        is_primary TINYINT,
        collected_at DATETIME
      )`,
      'product_barcodes.csv',
      `INSERT INTO product_barcodes (barcode, report_no, is_primary, collected_at)
       SELECT s.barcode, s.report_no, s.is_primary, s.collected_at
       FROM product_barcodes_stage s
       JOIN products p ON p.report_no = s.report_no`
    );

    console.log('Loading product_ingredients (stage)...');
    await loadWithStage(
      conn,
      'product_ingredients_stage',
      `CREATE TEMPORARY TABLE product_ingredients_stage (
        report_no VARCHAR(30),
        seq INT,
        ingredient_name VARCHAR(255),
        raw_token TEXT
      )`,
      'product_ingredients.csv',
      `INSERT INTO product_ingredients (report_no, seq, ingredient_name, raw_token)
       SELECT s.report_no, s.seq, s.ingredient_name, s.raw_token
       FROM product_ingredients_stage s
       JOIN products p ON p.report_no = s.report_no`
    );

    console.log('Loading product_allergens (stage)...');
    await loadWithStage(
      conn,
      'product_allergens_stage',
      `CREATE TEMPORARY TABLE product_allergens_stage (
        report_no VARCHAR(30),
        seq INT,
        allergen_id INT,
        raw_token TEXT
      )`,
      'product_allergens.csv',
      `INSERT INTO product_allergens (report_no, seq, allergen_id, raw_token)
       SELECT s.report_no, s.seq, s.allergen_id, s.raw_token
       FROM product_allergens_stage s
       JOIN products p ON p.report_no = s.report_no
       JOIN allergens a ON a.allergen_id = s.allergen_id`
    );

    console.log('Loading product_sweeteners (stage)...');
    await loadWithStage(
      conn,
      'product_sweeteners_stage',
      `CREATE TEMPORARY TABLE product_sweeteners_stage (
        report_no VARCHAR(30),
        seq INT,
        sweetener_id INT,
        raw_token TEXT
      )`,
      'product_sweeteners.csv',
      `INSERT INTO product_sweeteners (report_no, seq, sweetener_id, raw_token)
       SELECT s.report_no, s.seq, s.sweetener_id, s.raw_token
       FROM product_sweeteners_stage s
       JOIN products p ON p.report_no = s.report_no
       JOIN sweeteners sw ON sw.sweetener_id = s.sweetener_id`
    );

    console.log('Loading nutrition_facts_raw (stage)...');
    await loadWithStage(
      conn,
      'nutrition_stage',
      `CREATE TEMPORARY TABLE nutrition_stage (
        ${nutritionCols.map(c => `${c} TEXT`).join(',\n')}
      )`,
      'nutrition_raw.csv',
      `INSERT INTO nutrition_facts_raw (${nutritionCols.join(', ')})
       SELECT ${nutritionCols.map(c => `ns.${c}`).join(', ')}
       FROM nutrition_stage ns
       JOIN products p ON p.report_no = ns.report_no`
    );

    // Seed a basic user (matching the example)
    await conn.execute(
      `INSERT INTO users (provider, social_id, email, password, nickname)
       VALUES (NULL, NULL, 'test@example.com', 'dummy', 'tester')
       ON DUPLICATE KEY UPDATE nickname = VALUES(nickname)`
    );

    console.log('✅ CSV import completed.');
  } catch (err) {
    console.error('Import failed:', err);
  } finally {
    await conn.end();
  }
}

main();

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env path: TEST1 -> backend -> .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const DB_CONFIG = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

async function checkProductSafety(userId, keyword) {
    console.log(`\n🔎 [Product Safety Check] User: ${userId}, Keyword: "${keyword}"`);
    
    let conn;
    try {
        conn = await mysql.createConnection(DB_CONFIG);

        // 1. Find Products
        const [products] = await conn.execute(
            `SELECT report_no, product_name, manufacturer 
             FROM products 
             WHERE product_name LIKE ? 
             LIMIT 5`, 
            [`%${keyword}%`]
        );

        if (products.length === 0) {
            console.log("❌ No products found.");
            return;
        }

        // 2. Get User Profile (Allergies & Diseases)
        const [uAllergies] = await conn.execute(`SELECT allergen_id FROM user_allergens WHERE user_id = ?`, [userId]);
        const userAllergyIds = uAllergies.map(r => r.allergen_id);

        const [uDiseases] = await conn.execute(`SELECT disease_id FROM user_diseases WHERE user_id = ?`, [userId]);
        const userDiseaseIds = uDiseases.map(r => r.disease_id);

        console.log(`👤 User Profile -> Allergy IDs: [${userAllergyIds}], Disease IDs: [${userDiseaseIds}]`);
        if (userAllergyIds.length === 0 && userDiseaseIds.length === 0) {
            console.log("ℹ️  User has no registered allergies or diseases.");
        }

        // [주석] 3. 각 제품에 대해 안전성 검사 루프
        for (const p of products) {
            console.log(`\n📦 제품명: ${p.product_name} (보고번호: ${p.report_no})`);
            
            let warnings = [];

            // [주석] A. 제품 알러지 정보 조회
            // product_allergens 테이블과 allergens 테이블을 조인하여 알러지명을 가져옵니다.
            const [pAllergens] = await conn.execute(
                `SELECT pa.allergen_id, a.allergen_name 
                 FROM product_allergens pa 
                 JOIN allergens a ON pa.allergen_id = a.allergen_id 
                 WHERE pa.report_no = ?`,
                [p.report_no]
            );

            // [디버그] 알러지 데이터 개수 확인
            if (pAllergens.length === 0) console.log(`   (주의: 해당 제품의 알러지 데이터가 DB에 없습니다.)`);

            // [주석] 유저의 알러지와 제품의 알러지 비교
            const conflictAllergies = pAllergens.filter(pa => userAllergyIds.includes(pa.allergen_id));
            if (conflictAllergies.length > 0) {
                const names = conflictAllergies.map(a => a.allergen_name).join(', ');
                warnings.push(`🚨 [알러지 경고] 다음 성분이 포함됨: ${names}`);
            }

            // [주석] B. 감미료 및 질병 상충 확인
            // 감미료 정보와 감미료별 질병 주의 규칙(sweetener_disease_rules)을 조회
            const [pSweeteners] = await conn.execute(
                `SELECT ps.sweetener_id, s.sweetener_name 
                 FROM product_sweeteners ps 
                 JOIN sweeteners s ON ps.sweetener_id = s.sweetener_id 
                 WHERE ps.report_no = ?`, 
                [p.report_no]
            );

            for (const s of pSweeteners) {
                const [rules] = await conn.execute(
                    `SELECT disease_id, restriction_level, message 
                     FROM sweetener_disease_rules 
                     WHERE sweetener_id = ?`,
                    [s.sweetener_id]
                );
                
                // 유저의 질병과 규칙이 일치하는지 확인
                const conflictRules = rules.filter(r => userDiseaseIds.includes(r.disease_id));
                conflictRules.forEach(r => {
                    warnings.push(`⚠️  [지병 주의] (${s.sweetener_name}): ${r.message || '섭취 주의가 필요합니다.'}`);
                });
            }

            // [주석] 결과 출력
            if (warnings.length > 0) {
                warnings.forEach(w => console.log(`   ${w}`));
                // "기록" - 추후 이곳에 DB insert 로직을 추가하여 검색 기록을 저장할 수 있습니다.
            } else {
                console.log("   ✅ 안전함 (주의 성분 발견되지 않음)");
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        if (conn) await conn.end();
    }
}

// Run if called directly
const args = process.argv.slice(2);
const uid = args[0] || 1;
const key = args[1] || '우유'; // Default keyword
checkProductSafety(uid, key);

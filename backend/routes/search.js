import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/search (When mounted at /api/search, this path is /)
router.get('/', async (req, res) => {
    const { query, userId } = req.query;
    if (!query) return res.json([]);

    try {
        // 1. 제품 검색
        const [products] = await db.query(`
            SELECT 
                report_no, 
                product_name AS name, 
                capacity AS price, 
                imgurl1 AS img, 
                seller 
            FROM products 
            WHERE product_name LIKE ? OR report_no LIKE ?
            LIMIT 50
        `, [`%${query}%`, `%${query}%`]);

        // 2. 로그인 유저가 있으면 경고 정보 확인
        if (userId) {
            // A. 유저 알러지/질병 정보 조회
            const [uAllergies] = await db.query(`SELECT allergen_id FROM user_allergens WHERE user_id = ?`, [userId]);
            const userAllergyIds = uAllergies.map(r => r.allergen_id);

            const [uDiseases] = await db.query(`SELECT disease_id FROM user_diseases WHERE user_id = ?`, [userId]);
            const userDiseaseIds = uDiseases.map(r => r.disease_id);

            // B. 각 제품별로 체크
            for (const p of products) {
                p.warnings = []; // 경고 목록 초기화

                // [알러지 체크]
                const [pAllergens] = await db.query(
                    `SELECT pa.allergen_id, a.allergen_name 
                     FROM product_allergens pa 
                     JOIN allergens a ON pa.allergen_id = a.allergen_id 
                     WHERE pa.report_no = ?`, 
                    [p.report_no]
                );
                
                const conflictAllergies = pAllergens.filter(pa => userAllergyIds.includes(pa.allergen_id));
                if (conflictAllergies.length > 0) {
                    const names = conflictAllergies.map(a => a.allergen_name).join(', ');
                    p.warnings.push(`🚨 알러지 주의: ${names} 함유`);
                }

                // [감미료/지병 체크]
                const [pSweeteners] = await db.query(
                    `SELECT ps.sweetener_id, s.sweetener_name 
                     FROM product_sweeteners ps 
                     JOIN sweeteners s ON ps.sweetener_id = s.sweetener_id 
                     WHERE ps.report_no = ?`, 
                    [p.report_no]
                );

                for (const s of pSweeteners) {
                    const [rules] = await db.query(
                        `SELECT disease_id, message FROM sweetener_disease_rules WHERE sweetener_id = ?`,
                        [s.sweetener_id]
                    );
                    
                    const conflicts = rules.filter(r => userDiseaseIds.includes(r.disease_id));
                    conflicts.forEach(c => {
                        p.warnings.push(`⚠️ 지병 주의 (${s.sweetener_name}): ${c.message}`);
                    });
                }
            }
        }

        res.json(products);

    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;

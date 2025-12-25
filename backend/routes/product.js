import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET /api/product/check-safety
// 파라미터: reportNo, userId
router.get('/check-safety', async (req, res) => {
    const { reportNo, userId } = req.query;
    if (!reportNo) return res.status(400).json({ error: "reportNo is required" });

    // 결과 객체 (경고 목록)
    const result = { warnings: [] };

    // 로그인하지 않은 경우 빈 배열 반환
    if (!userId) return res.json(result);

    try {
        // 1. 유저 알러지/질병 정보 조회
        const [uAllergies] = await db.query(`SELECT allergen_id FROM user_allergens WHERE user_id = ?`, [userId]);
        const userAllergyIds = uAllergies.map(r => r.allergen_id);

        const [uDiseases] = await db.query(`SELECT disease_id FROM user_diseases WHERE user_id = ?`, [userId]);
        const userDiseaseIds = uDiseases.map(r => r.disease_id);

        // 2. 알러지 체크
        const [pAllergens] = await db.query(
            `SELECT pa.allergen_id, a.allergen_name 
             FROM product_allergens pa 
             JOIN allergens a ON pa.allergen_id = a.allergen_id 
             WHERE pa.report_no = ?`, 
            [reportNo]
        );
        
        const conflictAllergies = pAllergens.filter(pa => userAllergyIds.includes(pa.allergen_id));
        if (conflictAllergies.length > 0) {
            const names = conflictAllergies.map(a => a.allergen_name).join(', ');
            // UI 표시용 메시지
            result.warnings.push({
                type: 'allergy',
                title: '알러지 주의',
                message: `${names} 성분이 포함되어 있습니다.`
            });
        }

        // 3. 지병/감미료 체크
        const [pSweeteners] = await db.query(
            `SELECT ps.sweetener_id, s.sweetener_name 
             FROM product_sweeteners ps 
             JOIN sweeteners s ON ps.sweetener_id = s.sweetener_id 
             WHERE ps.report_no = ?`, 
            [reportNo]
        );

        for (const s of pSweeteners) {
            const [rules] = await db.query(
                `SELECT disease_id, message, restriction_level FROM sweetener_disease_rules WHERE sweetener_id = ?`,
                [s.sweetener_id]
            );
            
            const conflicts = rules.filter(r => userDiseaseIds.includes(r.disease_id));
            conflicts.forEach(c => {
                result.warnings.push({
                    type: 'disease',
                    level: c.restriction_level, // 레벨 정보 추가
                    title: `지병 주의 (${s.sweetener_name})`,
                    message: c.message || '섭취 주의가 필요합니다.'
                });
            });
        }

        res.json(result);

    } catch (err) {
        console.error("Product Safety Check Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;

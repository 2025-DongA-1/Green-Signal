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
        const [uAllergies] = await db.query(`
            SELECT ua.allergen_id, a.allergen_name 
            FROM user_allergens ua
            JOIN allergens a ON ua.allergen_id = a.allergen_id
            WHERE ua.user_id = ?
        `, [userId]);
        const userAllergyIds = uAllergies.map(r => r.allergen_id);
        const userAllergyNames = uAllergies.map(r => r.allergen_name || '');

        const [uDiseases] = await db.query(`
            SELECT ud.disease_id, d.disease_name 
            FROM user_diseases ud
            JOIN diseases d ON ud.disease_id = d.disease_id 
            WHERE ud.user_id = ?
        `, [userId]);
        const userDiseaseIds = uDiseases.map(r => r.disease_id);
        const userDiseaseNames = uDiseases.map(r => r.disease_name || '');

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

        // 4. [수정] 원재료/영양성분 정밀 분석 (당류 정보 상시 표시)
        const hasDiabetes = userDiseaseNames.some(name => name && name.includes('당뇨'));
        
        // 제품 텍스트 데이터 조회 (항상 실행)
        const [rows] = await db.query(`SELECT raw_materials_text, nutrient_text FROM products WHERE report_no = ?`, [reportNo]);
        
        if (rows.length > 0) {
            const { raw_materials_text, nutrient_text } = rows[0];
            const raw = raw_materials_text || '';
            const nut = nutrient_text || '';

            // 위험 키워드 (혈당 상승 유발)
            const dangerKeywords = ['설탕', '백설탕', '흑설탕', '액상과당', '기타과당', '올리고당', '꿀', '시럽', '덱스트린', '포도당', '물엿', '조청', '사탕수수', '결정과당'];
            const detected = dangerKeywords.filter(k => raw.includes(k));
            
            // 영양성분 텍스트 분석
            const hasSugarNutrient = nut.includes('당류') && !nut.includes('당류 0g') && !nut.includes('당류0g');

            // 당류나 설탕류가 검출된 경우
            if (detected.length > 0 || hasSugarNutrient) {
                 const level = hasDiabetes ? 'WARN' : 'INFO';
                 const title = hasDiabetes ? '당뇨 주의 (당분 함유)' : '상세 성분 정보 (당류)';
                 
                 let message = '';
                 if (detected.length > 0) {
                     message = hasDiabetes 
                        ? `혈당을 급격히 높일 수 있는 원재료(${detected.join(', ')})가 포함되어 있습니다.`
                        : `원재료에 ${detected.join(', ')} 등이 포함되어 있습니다.`;
                 } else {
                     message = hasDiabetes
                        ? `영양성분에 당류가 확인됩니다. 혈당 관리에 유의하세요.`
                        : `영양성분에 당류가 포함되어 있습니다.`;
                 }

                 result.warnings.push({
                    type: level === 'WARN' ? 'disease' : 'info',
                    level: level,
                    title: title,
                    message: message
                 });
            }
        }

        // 5. [추가] 텍스트 기반 알레르기 정밀 분석 (원재료명 텍스트 기반)
        if (rows.length > 0 && userAllergyNames.length > 0) {
            const raw = rows[0].raw_materials_text || '';
            
            // 알러지 유발 키워드 매핑
            const allergyMap = {
                '우유': ['우유', '유크림', '분유', '치즈', '버터', '카제인', '유청', '요거트', '락토', '원유', '1A등급', '1A', '탈지유', '전지분유', '가공유'],
                '대두': ['대두', '콩', '두유', '레시틴', '된장', '간장'],
                '밀': ['밀', '소맥', '글루텐', '빵가루', '밀가루'],
                '땅콩': ['땅콩', '피넛'],
                '호두': ['호두'],
                '잣': ['잣'],
                '메밀': ['메밀'],
                '계란': ['계란', '달걀', '난류', '난황', '난백'],
                '게': ['게', '크랩'],
                '새우': ['새우'],
                '복숭아': ['복숭아'],
                '토마토': ['토마토'],
                '오징어': ['오징어'],
                '조개': ['조개', '굴', '전복', '홍합'],
                '돼지고기': ['돼지고기', '돈육', '젤라틴'],
                '쇠고기': ['쇠고기', '우육']
            };

            userAllergyNames.forEach(uName => {
                for (const [groupName, keywords] of Object.entries(allergyMap)) {
                    if (uName && uName.includes(groupName)) { 
                        const detected = keywords.filter(k => raw.includes(k));
                        if (detected.length > 0) {
                            // 중복 체크
                            const isAlreadyWarned = result.warnings.some(
                                w => w.type === 'allergy' && w.message.includes(groupName)
                            );

                            if (!isAlreadyWarned) {
                                result.warnings.push({
                                    type: 'allergy',
                                    title: `알러지 주의 (${groupName} 관련성분)`,
                                    message: `원재료에 ${groupName} 관련 성분(${detected.join(', ')})이 포함되어 있습니다.`
                                });
                            }
                        }
                    }
                }
            });
        }

        res.json(result);

    } catch (err) {
        console.error("Product Safety Check Error:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;

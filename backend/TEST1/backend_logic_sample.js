// [백엔드 구현 코드] server.js에 작성될 실제 로직입니다.
// 이 코드는 클라이언트(프론트엔드) 요청을 받아 DB를 조회하고 안전성을 분석합니다.

// (주의: 실제 server.js에서는 express, db 모듈 등이 import 되어 있어야 합니다.)

app.get("/api/search", async (req, res) => {
  const { query, userId } = req.query; // 프론트엔드에서 보낸 검색어(query)와 유저ID(userId)
  if (!query) return res.json([]);

  try {
    // 1. 제품 검색 쿼리 실행
    // (이름이나 보고번호에 검색어가 포함된 제품을 최대 50개까지 찾습니다)
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

    // 2. 로그인 유저(`userId`)가 있는 경우에만 안전성 검사를 추가로 수행
    if (userId) {
        // A. [DB 조회] 해당 유저의 알러지 및 지병 정보 가져오기
        const [uAllergies] = await db.query(`SELECT allergen_id FROM user_allergens WHERE user_id = ?`, [userId]);
        const userAllergyIds = uAllergies.map(r => r.allergen_id);

        const [uDiseases] = await db.query(`SELECT disease_id FROM user_diseases WHERE user_id = ?`, [userId]);
        const userDiseaseIds = uDiseases.map(r => r.disease_id);

        // B. 검색된 각 제품(p)에 대해 위험성 분석 반복
        for (const p of products) {
            p.warnings = []; // 이 제품의 경고 목록을 담을 빈 배열 생성

            // --- [검사 1: 알러지] ---
            // 제품에 포함된 알러지 성분 조회
            const [pAllergens] = await db.query(
                `SELECT pa.allergen_id, a.allergen_name 
                 FROM product_allergens pa 
                 JOIN allergens a ON pa.allergen_id = a.allergen_id 
                 WHERE pa.report_no = ?`, 
                [p.report_no]
            );
            
            // 유저가 가진 알러지와 겹치는지(교집합) 확인
            const conflictAllergies = pAllergens.filter(pa => userAllergyIds.includes(pa.allergen_id));
            if (conflictAllergies.length > 0) {
                const names = conflictAllergies.map(a => a.allergen_name).join(', ');
                p.warnings.push(`🚨 알러지 주의: ${names} 함유`);
            }

            // --- [검사 2: 지병/감미료] ---
            // 제품에 포함된 감미료 조회
            const [pSweeteners] = await db.query(
                `SELECT ps.sweetener_id, s.sweetener_name 
                 FROM product_sweeteners ps 
                 JOIN sweeteners s ON ps.sweetener_id = s.sweetener_id 
                 WHERE ps.report_no = ?`, 
                [p.report_no]
            );

            // 각 감미료에 대해 '섭취 금지/주의 규칙'이 유저의 지병과 겹치는지 확인
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

    // 3. 최종 결과 반환 (warnings 정보가 포함된 제품 목록을 JSON으로 응답)
    res.json(products);

  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ error: err.message });
  }
});

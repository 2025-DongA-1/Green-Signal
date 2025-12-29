
import express from 'express';
import db from '../db.js';
import axios from 'axios';

const router = express.Router();

// GET /api/recommend
router.get('/', async (req, res) => {
    const { userId, limit = 6, query: searchText } = req.query;

    try {
        // [1] 사용자별 필터링 조건 가져오기 (로그인 시)
        let excludedAllergens = [];
        let excludedSweeteners = [];

        if (userId && userId !== 'null') {
             // 1. 알러지 조회
             const [userAllergens] = await db.query(
                `SELECT allergen_id FROM user_allergens WHERE user_id = ?`, 
                [userId]
             );
             excludedAllergens = userAllergens.map(row => row.allergen_id);
             
             // 2. 질병 관련 기피 감미료 조회
             const [badSweeteners] = await db.query(`
                SELECT DISTINCT s.sweetener_name 
                FROM user_diseases ud
                JOIN sweetener_disease_rules sdr ON ud.disease_id = sdr.disease_id
                JOIN sweeteners s ON sdr.sweetener_id = s.sweetener_id
                WHERE ud.user_id = ?
             `, [userId]);
             excludedSweeteners = badSweeteners.map(r => r.sweetener_name);
        }

        let results = [];

        // [2] 추천 로직 분기: 검색어(Flask) vs 랜덤(DB)
        if (searchText) {
            try {
                // Flask 서버에 요청 (타임아웃 2초)
                const flaskRes = await axios.get('http://localhost:5000/predict/recommend', {
                    params: { query: searchText },
                    timeout: 2000 
                });
                
                let candidates = flaskRes.data; // [{ report_no, product_name, ... }, ...]

                // candidates가 배열인지 확인
                if (Array.isArray(candidates)) {
                     // [안전 필터링] Flask 결과 중 위험한 제품 제외
                    if (candidates.length > 0) {
                        // A-1. 알러지 체크 (DB 조회 필요)
                        if (excludedAllergens.length > 0) {
                            const reportNos = candidates.map(c => c.report_no);
                            if (reportNos.length > 0) {
                                const [unsafe] = await db.query(
                                    `SELECT report_no FROM product_allergens WHERE report_no IN (?) AND allergen_id IN (?)`, 
                                    [reportNos, excludedAllergens]
                                );
                                const unsafeIds = new Set(unsafe.map(u => u.report_no));
                                candidates = candidates.filter(c => !unsafeIds.has(c.report_no));
                            }
                        }

                        // A-2. 감미료 체크 (텍스트 기반)
                        if (excludedSweeteners.length > 0) {
                            candidates = candidates.filter(c => {
                                const raw = (c.raw_materials || c.raw_materials_text || '').toLowerCase();
                                return !excludedSweeteners.some(bad => raw.includes(bad.toLowerCase()));
                            });
                        }
                        
                        // A-3. 이미지 등 추가 정보 보강 (Flask가 이미지를 안 줌)
                        if (candidates.length > 0) {
                            const safeReportNos = candidates.map(c => c.report_no);
                            if (safeReportNos.length > 0) {
                                const [details] = await db.query(
                                    `SELECT report_no, imgurl1, capacity, seller FROM products WHERE report_no IN (?)`,
                                    [safeReportNos]
                                );
                                
                                const detailMap = {};
                                details.forEach(d => detailMap[d.report_no] = d);
                                
                                candidates = candidates.map(c => ({
                                    ...c,
                                    ...detailMap[c.report_no], 
                                    imgurl1: detailMap[c.report_no]?.imgurl1 || '' 
                                }));
                            }
                        }
                    }
                    results = candidates;
                }
            } catch (err) {
                console.error("Flask 추천 서버 오류 (랜덤으로 대체):", err.message);
            }
        }

        // [3] 결과가 없으면(Flask 실패 or 검색어 없음) -> 랜덤 추천
        if (results.length === 0) {
            let query = `SELECT * FROM products`;
            let params = [];
            let whereClauses = [];

            if (excludedAllergens.length > 0) {
                 const placeholders = excludedAllergens.map(() => '?').join(',');
                 whereClauses.push(`report_no NOT IN (
                    SELECT report_no FROM product_allergens WHERE allergen_id IN (${placeholders})
                 )`);
                 params.push(...excludedAllergens);
            }
            
            if (whereClauses.length > 0) {
                query += ` WHERE ` + whereClauses.join(' AND ');
            }
            
            query += ` ORDER BY RAND() LIMIT ?`;
            params.push(parseInt(limit) + 5); 

            const [rows] = await db.query(query, params);
            
            results = rows;
            if (excludedSweeteners.length > 0) {
                results = results.filter(p => {
                    const raw = (p.raw_materials_text || '').toLowerCase();
                    for (const bad of excludedSweeteners) {
                        if (raw.includes(bad.toLowerCase())) return false; 
                    }
                    return true;
                });
            }
        }
        
        // 최종 개수 자르기
        const finalResults = results.slice(0, parseInt(limit));

        res.json(finalResults);

    } catch (error) {
        console.error('Recommendation Error:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

export default router;

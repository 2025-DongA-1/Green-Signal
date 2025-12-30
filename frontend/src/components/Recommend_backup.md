# 2025-12-30 AI 추천 기능 전환 기록

## 변경 목적

- 기존: 프론트엔드에서 단순 DB SQL 조회를 통해 추천(필터링) 수행
- 변경: 백엔드(`/api/recommend`)를 통해 Flask AI 서버의 추천 알고리즘 결과 사용

## 복구 방법 (Rollback)

만약 AI 서버 연동에 문제가 발생할 경우, `src/components/Recommend.jsx` 파일의 `fetchRecommendations` 함수 내용을 아래 **기존 코드**로 원상 복구하면 됩니다.

### [기존 코드 전문 backup]

```javascript
const fetchRecommendations = async () => {
  if (!isLoggedIn || !userInfo?.user_id) {
    setError("로그인 후 추천을 받을 수 있습니다.");
    setItems([]);
    return;
  }

  setLoading(true);
  setError("");
  try {
    const sql = `
        SELECT p.report_no, p.product_name, p.capacity, p.imgurl1, p.seller
        FROM products p
        WHERE p.report_no NOT IN (
          SELECT pa.report_no
          FROM product_allergens pa
          WHERE pa.allergen_id IN (SELECT allergen_id FROM user_allergens WHERE user_id = ?)
        )
        AND p.report_no NOT IN (
          SELECT ps.report_no
          FROM product_sweeteners ps
          JOIN sweetener_disease_rules r ON r.sweetener_id = ps.sweetener_id
          WHERE r.disease_id IN (SELECT disease_id FROM user_diseases WHERE user_id = ?)
        )
        ORDER BY p.collected_at DESC
        LIMIT 20
      `;

    const rows = await db.execute(sql, [userInfo.user_id, userInfo.user_id]);
    setItems(rows || []);
    if (!rows || rows.length === 0) {
      setError(
        "조건에 맞는 추천 결과가 없습니다. 알러지/질병 정보를 확인해 주세요."
      );
    }
  } catch (e) {
    console.error("추천 조회 실패:", e);
    setError("추천 데이터를 불러오지 못했습니다.");
  } finally {
    setLoading(false);
  }
};
```

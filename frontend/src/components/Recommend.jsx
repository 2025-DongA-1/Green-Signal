import React, { useEffect, useState } from 'react';
import db from './lib/db';

const Recommend = ({ isLoggedIn, userInfo }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRecommendations = async () => {
    if (!isLoggedIn || !userInfo?.user_id) {
      setError('로그인 후 추천을 받을 수 있습니다.');
      setItems([]);
      return;
    }

    setLoading(true);
    setError('');
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
        setError('조건에 맞는 추천 결과가 없습니다. 알러지/질병 정보를 확인해 주세요.');
      }
    } catch (e) {
      console.error('추천 조회 실패:', e);
      setError('추천 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, userInfo?.user_id]);

  const handleCardClick = (reportNo) => {
    if (!reportNo) return;
    window.location.href = `/product?reportNo=${reportNo}`;
  };

  return (
    <div className="container" style={{ paddingTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h2 style={{ margin: 0 }}>AI 맞춤 추천</h2>
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
            등록한 알러지/지병 정보를 바탕으로 안전한 음료를 보여드려요.
          </p>
        </div>
        <button className="btn" onClick={fetchRecommendations} disabled={loading}>
          {loading ? '불러오는 중...' : '다시 추천'}
        </button>
      </div>

      {!isLoggedIn && (
        <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', color: '#444' }}>
          로그인 후 추천을 받을 수 있습니다.
        </div>
      )}

      {error && (
        <div style={{ padding: '12px', background: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '8px', color: '#856404', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      <div className="recommend-grid">
        {items.map((item) => (
          <div key={item.report_no} className="recommend-item" onClick={() => handleCardClick(item.report_no)}>
            <div
              className="recommend-img"
              style={{
                backgroundImage: `url(${item.imgurl1 || ''})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#f0f0f0'
              }}
            >
              {!item.imgurl1 && <span style={{ fontSize: '10px', color: '#999' }}>이미지 없음</span>}
            </div>
            <div className="recommend-name">{item.product_name}</div>
            <div className="recommend-price">{item.capacity || '용량 정보 없음'}</div>
            {item.seller && <div style={{ fontSize: '12px', color: '#666' }}>{item.seller}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommend;

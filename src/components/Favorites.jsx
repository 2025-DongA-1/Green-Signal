import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Favorites.css';

const Favorites = ({ favorites = [], onRemove }) => {
    const [filter, setFilter] = useState('전체');
    const navigate = useNavigate();

    // 필터링 적용
    const filteredFavorites = filter === '전체'
        ? favorites
        : favorites.filter(item => {
            const statusText = item.grade_text || item.gradeText || '';
            return statusText.includes(filter);
        });

    // 상세 페이지 이동
    const handleDetailClick = (item) => {
        const productId = item.report_no || item.prdlstReportNo;
        if (!productId) return;
        navigate('/product', { state: { productId } });
    };

    return (
        <div className="favorites-container">
            <div className="favorites-header">
                <h1>즐겨찾기</h1>
                <p>내가 찜한 안심 상품들입니다.</p>
            </div>

            <div className="favorites-filters">
                {['전체', '안전', '주의'].map(f => (
                    <div
                        key={f}
                        className={`filter-chip ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f}
                    </div>
                ))}
            </div>

            {filteredFavorites.length > 0 ? (
                <div className="favorites-grid">
                    {filteredFavorites.map((item, index) => (
                        <div key={item.report_no || index} className="favorite-card" onClick={() => handleDetailClick(item)} style={{ cursor: 'pointer' }}>
                            <div className="favorite-badge">❤️</div>
                            <div className="favorite-image">
                                🍎
                            </div>
                            <div className="favorite-content">
                                <p className="favorite-brand">{item.manufacturer || item.brand}</p>
                                <h3 className="favorite-name">{item.product_name || item.name}</h3>
                                <div className={`favorite-status ${item.grade || 'safe'}`}>
                                    {item.grade_text || item.gradeText || '🟢 안전'}
                                </div>
                            </div>
                            <button
                                className="remove-btn"
                                onClick={(e) => {
                                    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
                                    onRemove && onRemove(item);
                                }}
                            >
                                삭제
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-favorites">
                    <span className="empty-icon">⭐</span>
                    <p className="empty-text">아직 즐겨찾기한 상품이 없습니다.</p>
                </div>
            )}
        </div>
    );
};

export default Favorites;

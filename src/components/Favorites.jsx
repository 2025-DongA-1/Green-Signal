import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Favorites.css';

const Favorites = ({ favorites = [], onRemove }) => {
    // ----------------------------------------------------------------
    // [변수 설명]
    // favorites: App.jsx(부모)로부터 받아온 즐겨찾기 목록 데이터
    // onRemove: 즐겨찾기 삭제 버튼 클릭 시 실행될 부모 컴포넌트의 함수
    // filter: 현재 선택된 등급 필터 ('전체', '안전', '주의' 등)
    // ----------------------------------------------------------------
    const [filter, setFilter] = useState('전체');
    const navigate = useNavigate();

    // [기능: 필터링 로직]
    // 사용자가 선택한 필터에 맞춰 목록을 가공하여 렌더링 준비를 합니다.
    const filteredFavorites = filter === '전체'
        ? favorites
        : favorites.filter(item => {
            // grade_text 필드가 없을 경우를 대비해 빈 문자열 처리
            const statusText = item.grade_text || item.gradeText || '';
            return statusText.includes(filter); // 등급 텍스트에 필터어가 포함되는지 확인
        });

    // [기능: 상세 페이지 이동]
    // 카드를 클릭했을 때 해당 상품의 상세 정보 화면으로 넘어갑니다.
    const handleDetailClick = (item) => {
        // DB 컬럼명 호환성 처리 (report_no 우선 사용)
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
                                {item.imgurl1 ? (
                                    <img
                                        src={item.imgurl1}
                                        alt={item.product_name}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                ) : (
                                    '🍎'
                                )}
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

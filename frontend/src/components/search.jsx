

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import db from './lib/db'
import '../styles/dar.css'

const Search = ({ isLoggedIn, userInfo }) => {
    // 1. 상태 및 훅 초기화
    const navigate = useNavigate();
    const [recommendItems, setRecommendItems] = useState([]); // 하단 추천 목록 데이터

    // 2. 컴포넌트 마운트 시 추천 상품 로드 (API 사용)
    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                // [변경] 백엔드 API를 호출하여 랜덤+필터링된 추천 목록을 가져옵니다.
                // 로그인 시 userInfo.user_id를 보내면 알러지 유발 제품이 자동 제외됩니다.
                const userIdParam = (userInfo && userInfo.user_id) ? userInfo.user_id : 'null';
                const res = await fetch(`http://192.168.219.74:3000/api/recommend?userId=${userIdParam}&limit=10`);
                const data = await res.json();

                // API 데이터를 UI 포맷에 맞게 변환
                const items = data.map((item, index) => ({
                    id: `${item.report_no || 'rec'}-${index}`,
                    productId: item.report_no,
                    name: item.product_name,
                    price: item.capacity || '용량 정보 없음', // 원래 가격 칸에 용량 정보를 보여줌
                    img: item.imgurl1,
                    seller: item.seller
                }));

                setRecommendItems(items);
            } catch (error) {
                console.error('추천 목록 로딩 실패:', error);
            }
        };

        fetchRecommendations();
    }, [userInfo]); // userInfo가 바뀌면(로그인/로그아웃) 목록 갱신

    // 3. 이벤트 핸들러: 페이지 이동 처리
    const handleNavigate = (path, state = {}) => {
        navigate(path, { state });
    }

    return (
        <div className="stack">
            {/* 1. 검색 영역: 클릭 시 검색 탭으로 이동만 수행 */}
            <div
                className="card search-box"
                style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                onClick={() => navigate('/search')}
            >
                {isLoggedIn && (
                    <div
                        onClick={(e) => { e.stopPropagation(); navigate('/favorites'); }}
                        style={{ cursor: 'pointer', fontSize: '20px', color: '#d0e700d0', marginRight: '4px' }}
                        title="즐겨찾기"
                    >
                        ⭐
                    </div>
                )}
                <div style={{ flex: 1, color: '#999', fontSize: '14px', textAlign: 'left', padding: '10px 0' }}>
                    상품명을 입력 해주세요
                </div>
                <button className='btn' style={{ pointerEvents: 'none' }}>검색</button>
            </div>

            {/* 2. 바코드 스캔 버튼: 카메라를 이용해 바코드를 직접 스캔하는 기능으로 연결 */}
            <div style={{ marginTop: '12px' }}>
                {/* 버튼 클릭 시 하단의 카메라 스캔 영역이 나타나거나 사라집니다. */}
                <button
                    className='btn'
                    style={{ width: '100%', background: '#263238' }}
                    onClick={() => handleNavigate('/search', { autoScan: true })}
                >
                    📷 바코드 스캔하기
                </button>
            </div>

            {/* 3. 추천 목록 영역: CSV 데이터에서 가져온 인기/추천 상품을 그리드 형태로 표시 */}
            <div className="recommend-section">
                <div className="section-title">추천 목록</div>

                {/* 상품 정보를 2열 그리드(격자) 형식으로 배치 */}
                <div className="recommend-grid">
                    {/* 데이터 배열을 순회(map)하며 각각의 상품 카드를 생성 */}
                    {recommendItems.map((item) => (
                        <div key={item.id} className="recommend-item" onClick={() => handleNavigate('/product', { productId: item.productId })}>
                            {/* 상품 이미지: 배경 이미지로 설정하여 비율에 맞춰 표시 */}
                            <div
                                className="recommend-img"
                                style={{
                                    backgroundImage: `url(${item.img})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: '#f0f0f0'
                                }}
                            >
                                {!item.img && <span style={{ fontSize: '10px', color: '#999' }}>이미지 없음</span>}
                            </div>
                            {/* 상품 정보: 이름과 용량(가격 위치) 표시 */}
                            <div className="recommend-name">{item.name}</div>
                            <div className="recommend-price">{item.price}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Search

// src/components/ProductDetailMain.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import db from './lib/db';
import { ensureUserRow, getUserId } from './lib/userUtils';
import '../styles/dar.css';
import "../styles/ProductDetailMain.css";
import API_BASE from "../config/apiBase";

// MySQL DATETIME 포맷으로 변환 (YYYY-MM-DD HH:MM:SS)
const toMySQLDateTime = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 19).replace('T', ' ');
};

const ProductDetailMain = ({ favorites = [], toggleFavorite, userInfo }) => {
    // 1. 상태 및 라우팅 관련 정의
    const [activeTab, setActiveTab] = useState('summary');
    const [product, setProduct] = useState(null);
    const [warnings, setWarnings] = useState([]); // ✅ 경고 상태 추가
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const userId = getUserId(userInfo);

    // URL 쿼리 파라미터 파싱
    const queryParams = new URLSearchParams(location.search);
    const reportNoFromQuery = queryParams.get('reportNo');

    // 이전 페이지(목록 등)에서 넘겨준 상품 식별자 수신 (state 우선 -> 쿼리 파라미터 백업)
    const productId = location.state?.productId || reportNoFromQuery;
    // 추천 목록을 통해 들어왔는지 여부 (화면 UI 조절용)
    const isFromRecommendation = location.state?.fromRecommendation;

    // 중복 기록 방지를 위한 Ref
    const recordedRef = useRef(null);

    // 현재 상품이 즐겨찾기에 있는지 확인
    const isFavorite = product && favorites.some(fav =>
        String(fav.report_no || fav.prdlstReportNo) === String(product.report_no || product.prdlstReportNo)
    );

    // [상품 정보 조회 기능]
    useEffect(() => {
        let isMounted = true;
        const fetchProduct = async () => {
            setProduct(null);
            setIsLoading(true);
            try {
                const query = `
                    SELECT p.*, b.barcode 
                    FROM products p
                    LEFT JOIN product_barcodes b ON p.report_no = b.report_no
                    WHERE p.report_no = ? OR b.barcode = ?
                    LIMIT 1
                `;
                const results = await db.execute(query, [productId, productId]);
                const found = results[0];

                if (found && isMounted) {
                    setProduct(found);

                    if (userId) {
                        await ensureUserRow(userInfo);
                        fetch(`${API_BASE}/api/product/check-safety?reportNo=${found.report_no}&userId=${userId}`)
                            .then(res => res.json())
                            .then(data => setWarnings(data.warnings || []))
                            .catch(e => console.error('Warning fetch error:', e));
                    }

                    if (recordedRef.current === found.report_no) return;
                    recordedRef.current = found.report_no;

                    if (userId) {
                        const historyValues = [
                            userId,
                            (found.barcode || '').trim(),
                            found.report_no,
                            found.product_name,
                            'OK',
                            new Date().toISOString().slice(0, 19).replace('T', ' ')
                        ];

                        await db.execute('DELETE FROM scan_history WHERE report_no = ? AND user_id = ?', [found.report_no, userId]);
                        await db.execute(
                            'INSERT INTO scan_history (user_id, barcode, report_no, product_name_snapshot, warning_level_snapshot, scanned_at) VALUES (?, ?, ?, ?, ?, ?)',
                            historyValues
                        );

                        const currentHistory = await db.execute('SELECT scanned_at FROM scan_history WHERE user_id = ? ORDER BY scanned_at DESC', [userId]);
                        if (currentHistory.length > 20) {
                            const thresholdTimestamp = toMySQLDateTime(currentHistory[19].scanned_at);
                            if (thresholdTimestamp) {
                                await db.execute('DELETE FROM scan_history WHERE user_id = ? AND scanned_at < ?', [userId, thresholdTimestamp]);
                            }
                        }
                    } else {
                        console.log('로그인하지 않아 히스토리를 갱신하지 않습니다.');
                    }
                } else if (isMounted) {
                    console.warn('해당 제품을 찾을 수 없습니다. (ID:', productId, ')');
                }
            } catch (error) {
                if (isMounted) console.error('데이터베이스 조회 오류 발생:', error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }

        return () => {
            isMounted = false;
        };
    }, [productId, userId, userInfo]); // userInfo added for dependency

    // 2. 상단 탭 구성 설정
    const tabs = ['summary', 'ingredient', 'nutrition'];
    if (!isFromRecommendation) {
        tabs.push('recommend');
    }

    const scrollToSection = (id) => {
        setActiveTab(id);
        const element = document.getElementById(id);
        if (element) {
            const offset = 100;
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    if (isLoading) {
        return <div style={{ padding: '50px', textAlign: 'center' }}>데이터를 불러오는 중...</div>;
    }

    if (!product) {
        return <div style={{ padding: '50px', textAlign: 'center' }}>상품 정보를 찾을 수 없습니다.</div>;
    }

    return (
        <div className="p-detail-container">
            <div className="nav-tabs">
                {tabs.map(tab => (
                    <div
                        key={tab}
                        className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => scrollToSection(tab)}
                    >
                        {tab === 'summary' && '요약'}
                        {tab === 'ingredient' && '성분'}
                        {tab === 'nutrition' && '영양'}
                        {tab === 'recommend' && '추천'}
                    </div>
                ))}
            </div>

            <div className="stack container" style={{ marginTop: '20px' }}>
                <div id="summary" className="card">
                    <div className="p-summary-grid">
                        <div className="p-img-box" style={{ backgroundImage: `url(${product.imgurl1})` }}>
                            {!product.imgurl1 && '이미지 없음'}
                        </div>

                        <div className="p-info-col">
                            <div className="p-title-row">
                                <div>
                                    <div className="p-name">{product.product_name}</div>
                                    <div className="p-capacity">
                                        {product.capacity} / {product.kind_name}
                                    </div>
                                </div>
                                <button
                                    className={`p-fav-btn ${isFavorite ? 'active' : ''}`}
                                    onClick={() => toggleFavorite(product)}
                                >
                                    {isFavorite ? '⭐' : '☆'}
                                </button>
                            </div>

                            <div className="p-manu-row">
                                <span>{product.manufacturer}</span>
                                {product.seller && product.seller !== '_' && (
                                    <>
                                        <span className="p-divider">|</span>
                                        <span>판매: {product.seller}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* [수정] '⚠️ 주의 정보' 텍스트는 알레르기 주의 사항이 있을 때만 표시 */}
                    {warnings.some(w => w.type === 'allergy') && (
                        <div className="p-warning-title">⚠️ 주의 정보</div>
                    )}

                    {/* [2. 중간 배치] 사용자 맞춤 알레르기 주의 카드 (사용자가 설정한 알레르기와 일치할 때만 표시) */}
                    {warnings.some(w => w.type === 'allergy') && (
                        <div className="p-warning-item warning-allergy" style={{ marginBottom: '10px' }}>
                            <div className="p-warning-item-header">🚨 알레르기 주의</div>
                            <div>회원님의 알레르기 설정에 해당하는 성분이 포함되어 있습니다.</div>
                        </div>
                    )}
                    <div className="card">
                        {/* [1. 상단 배치] 상세 스펙 정보 그리드 (4개 항목) */}
                        <div className="p-info-grid" style={{ marginBottom: '16px' }}>
                            {/* 1. 제품 분류 */}
                            <div className="p-info-box info-default">
                                <div className="p-info-label">제품 분류</div>
                                <div className="p-info-val">{product.kind_name || '정보 없음'}</div>
                            </div>

                            {/* 2. 바코드 번호 */}
                            <div className="p-info-box info-default">
                                <div className="p-info-label">바코드 번호</div>
                                <div className="p-info-val" style={{ fontFamily: 'monospace', letterSpacing: '1px' }}>
                                    {product.barcode || '등록된 바코드 없음'}
                                </div>
                            </div>

                            {/* 3. 품목 보고 번호 */}
                            <div className="p-info-box info-default">
                                <div className="p-info-label">품목 보고 번호</div>
                                <div className="p-info-val">{product.report_no}</div>
                            </div>

                            {/* 4. 용량 정보 */}
                            <div className="p-info-box info-default">
                                <div className="p-info-label">포장 단위(용량)</div>
                                <div className="p-info-val">{product.capacity || '정보 없음'}</div>
                            </div>
                        </div>


                    </div>



                    {/* 201 line card box start */}




                    {/* [3. 사용자 맞춤 경고] 동적 경고 표시 (알레르기 외 기타 경고) */}
                    {warnings.length > 0 && (
                        <div className="p-warning-list">
                            {warnings.map((w, idx) => {
                                // 알레르기 경고는 위에서 이미 크게 보여줬으므로 여기선 제외하거나, 상세 메시지만 보여줌
                                // 사용자가 원한건 "알레르기알떄만 표시"이므로 여기서는 중복을 피하기 위해
                                // type !== 'allergy' 인 것만 보여주거나, 그대로 두되 위 카드가 "요약" 역할.
                                // 요청: "알레르기 주의 정보는 사용자가 선택한 알레르기일 때만 표시" -> 위 코드에서 처리됨.

                                let className = "p-warning-item warning-default";
                                if (w.type === 'allergy' || w.level === 'WARN') {
                                    className = "p-warning-item warning-allergy";
                                } else if (w.level === 'INFO') {
                                    className = "p-warning-item warning-info";
                                } else if (w.level === 'CAUTION' || w.level === 'CONTRA') {
                                    className = "p-warning-item warning-caution";
                                }

                                return (
                                    <div key={idx} className={className}>
                                        <div className="p-warning-item-header">
                                            {w.type === 'allergy' ? '🚨' : (w.level === 'INFO' ? 'ℹ️' : '⚠️')} {w.title}
                                        </div>
                                        <div>{w.message}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* [4. 하단 배치] 알레르기 상세 텍스트 (전체 너비) */}
                    <div style={{ marginTop: '12px' }}>
                        {(() => {
                            const text = product.allergy_text || '정보 없음';
                            // 사용자가 설정한 알레르기와 충돌하는 경우에만 빨간 테두리(info-alert) 적용
                            const hasUserAllergy = warnings.some(w => w.type === 'allergy');
                            const boxClass = hasUserAllergy ? "p-info-box info-alert" : "p-info-box info-default";

                            return (
                                <div className={boxClass} style={{ width: '100%', boxSizing: 'border-box' }}>
                                    <div className="p-info-label" style={{ marginBottom: '6px' }}>알레르기 정보 상세</div>
                                    <div className="p-info-val" style={{
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: '1.6',
                                        fontSize: '15px',
                                        wordBreak: 'keep-all'
                                    }}>
                                        {text}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                <div id="ingredient" className="card stack">
                    <div>
                        <div className="p-section-header">
                            <div className="p-section-title">원재료</div>
                        </div>
                        <div className="p-text-block">
                            {product.raw_materials_text}
                        </div>
                    </div>
                </div>

                <div id="nutrition" className="card">
                    <div className="p-section-header">
                        <div className="p-section-title">영양 정보 요약</div>
                    </div>

                    <div className="p-nutrition-box">
                        {product.nutrient_text || '영양 성분 정보가 등록되어 있지 않습니다.'}
                    </div>

                    <div className="p-source">
                        <div className="p-source-text">
                            데이터 출처: HACCP 공공데이터 포털
                        </div>
                    </div>
                </div>

                {!isFromRecommendation && (
                    <div id="recommend">
                        <div className="section-title">추천 상품</div>
                        <div className="p-rec-desc">
                            회원님의 건강 정보(알레르기, 질병)와 현재 상품({product.product_name})을 분석하여 추천합니다.
                        </div>
                        {/* 추천 상품 리스트 렌더링 (상품명 전달) */}
                        <RecommendationList userInfo={userInfo} navigate={navigate} productName={product.product_name} />
                    </div>
                )}
            </div>
        </div>
    );
};

// [추가] 추천 상품 목록 컴포넌트
const RecommendationList = ({ userInfo, navigate }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchRecommendations = async () => {
            try {
                // 사용자 ID를 쿼리로 보내 안전한 맞춤 추천 요청
                const userIdParam = getUserId(userInfo) || 'null';
                const res = await fetch(`${API_BASE}/api/recommend?userId=${userIdParam}&limit=4`);
                const data = await res.json();

                if (isMounted) {
                    setRecommendations(data);
                }
            } catch (error) {
                console.error("추천 로드 실패:", error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchRecommendations();

        return () => { isMounted = false; };
    }, [userInfo]);

    if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>추천 상품 불러오는 중...</div>;
    if (recommendations.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>추천 상품이 없습니다.</div>;

    return (
        <div className="recommend-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
            {recommendations.map((item) => (
                <div
                    key={item.report_no}
                    className="recommend-item"
                    onClick={() => navigate('/product', { state: { productId: item.report_no, fromRecommendation: true } })}
                    style={{ cursor: 'pointer', border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}
                >
                    <div
                        className="recommend-img"
                        style={{
                            height: '120px',
                            backgroundImage: `url(${item.imgurl1})`,
                            backgroundSize: 'contain',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: '#f9f9f9',
                            borderRadius: '4px',
                            marginBottom: '8px'
                        }}
                    >
                        {!item.imgurl1 && <span style={{ fontSize: '10px', color: '#999', display: 'block', paddingTop: '50px', textAlign: 'center' }}>이미지 없음</span>}
                    </div>
                    <div className="recommend-name" style={{ fontSize: '14px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.product_name}
                    </div>
                    <div className="recommend-price" style={{ fontSize: '12px', color: '#666' }}>
                        {item.manufacturer}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProductDetailMain;

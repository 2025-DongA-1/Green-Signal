// src/components/ProductDetailMain.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import db from './lib/db';
import '../styles/dar.css';
import "../styles/ProductDetailMain.css";

const ProductDetailMain = ({ favorites = [], toggleFavorite, userInfo }) => {
    // 1. 상태 및 라우팅 관련 정의
    const [activeTab, setActiveTab] = useState('summary');
    const [product, setProduct] = useState(null);
    const [warnings, setWarnings] = useState([]); // ✅ 경고 상태 추가
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    // 이전 페이지(목록 등)에서 넘겨준 상품 식별자 수신
    const productId = location.state?.productId;
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
            setProduct(null); // 이전 데이터 초기화
            setIsLoading(true);
            try {
                // ... (상품 조회 쿼리)
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
                    console.log('✅ 상품 정보 로드 성공:', found.product_name);

                    // [추가] 안전성(알러지/지병) 검사 실행
                    if (userInfo && userInfo.user_id) {
                        fetch(`http://localhost:3000/api/product/check-safety?reportNo=${found.report_no}&userId=${userInfo.user_id}`)
                            .then(res => res.json())
                            .then(data => setWarnings(data.warnings || []))
                            .catch(e => console.error("Warning fetch error:", e));
                    }

                    // 엄격한 중복 체크
                    if (recordedRef.current === found.report_no) return;
                    recordedRef.current = found.report_no;

                    // 스캔 이력 기록
                    if (userInfo && userInfo.user_id) {
                        const historyValues = [
                            userInfo.user_id,
                            (found.barcode || '').trim(),
                            found.report_no,
                            found.product_name,
                            'OK',
                            new Date().toISOString().slice(0, 19).replace('T', ' ')
                        ];

                        await db.execute('DELETE FROM scan_history WHERE report_no = ? AND user_id = ?', [found.report_no, userInfo.user_id]);
                        await db.execute(
                            'INSERT INTO scan_history (user_id, barcode, report_no, product_name_snapshot, warning_level_snapshot, scanned_at) VALUES (?, ?, ?, ?, ?, ?)',
                            historyValues
                        );

                        // 히스토리 개수 제한
                        const currentHistory = await db.execute('SELECT scanned_at FROM scan_history WHERE user_id = ? ORDER BY scanned_at DESC', [userInfo.user_id]);
                        if (currentHistory.length > 20) {
                            const thresholdTimestamp = currentHistory[19].scanned_at;
                            await db.execute('DELETE FROM scan_history WHERE user_id = ? AND scanned_at < ?', [userInfo.user_id, thresholdTimestamp]);
                        }
                    } else {
                        console.log('로그인하지 않아 히스토리를 저장하지 않습니다.');
                    }
                } else if (isMounted) {
                    console.warn('❌ 상품을 찾을 수 없습니다. (ID:', productId, ')');
                }
            } catch (error) {
                if (isMounted) console.error('데이터베이스 조회 중 오류 발생:', error);
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
    }, [productId, userInfo]); // userInfo added for dependency

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

                    <div className="p-badge-row">
                        <span className="badge safe">HACCP 인증</span>
                        {product.allergy_text !== '해당없음' && product.allergy_text !== '알수없음' && product.allergy_text && (
                            <span className="badge warn">알레르기 주의</span>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="p-warning-title">⚠️ 주의 정보</div>

                    {/* 동적 경고 표시 */}
                    {warnings.length > 0 && (
                        <div className="p-warning-list">
                            {warnings.map((w, idx) => {
                                let className = "p-warning-item warning-default"; // Default
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

                    <div className="p-info-grid">
                        {/* 알레르기 정보 박스 */}
                        {(() => {
                            const text = product.allergy_text || '정보 없음';
                            const isUnknown = ['알수없음', '해당없음', '정보 없음', '', 'None'].includes(text.trim());
                            const boxClass = isUnknown ? "p-info-box info-default" : "p-info-box info-alert";

                            return (
                                <div className={boxClass}>
                                    <div className="p-info-label">알레르기 정보</div>
                                    <div className="p-info-val">{text}</div>
                                </div>
                            );
                        })()}

                        <div className="p-info-box info-default">
                            <div className="p-info-label">제품 분류</div>
                            <div className="p-info-val">{product.kind_name || '정보 없음'}</div>
                        </div>
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
                        <div className="section-title">관련 더보기</div>
                        <div className="p-rec-desc">
                            같은 분류({product.kind_name})의 다른 제품들을 찾아보세요.
                        </div>
                        <button
                            className="btn p-rec-btn"
                            onClick={() => navigate('/search', { state: { query: product.kind_name } })}
                        >
                            '{product.kind_name}' 검색결과 더보기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailMain;

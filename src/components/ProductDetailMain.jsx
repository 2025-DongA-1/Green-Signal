import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import db from './lib/db';
import './dar.css';

const ProductDetailMain = ({ favorites = [], toggleFavorite, userInfo }) => {
    // 1. 상태 및 라우팅 관련 정의
    const [activeTab, setActiveTab] = useState('summary'); // 현재 선택된 탭 (요약/성분/영양 등)
    const [product, setProduct] = useState(null); // 조회된 상품 상세 데이터
    const [isLoading, setIsLoading] = useState(true); // 로딩 상태
    const navigate = useNavigate();
    const location = useLocation();

    // 이전 페이지(목록 등)에서 넘겨준 상품 식별자 수신
    const productId = location.state?.productId;
    // 추천 목록을 통해 들어왔는지 여부 (화면 UI 조절용)
    const isFromRecommendation = location.state?.fromRecommendation;

    // 중복 기록 방지를 위한 Ref
    const recordedRef = useRef(null);

    // 현재 상품이 즐겨찾기에 있는지 확인 (SQL 명세 필드 report_no 기준)
    const isFavorite = product && favorites.some(fav => (fav.report_no || fav.prdlstReportNo) === (product.report_no || product.prdlstReportNo));

    // [상품 정보 조회 기능]
    // 전달받은 productId를 기반으로 DB에서 상세 정보를 가져옵니다.
    useEffect(() => {
        let isMounted = true;
        const fetchProduct = async () => {
            setProduct(null); // 이전 데이터 초기화
            setIsLoading(true);
            try {
                // ... (상품 조회 쿼리 등 기존 코드 유지)
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

                    // 엄격한 중복 체크: 현재 렌더링 사이클에서 이미 처리했는지 확인
                    if (recordedRef.current === found.report_no) return;
                    recordedRef.current = found.report_no;

                    // 스캔 이력(scan_history)에 기록 추가 (로그인한 유저만)
                    if (userInfo && userInfo.user_id) {
                        const historyValues = [
                            userInfo.user_id,
                            (found.barcode || '').trim(),
                            found.report_no,
                            found.product_name,
                            'OK',
                            new Date().toISOString().slice(0, 19).replace('T', ' '), // MySQL DATETIME format
                            Date.now()
                        ];

                        await db.execute('DELETE FROM scan_history WHERE report_no = ? AND user_id = ?', [found.report_no, userInfo.user_id]);
                        await db.execute(
                            'INSERT INTO scan_history (user_id, barcode, report_no, product_name_snapshot, warning_level_snapshot, scanned_at, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
                            historyValues
                        );

                        // 히스토리 개수 제한 (해당 유저의 최신 20개만 유지)
                        const currentHistory = await db.execute('SELECT timestamp FROM scan_history WHERE user_id = ? ORDER BY timestamp DESC', [userInfo.user_id]);
                        if (currentHistory.length > 20) {
                            const thresholdTimestamp = currentHistory[19].timestamp;
                            await db.execute('DELETE FROM scan_history WHERE user_id = ? AND timestamp < ?', [userInfo.user_id, thresholdTimestamp]);
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
    }, [productId]);

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
        <div style={{ paddingBottom: '80px' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px' }}>
                        <div style={{
                            width: '80px', height: '80px',
                            backgroundImage: `url(${product.imgurl1})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: '#f1f2f4',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '10px', color: '#999'
                        }}>
                            {!product.imgurl1 && '이미지 없음'}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '16px' }}>{product.product_name}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--c-muted)', marginTop: '4px' }}>
                                        {product.capacity} / {product.kind_name}
                                    </div>
                                </div>
                                <button
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '22px',
                                        color: isFavorite ? '#f43f5e' : '#ccc'
                                    }}
                                    onClick={() => toggleFavorite(product)}
                                >
                                    {isFavorite ? '★' : '☆'}
                                </button>
                            </div>

                            <div style={{ fontSize: '12px', color: '#666' }}>
                                <span>{product.manufacturer}</span>
                                {product.seller && product.seller !== '_' && (
                                    <>
                                        <span style={{ margin: '0 4px' }}>|</span>
                                        <span>판매: {product.seller}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                        <span className="badge safe">HACCP 인증</span>
                        {product.allergy_text !== '해당없음' && product.allergy_text !== '알수없음' && product.allergy_text && (
                            <span className="badge warn">알레르기 주의</span>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div style={{ fontWeight: '800', marginBottom: '12px' }}>⚠️ 주의 정보</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                        <div style={{
                            background: '#FFF3F2', padding: '10px', borderRadius: '8px',
                            border: '1px solid rgba(231,76,60,.3)', color: '#E74C3C'
                        }}>
                            <div style={{ fontWeight: '800', marginBottom: '4px' }}>알레르기 정보</div>
                            <div style={{ fontSize: '12px' }}>{product.allergy_text || '정보 없음'}</div>
                        </div>
                        <div style={{
                            background: '#F9FAFB', padding: '10px', borderRadius: '8px',
                            border: '1px solid #E5E7EB', color: '#374151'
                        }}>
                            <div style={{ fontWeight: '800', marginBottom: '4px' }}>제품 분류</div>
                            <div style={{ fontSize: '12px' }}>{product.kind_name || '정보 없음'}</div>
                        </div>
                    </div>
                </div>

                <div id="ingredient" className="card stack">
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ fontWeight: '800' }}>원재료</div>
                        </div>
                        <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#444' }}>
                            {product.raw_materials_text}
                        </div>
                    </div>
                </div>

                <div id="nutrition" className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontWeight: '800' }}>영양 정보 요약</div>
                    </div>

                    <div style={{
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#444',
                        background: '#f9f9f9',
                        padding: '12px',
                        borderRadius: '8px',
                        whiteSpace: 'pre-line'
                    }}>
                        {product.nutrient_text || '영양 성분 정보가 등록되어 있지 않습니다.'}
                    </div>

                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: '#aaa' }}>
                            데이터 출처: HACCP 공공데이터 포털
                        </div>
                    </div>
                </div>

                {!isFromRecommendation && (
                    <div id="recommend">
                        <div className="section-title">관련 더보기</div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                            같은 분류({product.kind_name})의 다른 제품들을 찾아보세요.
                        </div>
                        <button
                            className="btn"
                            style={{ width: '100%', background: '#fff', color: 'var(--c-primary)', border: '1px solid var(--c-primary)' }}
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

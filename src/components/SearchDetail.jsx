
import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera } from '@capacitor/camera';

import db from './lib/db.js'
import './dar.css'

const SearchDetail = () => {
    // 1. 필요한 훅 및 상태 정의
    const location = useLocation(); // 이전 페이지에서 넘겨준 데이터(검색어 등) 수신
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(location.state?.autoScan || false); // 카메라 스캔 모드 여부
    const [searchQuery, setSearchQuery] = useState(location.state?.query || ''); // 검색창 입력값
    const [results, setResults] = useState([]); // 검색 결과 리스트
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 제어
    const [hasSearched, setHasSearched] = useState(!!location.state?.query); // 검색 실행 여부 (결과 섹션 표시용)
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);
    const scannerRef = useRef(null);

    /**
     * [검색 실행 함수]
     * SQL의 LIKE 문법을 사용하여 상품 데이터베이스에서 검색어와 일치하는 상품을 찾습니다.
     * @param {string} query 검색할 상품명
     */
    const filterResults = async (query) => {
        if (!query.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        try {
            // SQL 쿼리 실행: 상품명(product_name)에 검색어가 포함된 데이터를 모두 조회합니다.
            const queryResult = await db.execute(`
                SELECT 
                    report_no, 
                    product_name AS name, 
                    capacity AS price, 
                    imgurl1 AS img, 
                    seller 
                FROM products 
                WHERE product_name LIKE ? OR report_no LIKE ?
            `, [`%${query}%`, `%${query}%`]);

            // 조회된 원본 데이터를 UI 표시용 객체 구조로 변환
            const mapped = queryResult.map((item, index) => ({
                id: `${item.report_no || 'item'}-${index}`,
                productId: item.report_no,
                name: item.name,
                price: item.price || '용량 정보 없음',
                img: item.img,
                seller: item.seller
            }));
            setResults(mapped);
            setHasSearched(true); // 검색 결과가 있을 때만 목록 영역을 보여주기 위해 true로 설정
        } catch (error) {
            console.error('검색 쿼리 실행 중 오류 발생:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // [바코드 스캔: 카메라 권한 체크]
    useEffect(() => {
        const checkPermission = async () => {
            try {
                const result = await Camera.checkPermissions();
                if (result.camera === 'granted') setIsPermissionGranted(true);
                else {
                    const request = await Camera.requestPermissions({ permissions: ['camera'] });
                    if (request.camera === 'granted' || request.camera === 'limited') setIsPermissionGranted(true);
                }
            } catch {
                setIsPermissionGranted(true); // 웹 환경 대응
            }
        };
        checkPermission();
    }, []);

    // [바코드 스캔: 스캐너 초기화 및 가동]
    useEffect(() => {
        if (!isScanning) {
            if (scannerRef.current) {
                try { scannerRef.current.clear(); } catch { /* ignore */ }
                scannerRef.current = null;
            }
            return;
        }

        if (!isPermissionGranted) return;
        if (scannerRef.current) return;

        const timer = setTimeout(() => {
            try {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
                    false
                );
                scannerRef.current = scanner;

                scanner.render((decodedText) => {
                    // 스캔 성공 시
                    setSearchQuery(decodedText);
                    filterResults(decodedText);
                    setIsScanning(false); // 스캔 성공 시 카메라 종료

                    try { scanner.clear(); } catch { /* ignore */ }
                    scannerRef.current = null;
                }, () => { });
            } catch (e) {
                console.error(e);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                try { scannerRef.current.clear(); } catch { /* ignore */ }
                scannerRef.current = null;
            }
        };
    }, [isScanning, isPermissionGranted]);

    // 2. 컴포넌트 로드 시 최초 1회 실행
    useEffect(() => {
        // 메인 페이지에서 검색어를 넘겨받아 진입한 경우 바로 검색 수행
        if (searchQuery) {
            filterResults(searchQuery);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 3. 검색 버튼 클릭 핸들러
    const handleSearch = () => {
        if (searchQuery.trim()) {
            filterResults(searchQuery);
        }
    }

    // 4. 입력창 엔터 키 대응
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    }

    // 5. 상품 카드 클릭 시 상세 페이지로 이동
    const handleProductClick = (id) => {
        navigate('/product', { state: { productId: id } });
    }

    return (
        <div className="stack">
            {/* 1. 검색 입력 영역: 현재 페이지에서도 즉시 다른 상품을 검색할 수 있도록 제공 */}
            <div className="card search-box" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                    onClick={() => navigate('/favorites')}
                    style={{ cursor: 'pointer', fontSize: '20px', color: '#f43f5e', marginRight: '4px' }}
                    title="즐겨찾기"
                >
                    ❤️
                </div>
                <input
                    id="scarcest"
                    type="text"
                    name="search"
                    placeholder="상품명을 입력 해주세요"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button className='btn' onClick={handleSearch}>검색</button>
            </div>

            {/* 2. 바코드 스캔 및 카메라 영역 */}
            <div style={{ marginTop: '12px' }}>
                <button
                    className='btn'
                    style={{ width: '100%', background: '#263238' }}
                    onClick={() => setIsScanning(!isScanning)}
                >
                    {isScanning ? '❌ 스캔 종료' : '📷 바코드 스캔하기'}
                </button>

                {/* isScanning이 활성화된 경우에만 카메라 화면(reader) 영역을 렌더링 */}
                {isScanning && (
                    <div className="scan-box">
                        <div id="reader" style={{ width: '100%', height: '100%' }}>
                            {/* html5-qrcode 라이브러리가 여기에 카메라 화면을 렌더링합니다 */}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. 검색 결과 목록: 사용자가 검색을 실행한 경우(hasSearched)에만 표시 */}
            {hasSearched && (
                <div className="recommend-section" style={{ marginTop: '20px' }}>
                    <div className="section-title">
                        '{searchQuery}' 검색 결과 ({results.length}건)
                    </div>

                    {/* 로딩 상태일 때는 안내 문구 표시, 완료 후에는 실제 목록 표시 */}
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>데이터를 불러오는 중...</div>
                    ) : (
                        <div className="recommend-grid">
                            {results.length > 0 ? (
                                results.map((item) => (
                                    <div key={item.id} className="recommend-item" onClick={() => handleProductClick(item.productId)}>
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
                                        <div className="recommend-name">{item.name}</div>
                                        <div className="recommend-price">{item.price}</div>
                                    </div>
                                ))
                            ) : (
                                /* 검색 결과가 0건일 때 표시되는 영역 */
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#666' }}>검색 결과가 없습니다.</div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default SearchDetail

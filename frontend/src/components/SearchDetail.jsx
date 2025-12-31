import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Html5Qrcode } from "html5-qrcode";

import db from './lib/db.js'
import '../styles/dar.css'

const SearchDetail = ({ isLoggedIn }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(location.state?.autoScan || false);
    const [searchQuery, setSearchQuery] = useState(location.state?.query || '');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(!!location.state?.query);
    const html5QrCodeRef = useRef(null);

    // 검색 실행
    const filterResults = async (query) => {
        if (!query.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        try {
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

            const mapped = queryResult.map((item, index) => ({
                id: `${item.report_no || 'item'}-${index}`,
                productId: item.report_no,
                name: item.name,
                price: item.price || '용량 정보 없음',
                img: item.img,
                seller: item.seller
            }));
            setResults(mapped);
            setHasSearched(true);
        } catch (error) {
            console.error('검색 쿼리 실행 중 오류 발생:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // [웹] 스캔 중단
    const stopWebScan = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current.clear();
                html5QrCodeRef.current = null;
            } catch (err) {
                console.error("Failed to stop html5-qrcode", err);
            }
        }
        setIsScanning(false);
    };

    // 스캔 시작 핸들러
    const startScan = async () => {
        // [Web 환경]
        if (Capacitor.getPlatform() === 'web') {
            if (isScanning) {
                await stopWebScan();
                return;
            }

            setIsScanning(true);
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length) {
                    const html5QrCode = new Html5Qrcode("reader");
                    html5QrCodeRef.current = html5QrCode;

                    // 카메라 ID 사용 (첫 번째 카메라)
                    const cameraId = devices[0].id;

                    await html5QrCode.start(
                        cameraId,
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        (decodedText) => {
                            setSearchQuery(decodedText);
                            filterResults(decodedText);
                            stopWebScan();
                        },
                        (errorMessage) => {
                            // 스캔 중 에러 (무시)
                        }
                    );
                } else {
                    alert("사용 가능한 카메라가 없습니다.");
                    setIsScanning(false);
                }
            } catch (err) {
                console.error("Web Scan Error:", err);
                setIsScanning(false);
                alert("웹 카메라 권한을 확인해주세요.");
            }
            return;
        }

        // [Android/Native 환경]
        try {
            const { camera } = await BarcodeScanner.requestPermissions();
            if (camera !== 'granted' && camera !== 'limited') {
                alert('카메라 권한이 거부되었습니다.');
                return;
            }

            setIsScanning(true);

            const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
            if (!available) {
                alert('바코드 모듈 다운로드 중...');
                await BarcodeScanner.installGoogleBarcodeScannerModule();
            }

            const { barcodes } = await BarcodeScanner.scan({
                formats: [BarcodeFormat.QrCode, BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA],
                lensFacing: LensFacing.Back
            });

            if (barcodes.length > 0) {
                const scannedValue = barcodes[0].rawValue;
                setSearchQuery(scannedValue);
                filterResults(scannedValue);
            }
        } catch (error) {
            console.error('Mobile Scan Error:', error);
            if (!error.message.includes('canceled')) {
                alert('스캔 오류: ' + error.message);
            }
        } finally {
            setIsScanning(false);
        }
    };

    // 컴포넌트 언마운트 시 웹 스캐너 정리
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(console.error);
                html5QrCodeRef.current.clear();
            }
        };
    }, []);

    // 초기 검색어 처리
    useEffect(() => {
        if (searchQuery) filterResults(searchQuery);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) filterResults(searchQuery);
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSearch();
    }

    const handleProductClick = (id) => {
        navigate('/product', { state: { productId: id } });
    }

    return (
        <div className="stack">
            {/* 1. 검색 입력 영역: 현재 페이지에서도 즉시 다른 상품을 검색할 수 있도록 제공 */}
            <div className="card search-box" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isLoggedIn && (
                    <div
                        onClick={() => navigate('/favorites')}
                        style={{ cursor: 'pointer', fontSize: '20px', color: '#d0e700d0', marginRight: '4px' }}
                        title="즐겨찾기"
                    >
                        ⭐
                    </div>
                )}
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
                    onClick={startScan}
                    disabled={isScanning}
                >
                    {isScanning ? ' 스캔 중단' : '📷 바코드 스캔하기'}
                </button>

                {/* Web Scanner Element */}
                <div id="reader" style={{ width: '100%', marginTop: '10px' }}></div>
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

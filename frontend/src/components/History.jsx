import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from './lib/db';
import { getUserId } from './lib/userUtils';
import '../styles/History.css';

const History = ({ isLoggedIn, userInfo }) => {
    // ----------------------------------------------------------------
    // [변수 설명]
    // historyList: DB에서 가져온 전체 스캔 내역을 저장하는 배열
    // filter: 현재 선택된 필터링 옵션 ('전체' | '안전' | '주의' | '위험')
    // navigate: 페이지 이동을 위한 리액트 라우터 훅
    // ----------------------------------------------------------------

    const [historyList, setHistoryList] = useState([]);
    const [filter, setFilter] = useState('전체');
    const navigate = useNavigate();
    const userId = getUserId(userInfo);

    // [기능: 초기 데이터 로드]
    // 컴포넌트가 처음 화면에 나타날 때 실행됩니다.
    // DB의 'scan_history' 테이블에서 데이터를 가져와 가공하여 상태에 저장합니다.
    useEffect(() => {
        if (!isLoggedIn || !userId) {
            setHistoryList([]);
            return;
        }

        const fetchHistory = async () => {
            try {
                // 1. MySQL DB에서 스캔 기록 조회 (최신순 정렬) + 상품 이미지 조인
                // 현재 로그인한 유저(user_id)의 기록만 조회
                const query = `
                    SELECT h.*, p.imgurl1 
                    FROM scan_history h
                    LEFT JOIN products p ON h.report_no = p.report_no
                    WHERE h.user_id = ?
                    ORDER BY h.scanned_at DESC
                `;
                const data = await db.execute(query, [userId]);

                // 2. 데이터 가공 (UI에 맞게 필드명 변경 및 포맷팅)
                const mapped = (data || []).map(item => ({
                    ...item,
                    name: item.product_name_snapshot,
                    date: item.scanned_at
                        ? (typeof item.scanned_at === 'string'
                            ? item.scanned_at.split('T')[0]
                            : new Date(item.scanned_at).toISOString().split('T')[0])
                        : '',
                    grade: 'safe',
                    gradeText: '🟢 안전',
                    productId: item.report_no,
                    imgurl1: item.imgurl1 // 이미지 URL
                }));

                setHistoryList(mapped);
            } catch (e) {
                console.error('히스토리 로드 실패:', e);
            }
        };
        fetchHistory();
    }, [isLoggedIn, userId]);

    // [기능: 상품 클릭 핸들러]
    // 리스트에서 특정 상품을 클릭하면 해당 상품의 상세 페이지로 이동합니다.
    const handleItemClick = (productId) => {
        if (!productId) return;
        // 페이지 이동 시 'state'로productId를 넘겨주어 상세 페이지에서 조회 가능하게 함
        navigate('/product', { state: { productId } });
    };

    // [기능: 목록 필터링]
    // 현재 선택된 'filter' 값(예: '주의')에 따라 보여줄 목록을 실시간으로 계산합니다.
    const filteredHistory = filter === '전체'
        ? historyList // 전체 선택 시 모든 목록 반환
        : historyList.filter(item => item.gradeText.includes(filter)); // 텍스트 포함 여부로 필터링

    return (
        <div className="history-container">
            <div className="history-header">
                <h1>스캔 히스토리</h1>
                <p>최근 분석된 상품 목록입니다.</p>
            </div>

            <div className="history-filters">
                {['전체', '안전', '주의', '위험'].map(f => (
                    <div
                        key={f}
                        className={`filter-chip ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f}
                    </div>
                ))}
            </div>

            {filteredHistory.length > 0 ? (
                <div className="history-list">
                    {filteredHistory.map((item, index) => (
                        <div
                            key={index}
                            className="history-item"
                            onClick={() => handleItemClick(item.productId)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="history-thumb">
                                {item.imgurl1 ? (
                                    <img
                                        src={item.imgurl1}
                                        alt={item.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                                    />
                                ) : (
                                    item.name && item.name.includes('우유') ? '🥛' : '🍹'
                                )}
                            </div>
                            <div className="history-info">
                                <p className="history-name">{item.name}</p>
                                <p className="history-meta">{item.date} · {item.barcode}</p>
                            </div>
                            <div className={`history-status ${item.grade}`}>
                                {item.gradeText}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-history">
                    <span className="empty-icon">📂</span>
                    <p className="empty-text">아직 스캔한 내역이 없습니다.</p>
                </div>
            )}
        </div>
    );
};

export default History;

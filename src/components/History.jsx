import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from './lib/db';
import './History.css';

const History = () => {
    const [historyList, setHistoryList] = useState([]);
    const [filter, setFilter] = useState('전체');
    const navigate = useNavigate();

    // DB에서 히스토리 데이터 로드
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // 최신순으로 정렬하여 가져오기
                const data = await db.execute('SELECT * FROM scan_history ORDER BY timestamp DESC');

                // UI에서 사용하는 필드명으로 매핑
                const mapped = (data || []).map(item => ({
                    ...item,
                    name: item.product_name_snapshot,
                    date: item.scanned_at ? item.scanned_at.split('T')[0] : '',
                    grade: 'safe',
                    gradeText: '🟢 안전',
                    productId: item.report_no
                }));

                setHistoryList(mapped);
            } catch (e) {
                console.error('히스토리 로드 실패:', e);
            }
        };
        fetchHistory();
    }, []);

    // 해당 상품 상세 페이지로 이동
    const handleItemClick = (productId) => {
        if (!productId) return;
        navigate('/product', { state: { productId } });
    };

    const filteredHistory = filter === '전체'
        ? historyList
        : historyList.filter(item => item.gradeText.includes(filter));

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
                                {item.name && item.name.includes('우유') ? '🥛' : '🍹'}
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

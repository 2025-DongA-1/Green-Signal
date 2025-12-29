import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

/**
 * [사이드바 메뉴 컴포넌트]
 * 화면 좌측(또는 전체 오버레이)에서 슬라이드되어 나오는 네비게이션 메뉴입니다.
 * 로그인 상태에 따라 사용자 정보 표시 및 메뉴 항목이 달라집니다.
 *
 * @param {boolean} isOpen - 사이드바 표시 여부
 * @param {function} onClose - 사이드바 닫기 함수
 * @param {boolean} isLoggedIn - 로그인 여부
 * @param {object} userInfo - 로그인한 사용자 정보 객체 (nickname, email 등 포함)
 * @param {function} onLogout - 로그아웃 처리 함수
 * @param {function} onLoginClick - 로그인 버튼 클릭 핸들러
 */
const Sidebar = ({ isOpen, onClose, isLoggedIn = false, userInfo, onLogout, onLoginClick }) => {
    const navigate = useNavigate();

    // 메뉴 항목 정의 (show 속성으로 노출 여부 제어)
    const menuItems = [
        {
            id: 'profile',
            label: '마이 프로필',
            icon: '👤',
            path: '/profile',
            show: isLoggedIn // 로그인 시에만 노출
        },
        {
            id: 'favorites',
            label: '즐겨찾기',
            icon: '❤️',
            path: '/favorites',
            show: isLoggedIn
        },
        {
            id: 'history',
            label: '히스토리',
            icon: '🕒',
            path: '/history',
            show: isLoggedIn
        },
        {
            id: 'source',
            label: '데이터/출처',
            icon: '📊',
            path: '/source',
            show: true // 항상 노출
        }
    ];

    // 메뉴 클릭 핸들러: 페이지 이동 후 사이드바 닫기
    const handleMenuClick = (path) => {
        navigate(path);
        onClose();
    };

    return (
        <>
            {/* 오버레이: 사이드바 바깥 배경 (클릭 시 닫힘) */}
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />

            {/* 사이드바 본체 */}
            <div className={`sidebar-container ${isOpen ? 'active' : ''}`}>
                <div className="sidebar-header">
                    <div className="user-info">
                        <div className="user-avatar">
                            {/* 로그인 여부에 따라 아이콘 변경 (추후 이미지 URL 연동 가능) */}
                            {isLoggedIn ? '🧒' : '❓'}
                        </div>
                        <div>
                            {/* 사용자 닉네임 또는 이메일 표시 */}
                            <h3>
                                {isLoggedIn && userInfo
                                    ? (userInfo.nickname || userInfo.name || userInfo.email.split('@')[0])
                                    : '로그인 해주세요'}
                            </h3>
                            <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>
                                {isLoggedIn
                                    ? (userInfo?.email || '오늘도 건강한 선택!')
                                    : '그린시그널과 함께해요'}
                            </p>
                        </div>
                    </div>
                    {/* 닫기 버튼 */}
                    <button className="sidebar-close" onClick={onClose}>×</button>
                </div>

                <div className="sidebar-menu">
                    {/* 로그인 상태에 따른 로그인/로그아웃 버튼 분기 */}
                    {!isLoggedIn ? (
                        <div className="menu-item" onClick={onLoginClick}>
                            <i>🔑</i>
                            <span>로그인</span>
                        </div>
                    ) : (
                        <div className="menu-item" onClick={() => { onLogout(); onClose(); }}>
                            <i>🚪</i>
                            <span>로그아웃</span>
                        </div>
                    )}

                    {/* 구분선 */}
                    <div style={{ height: '1px', background: '#f0f0f0', margin: '10px 20px' }} />

                    {/* 메뉴 아이템 렌더링 */}
                    {menuItems.filter(item => item.show).map(item => (
                        <div key={item.id} className="menu-item" onClick={() => handleMenuClick(item.path)}>
                            <i>{item.icon}</i>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* 사이드바 하단 (앱 정보) */}
                <div className="sidebar-footer">
                    <p><b>Green Signal</b> v1.0.0</p>
                    <p>© 2025 All Rights Reserved.</p>
                </div>
            </div>
        </>
    );
};

export default Sidebar;

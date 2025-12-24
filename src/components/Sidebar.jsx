import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, isLoggedIn = false, onLogout, onLoginClick }) => {
    const navigate = useNavigate();

    const menuItems = [
        {
            id: 'profile',
            label: '마이 프로필',
            icon: '👤',
            path: '/profile',
            show: isLoggedIn
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
            show: true
        }
    ];

    const handleMenuClick = (path) => {
        navigate(path);
        onClose();
    };

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose} />

            <div className={`sidebar-container ${isOpen ? 'active' : ''}`}>
                <div className="sidebar-header">
                    <div className="user-info">
                        <div className="user-avatar">
                            {isLoggedIn ? '🧒' : '❓'}
                        </div>
                        <div>
                            <h3>{isLoggedIn ? '반가워요!' : '로그인 해주세요'}</h3>
                            <p style={{ fontSize: '11px', opacity: 0.8, margin: 0 }}>
                                {isLoggedIn ? '오늘도 건강한 선택!' : '그린시그널과 함께해요'}
                            </p>
                        </div>
                    </div>
                    <button className="sidebar-close" onClick={onClose}>×</button>
                </div>

                <div className="sidebar-menu">
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

                    <div style={{ height: '1px', background: '#f0f0f0', margin: '10px 20px' }} />

                    {menuItems.filter(item => item.show).map(item => (
                        <div key={item.id} className="menu-item" onClick={() => handleMenuClick(item.path)}>
                            <i>{item.icon}</i>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>

                <div className="sidebar-footer">
                    <p><b>Green Signal</b> v1.0.0</p>
                    <p>© 2025 All Rights Reserved.</p>
                </div>
            </div>
        </>
    );
};

export default Sidebar;

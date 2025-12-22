import React from 'react'
import { useNavigate } from 'react-router-dom'
import './dar.css'

const Header = ({ onMenuClick }) => {
    const navigate = useNavigate();

    const homeNavigate = (state = {}) => {
        navigate('/', { state });
    }

    return (
        /* top-bar: 상단 고정 헤더 */
        <div className="top-bar">

            {/* 좌측: 기록 버튼 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <i
                    style={{ fontStyle: 'normal', fontSize: '14px', cursor: 'pointer' }}
                    onClick={() => navigate('/history')}
                >
                    기록
                </i>
                <span style={{ color: '#e5e7eb' }}>|</span>
            </div>

            {/* 중앙: 로고 */}
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                    src="\Green Signal.png"
                    alt="Green Signal"
                    style={{ height: '32px' }}
                    onClick={() => homeNavigate()}
                />
            </div>

            {/* 우측: 메뉴 버튼 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: '#e5e7eb' }}>|</span>
                <i
                    style={{ fontStyle: 'normal', fontSize: '14px', cursor: 'pointer' }}
                    onClick={onMenuClick}
                >
                    메뉴
                </i>
            </div>

        </div>
    )
}

export default Header
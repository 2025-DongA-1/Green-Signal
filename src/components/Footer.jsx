import React from 'react'
// import { Route, Routes, Link } from 'react-router-dom'
// import { BrowserRouter } from 'react-router-dom'
import './dar.css'
import { useNavigate, useLocation } from 'react-router-dom'

const Footer = () => {

    const navigate = useNavigate();
    const location = useLocation(); // 현재 경로 정보를 가져옴

    const homeNavigate = (state = {}) => {
        navigate('/', { state });
    }
    const searchNavigate = (state = {}) => {
        navigate('/search', { state });
    }

    return (
        <div>
            {/* 하단 탭바 컨테이너 (3개의 탭으로 구성) */}
            <div className="tab-bar">

                {/* 1. 홈(Home) 탭 - 현재 경로가 '/'일 때 활성화됨(active) */}
                <div
                    className={`tab ${location.pathname === '/' ? 'active' : ''}`}
                    onClick={() => homeNavigate()}
                >
                    {/* 홈 아이콘 (집 모양 SVG) */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>홈</span>
                </div>

                {/* 2. 검색(Search) 탭 - 현재 경로가 '/search'일 때 활성화됨(active) */}
                <div
                    className={`tab ${location.pathname === '/search' ? 'active' : ''}`}
                    onClick={() => searchNavigate()}
                >
                    {/* 검색 아이콘 (돋보기 모양 SVG) */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>

                    <span>검색</span>
                </div>

                {/* 3. 마이(My) 탭 */}
                <div className="tab">
                    {/* 마이페이지 아이콘 (사람 모양 SVG) */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span>마이</span>
                </div>
            </div>

        </div>
    )
}

export default Footer
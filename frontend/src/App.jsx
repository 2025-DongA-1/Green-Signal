import { useState, useEffect } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import db from './components/lib/db'

import Header from './components/Header'
import Footer from './components/Footer'
import Search from './components/search'
import SearchDetail from './components/SearchDetail'
import ProductDetailMain from './components/ProductDetailMain'
import History from './components/History'
import Favorites from './components/Favorites'
import Sidebar from './components/Sidebar'
import AuthModal from './components/AuthModal' // ✅ 변경: AuthModal import
import { ProfilePlaceholder, SourcePlaceholder } from './components/Placeholders'
import MyPageModal from './components/MyPageModal'

function App() {
  const [favorites, setFavorites] = useState([])
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggedIn, setLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false) // ✅ 추가: 로그인 모달 상태
  const [userInfo, setUserInfo] = useState(null) // ✅ 추가: 로그인 유저 정보

  // 공통: 즐겨찾기 데이터 로드 함수
  const fetchFavorites = async (userId) => {
    if (!userId) return;
    try {
      // DB에서 즐겨찾기 목록을 조회 (상품 테이블과 조인하여 이미지 URL 가져오기)
      // 특정 유저(user_id)의 즐겨찾기만 조회
      const query = `
          SELECT f.*, p.imgurl1 
          FROM favorites f 
          LEFT JOIN products p ON f.report_no = p.report_no
          WHERE f.user_id = ?
        `;
      const data = await db.execute(query, [userId]);
      setFavorites(data || []);
    } catch (e) {
      console.error('즐겨찾기 로드 실패:', e);
    }
  };

  // 컴포넌트 마운트 시 초기 로그인 상태 확인 및 데이터 로드 + 소셜 로그인 토큰 처리
  useEffect(() => {
    // 1. 소셜 로그인 토큰 처리 (URL 쿼리 파라미터 확인)
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);

      // 토큰 디코딩 (간단하게 payload만 해석)
      try {
        const payload = JSON.parse(atob(tokenFromUrl.split('.')[1]));
        const userData = {
          user_id: payload.id || payload.user_id, // id 또는 user_id 둘 다 확인
          email: payload.email,
          role: payload.role,
          provider: payload.provider, // google or kakao
          nickname: payload.nickname || (payload.email ? payload.email.split('@')[0] : 'User')
        };
        localStorage.setItem("user", JSON.stringify(userData));

        // 상태 업데이트
        setLoggedIn(true);
        setUserInfo(userData);
        setShowLoginModal(false); // ✅ 로그인 모달 닫기 추가
        fetchFavorites(userData.user_id);

        // URL 정리 (토큰 제거)
        window.history.replaceState({}, document.title, "/");
      } catch (e) {
        console.error("Token parsing error:", e);
      }
    } else {
      // 2. 기존 로컬 스토리지 로그인 확인
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        setLoggedIn(true);
        const parsedUser = JSON.parse(user);
        setUserInfo(parsedUser);
        fetchFavorites(parsedUser.user_id);
      } else {
        setFavorites([]);
      }
    }
  }, []);

  // [기능: 즐겨찾기 추가/삭제]
  // 사용자가 하트 버튼을 클릭했을 때 호출됩니다.
  // DB에 즐겨찾기 데이터를 추가하거나, 이미 존재하면 삭제합니다.
  const toggleFavorite = async (product) => {
    if (!isLoggedIn || !userInfo || !userInfo.user_id) {
      console.error("로그인 정보 부족:", userInfo);
      alert('로그인 정보가 올바르지 않습니다. 다시 로그인해주세요.');
      setShowLoginModal(true);
      return;
    }

    // 상품 고유 번호 추출 (데이터 소스에 따라 필드명이 다를 수 있음)
    console.log("Toggle Favorite Product:", product); // 디버깅용 로그
    const reportNo = product.report_no || product.prdlstReportNo;

    // reportNo가 없으면 중단
    if (!reportNo) {
      console.error("No report_no found for product:", product);
      return;
    }

    // 현재 즐겨찾기 목록에 해당 상품이 있는지 확인
    const isExist = favorites.find(item => String(item.report_no || item.prdlstReportNo) === String(reportNo));

    try {
      if (isExist) {
        // [삭제 로직] 이미 존재하면 DB에서 삭제 (해당 유저의 것만)
        await db.execute('DELETE FROM favorites WHERE report_no = ? AND user_id = ?', [reportNo, userInfo.user_id]);
        // 화면 목록에서도 즉시 제거
        setFavorites(prev => prev.filter(item => (item.report_no || item.prdlstReportNo) !== reportNo));
      } else {
        // [추가 로직] 존재하지 않으면 DB에 추가 (최대 50개 제한)
        if (favorites.length >= 50) {
          alert('즐겨찾기는 최대 50개까지만 등록할 수 있습니다.');
          return;
        }

        const favValues = [
          userInfo.user_id, // 실제 로그인 유저 ID
          reportNo,
          product.product_name || product.product_name_snapshot || product.prdlstNm,
          product.manufacturer || product.manufacture,
          'safe',
          '🟢 안전', // grade_text
          new Date().toISOString().slice(0, 19).replace('T', ' ') // MySQL DATETIME format
        ];

        await db.execute(
          'INSERT INTO favorites (user_id, report_no, product_name, manufacturer, grade, grade_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          favValues
        );

        const newItem = {
          user_id: userInfo.user_id,
          report_no: reportNo,
          product_name: product.product_name || product.product_name_snapshot || product.prdlstNm,
          manufacturer: product.manufacturer || product.manufacture,
          grade: 'safe',
          grade_text: '🟢 안전',
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          imgurl1: product.imgurl1 // 이미지 URL 추가
        };
        setFavorites(prev => [newItem, ...prev]);
      }
    } catch (e) {
      console.error('즐겨찾기 토글 실패:', e);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUserInfo(null);
    setFavorites([]); // 즐겨찾기 목록 초기화
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('로그아웃 되었습니다.');
  };

  const handleLoginSuccess = (user) => {
    setLoggedIn(true);
    setUserInfo(user);
    setShowLoginModal(false);
    fetchFavorites(user.user_id); // 로그인 성공 시 데이터 로드
    alert(`환영합니다, ${user.nickname || '사용자'}님!`);
  };

  return (
    <div>
      <Header onMenuClick={() => setSidebarOpen(true)} isLoggedIn={isLoggedIn} />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isLoggedIn={isLoggedIn}
        userInfo={userInfo}
        onLogout={handleLogout}
        onLoginClick={() => {
          setSidebarOpen(false); // 사이드바 닫고
          setShowLoginModal(true); // 로그인 창 열기
        }}
      />

      <div className="container">
        <Routes>
          <Route path="/" element={<Search isLoggedIn={isLoggedIn} />} />
          <Route path="/search" element={<SearchDetail isLoggedIn={isLoggedIn} />} />
          <Route path="/product" element={<ProductDetailMain favorites={favorites} toggleFavorite={toggleFavorite} userInfo={userInfo} />} />
          <Route path="/history" element={<History isLoggedIn={isLoggedIn} userInfo={userInfo} />} />
          <Route path="/favorites" element={<Favorites favorites={favorites} onRemove={toggleFavorite} isLoggedIn={isLoggedIn} />} />
          <Route path="/profile" element={
            <MyPageModal
              user={userInfo}
              onClose={() => window.history.back()}
              onSaved={(updatedUser) => {
                setUserInfo(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                alert("회원 정보가 수정되었습니다.");
              }}
            />
          } />
          <Route path="/source" element={<SourcePlaceholder />} />
        </Routes>
      </div>

      <Footer />

      {/* 글로벌 로그인 모달 */}
      <AuthModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}

export default App

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
import AuthModal from './components/AuthModal' // ??변�? AuthModal import
import { ProfilePlaceholder, SourcePlaceholder } from './components/Placeholders'
import MyPage from './components/MyPage'
import Recommend from './components/Recommend'

function App() {
  const [favorites, setFavorites] = useState([])
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggedIn, setLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false) // ??추�?: 로그??모달 ?�태
  const [userInfo, setUserInfo] = useState(null) // ??추�?: 로그???��? ?�보

  // 공통: 즐겨찾기 ?�이??로드 ?�수
  const fetchFavorites = async (userId) => {
    if (!userId) return;
    try {
      // DB?�서 즐겨찾기 목록??조회 (?�품 ?�이블과 조인?�여 ?��?지 URL 가?�오�?
      // ?�정 ?��?(user_id)??즐겨찾기�?조회
      const query = `
          SELECT f.*, p.imgurl1 
          FROM favorites f 
          LEFT JOIN products p ON f.report_no = p.report_no
          WHERE f.user_id = ?
        `;
      const data = await db.execute(query, [userId]);
      setFavorites(data || []);
    } catch (e) {
      console.error('즐겨찾기 로드 ?패:', e);
    }
  };

  // 컴포?트 마운????초기 로그???태 ?인 ??이??로드 + ?셜 로그???큰 처리
  // 컴포넌트 마운트 시 초기 로그인 상태 확인 및 Deep Link 리스너 등록
  useEffect(() => {
    // [1] 안드로이드 Deep Link 리스너 (앱으로 복귀 시 토큰 처리)
    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.addListener('appUrlOpen', (event) => {
        // URL 파싱: projectp2://callback?token=...
        const url = new URL(event.url);
        const tokenFromDeepLink = url.searchParams.get("token");

        if (tokenFromDeepLink) {
          processToken(tokenFromDeepLink); // 토큰 처리 함수 호출
        }
      });
    }).catch(err => console.log("Capacitor App plugin not found (web mode)", err));

    // [2] 웹 URL 쿼리 파라미터 확인 (브라우저 복귀 시)
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      processToken(tokenFromUrl);
    } else {
      // 3. 기존 로컬 스토리지 로그인 확인
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

  // 토큰 처리 및 로그인 완료 로직 분리
  const processToken = (tokenStr) => {
    if (!tokenStr) return;
    localStorage.setItem("token", tokenStr);
    try {
      const payload = JSON.parse(atob(tokenStr.split('.')[1]));
      const userData = {
        user_id: payload.id || payload.user_id,
        email: payload.email,
        role: payload.role,
        provider: payload.provider,
        nickname: payload.nickname || (payload.email ? payload.email.split('@')[0] : 'User')
      };
      localStorage.setItem("user", JSON.stringify(userData));

      setLoggedIn(true);
      setUserInfo(userData);
      setShowLoginModal(false);
      fetchFavorites(userData.user_id);

      // URL 정리
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error("Token pars error:", e);
    }
  };

  // [기능: 즐겨찾기 추?/??]
  // ?용?? ?트 버튼???릭?을 ???출?니??
  // DB??즐겨찾기 ?이?? 추??거?? ?? 존재?면 ???니??
  const toggleFavorite = async (product) => {
    if (!isLoggedIn || !userInfo || !userInfo.user_id) {
      alert('로그???�보가 ?�바르�? ?�습?�다. ?�시 로그?�해주세??');
      setShowLoginModal(true);
      return;
    }

    // ?�품 고유 번호 추출 (?�이???�스???�라 ?�드명이 ?��? ???�음)
    console.log("Toggle Favorite Product:", product); // ?�버깅용 로그
    const reportNo = product.report_no || product.prdlstReportNo;

    // reportNo가 ?�으�?중단
    if (!reportNo) {
      console.error("No report_no found for product:", product);
      return;
    }

    // ?�재 즐겨찾기 목록???�당 ?�품???�는지 ?�인
    const isExist = favorites.find(item => String(item.report_no || item.prdlstReportNo) === String(reportNo));

    try {
      if (isExist) {
        // [??�� 로직] ?��? 존재?�면 DB?�서 ??�� (?�당 ?��???것만)
        await db.execute('DELETE FROM favorites WHERE report_no = ? AND user_id = ?', [reportNo, userInfo.user_id]);
        // ?�면 목록?�서??즉시 ?�거
        setFavorites(prev => prev.filter(item => (item.report_no || item.prdlstReportNo) !== reportNo));
      } else {
        // [추�? 로직] 존재?��? ?�으�?DB??추�? (최�? 50�??�한)
        if (favorites.length >= 50) {
          alert('즐겨찾기??최�? 50개까지�??�록?????�습?�다.');
          return;
        }

        const favValues = [
          userInfo.user_id, // ?�제 로그???��? ID
          reportNo,
          product.product_name || product.product_name_snapshot || product.prdlstNm,
          product.manufacturer || product.manufacture,
          'safe',
          '?�� ?�전', // grade_text
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
          grade_text: '?�� ?�전',
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          imgurl1: product.imgurl1 // ?��?지 URL 추�?
        };
        setFavorites(prev => [newItem, ...prev]);
      }
    } catch (e) {
      console.error('즐겨찾기 ?��? ?�패:', e);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUserInfo(null);
    setFavorites([]); // 즐겨찾기 목록 초기??
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('로그?�웃 ?�었?�니??');
  };

  const handleLoginSuccess = (user) => {
    setLoggedIn(true);
    setUserInfo(user);
    setShowLoginModal(false);
    fetchFavorites(user.user_id); // 로그???�공 ???�이??로드
    alert(`ȯ���մϴ� ${user.nickname || "�����"}`);
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
          setSidebarOpen(false); // ?�이?�바 ?�고
          setShowLoginModal(true); // 로그??�??�기
        }}
      />

      <div className="container">
        <Routes>
          <Route path="/" element={<Search isLoggedIn={isLoggedIn} />} />
          <Route path="/search" element={<SearchDetail isLoggedIn={isLoggedIn} />} />
          <Route path="/product" element={<ProductDetailMain favorites={favorites} toggleFavorite={toggleFavorite} userInfo={userInfo} />} />
          <Route path="/history" element={<History isLoggedIn={isLoggedIn} userInfo={userInfo} />} />
          <Route path="/favorites" element={<Favorites favorites={favorites} onRemove={toggleFavorite} isLoggedIn={isLoggedIn} />} />
          <Route path="/recommend" element={<Recommend isLoggedIn={isLoggedIn} userInfo={userInfo} />} />
          <Route path="/profile" element={
            <MyPage
              user={userInfo}
              onSaved={(updatedUser) => {
                setUserInfo(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
              }}
            />
          } />
          <Route path="/source" element={<SourcePlaceholder />} />
        </Routes>
      </div>

      <Footer
        isLoggedIn={isLoggedIn}
        onOpenLogin={() => setShowLoginModal(true)}
      />

      {/* 글로벌 로그??모달 */}
      <AuthModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}

export default App







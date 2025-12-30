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
import AuthModal from './components/AuthModal' // ??ë³€ê²? AuthModal import
import { ProfilePlaceholder, SourcePlaceholder } from './components/Placeholders'
import MyPage from './components/MyPage'
import Recommend from './components/Recommend'

function App() {
  const [favorites, setFavorites] = useState([])
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggedIn, setLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false) // ??ì¶”ê?: ë¡œê·¸??ëª¨ë‹¬ ?íƒœ
  const [userInfo, setUserInfo] = useState(null) // ??ì¶”ê?: ë¡œê·¸??? ì? ?•ë³´

  // ê³µí†µ: ì¦ê²¨ì°¾ê¸° ?°ì´??ë¡œë“œ ?¨ìˆ˜
  const fetchFavorites = async (userId) => {
    if (!userId) return;
    try {
      // DB?ì„œ ì¦ê²¨ì°¾ê¸° ëª©ë¡??ì¡°íšŒ (?í’ˆ ?Œì´ë¸”ê³¼ ì¡°ì¸?˜ì—¬ ?´ë?ì§€ URL ê°€?¸ì˜¤ê¸?
      // ?¹ì • ? ì?(user_id)??ì¦ê²¨ì°¾ê¸°ë§?ì¡°íšŒ
      const query = `
          SELECT f.*, p.imgurl1 
          FROM favorites f 
          LEFT JOIN products p ON f.report_no = p.report_no
          WHERE f.user_id = ?
        `;
      const data = await db.execute(query, [userId]);
      setFavorites(data || []);
    } catch (e) {
      console.error('ì¦ê²¨ì°¾ê¸° ë¡œë“œ ?¤íŒ¨:', e);
    }
  };

  // ì»´í¬?ŒíŠ¸ ë§ˆìš´????ì´ˆê¸° ë¡œê·¸???íƒœ ?•ì¸ ë°??°ì´??ë¡œë“œ + ?Œì…œ ë¡œê·¸??? í° ì²˜ë¦¬
  useEffect(() => {
    // 1. ?Œì…œ ë¡œê·¸??? í° ì²˜ë¦¬ (URL ì¿¼ë¦¬ ?Œë¼ë¯¸í„° ?•ì¸)
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("token", tokenFromUrl);

      // ? í° ?”ì½”??(ê°„ë‹¨?˜ê²Œ payloadë§??´ì„)
      try {
        const payload = JSON.parse(atob(tokenFromUrl.split('.')[1]));
        const userData = {
          user_id: payload.id || payload.user_id, // id ?ëŠ” user_id ?????•ì¸
          email: payload.email,
          role: payload.role,
          provider: payload.provider, // google or kakao
          nickname: payload.nickname || (payload.email ? payload.email.split('@')[0] : 'User')
        };
        localStorage.setItem("user", JSON.stringify(userData));

        // ?íƒœ ?…ë°?´íŠ¸
        setLoggedIn(true);
        setUserInfo(userData);
        setShowLoginModal(false); // ??ë¡œê·¸??ëª¨ë‹¬ ?«ê¸° ì¶”ê?
        fetchFavorites(userData.user_id);

        // URL ?•ë¦¬ (? í° ?œê±°)
        window.history.replaceState({}, document.title, "/");
      } catch (e) {
        console.error("Token parsing error:", e);
      }
    } else {
      // 2. ê¸°ì¡´ ë¡œì»¬ ?¤í† ë¦¬ì? ë¡œê·¸???•ì¸
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

  // [ê¸°ëŠ¥: ì¦ê²¨ì°¾ê¸° ì¶”ê?/?? œ]
  // ?¬ìš©?ê? ?˜íŠ¸ ë²„íŠ¼???´ë¦­?ˆì„ ???¸ì¶œ?©ë‹ˆ??
  // DB??ì¦ê²¨ì°¾ê¸° ?°ì´?°ë? ì¶”ê??˜ê±°?? ?´ë? ì¡´ì¬?˜ë©´ ?? œ?©ë‹ˆ??
  const toggleFavorite = async (product) => {
    if (!isLoggedIn || !userInfo || !userInfo.user_id) {
      console.error("ë¡œê·¸???•ë³´ ë¶€ì¡?", userInfo);
      alert('ë¡œê·¸???•ë³´ê°€ ?¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤. ?¤ì‹œ ë¡œê·¸?¸í•´ì£¼ì„¸??');
      setShowLoginModal(true);
      return;
    }

    // ?í’ˆ ê³ ìœ  ë²ˆí˜¸ ì¶”ì¶œ (?°ì´???ŒìŠ¤???°ë¼ ?„ë“œëª…ì´ ?¤ë? ???ˆìŒ)
    console.log("Toggle Favorite Product:", product); // ?”ë²„ê¹…ìš© ë¡œê·¸
    const reportNo = product.report_no || product.prdlstReportNo;

    // reportNoê°€ ?†ìœ¼ë©?ì¤‘ë‹¨
    if (!reportNo) {
      console.error("No report_no found for product:", product);
      return;
    }

    // ?„ì¬ ì¦ê²¨ì°¾ê¸° ëª©ë¡???´ë‹¹ ?í’ˆ???ˆëŠ”ì§€ ?•ì¸
    const isExist = favorites.find(item => String(item.report_no || item.prdlstReportNo) === String(reportNo));

    try {
      if (isExist) {
        // [?? œ ë¡œì§] ?´ë? ì¡´ì¬?˜ë©´ DB?ì„œ ?? œ (?´ë‹¹ ? ì???ê²ƒë§Œ)
        await db.execute('DELETE FROM favorites WHERE report_no = ? AND user_id = ?', [reportNo, userInfo.user_id]);
        // ?”ë©´ ëª©ë¡?ì„œ??ì¦‰ì‹œ ?œê±°
        setFavorites(prev => prev.filter(item => (item.report_no || item.prdlstReportNo) !== reportNo));
      } else {
        // [ì¶”ê? ë¡œì§] ì¡´ì¬?˜ì? ?Šìœ¼ë©?DB??ì¶”ê? (ìµœë? 50ê°??œí•œ)
        if (favorites.length >= 50) {
          alert('ì¦ê²¨ì°¾ê¸°??ìµœë? 50ê°œê¹Œì§€ë§??±ë¡?????ˆìŠµ?ˆë‹¤.');
          return;
        }

        const favValues = [
          userInfo.user_id, // ?¤ì œ ë¡œê·¸??? ì? ID
          reportNo,
          product.product_name || product.product_name_snapshot || product.prdlstNm,
          product.manufacturer || product.manufacture,
          'safe',
          '?Ÿ¢ ?ˆì „', // grade_text
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
          grade_text: '?Ÿ¢ ?ˆì „',
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          imgurl1: product.imgurl1 // ?´ë?ì§€ URL ì¶”ê?
        };
        setFavorites(prev => [newItem, ...prev]);
      }
    } catch (e) {
      console.error('ì¦ê²¨ì°¾ê¸° ? ê? ?¤íŒ¨:', e);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUserInfo(null);
    setFavorites([]); // ì¦ê²¨ì°¾ê¸° ëª©ë¡ ì´ˆê¸°??
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('ë¡œê·¸?„ì›ƒ ?˜ì—ˆ?µë‹ˆ??');
  };

  const handleLoginSuccess = (user) => {
    setLoggedIn(true);
    setUserInfo(user);
    setShowLoginModal(false);
    fetchFavorites(user.user_id); // ë¡œê·¸???±ê³µ ???°ì´??ë¡œë“œ
        alert(`È¯¿µÇÕ´Ï´Ù ${user.nickname || "»ç¿ëÀÚ"}`);
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
          setSidebarOpen(false); // ?¬ì´?œë°” ?«ê³ 
          setShowLoginModal(true); // ë¡œê·¸??ì°??´ê¸°
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

      {/* ê¸€ë¡œë²Œ ë¡œê·¸??ëª¨ë‹¬ */}
      <AuthModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  )
}

export default App







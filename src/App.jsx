import { useState, useEffect } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import db from './components/lib/db'

import Header from './components/Header'
import Footer from './components/Footer'
import Search from './components/search'
import SearchDetail from './components/SearchDetail'
import ProductDetailMain from './components/ProductDetailMain'
import Login from './components/Login'
import History from './components/History'
import Favorites from './components/Favorites'
import Sidebar from './components/Sidebar'
import { ProfilePlaceholder, SourcePlaceholder } from './components/Placeholders'

function App() {
  const [favorites, setFavorites] = useState([])
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggedIn, setLoggedIn] = useState(false)

  // 초기 즐겨찾기 로드
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const data = await db.execute('SELECT * FROM favorites');
        setFavorites(data || []);
      } catch (e) {
        console.error('즐겨찾기 로드 실패:', e);
      }
    };
    loadFavorites();
  }, []);

  // 즐겨찾기 토글 함수
  const toggleFavorite = async (product) => {
    const reportNo = product.report_no || product.prdlstReportNo;
    const isExist = favorites.find(item => (item.report_no || item.prdlstReportNo) === reportNo);

    try {
      if (isExist) {
        await db.execute('DELETE FROM favorites WHERE report_no = ?', [reportNo]);
        setFavorites(prev => prev.filter(item => (item.report_no || item.prdlstReportNo) !== reportNo));
      } else {
        if (favorites.length >= 50) {
          alert('즐겨찾기는 최대 50개까지만 등록할 수 있습니다.');
          return;
        }

        const favValues = [
          1, // user_id (임시)
          reportNo,
          product.product_name || product.product_name_snapshot || product.prdlstNm,
          product.manufacturer || product.manufacture,
          'safe',
          '🟢 안전', // grade_text
          new Date().toISOString()
        ];

        await db.execute(
          'INSERT INTO favorites (user_id, report_no, product_name, manufacturer, grade, grade_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          favValues
        );

        const newItem = {
          user_id: 1,
          report_no: reportNo,
          product_name: product.product_name || product.product_name_snapshot || product.prdlstNm,
          manufacturer: product.manufacturer || product.manufacture,
          grade: 'safe',
          grade_text: '🟢 안전',
          created_at: new Date().toISOString()
        };
        setFavorites(prev => [newItem, ...prev]);
      }
    } catch (e) {
      console.error('즐겨찾기 토글 실패:', e);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    alert('로그아웃 되었습니다.');
  };

  return (
    <div>
      <Header onMenuClick={() => setSidebarOpen(true)} />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
      />

      <div className="container">
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/search" element={<SearchDetail />} />
          <Route path="/product" element={<ProductDetailMain favorites={favorites} toggleFavorite={toggleFavorite} />} />
          <Route path="/login" element={<Login onLoginSuccess={() => setLoggedIn(true)} />} />
          <Route path="/history" element={<History />} />
          <Route path="/favorites" element={<Favorites favorites={favorites} onRemove={toggleFavorite} />} />
          <Route path="/profile" element={<ProfilePlaceholder />} />
          <Route path="/source" element={<SourcePlaceholder />} />
        </Routes>
      </div>

      <Footer />
    </div>
  )
}

export default App

import React, { useEffect, useState } from "react";
import API from "./utils/axiosInstance";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import AuthModal from "./components/AuthModal";
import MyPageModal from "./components/MyPageModal";
import AdminPage from "./pages/AdminPage"; // ✅ 관리자 페이지 추가

function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const [page, setPage] = useState("home");

  // ✅ 구글/카카오 로그인 후 URL 토큰 저장 및 자동 로그인 반영
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.history.replaceState({}, document.title, "/");
      handleLoginSuccess();
    }
  }, []);

  // ✅ 로그인 유지
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await API.get("/users/me");
        setUser(res.data);
      } catch (err) {
        console.error("토큰 검증 실패:", err);
        localStorage.removeItem("token");
      }
    };
    fetchUser();
  }, []);

  // ✅ 로그아웃
  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // ✅ 로그인 성공 시 즉시 반영
  const handleLoginSuccess = async () => {
    try {
      const res = await API.get("/users/me");
      setUser(res.data);
      setShowLogin(false);
    } catch (err) {
      console.error("유저 정보 불러오기 실패:", err);
    }
  };

  // ✅ 회원가입 완료 → 로그인 탭으로 전환
  const handleRegisterDone = () => {
    setShowRegister(false);
    setTimeout(() => setShowLogin(true), 300);
  };

  // ✅ 마이페이지 수정 후 즉시 반영
  const handleProfileSaved = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* 헤더 */}
      <Header
        user={user}
        onLoginClick={() => setShowLogin(true)}
        onLogout={handleLogout}
        onSidebarToggle={() => setSidebarOpen(true)}
        onNavigate={setPage}
        onMyPageClick={() => setShowMyPage(true)}
      />

      {/* 사이드바 */}
      <Sidebar
        show={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={setPage}
      />

      {/* 메인 페이지 */}
      <main className="flex-1">
        {page === "home" && <HomePage />}
        {page === "admin" && <AdminPage />} {/* ✅ 관리자 페이지 완전 연결 */}
      </main>

      {/* 로그인 / 회원가입 모달 (AuthModal로 교체) */}
      <AuthModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />


      {/* 마이페이지 모달 */}
      {showMyPage && user && (
        <MyPageModal
          user={user}
          onClose={() => setShowMyPage(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
}

export default App;

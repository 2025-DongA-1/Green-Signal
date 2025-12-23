// src/components/Header.jsx
import React from "react";

function getAvatarLetter(user) {
  if (!user) return "?";
  const base = user.nickname || user.email || "U";
  return String(base).trim().charAt(0).toUpperCase();
}

const Header = ({
  user,
  onLoginClick,
  onLogout,
  onSidebarToggle,
  onNavigate,
  onMyPageClick, // ✅ 추가
}) => {
  const isAdmin =
    user && (user.role === "admin" || user.role === "super_admin");

  return (
    <header className="flex items-center justify-between bg-[#0a1525] text-white p-3 shadow">
      <div className="flex items-center gap-3">
        <button onClick={onSidebarToggle} className="text-xl">
          ☰
        </button>

        <h1 className="text-lg font-semibold">My Service</h1>

        {/* ✅ 관리자만 노출: 이름 왼쪽에 관리자페이지 버튼 */}
        {isAdmin && (
          <button
            className="ml-2 bg-green-600 hover:bg-green-500 px-3 py-1 rounded"
            onClick={() => onNavigate("admin")}
          >
            관리자페이지
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            {/* ✅ 프로필/닉네임 영역 */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold">
                {getAvatarLetter(user)}
              </div>
              <div className="leading-tight">
                <div className="font-semibold">{user.nickname}</div>
                <div className="text-xs text-white/60">{user.provider}</div>
              </div>
            </div>

            {/* ✅ 마이페이지 버튼 옆에 “모양(아바타)” 같이 붙여달라 → 버튼 내부에 아이콘처럼 */}
            <button
              onClick={onMyPageClick}
              className="flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded hover:bg-gray-100"
            >
              <span className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center font-bold text-sm">
                {getAvatarLetter(user)}
              </span>
              마이페이지
            </button>

            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-400 px-3 py-1.5 rounded"
            >
              로그아웃
            </button>
          </>
        ) : (
          <button
            onClick={onLoginClick}
            className="bg-blue-500 hover:bg-blue-400 px-3 py-1.5 rounded"
          >
            로그인
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;

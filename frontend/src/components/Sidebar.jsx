// src/components/Sidebar.jsx
import React, { useEffect } from "react";

const Sidebar = ({ show, onClose, onNavigate }) => {
  useEffect(() => {
    if (!show) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    // 스크롤 잠금(선택)
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    // ✅ 바깥(오버레이) 클릭하면 닫힘
    <div
      className="fixed inset-0 z-50 bg-black/30"
      onClick={onClose}
      role="presentation"
    >
      {/* ✅ 사이드바 본체 클릭은 전파 막기 */}
      <aside
        className="h-full w-64 bg-gray-900 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="font-bold text-lg">메뉴</div>
          <button className="text-white/80 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        <ul className="p-4 space-y-2">
          <li
            className="cursor-pointer rounded px-3 py-2 hover:bg-white/10"
            onClick={() => {
              onNavigate("home");
              onClose();
            }}
          >
            홈
          </li>

          {/* ✅ 요청대로: 사이드바에서 마이페이지/관리자 메뉴 제거 */}
        </ul>

        <div className="p-4 text-xs text-white/50">
          ESC로 닫을 수 있어요.
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;

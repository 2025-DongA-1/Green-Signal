import React, { useState } from "react";
import AuthModal from "../components/AuthModal";

function HomePage() {
    const [showAuthModal, setShowAuthModal] = useState(false);

    return (
        <div className="p-10 text-center text-gray-700">
            <h2 className="text-2xl font-bold mb-2">홈 화면</h2>
            <p>로그인하면 개인화된 정보를 확인할 수 있습니다.</p>

            {/* 🔹 테스트용 버튼 (기존 로그인 영향 없음) */}
            <div className="mt-8">
                <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
                >
                    새로운 로그인 테스트 (AuthModal)
                </button>
            </div>

            {/* 🔹 가져온 로그인 모달 연결 */}
            <AuthModal
                open={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onLoginSuccess={(user) => {
                    console.log("로그인 성공:", user);
                    alert(`로그인 성공! 환영합니다, ${user.nickname || '사용자'}님.`);
                    setShowAuthModal(false);
                }}
            />
        </div>
    );
}

export default HomePage;

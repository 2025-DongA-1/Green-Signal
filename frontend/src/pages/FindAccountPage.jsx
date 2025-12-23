// src/pages/FindAccountPage.jsx
import React, { useState } from "react";

export default function FindAccountPage() {
  const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMsg("이메일을 입력하세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "임시 비밀번호 발급 실패");
        return;
      }
      setMsg("임시 비밀번호를 이메일로 발송했습니다!");
    } catch {
      setMsg("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-5">비밀번호 찾기</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm mb-2">이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 mb-4"
          />

          {msg && <div className="text-center text-sm text-red-600 mb-3">{msg}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            {loading ? "처리 중..." : "임시 비밀번호 발급"}
          </button>
        </form>
      </div>
    </div>
  );
}

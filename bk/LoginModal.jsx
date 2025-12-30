import React, { useState } from "react";
import API from "../utils/axiosInstance";

const LoginModal = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });
      const { token } = res.data;
      if (token) {
        localStorage.setItem("token", token);
        setMessage("로그인 성공!");
        setTimeout(() => {
          onClose?.();
          onSuccess?.(); // App.jsx에서 로그인 상태 갱신
        }, 700);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] p-8">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
          {message && (
            <p
              className={`text-center text-sm ${
                message.includes("성공") ? "text-green-600" : "text-red-500"
              }`}
            >
              {message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="text-gray-400 text-sm mt-4 w-full text-center hover:text-gray-600"
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default LoginModal;

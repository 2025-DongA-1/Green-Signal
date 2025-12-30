// src/pages/RegisterPage.jsx
import React, { useState } from "react";
import API from "../utils/axiosInstance";

const RegisterPage = ({ onClose, onSuccess }) => {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ 카카오/구글 로그인
  const handleOAuth = (provider) => {
    window.location.href = `http://localhost:3000/auth/${provider}`;
  };

  // ✅ 로컬 로그인
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/auth/login", { email, password });
      const { token } = res.data;
      localStorage.setItem("token", token);
      setMessage("로그인 성공!");
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 800);
    } catch (err) {
      setMessage(err.response?.data?.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 회원가입
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }
    try {
      setLoading(true);
      const res = await API.post("/auth/register", {
        email,
        password,
        nickname,
      });
      setMessage(res.data?.message || "회원가입 완료!");
      setTimeout(() => setTab("login"), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 비밀번호 찾기
  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await API.post("/auth/forgot", { email });
      setMessage(res.data.message || "임시 비밀번호가 전송되었습니다.");
    } catch (err) {
      setMessage(err.response?.data?.message || "메일 전송 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[480px] p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-black text-xl"
        >
          ✕
        </button>

        {/* 탭 */}
        <div className="flex justify-center mb-6 border-b">
          <button
            onClick={() => setTab("login")}
            className={`px-6 py-2 font-bold ${tab === "login"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-400"
              }`}
          >
            로그인
          </button>
          <button
            onClick={() => setTab("register")}
            className={`px-6 py-2 font-bold ${tab === "register"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-400"
              }`}
          >
            회원가입
          </button>
          <button
            onClick={() => setTab("forgot")}
            className={`px-6 py-2 font-bold ${tab === "forgot"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-400"
              }`}
          >
            비밀번호 찾기
          </button>
        </div>

        {/* 내용 */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-3 rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-3 rounded-lg"
              required
            />
            {message && (
              <p className="text-center text-sm text-red-500">{message}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
            <div className="flex flex-col gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleOAuth("kakao")}
                className="w-full bg-yellow-400 text-black py-2 rounded-lg hover:bg-yellow-500 font-semibold"
              >
                카카오 로그인
              </button>
              <button
                type="button"
                onClick={() => handleOAuth("google")}
                className="w-full bg-white border py-2 rounded-lg hover:bg-gray-100 font-semibold"
              >
                구글 로그인
              </button>
            </div>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-3 rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border p-3 rounded-lg"
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border p-3 rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border p-3 rounded-lg"
              required
            />
            {message && (
              <p className="text-center text-sm text-red-500">{message}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
            >
              {loading ? "가입 중..." : "회원가입"}
            </button>
          </form>
        )}

        {tab === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-3">
            <input
              type="email"
              placeholder="이메일 입력"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-3 rounded-lg"
              required
            />
            {message && (
              <p className="text-center text-sm text-red-500">{message}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold transition disabled:opacity-50"
            >
              {loading ? "전송 중..." : "임시 비밀번호 전송"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;

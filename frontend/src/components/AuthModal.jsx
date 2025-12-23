// src/components/AuthModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function AuthModal({ open, onClose, onLoginSuccess }) {
  const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";
  const [mode, setMode] = useState("login"); // login | register | find
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const emailRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setMsg("");
    setMode("login");
    setTimeout(() => emailRef.current?.focus(), 50);

    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 폼 데이터 관리
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    nickname: "",
    allergy: "",
    trait: "",
  });
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // 로그인
  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!form.email || !form.password) return setMsg("이메일과 비밀번호를 입력하세요.");
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) return setMsg(data.error || "로그인 실패");

      localStorage.setItem("token", data.token);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user", JSON.stringify(data.user));
      onLoginSuccess?.(data.user);
      onClose?.();
    } catch {
      setMsg("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  // 회원가입
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.nickname || !form.email || !form.password)
      return setMsg("필수 항목을 입력하세요.");
    if (form.password !== form.confirm) return setMsg("비밀번호가 일치하지 않습니다.");

    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) return setMsg(data.error || "회원가입 실패");

      setMsg("회원가입 성공! 로그인해주세요.");
      setMode("login");
    } catch {
      setMsg("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  // 비밀번호 찾기
  const handleFind = async (e) => {
    e.preventDefault();
    if (!form.email) return setMsg("이메일을 입력하세요.");
    try {
      setLoading(true);
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!res.ok) return setMsg(data.error || "임시 비밀번호 발급 실패");

      setMsg("임시 비밀번호를 이메일로 보냈습니다!");
      setMode("login");
    } catch {
      setMsg("서버 오류");
    } finally {
      setLoading(false);
    }
  };

  const goGoogle = () => (window.location.href = `${API}/auth/google`);
  const goKakao = () => (window.location.href = `${API}/auth/kakao`);

  const renderTitle = () =>
    mode === "login"
      ? "로그인"
      : mode === "register"
      ? "회원가입"
      : "비밀번호 찾기";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl bg-white shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 w-9 h-9 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>

              <div className="px-8 pt-10 pb-7">
                <h2 className="text-2xl font-bold text-center mb-6">{renderTitle()}</h2>

                {mode === "login" && (
                  <form onSubmit={handleLogin}>
                    <input
                      ref={emailRef}
                      name="email"
                      placeholder="이메일"
                      className="w-full border rounded-lg px-4 py-3 mb-3"
                      value={form.email}
                      onChange={handleChange}
                    />
                    <input
                      name="password"
                      type="password"
                      placeholder="비밀번호"
                      className="w-full border rounded-lg px-4 py-3 mb-3"
                      value={form.password}
                      onChange={handleChange}
                    />
                    {msg && <div className="text-sm text-red-600 mb-3">{msg}</div>}
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-3 rounded-lg"
                    >
                      {loading ? "로그인 중..." : "로그인"}
                    </button>
                    <div className="flex justify-between text-sm mt-4">
                      <button onClick={() => setMode("register")} type="button" className="text-blue-600 hover:underline">
                        회원가입
                      </button>
                      <button onClick={() => setMode("find")} type="button" className="text-gray-700 hover:underline">
                        비밀번호 찾기
                      </button>
                    </div>
                    <div className="mt-6 space-y-2">
                      <button onClick={goGoogle} type="button" className="w-full bg-red-500 text-white py-3 rounded-lg">
                        Google 로그인
                      </button>
                      <button onClick={goKakao} type="button" className="w-full bg-yellow-400 text-black py-3 rounded-lg">
                        Kakao 로그인
                      </button>
                    </div>
                  </form>
                )}

                {mode === "register" && (
                  <form onSubmit={handleRegister}>
                    <input
                      name="nickname"
                      placeholder="닉네임"
                      className="w-full border rounded-lg px-4 py-3 mb-3"
                      value={form.nickname}
                      onChange={handleChange}
                    />
                    <input
                      name="email"
                      placeholder="이메일"
                      className="w-full border rounded-lg px-4 py-3 mb-3"
                      value={form.email}
                      onChange={handleChange}
                    />
                    <input
                      name="password"
                      type="password"
                      placeholder="비밀번호"
                      className="w-full border rounded-lg px-4 py-3 mb-3"
                      value={form.password}
                      onChange={handleChange}
                    />
                    <input
                      name="confirm"
                      type="password"
                      placeholder="비밀번호 확인"
                      className="w-full border rounded-lg px-4 py-3 mb-3"
                      value={form.confirm}
                      onChange={handleChange}
                    />
                    <input
                      name="allergy"
                      placeholder="알러지 정보"
                      className="w-full border rounded-lg px-4 py-3 mb-3"
                      value={form.allergy}
                      onChange={handleChange}
                    />
                    <input
                      name="trait"
                      placeholder="사용자 특성"
                      className="w-full border rounded-lg px-4 py-3 mb-3"
                      value={form.trait}
                      onChange={handleChange}
                    />
                    {msg && <div className="text-sm text-red-600 mb-3">{msg}</div>}
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg">
                      {loading ? "처리 중..." : "회원가입"}
                    </button>
                    <div className="text-sm text-center mt-3">
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-blue-600 hover:underline"
                      >
                        로그인으로 돌아가기
                      </button>
                    </div>
                  </form>
                )}

                {mode === "find" && (
                  <form onSubmit={handleFind}>
                    <input
                      name="email"
                      placeholder="가입한 이메일"
                      className="w-full border rounded-lg px-4 py-3 mb-3"
                      value={form.email}
                      onChange={handleChange}
                    />
                    {msg && <div className="text-sm text-red-600 mb-3">{msg}</div>}
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg">
                      {loading ? "처리 중..." : "임시 비밀번호 발급"}
                    </button>
                    <div className="text-sm text-center mt-3">
                      <button
                        type="button"
                        onClick={() => setMode("login")}
                        className="text-blue-600 hover:underline"
                      >
                        로그인으로 돌아가기
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

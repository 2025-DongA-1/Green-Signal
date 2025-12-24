// src/components/AuthModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "./AuthModal.css";

export default function AuthModal({ open, onClose, onLoginSuccess }) {
  const API = import.meta.env.VITE_API_BASE || "http://localhost:5000";
  const [mode, setMode] = useState("login"); // login | register | find
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const emailRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setMsg("");
    setMode("login");
    setTimeout(() => emailRef.current?.focus(), 100);

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

  // ----------------------------------------------------------------
  // [변수 설명]
  // API: 백엔드 서버 기본 주소 (환경 변수 또는 기본값 사용)
  // mode: 현재 모달 상태 ('login' | 'register' | 'find') - 로그인, 회원가입, 비번찾기 화면 전환용
  // loading: API 요청 진행 중 여부 (중복 요청 방지 및 UI 피드백용)
  // msg: 사용자에게 보여줄 에러 또는 성공 메시지
  // form: 사용자가 입력한 모든 폼 데이터 (이메일, 비번, 닉네임 등) 저장 객체
  // ----------------------------------------------------------------

  // [기능: 로그인 처리]
  // 사용자가 입력한 이메일과 패스워드를 백엔드로 전송하여 토큰을 받아옵니다.
  const handleLogin = async (e) => {
    e.preventDefault(); // 기본 폼 제출 동작 방지
    setMsg("");

    // 유효성 검사: 필수 입력값 확인
    if (!form.email || !form.password) return setMsg("이메일과 비밀번호를 입력하세요.");

    try {
      setLoading(true); // 로딩 상태 시작

      // 1. 백엔드 로그인 API 호출 (POST /auth/login)
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 공백 실수 방지를 위해 trim() 처리하여 전송
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password.trim()
        }),
      });

      const data = await res.json();

      // 2. 응답 상태 확인
      if (!res.ok) {
        // 실패 시 서버에서 보낸 에러 메시지 표시
        const errorMsg = data.message || data.error || "로그인 실패";
        return setMsg(errorMsg);
      }

      // 3. 로그인 성공 처리
      // - 받은 토큰을 로컬 스토리지에 저장 (자동 로그인용)
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // - 상위 컴포넌트(App.jsx)에 로그인 성공 알림
      onLoginSuccess?.(data.user);
      onClose?.(); // 모달 닫기
    } catch (err) {
      console.error(err);
      setMsg("서버 연결 실패: " + err.message);
    } finally {
      setLoading(false); // 로딩 상태 종료
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

      alert("회원가입 성공! 로그인해주세요.");
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
      if (!res.ok) return setMsg("가입되지 않은 이메일입니다.");

      alert("임시 비밀번호를 이메일로 보냈습니다!");
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
    mode === "login" ? "로그인" : mode === "register" ? "회원가입" : "비밀번호 찾기";

  if (!open) return null;

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <h2 className="auth-title">{renderTitle()}</h2>

        {mode === "login" && (
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                ref={emailRef}
                name="email"
                placeholder="이메일 주소"
                className="auth-input"
                value={form.email}
                onChange={handleChange}
              />
              <input
                name="password"
                type="password"
                placeholder="비밀번호"
                className="auth-input"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            {msg && <div className="error-msg">{msg}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </button>

            <div className="auth-links">
              <button type="button" onClick={() => setMode("register")} className="link-btn">
                회원가입
              </button>
              <button type="button" onClick={() => setMode("find")} className="link-btn">
                비밀번호 찾기
              </button>
            </div>

            <div className="divider">
              <span>또는 소셜 로그인</span>
            </div>

            <div className="social-buttons">
              <button type="button" onClick={goGoogle} className="social-btn google">
                <img src="/google-icon.svg" alt="" style={{ width: 18 }} onError={(e) => e.target.style.display = 'none'} />
                Google
              </button>
              <button type="button" onClick={goKakao} className="social-btn kakao">
                <img src="/kakao-icon.svg" alt="" style={{ width: 18 }} onError={(e) => e.target.style.display = 'none'} />
                Kakao
              </button>
            </div>
          </form>
        )}

        {mode === "register" && (
          <form onSubmit={handleRegister}>
            <div className="input-group">
              <input
                name="nickname"
                placeholder="닉네임"
                className="auth-input"
                value={form.nickname}
                onChange={handleChange}
              />
              <input
                name="email"
                placeholder="이메일"
                className="auth-input"
                value={form.email}
                onChange={handleChange}
              />
              <input
                name="password"
                type="password"
                placeholder="비밀번호"
                className="auth-input"
                value={form.password}
                onChange={handleChange}
              />
              <input
                name="confirm"
                type="password"
                placeholder="비밀번호 확인"
                className="auth-input"
                value={form.confirm}
                onChange={handleChange}
              />

            </div>

            {msg && <div className="error-msg">{msg}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "가입 처리 중..." : "회원가입 완료"}
            </button>

            <div className="auth-links" style={{ justifyContent: 'center', marginTop: '15px' }}>
              <button type="button" onClick={() => setMode("login")} className="link-btn">
                이미 계정이 있으신가요? 로그인
              </button>
            </div>
          </form>
        )}

        {mode === "find" && (
          <form onSubmit={handleFind}>
            <div className="input-group">
              <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                가입하신 이메일 주소를 입력하시면 임시 비밀번호를 보내드립니다.
              </p>
              <input
                name="email"
                placeholder="이메일 주소"
                className="auth-input"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {msg && <div className="error-msg">{msg}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "전송 중..." : "임시 비밀번호 발송"}
            </button>

            <div className="auth-links" style={{ justifyContent: 'center', marginTop: '15px' }}>
              <button type="button" onClick={() => setMode("login")} className="link-btn">
                로그인으로 돌아가기
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

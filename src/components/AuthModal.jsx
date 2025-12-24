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
            localStorage.setItem("user", JSON.stringify(data.user));
            onLoginSuccess?.(data.user);
            onClose?.();
        } catch {
            setMsg("서버 연결 실패");
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

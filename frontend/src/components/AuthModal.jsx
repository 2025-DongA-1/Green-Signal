// src/components/AuthModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import "../styles/AuthModal.css";

/**
 * [통합 인증 모달]
 * 로그인, 회원가입, 비밀번호 찾기 기능을 하나의 모달에서 처리하는 컴포넌트입니다.
 * 
 * @param {boolean} open - 모달 표시 여부
 * @param {function} onClose - 모달 닫기 핸들러
 * @param {function} onLoginSuccess - 로그인 성공 시 상위 컴포넌트로 사용자 정보를 전달하는 콜백
 */
export default function AuthModal({ open, onClose, onLoginSuccess }) {
    // API 주소 설정 (환경 변수 또는 기본값 3000번 포트 사용)
    const API = import.meta.env.VITE_API_BASE || "http://localhost:3000";

    // 모달 내부 상태 관리
    const [mode, setMode] = useState("login"); // 현재 화면 모드 (login | register | find)
    const [loading, setLoading] = useState(false); // 로딩 상태 (API 요청 중 버튼 비활성화용)
    const [msg, setMsg] = useState(""); // 에러 또는 안내 메시지

    const emailRef = useRef(null); // 이메일 입력창 포커싱용 Ref

    // 모달이 열릴 때 초기화 로직
    useEffect(() => {
        if (!open) return;
        setMsg(""); // 메시지 초기화
        setMode("login"); // 항상 로그인 화면부터 시작
        setTimeout(() => emailRef.current?.focus(), 100); // 0.1초 후 이메일 입력창에 포커스

        // ESC 키 누르면 닫기
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    // 입력 폼 데이터 관리 (모든 입력값을 하나의 객체로 관리)
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirm: "", // 비밀번호 확인용
        nickname: "",
        allergy: "",
        trait: "",
    });
    // 입력값 변경 핸들러
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // [1] 로그인 처리 함수
    const handleLogin = async (e) => {
        e.preventDefault();
        setMsg("");
        if (!form.email || !form.password) return setMsg("이메일과 비밀번호를 입력하세요.");
        try {
            setLoading(true);
            // 백엔드 로그인 API 호출
            const res = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: form.email, password: form.password }),
            });
            const data = await res.json();

            // 로그인 실패 시 에러 표시
            if (!res.ok) return setMsg(data.error || "로그인 실패");

            // 성공 시 토큰 저장 및 상태 업데이트
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            onLoginSuccess?.(data.user); // 상위 컴포넌트에 알림
            onClose?.(); // 모달 닫기
        } catch {
            setMsg("서버 연결 실패");
        } finally {
            setLoading(false);
        }
    };

    // [2] 회원가입 처리 함수
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!form.nickname || !form.email || !form.password)
            return setMsg("필수 항목을 입력하세요.");
        if (form.password !== form.confirm) return setMsg("비밀번호가 일치하지 않습니다.");

        setLoading(true);
        try {
            // 회원가입 API 호출
            const res = await fetch(`${API}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) return setMsg(data.error || "회원가입 실패");

            alert("회원가입 성공! 로그인해주세요.");
            setMode("login"); // 가입 성공 후 로그인 화면으로 전환
        } catch {
            setMsg("서버 오류");
        } finally {
            setLoading(false);
        }
    };

    // [3] 비밀번호 찾기 처리 함수
    const handleFind = async (e) => {
        e.preventDefault();
        if (!form.email) return setMsg("이메일을 입력하세요.");
        try {
            setLoading(true);
            // 비밀번호 재설정 이메일 전송 API 호출
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

    // 소셜 로그인 리다이렉트 (백엔드 경로로 바로 이동)
    const goGoogle = () => (window.location.href = `${API}/auth/google`);
    const goKakao = () => (window.location.href = `${API}/auth/kakao`);

    // 현재 모드에 따른 제목 표시
    const renderTitle = () =>
        mode === "login" ? "로그인" : mode === "register" ? "회원가입" : "비밀번호 찾기";

    if (!open) return null; // 모달이 닫혀있으면 렌더링하지 않음

    return (
        // 배경을 클릭하면 모달 닫기
        <div className="auth-overlay" onClick={onClose}>
            {/* 모달 내부 클릭 시 닫기 이벤트 전파 방지 */}
            <div className="auth-container" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <h2 className="auth-title">{renderTitle()}</h2>

                {/* --- [로그인 화면] --- */}
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
                                {/* 구글 아이콘 (이미지 로드 실패 시 숨김 처리) */}
                                <img src="/google-icon.svg" alt="" style={{ width: 18 }} onError={(e) => e.target.style.display = 'none'} />
                                Google
                            </button>
                            <button type="button" onClick={goKakao} className="social-btn kakao">
                                {/* 카카오 아이콘 */}
                                <img src="/kakao-icon.svg" alt="" style={{ width: 18 }} onError={(e) => e.target.style.display = 'none'} />
                                Kakao
                            </button>
                        </div>
                    </form>
                )}

                {/* --- [회원가입 화면] --- */}
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

                {/* --- [비밀번호 찾기 화면] --- */}
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

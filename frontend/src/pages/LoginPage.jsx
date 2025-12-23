import React, { useState, useEffect } from "react";
import axios from "axios";
import AuthModal from "../components/AuthModal";

export default function LoginPage({ apiBase, onLoginSuccess }) {
  const [showModal, setShowModal] = useState(true);
  const [msg, setMsg] = useState("");

  const api = axios.create({ baseURL: apiBase, withCredentials: true });

  const handleLogin = async (email, password) => {
    setMsg("");
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      onLoginSuccess(token, user);
      setShowModal(false);
      window.location.href = "/mypage";
    } catch (err) {
      setMsg(err?.response?.data?.error || "로그인 실패");
    }
  };

  const handleRegister = () => {
    window.location.href = "/register";
  };

  const handleGoogle = () => (window.location.href = `${apiBase}/auth/google`);
  const handleKakao = () => (window.location.href = `${apiBase}/auth/kakao`);

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
  }, [showModal]);

  return (
    <>
      {showModal && (
        <AuthModal
          onClose={() => setShowModal(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogle={handleGoogle}
          onKakao={handleKakao}
          msg={msg}
          setMsg={setMsg}
        />
      )}
    </>
  );
}

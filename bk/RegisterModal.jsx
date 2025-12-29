import React, { useState } from "react";
import API from "../utils/axiosInstance";

const RegisterModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirm) {
      setMessage("모든 칸을 입력해주세요.");
      return;
    }
    if (password !== confirm) {
      setMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const res = await API.post("/auth/register", { email, password, nickname });
      setMessage(res.data.message || "회원가입 성공!");
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "회원가입 실패");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl w-96 shadow-xl">
        <h2 className="text-center text-2xl font-bold mb-4">회원가입</h2>
        <form onSubmit={handleRegister} className="space-y-3">
          <input
            className="w-full border p-2 rounded"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border p-2 rounded"
            placeholder="닉네임 (선택)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <input
            className="w-full border p-2 rounded"
            placeholder="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full border p-2 rounded"
            placeholder="비밀번호 확인"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {message && <p className="text-center text-sm text-gray-500">{message}</p>}
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            회원가입
          </button>
          <p
            className="text-center text-gray-400 text-sm mt-3 cursor-pointer"
            onClick={onClose}
          >
            닫기
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;

// src/pages/MyPage.jsx
import React, { useState } from "react";
import axios from "axios";

const MyPage = ({ user }) => {
  const [formData, setFormData] = useState({
    nickname: user?.nickname || "",
    allergy: user?.allergy || "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:3000/users/${user.id}`, formData);
      alert("✅ 정보가 수정되었습니다!");
    } catch (err) {
      console.error(err);
      alert("❌ 수정 실패!");
    }
  };

  if (!user) return <div>로그인이 필요합니다.</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">마이페이지</h2>
      <div className="space-y-3">
        <p>이메일: {user.email}</p>
        <label>닉네임:
          <input name="nickname" value={formData.nickname} onChange={handleChange} className="border ml-2 px-1"/>
        </label>
        <label>알러지 정보:
          <input name="allergy" value={formData.allergy} onChange={handleChange} className="border ml-2 px-1"/>
        </label>
        <p>유형: {user.type}</p>
        <p>역할: {user.role}</p>
        <p>가입일: {user.created_at}</p>
        <button onClick={handleSave} className="bg-blue-500 text-white px-3 py-1 rounded mt-3">수정 저장</button>
      </div>
    </div>
  );
};

export default MyPage;

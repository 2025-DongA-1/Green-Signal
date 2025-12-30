// src/components/MyPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import db from "./lib/db";
import "../styles/MyPage.css";

const API = "http://localhost:3000";

const MyPage = ({ user, onSaved }) => {
  const [nickname, setNickname] = useState(user?.nickname || "");

  const [allergenOptions, setAllergenOptions] = useState([]);
  const [myAllergens, setMyAllergens] = useState([]);
  const [selectedAllergen, setSelectedAllergen] = useState("");

  const [diseaseOptions, setDiseaseOptions] = useState([]);
  const [myDiseases, setMyDiseases] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState("");

  const [joinDate, setJoinDate] = useState(user?.created_at || null);

  const [saving, setSaving] = useState(false);
  const token = useMemo(() => localStorage.getItem("token"), []);

  // 초기 데이터 로드
  useEffect(() => {
    // 가입일 조회
    if (user?.user_id) {
      db.execute("SELECT created_at FROM users WHERE user_id = ?", [user.user_id])
        .then((rows) => {
          if (rows.length > 0) setJoinDate(rows[0].created_at);
        })
        .catch((e) => console.error("가입일 조회 실패:", e));
    }

    // 마스터 목록
    db.execute("SELECT allergen_id, allergen_name FROM allergens")
      .then((rows) => setAllergenOptions(rows || []))
      .catch((err) => console.error("알러지 목록 로드 실패:", err));

    db.execute("SELECT disease_id, disease_name FROM diseases")
      .then((rows) => setDiseaseOptions(rows || []))
      .catch((err) => console.error("질병 목록 로드 실패:", err));

    // 내 알러지/질병
    if (user?.user_id) {
      db.execute(
        `
        SELECT a.allergen_name, a.allergen_id 
        FROM user_allergens ua 
        JOIN allergens a ON ua.allergen_id = a.allergen_id 
        WHERE ua.user_id = ?
      `,
        [user.user_id]
      )
        .then((rows) => setMyAllergens(rows || []))
        .catch((err) => console.error("내 알러지 로드 실패:", err));

      db.execute(
        `
        SELECT d.disease_name, d.disease_id 
        FROM user_diseases ud 
        JOIN diseases d ON ud.disease_id = d.disease_id 
        WHERE ud.user_id = ?
      `,
        [user.user_id]
      )
        .then((rows) => setMyDiseases(rows || []))
        .catch((err) => console.error("내 질병 로드 실패:", err));
    }
  }, [user]);

  // 알러지 추가
  const handleAddAllergen = async () => {
    if (!selectedAllergen || !user?.user_id) return;
    try {
      await db.execute("INSERT INTO user_allergens (user_id, allergen_id) VALUES (?, ?)", [
        user.user_id,
        selectedAllergen,
      ]);
      const rows = await db.execute(
        `
        SELECT a.allergen_name, a.allergen_id 
        FROM user_allergens ua 
        JOIN allergens a ON ua.allergen_id = a.allergen_id 
        WHERE ua.user_id = ?
      `,
        [user.user_id]
      );
      setMyAllergens(rows || []);
      setSelectedAllergen("");
    } catch (e) {
      alert("알러지 추가 중 오류가 발생했습니다.");
    }
  };

  // 질병 추가
  const handleAddDisease = async () => {
    if (!selectedDisease || !user?.user_id) return;
    try {
      await db.execute("INSERT INTO user_diseases (user_id, disease_id) VALUES (?, ?)", [
        user.user_id,
        selectedDisease,
      ]);
      const rows = await db.execute(
        `
        SELECT d.disease_name, d.disease_id 
        FROM user_diseases ud 
        JOIN diseases d ON ud.disease_id = d.disease_id 
        WHERE ud.user_id = ?
      `,
        [user.user_id]
      );
      setMyDiseases(rows || []);
      setSelectedDisease("");
    } catch (e) {
      alert("질병 정보를 추가하는 중 오류가 발생했습니다.");
    }
  };

  // 알러지 삭제
  const handleRemoveAllergen = async (id, name) => {
    if (!confirm(`${name}을(를) 삭제하시겠습니까?`)) return;
    try {
      await db.execute("DELETE FROM user_allergens WHERE user_id = ? AND allergen_id = ?", [
        user.user_id,
        id,
      ]);
      setMyAllergens((prev) => prev.filter((item) => item.allergen_id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // 질병 삭제
  const handleRemoveDisease = async (id, name) => {
    if (!confirm(`${name}을(를) 삭제하시겠습니까?`)) return;
    try {
      await db.execute("DELETE FROM user_diseases WHERE user_id = ? AND disease_id = ?", [
        user.user_id,
        id,
      ]);
      setMyDiseases((prev) => prev.filter((item) => item.disease_id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  if (!user)
    return (
      <div className="mypage-container">
        <div className="mypage-body">로그인이 필요합니다.</div>
      </div>
    );

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { nickname };

      try {
        await axios.put(
          `${API}/users/${user.user_id || user.id}`,
          payload,
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
      } catch (err) {
        if (err?.response?.status === 401) {
          onSaved?.({ ...user, nickname });
          alert("로그인이 만료되어 서버 저장은 건너뛰고 로컬만 갱신했습니다. 다시 로그인해 주세요.");
          setSaving(false);
          return;
        }
        throw err;
      }

      try {
        const res = await axios.get(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        onSaved?.(res.data);
      } catch (err) {
        if (err?.response?.status === 401) {
          onSaved?.({ ...user, nickname });
        } else {
          throw err;
        }
      }

      alert("사용자 정보가 저장되었습니다.");
    } catch (err) {
      console.error(err);
      alert("저장에 실패했습니다!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mypage-container">
      {/* 헤더 */}
      <div className="mypage-header">
        <div>
          <h2 className="mypage-title">마이페이지</h2>
          <p className="mypage-subtitle">나의 정보를 안전하게 관리하세요</p>
        </div>
      </div>

      {/* 본문 */}
      <div className="mypage-body">
        {/* 기본 정보 카드 */}
        <div className="mypage-card">
          <div className="mypage-card-header">
            <span className="mypage-card-title">Account Info</span>
          </div>
          <div style={{ display: "grid", gap: "8px" }}>
            <div className="mypage-row">
              <span className="mypage-label">이메일</span>
              <span className="mypage-value">{user.email}</span>
            </div>
            <div className="mypage-row">
              <span className="mypage-label">가입일</span>
              <span className="mypage-value">
                {joinDate ? new Date(joinDate).toLocaleDateString() : "-"}
              </span>
            </div>
            <div className="mypage-row" style={{ alignItems: "center", paddingTop: "4px" }}>
              <span className="mypage-label">닉네임 변경</span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mypage-nickname-input"
                placeholder="닉네임을 입력하세요"
              />
            </div>
          </div>
        </div>

        {/* 알러지 관리 */}
        <div className="mypage-section">
          <div className="mypage-section-header">
            <span>알러지 관리</span>
            <span className="mypage-badge required">필수 체크</span>
          </div>

          <div className="mypage-input-group">
            <select
              className="mypage-select"
              value={selectedAllergen}
              onChange={(e) => setSelectedAllergen(e.target.value)}
            >
              <option value="">알러지 성분을 선택해 주세요</option>
              {allergenOptions.map((v) => (
                <option key={v.allergen_id} value={v.allergen_id}>
                  {v.allergen_name}
                </option>
              ))}
            </select>
            <button onClick={handleAddAllergen} className="mypage-add-btn">
              추가
            </button>
          </div>

          <div className="mypage-chips-area">
            {myAllergens.length === 0 ? (
              <div className="mypage-empty-msg">등록된 알러지가 없습니다.</div>
            ) : (
              <div className="mypage-chips-wrap">
                {myAllergens.map((item) => (
                  <span key={item.allergen_id} className="mypage-chip">
                    <span className="mypage-dot"></span>
                    {item.allergen_name}
                    <button
                      onClick={() => handleRemoveAllergen(item.allergen_id, item.allergen_name)}
                      className="mypage-chip-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 질병/지병 관리 */}
        <div className="mypage-section">
          <div className="mypage-section-header">
            <span>질병/지병 관리</span>
            <span className="mypage-badge health">건강 관리</span>
          </div>

          <div className="mypage-input-group">
            <select
              className="mypage-select"
              value={selectedDisease}
              onChange={(e) => setSelectedDisease(e.target.value)}
            >
              <option value="">질병을 선택해 주세요</option>
              {diseaseOptions.map((v) => (
                <option key={v.disease_id} value={v.disease_id}>
                  {v.disease_name}
                </option>
              ))}
            </select>
            <button onClick={handleAddDisease} className="mypage-add-btn green">
              추가
            </button>
          </div>

          <div className="mypage-chips-area">
            {myDiseases.length === 0 ? (
              <div className="mypage-empty-msg">등록된 질병 정보가 없습니다.</div>
            ) : (
              <div className="mypage-chips-wrap">
                {myDiseases.map((item) => (
                  <span key={item.disease_id} className="mypage-chip green">
                    <span className="mypage-dot green"></span>
                    {item.disease_name}
                    <button
                      onClick={() => handleRemoveDisease(item.disease_id, item.disease_name)}
                      className="mypage-chip-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="mypage-footer">
          <button onClick={handleSave} className="mypage-btn-save" disabled={saving}>
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;

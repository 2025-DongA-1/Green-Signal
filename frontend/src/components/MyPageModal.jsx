// src/components/MyPageModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import db from './lib/db';

const API = "http://localhost:3000";

// ✅ "a,b,c" -> ["a","b","c"] (빈값 제거)
function toChipArray(str) {
  if (!str) return [];
  return String(str).split(",").map((s) => s.trim()).filter(Boolean);
}

// ✅ ["a","b"] -> "a,b"
function toChipString(arr) {
  return (arr || []).map((s) => String(s).trim()).filter(Boolean).join(",");
}

// ✅ 공통 칩 입력 컴포넌트
const ChipInput = ({
  label,
  chips,
  setChips,
  placeholder = "Enter로 추가",
}) => {
  const [inputValue, setInputValue] = useState("");

  const addChip = (raw) => {
    const value = String(raw || "").trim();
    if (!value) return;
    const exists = chips.some((c) => c.toLowerCase() === value.toLowerCase());
    if (exists) return;
    setChips([...chips, value]);
  };

  const removeChip = (chip) => {
    setChips(chips.filter((c) => c !== chip));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(inputValue);
      setInputValue("");
      return;
    }
    if (e.key === "Backspace" && inputValue === "" && chips.length > 0) {
      const next = chips.slice(0, -1);
      setChips(next);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {chips.map((chip, idx) => (
          <span key={`${chip}-${idx}`} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
            {chip}
            <button type="button" onClick={() => removeChip(chip)} className="text-blue-600 hover:text-red-500 font-bold">×</button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-100"
      />
      <div className="mt-1 text-xs text-gray-500">Enter(또는 ,)로 추가 / ×로 삭제 / Backspace로 삭제</div>
    </div>
  );
};

const MyPageModal = ({ user, onClose, onSaved }) => {
  const [nickname, setNickname] = useState(user?.nickname || "");

  // ✅ DB 기반 알러지 관리
  const [allergenOptions, setAllergenOptions] = useState([]);
  const [myAllergens, setMyAllergens] = useState([]);
  const [selectedAllergen, setSelectedAllergen] = useState("");

  // ✅ DB 기반 질병 관리
  const [diseaseOptions, setDiseaseOptions] = useState([]);
  const [myDiseases, setMyDiseases] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState("");

  // ✅ DB: user_type
  const [userType, setUserType] = useState(user?.user_type || "일반");

  // ✅ 가입일 직접 조회 (세션 정보에 없을 수 있음)
  const [joinDate, setJoinDate] = useState(user?.created_at || null);

  const [saving, setSaving] = useState(false);
  const token = useMemo(() => localStorage.getItem("token"), []);

  // 초기 데이터 로드
  useEffect(() => {
    // 0. 가입일 조회 (유저 정보 갱신)
    if (user?.user_id) {
      db.execute("SELECT created_at FROM users WHERE user_id = ?", [user.user_id])
        .then(rows => {
          if (rows.length > 0) setJoinDate(rows[0].created_at);
        })
        .catch(e => console.error("가입일 조회 실패:", e));
    }

    // 1. 전체 목록
    db.execute("SELECT allergen_id, allergen_name FROM allergens")
      .then(rows => setAllergenOptions(rows || []))
      .catch(err => console.error("알러지 목록 로드 실패:", err));

    db.execute("SELECT disease_id, disease_name FROM diseases")
      .then(rows => setDiseaseOptions(rows || []))
      .catch(err => console.error("질병 목록 로드 실패:", err));

    // 2. 내 정보
    if (user?.user_id) {
      // 알러지
      db.execute(`
        SELECT a.allergen_name, a.allergen_id 
        FROM user_allergens ua 
        JOIN allergens a ON ua.allergen_id = a.allergen_id 
        WHERE ua.user_id = ?
      `, [user.user_id])
        .then(rows => setMyAllergens(rows || []))
        .catch(err => console.error("내 알러지 로드 실패:", err));

      // 질병
      db.execute(`
        SELECT d.disease_name, d.disease_id 
        FROM user_diseases ud 
        JOIN diseases d ON ud.disease_id = d.disease_id 
        WHERE ud.user_id = ?
      `, [user.user_id])
        .then(rows => setMyDiseases(rows || []))
        .catch(err => console.error("내 질병 로드 실패:", err));
    }
  }, [user]);

  // 알러지 추가
  const handleAddAllergen = async () => {
    if (!selectedAllergen || !user?.user_id) return;
    try {
      await db.execute("INSERT INTO user_allergens (user_id, allergen_id) VALUES (?, ?)", [user.user_id, selectedAllergen]);
      const rows = await db.execute(`
        SELECT a.allergen_name, a.allergen_id 
        FROM user_allergens ua 
        JOIN allergens a ON ua.allergen_id = a.allergen_id 
        WHERE ua.user_id = ?
      `, [user.user_id]);
      setMyAllergens(rows || []);
      setSelectedAllergen("");
    } catch (e) { alert("이미 추가된 항목이거나 오류입니다."); }
  };

  // 질병 추가
  const handleAddDisease = async () => {
    if (!selectedDisease || !user?.user_id) return;
    try {
      await db.execute("INSERT INTO user_diseases (user_id, disease_id) VALUES (?, ?)", [user.user_id, selectedDisease]);
      const rows = await db.execute(`
        SELECT d.disease_name, d.disease_id 
        FROM user_diseases ud 
        JOIN diseases d ON ud.disease_id = d.disease_id 
        WHERE ud.user_id = ?
      `, [user.user_id]);
      setMyDiseases(rows || []);
      setSelectedDisease("");
    } catch (e) { alert("이미 추가된 항목이거나 오류입니다."); }
  };

  // 삭제 핸들러
  const handleRemoveAllergen = async (id, name) => {
    if (!confirm(`${name} 삭제하시겠습니까?`)) return;
    try {
      await db.execute("DELETE FROM user_allergens WHERE user_id = ? AND allergen_id = ?", [user.user_id, id]);
      setMyAllergens(prev => prev.filter(item => item.allergen_id !== id));
    } catch (e) { console.error(e); }
  };

  const handleRemoveDisease = async (id, name) => {
    if (!confirm(`${name} 삭제하시겠습니까?`)) return;
    try {
      await db.execute("DELETE FROM user_diseases WHERE user_id = ? AND disease_id = ?", [user.user_id, id]);
      setMyDiseases(prev => prev.filter(item => item.disease_id !== id));
    } catch (e) { console.error(e); }
  };

  // ESC 닫기
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!user) return null;

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { nickname, user_type: userType };

      await axios.put(`${API}/users/${user.user_id || user.id}`, payload, token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined
      );

      const res = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onSaved?.(res.data);
      alert("✅ 내 정보가 수정되었습니다!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ 저장 실패!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose} role="presentation">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()} role="presentation">

        {/* 헤더 */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <div>
            <h2 className="font-bold text-lg">마이페이지</h2>
            <p className="text-sm text-gray-500">닉네임 / 알러지 / 질병 / 유형을 수정할 수 있어요</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-lg">✕</button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* 읽기 전용 정보 */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-gray-500">이메일</div>
            <div className="col-span-2 font-medium">{user.email}</div>
            <div className="text-gray-500">가입일</div>
            <div className="col-span-2 font-medium">{joinDate ? new Date(joinDate).toLocaleString() : '-'}</div>
            <div className="text-gray-500">닉네임</div>
            <div className="col-span-2 font-medium">{user.nickname}</div>
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-semibold mb-1">닉네임</label>
            <input value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-100" placeholder="닉네임을 입력하세요" />
          </div>

          {/* 알러지 정보 */}
          <div>
            <label className="block text-sm font-semibold mb-1">알러지 정보</label>
            <div className="flex gap-2 mb-2">
              <select className="flex-1 border px-3 py-2 rounded-lg" value={selectedAllergen} onChange={(e) => setSelectedAllergen(e.target.value)}>
                <option value="">알러지를 선택하세요</option>
                {allergenOptions.map((v) => (
                  <option key={v.allergen_id} value={v.allergen_id}>{v.allergen_name}</option>
                ))}
              </select>
              <button onClick={handleAddAllergen} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500">추가</button>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg min-h-[50px]">
              {myAllergens.length === 0 ? <p className="text-gray-400 text-sm text-center py-2">등록된 알러지가 없습니다.</p> : (
                <div className="flex flex-wrap gap-2">
                  {myAllergens.map((item) => (
                    <span key={item.allergen_id} className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      {item.allergen_name}
                      <button onClick={() => handleRemoveAllergen(item.allergen_id, item.allergen_name)} className="text-red-600 hover:text-black font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 질병 정보 */}
          <div>
            <label className="block text-sm font-semibold mb-1">질병/지병 정보</label>
            <div className="flex gap-2 mb-2">
              <select className="flex-1 border px-3 py-2 rounded-lg" value={selectedDisease} onChange={(e) => setSelectedDisease(e.target.value)}>
                <option value="">질병을 선택하세요</option>
                {diseaseOptions.map((v) => (
                  <option key={v.disease_id} value={v.disease_id}>{v.disease_name}</option>
                ))}
              </select>
              <button onClick={handleAddDisease} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500">추가</button>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg min-h-[50px]">
              {myDiseases.length === 0 ? <p className="text-gray-400 text-sm text-center py-2">등록된 정보가 없습니다.</p> : (
                <div className="flex flex-wrap gap-2">
                  {myDiseases.map((item) => (
                    <span key={item.disease_id} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1">
                      {item.disease_name}
                      <button onClick={() => handleRemoveDisease(item.disease_id, item.disease_name)} className="text-green-600 hover:text-black font-bold ml-1">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>


          {/* 하단 버튼 */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50" disabled={saving}>취소</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60" disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MyPageModal;

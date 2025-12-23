// src/components/MyPageModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API = "http://localhost:3000";

// ✅ "a,b,c" -> ["a","b","c"] (빈값 제거)
function toChipArray(str) {
  if (!str) return [];
  return String(str)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ✅ ["a","b"] -> "a,b"
function toChipString(arr) {
  return (arr || []).map((s) => String(s).trim()).filter(Boolean).join(",");
}

// ✅ 공통 칩 입력 컴포넌트 (알러지/특성 둘 다 재사용)
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
    // 중복 방지(대소문자 동일 취급)
    const exists = chips.some((c) => c.toLowerCase() === value.toLowerCase());
    if (exists) return;
    setChips([...chips, value]);
  };

  const removeChip = (chip) => {
    setChips(chips.filter((c) => c !== chip));
  };

  const handleKeyDown = (e) => {
    // Enter / , 로 칩 추가
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(inputValue);
      setInputValue("");
      return;
    }

    // 입력칸 비었을 때 Backspace 누르면 마지막 칩 삭제
    if (e.key === "Backspace" && inputValue === "" && chips.length > 0) {
      const next = chips.slice(0, -1);
      setChips(next);
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>

      {/* chips */}
      <div className="flex flex-wrap gap-2 mb-2">
        {chips.map((chip, idx) => (
          <span
            key={`${chip}-${idx}`}
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
          >
            {chip}
            <button
              type="button"
              onClick={() => removeChip(chip)}
              className="text-blue-600 hover:text-red-500 font-bold"
              aria-label={`${chip} 삭제`}
              title="삭제"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* input */}
      <input
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-100"
      />

      <div className="mt-1 text-xs text-gray-500">
        Enter(또는 ,)로 추가 / ×로 삭제 / 입력칸 비었을 때 Backspace로 마지막 칩 삭제
      </div>
    </div>
  );
};

const MyPageModal = ({ user, onClose, onSaved }) => {
  const [nickname, setNickname] = useState(user?.nickname || "");

  // ✅ DB: allergy VARCHAR(255) -> "a,b,c"
  const [allergyChips, setAllergyChips] = useState(toChipArray(user?.allergy));

  // ✅ DB: traits VARCHAR(255) -> "a,b,c"
  const [traitsChips, setTraitsChips] = useState(toChipArray(user?.traits));

  // ✅ DB: user_type VARCHAR(50)
  const [userType, setUserType] = useState(user?.user_type || "일반");

  const [saving, setSaving] = useState(false);
  const token = useMemo(() => localStorage.getItem("token"), []);

  // ESC로 닫기 + 스크롤 잠금
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

      const payload = {
        nickname,
        allergy: toChipString(allergyChips),
        traits: toChipString(traitsChips),
        user_type: userType,
      };

      await axios.put(`${API}/users/${user.id}`, payload, token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined
      );

      // ✅ 저장 후 최신 유저정보 다시 가져와서 즉시 UI 갱신
      const res = await axios.get(`${API}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onSaved?.(res.data);
      alert("✅ 내 정보가 수정되었습니다!");
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ 저장 실패! (백엔드 /users/:id, DB 컬럼명 확인)");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        {/* 헤더 */}
        <div className="flex justify-between items-center border-b px-6 py-4">
          <div>
            <h2 className="font-bold text-lg">마이페이지</h2>
            <p className="text-sm text-gray-500">닉네임 / 알러지 / 유형 / 특성을 수정할 수 있어요</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-lg"
            aria-label="닫기"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-5">
          {/* 읽기 전용 정보 */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-gray-500">이메일</div>
            <div className="col-span-2 font-medium">{user.email}</div>

            <div className="text-gray-500">로그인</div>
            <div className="col-span-2 font-medium">{user.provider}</div>

            <div className="text-gray-500">역할</div>
            <div className="col-span-2 font-medium">{user.role}</div>
          </div>

          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-semibold mb-1">닉네임</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring focus:ring-blue-100"
              placeholder="닉네임을 입력하세요"
            />
          </div>

          {/* 알러지(칩) */}
          <ChipInput
            label="알러지 정보"
            chips={allergyChips}
            setChips={setAllergyChips}
            placeholder="예) 우유 Enter, 땅콩 Enter"
          />

          {/* ✅ traits(칩) */}
          <ChipInput
            label="유저 특성"
            chips={traitsChips}
            setChips={setTraitsChips}
            placeholder="예) 단맛 선호 Enter, 커피 좋아함 Enter"
          />

          {/* 유형(user_type) */}
          <div>
            <label className="block text-sm font-semibold mb-1">유형</label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring focus:ring-blue-100"
            >
              <option value="일반">일반</option>
              <option value="학생">학생</option>
              <option value="직장인">직장인</option>
              <option value="기타">기타</option>
            </select>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            disabled={saving}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPageModal;

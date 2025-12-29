import React from "react";

/**
 * [인증 입력 컴포넌트]
 * 로그인 및 회원가입 모달에서 사용되는 공통 입력 필드 컴포넌트입니다.
 * 라벨(Label)과 입력창(Input)을 하나로 묶어 재사용성을 높였습니다.
 *
 * @param {string} label - 입력 필드 위에 표시될 제목 (예: "이메일", "비밀번호")
 * @param {string} type - input 태그의 타입 (기본값: "text", 비밀번호의 경우 "password" 사용)
 * @param {string} value - 현재 입력된 값 (상태 관리용)
 * @param {function} onChange - 입력 값이 변경될 때 실행될 핸들러 함수
 * @param {string} placeholder - 입력창에 표시될 힌트 텍스트
 */
export default function AuthInput({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      {/* 라벨 영역: 입력 필드의 제목을 작고 회색 텍스트로 표시 */}
      <label className="block text-xs text-gray-500 mb-1">{label}</label>

      {/* 입력 영역: 실제 텍스트를 입력받는 부분 */}
      {/* w-full: 너비 100%, px-3 py-2: 내부 여백, focus:ring: 포커스 시 테두리 강조 효과 */}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border rounded px-3 py-2 outline-none focus:ring"
      />
    </div>
  );
}

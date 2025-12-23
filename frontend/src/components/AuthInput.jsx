import React from "react";

export default function AuthInput({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div className="mb-4">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
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

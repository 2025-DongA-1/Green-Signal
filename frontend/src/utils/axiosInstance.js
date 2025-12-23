import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URI || "http://localhost:3000",
  withCredentials: true,
});

// ✅ 요청 시 토큰 자동 첨부
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;

import axios from "axios";
import API_BASE from "../config/apiBase";

const API = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// ✅ 요청 시 토큰 자동 첨부
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;

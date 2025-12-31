// frontend/src/lib/api.js
import axios from "axios";
import API_BASE from "../config/apiBase";

const BASE = API_BASE;

const api = axios.create({
  baseURL: BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const refresh = localStorage.getItem("refresh");
      if (!refresh) throw err;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((newAccess) => {
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        });
      }

      isRefreshing = true;
      try {
        const r = await axios.post(`${BASE}/auth/refresh`, { refreshToken: refresh });
        localStorage.setItem("access", r.data.accessToken);

        queue.forEach((p) => p.resolve(r.data.accessToken));
        queue = [];

        original.headers.Authorization = `Bearer ${r.data.accessToken}`;
        return api(original);
      } catch (e) {
        queue.forEach((p) => p.reject(e));
        queue = [];
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        throw e;
      } finally {
        isRefreshing = false;
      }
    }

    throw err;
  }
);

export default api;

import axios from "axios";

// 기본 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: "http://localhost:3000",
});

// 요청 인터셉터: accessToken 헤더에 추가
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 응답 인터셉터: accessToken 만료 시 자동 갱신
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const res = await axios.post("http://localhost:3000/auth/refresh", {
          token: refreshToken,
        });
        const newAccessToken = res.data.accessToken;

        localStorage.setItem("accessToken", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        alert("세션이 만료되었습니다. 다시 로그인해주세요.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

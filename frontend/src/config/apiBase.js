const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URI ||
  (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.hostname}:3000` : "http://localhost:3000");

export default API_BASE;

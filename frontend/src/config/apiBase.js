const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URI ||
  (typeof window !== "undefined" ? window.location.origin : "");

export default API_BASE;

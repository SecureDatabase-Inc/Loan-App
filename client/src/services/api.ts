import axios from "axios";
import { API_URL } from "@/utils/constants";
import { useAuthStore } from "@/store/authStore";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** Suppress the global 401 redirect (used by session probes and auth calls). */
    skipAuthRedirect?: boolean;
  }
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Native builds authenticate with a Bearer token because the httpOnly cookie is
// cross-site inside the Capacitor WebView and will not be sent. On the web the
// token stays in memory only and the httpOnly cookie remains authoritative.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !error.config?.skipAuthRedirect
    ) {
      const isAdmin = window.location.pathname.startsWith("/admin");
      if (!isAdmin) window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

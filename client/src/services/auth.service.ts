import api from "./api";
import { User } from "@/types/auth.types";
import { useAuthStore } from "@/store/authStore";
import { secureStorage } from "@/utils/secureStorage";

/**
 * Persists the issued token for native clients (Keystore-backed) and keeps it
 * in memory for the current session. On the web nothing is written to disk;
 * the httpOnly cookie issued by the API is the durable credential.
 */
async function rememberToken(token?: string) {
  if (!token) return;
  useAuthStore.getState().setToken(token);
  await secureStorage.setToken(token);
}

export const authService = {
  async register(data: { fullName: string; phone: string; email?: string; password: string }) {
    const res = await api.post("/auth/register", data, { skipAuthRedirect: true });
    await rememberToken(res.data?.token);
    return res.data;
  },

  async login(data: { phone: string; password: string }) {
    const res = await api.post("/auth/login", data, { skipAuthRedirect: true });
    await rememberToken(res.data?.token);
    return res.data;
  },

  async logout() {
    try {
      await api.post("/auth/logout", undefined, { skipAuthRedirect: true });
    } finally {
      useAuthStore.getState().logout();
    }
  },

  async getProfile(): Promise<User> {
    // The route guard decides where to send an unauthenticated user, so the
    // global 401 redirect must not fire during boot hydration.
    const res = await api.get("/auth/profile", { skipAuthRedirect: true });
    return res.data;
  },
};

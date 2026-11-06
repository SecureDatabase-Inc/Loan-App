import { isNativeApp } from "@/utils/platform";

/**
 * Persistent auth-token storage for the native shell.
 *
 * Native Android builds use `capacitor-secure-storage-plugin`, which stores
 * values in Keystore-backed encrypted storage (EncryptedSharedPreferences with
 * an Android Keystore master key). Plain Capacitor Preferences / localStorage
 * is deliberately NOT used as a fallback: if secure storage is unavailable the
 * token simply is not persisted.
 *
 * On the web build this is a no-op — the httpOnly `token` cookie remains the
 * persistence mechanism there.
 */
const TOKEN_KEY = "boa.auth.token";

async function securePlugin() {
  const mod = await import("capacitor-secure-storage-plugin");
  return mod.SecureStoragePlugin;
}

export const secureStorage = {
  async getToken(): Promise<string | null> {
    if (!isNativeApp()) return null;
    try {
      const { value } = await (await securePlugin()).get({ key: TOKEN_KEY });
      return value || null;
    } catch {
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    if (!isNativeApp()) return;
    try {
      await (await securePlugin()).set({ key: TOKEN_KEY, value: token });
    } catch {
      // Never log the token. Persistence failure leaves the session in memory only.
      console.warn("Secure token storage unavailable; token will not persist.");
    }
  },

  async clearToken(): Promise<void> {
    if (!isNativeApp()) return;
    try {
      await (await securePlugin()).remove({ key: TOKEN_KEY });
    } catch {
      // Nothing to clear, or the plugin is unavailable.
    }
  },
};

import { API_BASE_URL } from "@/lib/api";
import { create } from "zustand";
import {
  getAccessToken,
  setAccessToken,
  getStoredRefreshToken,
  clearStoredTokens,
  refreshAccessToken,
} from "@/lib/token";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  phoneNumber?: string | null;
  hasPassword?: boolean;
  roles: string[];
  permissions: string[];
  isVerified?: boolean;
  isSuspended?: boolean;
  suspendedReason?: string | null;
  suspendedAt?: string | null;
  onboardingCompleted?: boolean;
  onboardingState?: "NOT_PROMPTED" | "PROMPTED" | "COMPLETED" | "DISMISSED" | string;
  hasPreferences?: boolean;
  isNewUser?: boolean;
  recommendationProfile?: {
    onboardingCompleted?: boolean;
    onboardingState?: string;
    onboardingPromptedAt?: string | null;
    onboardingDismissedAt?: string | null;
  };
  languagePreferences?: Array<{ languageCode: string; language?: any }>;
  topicPreferences?: Array<{ topicId: string; topic?: any }>;
  countryPreferences?: Array<{ countryId: string; country?: any }>;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: UserProfile, accessToken: string, refreshToken?: string) => void;
  updateUser: (partialUser: Partial<UserProfile>) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const USER_KEY = "bko_user_profile";

function getCachedUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

let checkPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => {
  const cachedUser = getCachedUser();
  const initialToken = typeof window !== "undefined" ? getAccessToken() : null;

  return {
    user: cachedUser,
    accessToken: initialToken,
    isAuthenticated: Boolean(cachedUser && initialToken),
    isLoading: true,

    setAuth: (user, accessToken, refreshToken) => {
      setAccessToken(accessToken, refreshToken);
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
    },

    updateUser: (partialUser) => {
      const current = get().user;
      if (!current) return;
      const updated = { ...current, ...partialUser };
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
      set({ user: updated });
    },

    logout: async () => {
      const storedRefresh = getStoredRefreshToken();
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: storedRefresh || undefined }),
        });
      } catch (e) {}
      clearStoredTokens();
      if (typeof window !== "undefined") {
        localStorage.removeItem(USER_KEY);
      }
      set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
    },

    checkAuth: () => {
      if (!checkPromise) {
        checkPromise = (async () => {
          // Hydratation optimiste immédiate si des données locales existent
          if (typeof window !== "undefined" && !get().user) {
            const cached = getCachedUser();
            const token = getAccessToken();
            if (cached && token) {
              set({ user: cached, accessToken: token, isAuthenticated: true, isLoading: false });
            }
          }

          try {
            let token = getAccessToken();
            if (!token) {
              token = await refreshAccessToken();
            }
            if (!token) {
              clearStoredTokens();
              if (typeof window !== "undefined") {
                localStorage.removeItem(USER_KEY);
              }
              set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
              return;
            }

            const res = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
            const json = await res.json();
            if (json?.error?.code === "ACCOUNT_SUSPENDED") {
              clearStoredTokens();
              if (typeof window !== "undefined") {
                localStorage.removeItem(USER_KEY);
                sessionStorage.setItem("bko_suspended_details", JSON.stringify(json.error?.details || {}));
                try {
                  const { usePlayerStore } = await import("@/store/playerStore");
                  usePlayerStore.getState().pause();
                } catch (_) {}
                if (window.location.pathname !== "/suspended") {
                  window.location.href = "/suspended";
                }
              }
              set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
              return;
            }
            if (json.success && json.data) {
              if (typeof window !== "undefined") {
                localStorage.setItem(USER_KEY, JSON.stringify(json.data));
              }
              set({ user: json.data, accessToken: getAccessToken(), isAuthenticated: true, isLoading: false });
            } else {
              // Si le token a expiré, on tente un refresh
              const refreshed = await refreshAccessToken();
              if (refreshed) {
                const retryRes = await fetch(`${API_BASE_URL}/me`, { credentials: "include" });
                const retryJson = await retryRes.json();
                if (retryJson.success && retryJson.data) {
                  if (typeof window !== "undefined") {
                    localStorage.setItem(USER_KEY, JSON.stringify(retryJson.data));
                  }
                  set({ user: retryJson.data, accessToken: refreshed, isAuthenticated: true, isLoading: false });
                  return;
                }
              }
              clearStoredTokens();
              if (typeof window !== "undefined") {
                localStorage.removeItem(USER_KEY);
              }
              set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
            }
          } catch (err) {
            // En cas d'erreur réseau ponctuelle, préserver la session en cache si existante
            const hasCached = !!get().user;
            set({ isLoading: false, isAuthenticated: hasCached });
          } finally {
            checkPromise = null;
          }
        })();
      }
      return checkPromise;
    },
  };
});

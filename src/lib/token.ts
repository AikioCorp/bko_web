import { API_BASE_URL } from "@/lib/api";

const ACCESS_TOKEN_KEY = "bko_access_token";
const REFRESH_TOKEN_KEY = "bko_refresh_token";

let memoryAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  if (!memoryAccessToken && typeof window !== "undefined") {
    memoryAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return memoryAccessToken;
}

export function getStoredRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

export function setAccessToken(token: string | null, refreshToken?: string | null) {
  memoryAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else if (refreshToken === null) {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  }
}

export function clearStoredTokens() {
  memoryAccessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("bko_user_profile"); // Clear user profile cache
  }
}

// Échange le refresh token contre un nouvel access token (dédupliqué).
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    const storedRefresh = getStoredRefreshToken();
    refreshPromise = (nativeFetch()(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: storedRefresh || undefined }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (json?.success && json.data?.accessToken) {
          memoryAccessToken = json.data.accessToken;
          setAccessToken(json.data.accessToken, json.data.refreshToken);
          return memoryAccessToken;
        }
        
        // Refresh failed, session is dead
        clearStoredTokens();
        
        // Force redirect to login to break any infinite retry loops from SWR or React Query
        if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
        
        return null;
      })
      .catch(() => {
        clearStoredTokens();
        return null;
      }) as Promise<string | null>).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

let originalFetch: typeof fetch | null = null;
function nativeFetch(): typeof fetch {
  return (originalFetch ?? window.fetch).bind(window);
}

// Intercepte fetch pour les appels vers l'API : injecte le Bearer et, sur 401,
// tente un refresh unique puis rejoue la requête.
if (typeof window !== "undefined" && !(window as any).__bkoFetchPatched) {
  (window as any).__bkoFetchPatched = true;
  originalFetch = window.fetch;
  const base = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const isApi = url.startsWith(API_BASE_URL);
    const isAuthEndpoint = isApi && /\/auth\/(login|register|refresh|verify-otp)/.test(url);
    if (!isApi || isAuthEndpoint) return base(input, init);

    const token = getAccessToken();
    const withToken = (tok: string | null): RequestInit => {
      const headers = new Headers(init?.headers);
      if (tok) headers.set("Authorization", `Bearer ${tok}`);
      else headers.delete("Authorization");
      return { ...init, headers };
    };

    const res = await base(input, withToken(token));
    if (res.status !== 401) return res;

    const fresh = await refreshAccessToken();
    return fresh ? base(input, withToken(fresh)) : res;
  };
}

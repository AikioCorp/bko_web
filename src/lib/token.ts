// Access token conservé UNIQUEMENT en mémoire (jamais dans localStorage : une faille XSS
// ne peut alors pas l'exfiltrer durablement). La session survit au rechargement grâce au
// refresh token, stocké par le backend dans un cookie httpOnly.
import { API_BASE_URL } from "@/lib/api";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

// Échange le cookie de refresh contre un nouvel access token (dédupliqué).
export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (nativeFetch()(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then(async (res) => {
        const json = await res.json();
        accessToken = json?.success && json.data?.accessToken ? json.data.accessToken : null;
        return accessToken;
      })
      .catch(() => null) as Promise<string | null>).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

let originalFetch: typeof fetch | null = null;
function nativeFetch(): typeof fetch {
  return (originalFetch ?? window.fetch).bind(window);
}

// Intercepte fetch pour les appels vers l'API : injecte le Bearer en mémoire et, sur 401,
// tente un refresh unique puis rejoue la requête. Les pages n'ont plus à gérer le token.
if (typeof window !== "undefined" && !(window as any).__bkoFetchPatched) {
  (window as any).__bkoFetchPatched = true;
  originalFetch = window.fetch;
  const base = originalFetch;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const isApi = url.startsWith(API_BASE_URL);
    const isAuthEndpoint = isApi && /\/auth\/(login|register|refresh|verify-otp)/.test(url);
    if (!isApi || isAuthEndpoint) return base(input, init);

    const withToken = (token: string | null): RequestInit => {
      const headers = new Headers(init?.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      else headers.delete("Authorization");
      return { ...init, headers };
    };

    const res = await base(input, withToken(accessToken));
    if (res.status !== 401) return res;

    const fresh = await refreshAccessToken();
    return fresh ? base(input, withToken(fresh)) : res;
  };
}

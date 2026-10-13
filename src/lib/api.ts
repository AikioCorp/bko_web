import { getAccessToken } from "@/lib/token";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; message?: string; error?: any }> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
    });
  } catch (error: any) {
    throw new Error(error.message || "Impossible de joindre le serveur.");
  }

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) {
      throw new Error(`Erreur serveur (${res.status})`);
    }
    return { success: true } as any;
  }

  if (!res.ok || json?.success === false) {
    if (json?.error?.code === "ACCOUNT_SUSPENDED" && typeof window !== "undefined") {
      try {
        const { clearStoredTokens } = await import("@/lib/token");
        const { usePlayerStore } = await import("@/store/playerStore");
        clearStoredTokens();
        sessionStorage.setItem("bko_suspended_details", JSON.stringify(json.error.details || {}));
        usePlayerStore.getState().pause();
      } catch (_) {}
      if (window.location.pathname !== "/suspended") {
        window.location.href = "/suspended";
      }
    }
    const errorMsg = json?.error?.message || json?.message || `Erreur requête (${res.status})`;
    const err = new Error(errorMsg);
    (err as any).status = res.status;
    (err as any).data = json;
    (err as any).code = json?.error?.code;
    throw err;
  }

  return json;
}

export const adminApi = fetchApi;


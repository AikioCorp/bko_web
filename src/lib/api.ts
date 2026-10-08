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
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      options.body = JSON.stringify(options.body);
    }
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
    const errorMsg = json?.error?.message || json?.message || `Erreur requête (${res.status})`;
    const err = new Error(errorMsg);
    (err as any).status = res.status;
    (err as any).data = json;
    throw err;
  }

  return json;
}

export const adminApi = fetchApi;


import { API_BASE_URL } from "@/lib/api";

// Appel API d'administration : renvoie `data` ou lève une Error portant le message du backend.
// Le Bearer est injecté (et rafraîchi sur 401) par l'intercepteur de `lib/token.ts`.
export async function adminApi<T = any>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error("Impossible de joindre le serveur.");
  }
  let json: any = null;
  try {
    json = await res.json();
  } catch {}
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || json?.message || `Erreur ${res.status}`);
  }
  return json.data as T;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function timeAgo(date: string | Date): string {
  const s = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86400)} j`;
}

export const REASON_LABELS: Record<string, string> = {
  COPYRIGHT: "Droits d'auteur",
  INAPPROPRIATE: "Contenu inapproprié",
  SPAM: "Spam",
  IMPERSONATION: "Usurpation d'identité",
  MISINFORMATION: "Désinformation",
  OTHER: "Autre",
};

export const AUDIT_LABELS: Record<string, string> = {
  EPISODE_APPROVED: "Épisode approuvé",
  EPISODE_REJECTED: "Épisode refusé",
  PODCAST_APPROVED: "Podcast approuvé",
  PODCAST_REJECTED: "Podcast refusé",
  REPORT_HANDLED: "Signalement traité",
  USER_SUSPENDED: "Compte suspendu",
  USER_REACTIVATED: "Compte réactivé",
  USER_ROLES_CHANGED: "Rôles modifiés",
  JOB_RETRIED: "Tâche relancée",
  ROLE_CREATED: "Rôle créé",
  ROLE_UPDATED: "Rôle modifié",
  ROLE_DELETED: "Rôle supprimé",
  CREATOR_VERIFIED: "Créateur marqué de confiance",
  CREATOR_UNVERIFIED: "Confiance créateur retirée",
};

/** Variante qui renvoie aussi `meta` (ex. pagination par curseur des listes publiques). */
export async function apiWithMeta<T = any>(path: string): Promise<{ data: T; meta: any }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { credentials: "include", headers: { "Content-Type": "application/json" } });
  } catch {
    throw new Error("Impossible de joindre le serveur.");
  }
  let json: any = null;
  try {
    json = await res.json();
  } catch {}
  if (!res.ok || !json?.success) throw new Error(json?.error?.message || json?.message || `Erreur ${res.status}`);
  return { data: json.data as T, meta: json.meta ?? null };
}

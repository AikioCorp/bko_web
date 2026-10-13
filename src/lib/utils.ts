import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Construit un sous-titre dynamique intelligent pour un podcast :
 * 1. Auteur ou organisation réelle (en excluant formellement "Bamako Podcast", "Bko Podcast", etc.).
 * 2. Langue principale (ex. Bambara, Français).
 * 3. Si aucun auteur ni langue, nombre d'épisodes (ex. 12 épisodes).
 * 4. Si aucune métadonnée n'est présente, retourne null (aucun texte parasite).
 */
export function formatPodcastSubtitle(podcast: any): string | null {
  if (!podcast) return null;

  const rawAuthor =
    (typeof podcast.author === "string"
      ? podcast.author
      : podcast.author?.fullName || podcast.author?.name) ||
    podcast.publisher ||
    podcast.organization?.name;

  let authorStr: string | null = null;
  if (rawAuthor && typeof rawAuthor === "string") {
    const trimmed = rawAuthor.trim();
    const lower = trimmed.toLowerCase();
    const isExcluded =
      lower === "bamako podcast" ||
      lower === "bko podcast" ||
      lower === "bamako-podcast" ||
      lower === "bamakopodcast" ||
      lower === "indépendant" ||
      lower === "independant";
    if (!isExcluded && trimmed.length > 0) {
      authorStr = trimmed;
    }
  }

  const lang =
    podcast.primaryLanguage?.name ||
    (typeof podcast.language === "string" && podcast.language.trim().length > 0
      ? podcast.language.trim()
      : null);

  const rawCount =
    podcast._count?.episodes ??
    podcast.episodesCount ??
    (Array.isArray(podcast.episodes) ? podcast.episodes.length : null);
  const countStr =
    typeof rawCount === "number" && rawCount > 0
      ? `${rawCount} ${rawCount === 1 ? "épisode" : "épisodes"}`
      : null;

  const parts: string[] = [];
  if (authorStr) parts.push(authorStr);
  if (lang) parts.push(lang);
  if (!authorStr && !lang && countStr) parts.push(countStr);

  return parts.length > 0 ? parts.slice(0, 2).join(" • ") : null;
}

/**
 * Décode les entités HTML courantes (&apos;, &quot;, &amp;, etc.) pour un affichage propre des titres.
 */
export function decodeHtmlEntities(text?: string | null): string {
  if (!text || typeof text !== "string") return text || "";
  return text
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}



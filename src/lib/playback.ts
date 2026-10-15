import type { PlayerEpisode } from "@/store/playerStore";

/**
 * Résout la pochette dominante selon la directive éditoriale :
 * - Si audio ET vidéo sont disponibles, la pochette audio est dominante.
 * - Le cas échéant (si absence de pochette audio), la pochette vidéo s'affiche.
 * - Si seul audio ou seule vidéo existe, sa pochette respective s'applique.
 */
export function resolveEpisodeCover(
  ep?: {
    cover?: string | null;
    audioCover?: string | null;
    videoCover?: string | null;
    effectiveCover?: string | null;
    mediaSources?: any[];
    hasAudio?: boolean;
    hasVideo?: boolean;
    audioAvailable?: boolean;
    videoAvailable?: boolean;
  } | null,
  podcast?: { cover?: string | null } | null
): string | null {
  if (!ep) return podcast?.cover ?? null;
  if (ep.effectiveCover) return ep.effectiveCover;

  const hasAudio = ep.hasAudio ?? ep.audioAvailable ?? ep.mediaSources?.some((m) => m.type === "AUDIO");
  const hasVideo = ep.hasVideo ?? ep.videoAvailable ?? ep.mediaSources?.some((m) => m.type === "VIDEO");

  const audioCover = ep.audioCover ?? ep.cover;
  const videoCover = ep.videoCover;

  if (hasAudio && hasVideo) {
    return audioCover || videoCover || podcast?.cover || null;
  }
  if (hasAudio) {
    return audioCover || podcast?.cover || null;
  }
  if (hasVideo) {
    return videoCover || ep.cover || podcast?.cover || null;
  }
  return ep.cover || podcast?.cover || null;
}

/** Adapte un épisode renvoyé par l'API publique au format attendu par le lecteur. */
export function toPlayerEpisode(
  ep: {
    id: string;
    slug: string;
    title: string;
    cover?: string | null;
    audioCover?: string | null;
    videoCover?: string | null;
    effectiveCover?: string | null;
    durationSeconds: number;
    mediaSources: any[];
    hasAudio?: boolean;
    hasVideo?: boolean;
  },
  podcast: { slug: string; name: string; cover: string }
): PlayerEpisode {
  return {
    id: ep.id,
    slug: ep.slug,
    title: ep.title,
    cover: resolveEpisodeCover(ep, podcast) ?? ep.cover ?? null,
    durationSeconds: ep.durationSeconds,
    podcast: { slug: podcast.slug, name: podcast.name, cover: podcast.cover },
    mediaSources: ep.mediaSources.map((m) => ({
      id: m.id,
      type: m.type,
      sourceType: m.sourceType,
      provider: m.provider,
      playbackMode: m.playbackMode,
      externalUrl: m.externalUrl,
      embedUrl: m.embedUrl,
      durationSeconds: m.durationSeconds,
      isPrimaryAudio: m.isPrimaryAudio,
      isPrimaryVideo: m.isPrimaryVideo,
    })),
  };
}

export const formatDuration = (seconds: number) => {
  if (!seconds || seconds < 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m.toString().padStart(2, "0")}` : `${Math.max(1, m)} min`;
};

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

export const formatClock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? m.toString().padStart(2, "0") : m.toString();
  return `${h > 0 ? `${h}:` : ""}${mm}:${sec.toString().padStart(2, "0")}`;
};

export async function shareOrCopy(title: string, path: string) {
  const url = `${window.location.origin}${path}`;
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return "shared";
    }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "cancelled";
  }
}

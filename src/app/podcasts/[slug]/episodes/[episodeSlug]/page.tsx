"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Play, Pause, Share2, Bookmark, BookmarkCheck, ListMusic, Smartphone, Crown, Lock, Heart, Check } from "lucide-react";
import { studioApi } from "@/lib/studioApi";
import { fetchApi } from "@/lib/api";
import { formatClock, formatDate, formatDuration, shareOrCopy, toPlayerEpisode } from "@/lib/playback";
import { usePlayerStore } from "../../../../../store/playerStore";
import { useAuthStore } from "../../../../../store/authStore";
import { ReportButton } from "@/components/public/ReportButton";
import { AppDownloadModal } from "@/components/modals/AppDownloadModal";
import { EpisodePaywallCard } from "@/components/player/EpisodePaywallCard";

type Episode = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover?: string | null;
  durationSeconds: number;
  publishedAt?: string | null;
  episodeNumber?: number | null;
  mediaSources: any[];
  defaultMode: "AUDIO" | "VIDEO";
  podcast: { id: string; slug: string; name: string; cover: string };
  isPremium?: boolean;
  premiumPrice?: number | null;
  season?: { number: number; title?: string | null } | null;
  people: { role: string; person: { name: string; slug: string } }[];
  topics: { topic: { name: string; slug: string } }[];
  viewer: {
    isSaved: boolean;
    isLiked?: boolean;
    hasActiveSubscription?: boolean;
    isPurchased?: boolean;
    progress: { positionSeconds: number; completed: boolean } | null;
  } | null;
};
type Chapter = { id: string; title: string; startTimeMs: number };
type Segment = { id: string; startTimeMs: number; text: string; speakerLabel?: string | null };

const ROLE_LABEL: Record<string, string> = { HOST: "Animation", GUEST: "Invité(e)", PRODUCER: "Production", SOUND_ENGINEER: "Son" };

export default function EpisodePage() {
  const { slug, episodeSlug } = useParams<{ slug: string; episodeSlug: string }>();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  const { currentEpisode, isPlaying, playEpisode, togglePlay, seek, addToQueue } = usePlayerStore();

  const [ep, setEp] = useState<Episode | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [tab, setTab] = useState<"about" | "chapters" | "transcript">("about");
  const [notice, setNotice] = useState("");
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isQueueingDownload, setIsQueueingDownload] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const e = await studioApi<Episode>(`/podcasts/${slug}/episodes/${episodeSlug}`);
      setEp(e);
      setSaved(!!e.viewer?.isSaved);
      setLiked(!!e.viewer?.isLiked);
      setStatus("ready");
      studioApi<Chapter[]>(`/episodes/${e.id}/chapters`).then(setChapters).catch(() => {});
      studioApi<{ segments: Segment[] } | null>(`/episodes/${e.id}/transcript`)
        .then((t) => setSegments(t?.segments ?? []))
        .catch(() => {});
    } catch (err: any) {
      setStatus(/introuvable/i.test(err.message) ? "notfound" : "error");
    }
  }, [slug, episodeSlug]);

  useEffect(() => {
    if (!authLoading) load();
  }, [load, authLoading, isAuthenticated]);

  const flash = (m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(""), 2500);
  };

  if (status === "loading") return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-sm text-gray-500">Chargement…</div>;
  if (status === "notfound")
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <h1 className="text-2xl font-extrabold text-white">Épisode introuvable</h1>
        <p className="text-sm text-gray-400">Cet épisode n&apos;existe pas ou n&apos;est plus disponible.</p>
        <Link href={`/podcasts/${slug}`} className="inline-block text-[#FFBF00] font-bold text-sm">Voir le podcast</Link>
      </div>
    );
  if (status === "error" || !ep)
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <p className="text-sm text-red-300">Impossible de charger cet épisode.</p>
        <button onClick={load} className="bg-[#262626] text-white text-sm font-bold px-4 py-2 rounded-lg">Réessayer</button>
      </div>
    );

  const isCurrent = currentEpisode?.id === ep.id;
  const playable = ep.mediaSources.length > 0;
  const login = () => router.push(`/login?redirect=${encodeURIComponent(`/podcasts/${slug}/episodes/${episodeSlug}`)}`);

  const start = (atMs = 0) => {
    const resume = ep.viewer?.progress && !ep.viewer.progress.completed ? ep.viewer.progress.positionSeconds : 0;
    if (isCurrent) {
      if (atMs > 0) seek(atMs / 1000);
      else togglePlay();
      return;
    }
    playEpisode(toPlayerEpisode(ep, ep.podcast), ep.defaultMode, atMs > 0 ? atMs / 1000 : resume);
  };

  const toggleSave = async () => {
    if (!isAuthenticated) return login();
    const next = !saved;
    setSaved(next);
    try {
      await studioApi(`/episodes/${ep.id}/save`, { method: next ? "POST" : "DELETE" });
    } catch (e: any) {
      setSaved(!next);
      flash(e.message);
    }
  };

  const toggleLike = async () => {
    if (!isAuthenticated) return login();
    const next = !liked;
    setLiked(next);
    try {
      if (next) {
        await studioApi(`/episodes/${ep.id}/likes`, { method: "POST" });
        flash("Épisode ajouté à vos favoris");
      } else {
        await studioApi(`/episodes/${ep.id}/likes`, { method: "DELETE" });
        flash("Épisode retiré de vos favoris");
      }
    } catch (e: any) {
      setLiked(!next);
      flash(e.message);
    }
  };

  const handleRemoteDownload = async () => {
    if (!isAuthenticated) return login();
    if (!ep) return;
    setIsQueueingDownload(true);
    try {
      const res = await fetchApi('/downloads/remote-queue', {
        method: 'POST',
        body: JSON.stringify({ episodeId: ep.id, clientSource: 'WEB' }),
      });
      if (res.data?.hasActiveMobile === false) {
        setIsAppModalOpen(true);
        flash("Aucun téléphone connecté. Connectez-vous sur l'application mobile pour lancer le téléchargement !");
      } else {
        flash(res.data?.message || "Téléchargement programmé sur votre téléphone !");
      }
    } catch (e: any) {
      flash(e.message || "Impossible de programmer le téléchargement.");
    } finally {
      setIsQueueingDownload(false);
    }
  };

  const tabs = [
    { k: "about", l: "À propos" },
    ...(chapters.length ? [{ k: "chapters", l: `Chapitres (${chapters.length})` }] : []),
    ...(segments.length ? [{ k: "transcript", l: "Transcription" }] : []),
  ] as { k: "about" | "chapters" | "transcript"; l: string }[];

  const hasAccess = !ep.isPremium || ep.viewer?.hasActiveSubscription || ep.viewer?.isPurchased;

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 py-8 space-y-8">
      <Link href={`/podcasts/${ep.podcast.slug}`} className="text-xs text-[#B8B8B8] hover:text-white">
        ← {ep.podcast.name}
      </Link>

      <header className="flex flex-col md:flex-row md:items-end gap-5 sm:gap-8 md:gap-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="relative shrink-0">
          <img src={ep.cover || ep.podcast.cover} alt="" className="w-32 h-32 sm:w-56 sm:h-56 md:w-64 md:h-64 shadow-2xl rounded-2xl object-cover bg-[#1C1C1C]" />
          {ep.isPremium && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0B0B0B] border border-[#FFBF00] text-[#FFBF00] text-xs font-bold flex items-center gap-1.5 shadow-lg">
              <Crown className="w-3.5 h-3.5 fill-[#FFBF00]" />
              <span>PREMIUM</span>
            </div>
          )}
        </div>
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {ep.isPremium && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#1F1B0B] border border-[#FFBF00]/50 text-[#FFBF00] text-[11px] font-bold flex items-center gap-1">
                <Crown className="w-3 h-3 fill-current" />
                Épisode Premium ({ep.premiumPrice ? `${ep.premiumPrice.toLocaleString('fr-FR')} FCFA` : "Inclus dans le Pass"})
              </span>
            )}
            <p className="text-[11px] text-[#8A8A8A]">
              {ep.season ? `Saison ${ep.season.number} • ` : ""}
              {ep.episodeNumber ? `Épisode ${ep.episodeNumber} • ` : ""}
              {formatDate(ep.publishedAt)}
              {ep.durationSeconds ? ` • ${formatDuration(ep.durationSeconds)}` : ""}
            </p>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight font-extrabold text-white">{ep.title}</h1>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {hasAccess ? (
              <button
                onClick={() => start()}
                disabled={!playable}
                className="inline-flex items-center gap-2 bg-[#FFBF00] text-[#0B0B0B] text-sm font-bold px-5 py-2.5 rounded-full disabled:opacity-40 hover:bg-[#E5AB00] transition-colors"
              >
                {isCurrent && isPlaying ? <Pause className="w-4 h-4 fill-current stroke-none" /> : <Play className="w-4 h-4 fill-current stroke-none" />}
                {isCurrent && isPlaying ? "Pause" : ep.viewer?.progress && !ep.viewer.progress.completed && ep.viewer.progress.positionSeconds > 10 ? "Reprendre" : "Écouter"}
              </button>
            ) : (
              <a
                href="#paywall-section"
                className="inline-flex items-center gap-2 bg-[#FFBF00] text-[#0B0B0B] text-sm font-bold px-5 py-2.5 rounded-full hover:bg-[#E5AB00] transition-colors shadow-lg"
              >
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>Débloquer cet épisode</span>
              </a>
            )}
            
            <button
              onClick={() => {
                addToQueue(toPlayerEpisode(ep, ep.podcast));
                flash("Épisode ajouté à la file d'attente");
              }}
              className="text-[#B8B8B8] hover:text-[#FFBF00] p-2 transition-colors"
              aria-label="Ajouter à la file d'attente"
              title="Ajouter à la file d'attente"
            >
              <ListMusic className="w-5 h-5" />
            </button>

            <button
              onClick={toggleLike}
              aria-pressed={liked}
              aria-label={liked ? "Ne plus aimer" : "Aimer"}
              title={liked ? "Retirer des favoris" : "Aimer cet épisode"}
              className={`p-2 transition-colors ${liked ? "text-[#FFBF00]" : "text-[#B8B8B8] hover:text-[#FFBF00]"}`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-[#FFBF00] text-[#FFBF00]" : ""}`} />
            </button>

            <button onClick={toggleSave} aria-pressed={saved} aria-label={saved ? "Retirer de la bibliothèque" : "Enregistrer"} title={saved ? "Retirer de la bibliothèque" : "Enregistrer dans la bibliothèque"} className="text-[#B8B8B8] hover:text-[#FFBF00] p-2 transition-colors">
              {saved ? <BookmarkCheck className="w-5 h-5 text-[#FFBF00]" /> : <Bookmark className="w-5 h-5" />}
            </button>
            <button
              onClick={async () => {
                if ((await shareOrCopy(ep.title, `/podcasts/${ep.podcast.slug}/episodes/${ep.slug}`)) === "copied") flash("Lien copié");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#B8B8B8] hover:text-white"
            >
              <Share2 className="w-3.5 h-3.5" /> Partager
            </button>
            <button
              onClick={handleRemoteDownload}
              disabled={isQueueingDownload}
              title="Télécharger sur mon téléphone (Écoute hors-ligne mobile)"
              className="inline-flex items-center gap-1.5 text-xs text-[#B8B8B8] hover:text-[#FFBF00] bg-[#1C1C1C] hover:bg-[#252525] border border-[#2E2E2E] px-3.5 py-1.5 rounded-full transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#FFBF00]" />
              <span>{isQueueingDownload ? "Envoi..." : "Télécharger sur mobile"}</span>
            </button>
            <ReportButton targetType="EPISODE" targetId={ep.id} />
            {notice && <span className="text-xs text-[#FFBF00]" role="status">{notice}</span>}
          </div>
          {!playable && <p className="text-xs text-red-300">Aucune source de lecture disponible pour cet épisode.</p>}
        </div>
      </header>

      {/* Paywall Banner if episode is gated */}
      {!hasAccess && (
        <div id="paywall-section">
          <EpisodePaywallCard
            episode={{
              id: ep.id,
              title: ep.title,
              slug: ep.slug,
              isPremium: ep.isPremium,
              premiumPrice: ep.premiumPrice,
              podcast: {
                name: ep.podcast.name,
                slug: ep.podcast.slug,
              },
            }}
            onAccessGranted={load}
          />
        </div>
      )}

      {tabs.length > 1 && (
        <div className="flex gap-1 border-b border-[#262626]" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.k}
              role="tab"
              aria-selected={tab === t.k}
              onClick={() => setTab(t.k)}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px ${tab === t.k ? "border-[#FFBF00] text-[#FFBF00]" : "border-transparent text-gray-400 hover:text-white"}`}
            >
              {t.l}
            </button>
          ))}
        </div>
      )}

      {tab === "about" && (
        <div className="space-y-5 max-w-5xl">
          <p className="text-base sm:text-lg text-[#CFCFCF] leading-relaxed whitespace-pre-wrap">{ep.description}</p>
          {ep.people.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wide text-[#8A8A8A]">Intervenants</h2>
              <div className="flex flex-wrap gap-2">
                {ep.people.map((p) => (
                  <Link key={p.person.slug} href={`/people/${p.person.slug}`} className="text-xs bg-[#1C1C1C] border border-[#2E2E2E] rounded-full px-3 py-1.5 hover:border-[#FFBF00]/50">
                    <span className="text-white font-semibold">{p.person.name}</span>
                    <span className="text-[#8A8A8A]"> • {ROLE_LABEL[p.role] ?? p.role}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {ep.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ep.topics.map((t) => (
                <Link key={t.topic.slug} href={`/topics/${t.topic.slug}`} className="text-[11px] bg-[#1C1C1C] border border-[#2E2E2E] text-[#B8B8B8] hover:text-white px-2.5 py-1 rounded-full">
                  #{t.topic.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "chapters" && (
        <ul className="divide-y divide-[#1F1F1F] border border-[#1F1F1F] rounded-xl overflow-hidden">
          {chapters.map((c) => (
            <li key={c.id}>
              <button onClick={() => start(c.startTimeMs)} disabled={!playable} className="w-full text-left px-4 py-3 flex gap-4 hover:bg-[#1A1A1A] disabled:opacity-60">
                <span className="text-xs font-mono text-[#FFBF00] w-14 shrink-0">{formatClock(c.startTimeMs)}</span>
                <span className="text-sm text-white">{c.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === "transcript" && (
        <ul className="space-y-1">
          {segments.map((s) => (
            <li key={s.id}>
              <button onClick={() => start(s.startTimeMs)} disabled={!playable} className="w-full text-left px-3 py-2 rounded-lg flex gap-4 hover:bg-[#1A1A1A] disabled:opacity-60">
                <span className="text-[11px] font-mono text-[#FFBF00] w-14 shrink-0 pt-0.5">{formatClock(s.startTimeMs)}</span>
                <span className="text-sm text-[#CFCFCF]">
                  {s.speakerLabel && <strong className="text-white">{s.speakerLabel} : </strong>}
                  {s.text}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <AppDownloadModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        title="Téléchargement sur Mobile"
        subtitle="Le téléchargement de fichiers est réservé à l'application mobile. Connectez-vous sur votre téléphone pour synchroniser vos épisodes hors-ligne !"
      />
    </div>
  );
}

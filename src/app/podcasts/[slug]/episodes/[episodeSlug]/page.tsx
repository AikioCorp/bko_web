"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";


import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import { Play, Pause, Share2, Bookmark, BookmarkCheck, ListPlus, ListMinus, Heart } from "lucide-react";
import { CommentsSection } from "@/components/CommentsSection";
import { studioApi } from "@/lib/studioApi";
import { formatClock, formatDate, formatDuration, shareOrCopy, toPlayerEpisode } from "@/lib/playback";
import { usePlayerStore } from "../../../../../store/playerStore";
import { useAuthStore } from "../../../../../store/authStore";
import { ReportButton } from "@/components/public/ReportButton";

type Episode = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover?: string | null;
  durationSeconds: number;
  allowComments: boolean;
  _count?: { EpisodeLike: number };
  publishedAt?: string | null;
  episodeNumber?: number | null;
  mediaSources: any[];
  defaultMode: "AUDIO" | "VIDEO";
  podcast: { id: string; slug: string; name: string; cover: string; organization?: { name: string } | null; primaryLanguage?: { name: string } | null; country?: { name: string } | null; };
  season?: { number: number; title?: string | null } | null;
  people: { role: string; person: { name: string; slug: string } }[];
  topics: { topic: { name: string; slug: string } }[];
  viewer: { isSaved: boolean; isLiked: boolean; progress: { positionSeconds: number; completed: boolean } | null } | null;
};
type Chapter = { id: string; title: string; startTimeMs: number };
type Segment = { id: string; startTimeMs: number; text: string; speakerLabel?: string | null };

const ROLE_LABEL: Record<string, string> = { HOST: "Animation", GUEST: "Invité(e)", PRODUCER: "Production", SOUND_ENGINEER: "Son" };

export default function EpisodePage() {
  const { slug, episodeSlug } = useParams<{ slug: string; episodeSlug: string }>();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  const { currentEpisode, isPlaying, playEpisode, togglePlay, seek, addToQueue, queue, removeFromQueue } = usePlayerStore();
  const [ep, setEp] = useState<Episode | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const { data: podcastData } = useSWR(ep ? `/podcasts/${ep.podcast.slug}` : null, async (url) => (await fetchApi(url)).data);
  const similarEpisodes = podcastData?.episodes?.filter((e: any) => e.id !== ep?.id) || [];
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [tab, setTab] = useState<"about" | "chapters" | "transcript">("about");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const e = await studioApi<Episode>(`/podcasts/${slug}/episodes/${episodeSlug}`);
      setEp(e);
      setSaved(!!e.viewer?.isSaved);
      setLiked(!!e.viewer?.isLiked);
      setLikesCount(e._count?.EpisodeLike || 0);
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


  const toggleLike = async () => {
    if (!isAuthenticated) return login();
    const isLiking = !liked;
    setLiked(isLiking);
    setLikesCount(prev => prev + (isLiking ? 1 : -1));
    try {
      if (isLiking) {
        await studioApi(`/episodes/${ep.id}/likes`, { method: "POST" });
      } else {
        await studioApi(`/episodes/${ep.id}/likes`, { method: "DELETE" });
      }
    } catch {
      setLiked(!isLiking);
      setLikesCount(prev => prev + (isLiking ? -1 : 1));
      flash("Erreur lors de l'action");
    }
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

  const tabs = [
    { k: "about", l: "À propos" },
    ...(chapters.length ? [{ k: "chapters", l: `Chapitres (${chapters.length})` }] : []),
    ...(segments.length ? [{ k: "transcript", l: "Transcription" }] : []),
  ] as { k: "about" | "chapters" | "transcript"; l: string }[];

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
      <Link href={`/podcasts/${ep.podcast.slug}`} className="inline-block text-xs text-[#B8B8B8] hover:text-[#FFBF00] mb-8 transition-colors">
        ← Retour au podcast {ep.podcast.name}
      </Link>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Left Column: Sticky Cover & Actions */}
        <div className="w-full lg:w-[450px] shrink-0 lg:sticky lg:top-24 space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ep.cover || ep.podcast.cover} alt="" className="w-full aspect-video shadow-2xl rounded-2xl object-cover bg-[#1C1C1C]" />
          
          <div className="flex flex-wrap items-center gap-3 bg-[#121212] p-4 rounded-2xl border border-[#1F1F1F]">

            <button
              onClick={() => start()}
              disabled={!playable}
              className="inline-flex items-center gap-2 bg-[#FFBF00] text-[#0B0B0B] text-sm font-bold px-5 py-2.5 rounded-full disabled:opacity-40"
            >
              {isCurrent && isPlaying ? <Pause className="w-4 h-4 fill-current stroke-none" /> : <Play className="w-4 h-4 fill-current stroke-none" />}
              {isCurrent && isPlaying ? "Pause" : ep.viewer?.progress && !ep.viewer.progress.completed && ep.viewer.progress.positionSeconds > 10 ? "Reprendre" : "Écouter"}
            </button>
            
            {(() => {
              const queueIndex = queue.findIndex(q => q.id === ep.id);
              const isInQueue = queueIndex !== -1;
              return (
                <button
                  onClick={() => {
                    if (isInQueue) {
                      removeFromQueue(queueIndex);
                      flash("Retiré de la file");
                    } else {
                      addToQueue(toPlayerEpisode(ep, ep.podcast));
                      flash("Ajouté à la file");
                    }
                  }}
                  className={`p-2 ${isInQueue ? 'text-[#FFBF00]' : 'text-[#B8B8B8] hover:text-[#FFBF00]'}`}
                  aria-label={isInQueue ? "Retirer de la file d'attente" : "Ajouter à la file d'attente"}
                >
                  {isInQueue ? <ListMinus className="w-5 h-5" /> : <ListPlus className="w-5 h-5" />}
                </button>
              );
            })()}

            <button onClick={toggleLike} aria-pressed={liked} aria-label={liked ? "Je n'aime plus" : "J'aime"} className="text-[#B8B8B8] hover:text-[#FFBF00] p-2 flex items-center gap-1">
              <Heart className={`w-5 h-5 ${liked ? "fill-[#FFBF00] text-[#FFBF00]" : ""}`} />
              <span className="text-xs font-mono">{likesCount > 0 ? likesCount : ""}</span>
            </button>
            <button onClick={toggleSave} aria-pressed={saved} aria-label={saved ? "Retirer des favoris" : "Enregistrer"} className="text-[#B8B8B8] hover:text-[#FFBF00] p-2">
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
            <ReportButton targetType="EPISODE" targetId={ep.id} />
            {notice && <span className="text-xs text-[#FFBF00]" role="status">{notice}</span>}
          
          </div>
          {!playable && <p className="text-xs text-red-300 px-2">Aucune source de lecture disponible pour cet épisode.</p>}
        </div>

        {/* Right Column: Title, Metadata, Tabs, Content */}
        <div className="flex-1 min-w-0 space-y-8">
          <div className="space-y-4">

          <p className="text-[11px] text-[#8A8A8A]">
            {ep.season ? `Saison ${ep.season.number} • ` : ""}
            {ep.episodeNumber ? `Épisode ${ep.episodeNumber} • ` : ""}
            {formatDate(ep.publishedAt)}
            {ep.durationSeconds ? ` • ${formatDuration(ep.durationSeconds)}` : ""}
          </p>
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight font-extrabold text-white">{ep.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#8A8A8A] pb-2">
            {ep.podcast.organization && <span className="px-2 py-1 bg-[#1C1C1C] rounded-md border border-[#2E2E2E]">Produit par <strong className="text-[#CFCFCF]">{ep.podcast.organization.name}</strong></span>}
            {ep.podcast.primaryLanguage && <span className="px-2 py-1 bg-[#1C1C1C] rounded-md border border-[#2E2E2E]">Langue: <strong className="text-[#CFCFCF]">{ep.podcast.primaryLanguage.name}</strong></span>}
            {ep.podcast.country && <span className="px-2 py-1 bg-[#1C1C1C] rounded-md border border-[#2E2E2E]">{ep.podcast.country.name}</span>}
          </div>
          
          </div>

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
          <p className="text-base sm:text-lg text-[#CFCFCF] leading-relaxed whitespace-pre-wrap">{ep.description.replace(/https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/g, "").replace(/Regardez la vidéo :/gi, "").trim()}</p>
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
      {/* Similar / Other Episodes */}
      <CommentsSection key={ep.id} episodeId={ep.id} allowComments={ep.allowComments} />
      {similarEpisodes.length > 0 && (
        <div className="pt-12 border-t border-[#1F1F1F] mt-12 w-full">
          <h2 className="text-xl font-extrabold text-white mb-6">Autres épisodes (Même Podcast)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {similarEpisodes.slice(0, 6).map((sep: any) => (
              <Link href={`/podcasts/${ep.podcast.slug}/episodes/${sep.slug}`} key={sep.id} className="group flex gap-4 bg-[#141414] border border-[#242424] hover:border-[#FFBF00]/50 p-3 rounded-xl transition-colors">
                <img src={sep.cover || ep.podcast.cover} alt="" className="w-20 h-20 rounded-lg object-cover bg-[#1C1C1C] shrink-0" />
                <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] text-[#FFBF00] font-mono">{formatDate(sep.publishedAt)}</p>
                    <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 mt-1 group-hover:text-[#FFBF00] transition-colors">{sep.title}</h3>
                  </div>
                  <p className="text-xs text-[#8A8A8A]">{sep.durationSeconds ? formatDuration(sep.durationSeconds) : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

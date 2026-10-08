"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Play, Pause, Share2, Bookmark, BookmarkCheck, Heart, Check, ListPlus, ListMinus } from "lucide-react";
import { studioApi } from "@/lib/studioApi";
import { formatDate, formatDuration, shareOrCopy, toPlayerEpisode } from "@/lib/playback";
import { usePlayerStore } from "../../../store/playerStore";
import { useAuthStore } from "../../../store/authStore";
import { ReportButton } from "@/components/public/ReportButton";
import { PodcastRating } from "@/components/PodcastRating";

type Episode = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover?: string | null;
  durationSeconds: number;
  publishedAt?: string | null;
  episodeNumber?: number | null;
  languageCode?: string | null;
  mediaSources: any[];
  defaultMode: "AUDIO" | "VIDEO";
  people: { role: string; person: { name: string } }[];
};
type Podcast = {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  cover: string;
  website?: string | null;
  country: { name: string };
  primaryLanguage: { name: string };
  organization?: { name: string; slug: string } | null;
  categories: { category: { name: string; slug: string } }[];
  seasons: { id: string; number: number; title?: string | null }[];
  episodes: (Episode & { seasonId?: string | null })[];
  _count: { episodes: number; followers: number };
  viewer: {
    isFollowing: boolean;
    savedEpisodeIds: string[];
    progress: Record<string, { positionSeconds: number; completed: boolean }>;
  } | null;
};

export default function PodcastPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  const { currentEpisode, isPlaying, playEpisode, togglePlay, addToQueue, queue, removeFromQueue } = usePlayerStore();

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const p = await studioApi<Podcast>(`/podcasts/${slug}`);
      setPodcast(p);
      setFollowing(!!p.viewer?.isFollowing);
      setFollowers(p._count.followers);
      setSaved(new Set(p.viewer?.savedEpisodeIds ?? []));
      setStatus("ready");
    } catch (e: any) {
      setStatus(/introuvable/i.test(e.message) ? "notfound" : "error");
    }
  }, [slug]);

  // On recharge une fois la session restaurée, pour récupérer abonnement, favoris et progression.
  useEffect(() => {
    if (!authLoading) load();
  }, [load, authLoading, isAuthenticated]);

  const needLogin = () => router.push(`/login?redirect=${encodeURIComponent(`/podcasts/${slug}`)}`);
  const flash = (m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(""), 2500);
  };

  const toggleFollow = async () => {
    if (!podcast) return;
    if (!isAuthenticated) return needLogin();
    const next = !following;
    setFollowing(next);
    setFollowers((n) => n + (next ? 1 : -1));
    try {
      await studioApi(`/podcasts/${podcast.id}/follow`, { method: next ? "POST" : "DELETE" });
    } catch (e: any) {
      setFollowing(!next);
      setFollowers((n) => n + (next ? -1 : 1));
      flash(e.message);
    }
  };

  const toggleSave = async (ep: Episode) => {
    if (!isAuthenticated) return needLogin();
    const has = saved.has(ep.id);
    const copy = new Set(saved);
    has ? copy.delete(ep.id) : copy.add(ep.id);
    setSaved(copy);
    try {
      await studioApi(`/episodes/${ep.id}/save`, { method: has ? "DELETE" : "POST" });
    } catch (e: any) {
      setSaved(saved);
      flash(e.message);
    }
  };

  const play = (ep: Episode) => {
    if (!podcast) return;
    if (currentEpisode?.id === ep.id) return togglePlay();
    const prog = podcast.viewer?.progress[ep.id];
    // Reprise là où l'utilisateur s'était arrêté (sauf épisode terminé).
    const startAt = prog && !prog.completed ? prog.positionSeconds : 0;
    playEpisode(toPlayerEpisode(ep, podcast), ep.defaultMode, startAt);
  };

  if (status === "loading") return <div className="w-full px-4 py-20 text-center text-sm text-gray-500">Chargement…</div>;
  if (status === "notfound")
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <h1 className="text-2xl font-extrabold text-white">Podcast introuvable</h1>
        <p className="text-sm text-gray-400">Ce podcast n&apos;existe pas ou n&apos;est plus disponible.</p>
        <Link href="/podcasts" className="inline-block text-[#FFBF00] font-bold text-sm">Parcourir les podcasts</Link>
      </div>
    );
  if (status === "error" || !podcast)
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <p className="text-sm text-red-300">Impossible de charger ce podcast.</p>
        <button onClick={load} className="bg-[#262626] text-white text-sm font-bold px-4 py-2 rounded-lg">Réessayer</button>
      </div>
    );

  return (
    <div className="w-full px-4 py-8 space-y-8">
      <header className="flex flex-col sm:flex-row gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={podcast.cover} alt="" className="w-full sm:w-80 lg:w-[400px] aspect-video rounded-2xl object-cover bg-[#1C1C1C] shrink-0 mx-auto sm:mx-0 shadow-2xl" />
        <div className="flex-1 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#FFBF00]">Podcast</p>
          <h1 className="text-3xl font-extrabold text-white">{podcast.name}</h1>
          <div className="pt-2 pb-1">
            <PodcastRating podcastId={podcast.id} />
          </div>
          <p className="text-xs text-[#B8B8B8]">
            {podcast.organization && (
              <>
                <Link href={`/organizations/${podcast.organization.slug}`} className="hover:text-white">{podcast.organization.name}</Link> •{" "}
              </>
            )}
            {podcast.country.name} • {podcast.primaryLanguage.name} • {podcast._count.episodes} épisode(s) • {followers.toLocaleString("fr-FR")} abonné(s)
          </p>
          {podcast.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {podcast.categories.map((c) => (
                <Link key={c.category.slug} href={`/categories/${c.category.slug}`} className="text-[11px] bg-[#1C1C1C] border border-[#2E2E2E] text-[#B8B8B8] hover:text-white px-2.5 py-1 rounded-full">
                  {c.category.name}
                </Link>
              ))}
            </div>
          )}
          <div className="text-sm text-[#CFCFCF] leading-relaxed">
            <p className={expanded ? "" : "line-clamp-3"}>{podcast.description}</p>
            {podcast.description.length > 220 && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-[#FFBF00] font-bold mt-1">
                {expanded ? "Réduire" : "Lire la suite"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={toggleFollow}
              aria-pressed={following}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold ${following ? "bg-[#1C1C1C] border border-[#FFBF00]/50 text-[#FFBF00]" : "bg-[#FFBF00] text-[#0B0B0B]"}`}
            >
              {following ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
              {following ? "Suivi" : "Suivre"}
            </button>
            <button
              onClick={async () => {
                const r = await shareOrCopy(podcast.name, `/podcasts/${podcast.slug}`);
                if (r === "copied") flash("Lien copié");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#B8B8B8] hover:text-white"
            >
              <Share2 className="w-3.5 h-3.5" /> Partager
            </button>
            <ReportButton targetType="PODCAST" targetId={podcast.id} />
            <button
              onClick={() => {
                podcast.episodes.forEach((e) => {
                  if (e.mediaSources.length > 0 && !usePlayerStore.getState().queue.some(q => q.id === e.id)) {
                    addToQueue(toPlayerEpisode(e, podcast));
                  }
                });
                flash("File d'attente mise à jour");
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#B8B8B8] hover:text-[#FFBF00] ml-1"
            >
              <ListPlus className="w-3.5 h-3.5" /> File d'attente
            </button>
            {notice && <span className="text-xs text-[#FFBF00]" role="status">{notice}</span>}
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold text-white">Épisodes</h2>
        {podcast.episodes.length === 0 ? (
          <p className="text-sm text-gray-500 bg-[#161616] border border-[#262626] rounded-xl p-6 text-center">Aucun épisode publié pour le moment.</p>
        ) : (
          <ul className="divide-y divide-[#1F1F1F] border border-[#1F1F1F] rounded-2xl overflow-hidden">
            {podcast.episodes.map((ep) => {
              const current = currentEpisode?.id === ep.id;
              const prog = podcast.viewer?.progress[ep.id];
              const pct = prog && ep.durationSeconds ? Math.min(100, (prog.positionSeconds / ep.durationSeconds) * 100) : 0;
              const playable = ep.mediaSources.length > 0;
              return (
                <li key={ep.id} className={`p-4 flex gap-4 ${current ? "bg-[#FFBF00]/5" : "bg-[#121212]"}`}>
                  <button
                    onClick={() => play(ep)}
                    disabled={!playable}
                    aria-label={current && isPlaying ? `Mettre en pause ${ep.title}` : `Lire ${ep.title}`}
                    className="w-11 h-11 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 self-center disabled:opacity-40"
                  >
                    {current && isPlaying ? <Pause className="w-4 h-4 fill-current stroke-none" /> : <Play className="w-4 h-4 fill-current stroke-none ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[11px] text-[#8A8A8A]">
                      {ep.episodeNumber ? `Épisode ${ep.episodeNumber} • ` : ""}
                      {formatDate(ep.publishedAt)}
                      {ep.durationSeconds ? ` • ${formatDuration(ep.durationSeconds)}` : ""}
                      {prog?.completed ? " • Terminé" : ""}
                    </p>
                    <Link href={`/podcasts/${podcast.slug}/episodes/${ep.slug}`} className="block font-bold text-white hover:text-[#FFBF00] truncate">
                      {ep.title}
                    </Link>
                    <p className="text-xs text-[#B8B8B8] line-clamp-2">{ep.description.replace(/https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/g, "").replace(/Regardez la vidéo :/gi, "").trim()}</p>
                    {pct > 0 && !prog?.completed && (
                      <div className="h-1 bg-[#262626] rounded-full overflow-hidden w-40" aria-label="Progression">
                        <div className="h-full bg-[#FFBF00]" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center self-center gap-1">
                    {(() => {
                      const queueIndex = queue.findIndex(q => q.id === ep.id);
                      const isInQueue = queueIndex !== -1;
                      return (
                        <button
                          onClick={() => {
                            if (!playable) return;
                            if (isInQueue) {
                              removeFromQueue(queueIndex);
                              flash("Retiré de la file");
                            } else {
                              addToQueue(toPlayerEpisode(ep, podcast));
                              flash("Ajouté à la file");
                            }
                          }}
                          disabled={!playable}
                          aria-label={isInQueue ? "Retirer de la file d'attente" : "Ajouter à la file d'attente"}
                          className={`p-2 disabled:opacity-40 ${isInQueue ? 'text-[#FFBF00]' : 'text-[#B8B8B8] hover:text-[#FFBF00]'}`}
                        >
                          {isInQueue ? <ListMinus className="w-5 h-5" /> : <ListPlus className="w-5 h-5" />}
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => toggleSave(ep)}
                      aria-label={saved.has(ep.id) ? "Retirer des favoris" : "Enregistrer"}
                      aria-pressed={saved.has(ep.id)}
                      className="text-[#B8B8B8] hover:text-[#FFBF00] p-2"
                    >
                      {saved.has(ep.id) ? <BookmarkCheck className="w-5 h-5 text-[#FFBF00]" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

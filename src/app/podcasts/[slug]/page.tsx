"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Share2,
  Bookmark,
  BookmarkCheck,
  Heart,
  Check,
  SlidersHorizontal,
  Headphones,
  Video,
  ListPlus,
  Radio,
  ExternalLink,
  ChevronRight,
  Clock,
  FolderPlus,
  Sparkles,
  Crown,
  Lock
} from "lucide-react";
import { studioApi } from "@/lib/studioApi";
import { formatDate, formatDuration, shareOrCopy, toPlayerEpisode } from "@/lib/playback";
import { usePlayerStore } from "../../../store/playerStore";
import { useAuthStore } from "../../../store/authStore";
import { ReportButton } from "@/components/public/ReportButton";
import { AddToPlaylistModal } from "@/components/modals/AddToPlaylistModal";
import { ClaimPodcastModal } from "@/components/modals/ClaimPodcastModal";
import { ShieldCheck } from "lucide-react";

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
  isPremium?: boolean;
  premiumPrice?: number | null;
};

type Podcast = {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  cover: string;
  website?: string | null;
  isPremium?: boolean;
  country: { name: string; flagEmoji?: string };
  primaryLanguage: { name: string };
  organization?: { name: string; slug: string } | null;
  categories: { category: { name: string; slug: string } }[];
  seasons: { id: string; number: number; title?: string | null }[];
  episodes: (Episode & { seasonId?: string | null })[];
  ownershipStatus?: string;
  _count: { episodes: number; followers: number };
  viewer: {
    isFollowing: boolean;
    hasActiveSubscription?: boolean;
    purchasedEpisodeIds?: string[];
    savedEpisodeIds: string[];
    progress: Record<string, { positionSeconds: number; completed: boolean }>;
  } | null;
};

export default function PodcastPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  const { currentEpisode, isPlaying, playEpisode, togglePlay, addToQueue } = usePlayerStore();

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "error">("loading");
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  const [playlistEpisodeId, setPlaylistEpisodeId] = useState<string | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

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

  useEffect(() => {
    if (!authLoading) load();
  }, [load, authLoading, isAuthenticated]);

  const needLogin = () => router.push(`/login?redirect=${encodeURIComponent(`/podcasts/${slug}`)}`);
  const flash = (m: string) => {
    setNotice(m);
    setTimeout(() => setNotice(""), 2800);
  };

  const toggleFollow = async () => {
    if (!podcast) return;
    if (!isAuthenticated) return needLogin();
    const next = !following;
    setFollowing(next);
    setFollowers((n) => n + (next ? 1 : -1));
    try {
      await studioApi(`/podcasts/${podcast.id}/follow`, { method: next ? "POST" : "DELETE" });
      flash(next ? "Abonnement enregistré" : "Abonnement retiré");
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
      flash(has ? "Retiré des favoris" : "Enregistré dans votre bibliothèque");
    } catch (e: any) {
      setSaved(saved);
      flash(e.message);
    }
  };

  const play = (ep: Episode) => {
    if (!podcast) return;
    if (currentEpisode?.id === ep.id) return togglePlay();
    const prog = podcast.viewer?.progress[ep.id];
    const startAt = prog && !prog.completed ? prog.positionSeconds : 0;
    playEpisode(toPlayerEpisode(ep, podcast), ep.defaultMode, startAt);
  };

  const sortedEpisodes = useMemo(() => {
    if (!podcast?.episodes) return [];
    const list = [...podcast.episodes];
    if (sortOrder === "oldest") {
      return list.sort((a, b) => new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime());
    }
    return list.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  }, [podcast?.episodes, sortOrder]);

  const latestEpisode = sortedEpisodes[0];

  if (status === "loading") {
    return (
      <div className="w-full px-4 py-16 space-y-8 animate-pulse">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-[#181818] shrink-0" />
          <div className="flex-1 space-y-4 w-full">
            <div className="h-4 bg-[#222222] rounded w-24" />
            <div className="h-8 bg-[#222222] rounded w-3/4" />
            <div className="h-4 bg-[#222222] rounded w-1/2" />
            <div className="h-16 bg-[#181818] rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "notfound") {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <Radio className="w-12 h-12 text-[#444444] mx-auto" />
        <h1 className="text-2xl font-black text-white">Émission introuvable</h1>
        <p className="text-sm text-[#888888]">Cette émission n&apos;existe pas ou a été retirée du catalogue.</p>
        <Link
          href="/explore?view=podcasts"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs hover:bg-[#e6ac00] transition-colors"
        >
          Découvrir toutes les émissions
        </Link>
      </div>
    );
  }

  if (status === "error" || !podcast) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <p className="text-sm font-semibold text-red-400">Impossible de charger cette émission.</p>
        <button
          onClick={load}
          className="px-5 py-2.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 md:px-8 py-8 space-y-10 animate-fade-in text-white select-none pb-36">
      {/* Toast Notification */}
      {notice && (
        <div className="fixed bottom-24 right-6 z-[90] px-4 py-2.5 rounded-xl bg-[#1E1E1E] border border-[#333333] text-white text-xs font-semibold shadow-2xl animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4 text-[#FFBF00]" />
          <span>{notice}</span>
        </div>
      )}

      {/* HERO / HEADER ÉDITORIAL (Inspiré Apple Podcasts & Spotify) */}
      <header className="relative rounded-3xl border border-[#242424] bg-[#101010] p-6 sm:p-8 md:p-10 overflow-hidden">
        {/* Subtle blur ambiance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
          <img
            src={podcast.cover || "/images/default-cover.jpg"}
            alt=""
            aria-hidden
            className="w-full h-full object-cover blur-3xl scale-125"
          />
        </div>
        <div className="absolute inset-0 bg-[#0B0B0B]/75 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Pochette principale */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-[#181818] border border-[#2E2E2E] shrink-0 mx-auto md:mx-0 shadow-2xl group">
            <Image
              unoptimized
              src={podcast.cover || "/images/default-cover.jpg"}
              alt={podcast.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Métadonnées & Actions */}
          <div className="flex-1 min-w-0 space-y-4 text-center md:text-left">
            {/* Badges catégorie & type */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-[#FFBF00] text-[#0B0B0B] text-[10px] font-black uppercase tracking-wider">
                Émission Officielle
              </span>
              {podcast.country?.name && (
                <span className="px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] text-[#B8B8B8] text-[11px] font-medium">
                  {podcast.country.name}
                </span>
              )}
              {podcast.primaryLanguage?.name && (
                <span className="px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] text-[#B8B8B8] text-[11px] font-medium">
                  {podcast.primaryLanguage.name}
                </span>
              )}
              {podcast.categories?.map((c) => (
                <Link
                  key={c.category.slug}
                  href={`/explore?category=${c.category.slug}`}
                  className="px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] text-[#B8B8B8] hover:text-[#FFBF00] hover:border-[#FFBF00]/40 text-[11px] font-medium transition-colors"
                >
                  {c.category.name}
                </Link>
              ))}
            </div>

            {/* Titre */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black text-white tracking-tight leading-tight">
              {podcast.name}
            </h1>

            {/* Auteur & Organisation */}
            <p className="text-xs sm:text-sm text-[#8E8E8E] font-medium">
              {podcast.organization ? (
                <Link
                  href={`/organizations/${podcast.organization.slug}`}
                  className="text-white hover:text-[#FFBF00] font-semibold underline underline-offset-2 transition-colors mr-1"
                >
                  {podcast.organization.name}
                </Link>
              ) : null}
              <span>•</span>
              <span className="mx-1.5">{podcast._count.episodes} épisode{podcast._count.episodes > 1 ? "s" : ""}</span>
              <span>•</span>
              <span className="ml-1.5">{followers.toLocaleString("fr-FR")} abonné{followers > 1 ? "s" : ""}</span>
            </p>

            {/* Description avec déploiement doux */}
            <div className="text-xs sm:text-sm text-[#B8B8B8] leading-relaxed max-w-2xl">
              <p className={expanded ? "" : "line-clamp-3"}>{podcast.description}</p>
              {podcast.description.length > 220 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-[#FFBF00] font-bold mt-1.5 hover:underline cursor-pointer inline-block"
                >
                  {expanded ? "Réduire" : "Lire la suite"}
                </button>
              )}
            </div>

            {/* Barre d'actions principales */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {latestEpisode && (
                <button
                  onClick={() => play(latestEpisode)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#FFBF00] hover:bg-[#e6ac00] text-[#0B0B0B] text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {currentEpisode?.id === latestEpisode.id && isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>En lecture</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                      <span>Dernier épisode</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={toggleFollow}
                aria-pressed={following}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                  following
                    ? "bg-[#181818] border-[#FFBF00]/50 text-[#FFBF00]"
                    : "bg-[#181818] hover:bg-[#222222] border-[#2A2A2A] text-white"
                }`}
              >
                {following ? <Check className="w-4 h-4 text-[#FFBF00]" /> : <Heart className="w-4 h-4 text-[#FFBF00]" />}
                <span>{following ? "Abonné" : "S'abonner"}</span>
              </button>

              <button
                onClick={async () => {
                  const r = await shareOrCopy(podcast.name, `/podcasts/${podcast.slug}`);
                  if (r === "copied") flash("Lien de l'émission copié !");
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] text-xs font-bold text-[#B8B8B8] hover:text-white transition-colors cursor-pointer"
                title="Partager cette émission"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Partager</span>
              </button>

              {podcast.website && (
                <a
                  href={podcast.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] text-xs font-bold text-[#B8B8B8] hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Site web</span>
                </a>
              )}

              {(!podcast.ownershipStatus || podcast.ownershipStatus === "UNCLAIMED") && (
                <button
                  onClick={() => setIsClaimModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#181818] hover:bg-[#222222] border border-[#2A2A2A] hover:border-[#FFBF00]/40 text-xs font-bold text-[#B8B8B8] hover:text-[#FFBF00] transition-colors cursor-pointer"
                  title="Vous êtes l'auteur de ce podcast ? Revendiquer la propriété"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FFBF00]" />
                  <span>Revendiquer</span>
                </button>
              )}

              <ReportButton targetType="PODCAST" targetId={podcast.id} />
            </div>
          </div>
        </div>
      </header>

      {/* LISTE DES ÉPISODES */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202020] pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Tous les épisodes
            </h2>
            <p className="text-xs text-[#808080] mt-0.5">
              {podcast.episodes.length} épisode{podcast.episodes.length > 1 ? "s" : ""} disponible{podcast.episodes.length > 1 ? "s" : ""}
            </p>
          </div>

          {/* Tri */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#888888] font-medium">Trier par :</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-[#141414] border border-[#262626] rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer hover:border-[#FFBF00]/50 transition-colors"
            >
              <option value="recent">Plus récents</option>
              <option value="oldest">Plus anciens</option>
            </select>
          </div>
        </div>

        {sortedEpisodes.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-[#141414] border border-[#222222] space-y-2">
            <Radio className="w-10 h-10 text-[#444444] mx-auto" />
            <p className="text-sm font-bold text-white">Aucun épisode disponible</p>
            <p className="text-xs text-[#757575]">Cette émission n&apos;a pas encore publié d&apos;épisodes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedEpisodes.map((ep, index) => {
              const isCurrent = currentEpisode?.id === ep.id;
              const prog = podcast.viewer?.progress[ep.id];
              const pct = prog && ep.durationSeconds ? Math.min(100, (prog.positionSeconds / ep.durationSeconds) * 100) : 0;
              const playable = ep.mediaSources.length > 0;
              const isSaved = saved.has(ep.id);
              const durationText = formatDuration(ep.durationSeconds);
              const dateText = formatDate(ep.publishedAt);
              const hasVideo = ep.mediaSources.some((s: any) => s.type === "VIDEO");

              return (
                <div
                  key={ep.id}
                  className={`group relative p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                    isCurrent
                      ? "bg-[#181818] border-[#FFBF00]/40"
                      : "bg-[#141414] hover:bg-[#181818] border-[#222222] hover:border-[#303030]"
                  }`}
                >
                  {/* Thumbnail avec overlay Play */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 bg-[#1C1C1C] border border-[#262626]">
                    <Image
                      unoptimized
                      src={ep.cover || podcast.cover || "/images/default-cover.jpg"}
                      alt={ep.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <button
                      onClick={() => play(ep)}
                      disabled={!playable}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 cursor-pointer"
                      title={isCurrent && isPlaying ? "Mettre en pause" : "Écouter l'épisode"}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shadow-lg">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Détails de l'épisode */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {ep.isPremium && (
                        <span className="px-2 py-0.5 rounded-full bg-[#1F1B0B] border border-[#FFBF00]/60 text-[#FFBF00] text-[10px] font-bold flex items-center gap-1 shadow-sm">
                          <Crown className="w-3 h-3 fill-current" />
                          Premium {ep.premiumPrice ? `• ${ep.premiumPrice.toLocaleString('fr-FR')} F` : ""}
                        </span>
                      )}

                      {hasVideo ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#202020] text-[#A0A0A0] text-[10px] font-bold flex items-center gap-1">
                          <Video className="w-3 h-3 text-[#FFBF00]" /> Vidéo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#202020] text-[#A0A0A0] text-[10px] font-bold flex items-center gap-1">
                          <Headphones className="w-3 h-3 text-[#FFBF00]" /> Audio
                        </span>
                      )}

                      {ep.episodeNumber && (
                        <span className="text-[10px] font-bold text-[#888888]">
                          Épisode {ep.episodeNumber}
                        </span>
                      )}

                      {dateText && (
                        <span className="text-[11px] text-[#707070] font-medium">
                          • {dateText}
                        </span>
                      )}

                      {durationText && (
                        <span className="text-[11px] text-[#707070] font-medium">
                          • {durationText}
                        </span>
                      )}

                      {prog?.completed && (
                        <span className="text-[10px] font-bold text-[#FFBF00]">
                          • Terminé
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/podcasts/${podcast.slug}/episodes/${ep.slug || ep.id}`}
                      className="block"
                    >
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#FFBF00] transition-colors line-clamp-2 leading-snug">
                        {ep.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-[#999999] line-clamp-2 leading-relaxed">
                      {ep.description}
                    </p>

                    {/* Barre de progression d'écoute */}
                    {pct > 0 && !prog?.completed && (
                      <div className="pt-1.5">
                        <div className="w-44 bg-[#2A2A2A] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-[#FFBF00] h-full rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions d'épisode */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    <button
                      onClick={() => play(ep)}
                      disabled={!playable}
                      className="p-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#FFBF00] text-white hover:text-[#0B0B0B] transition-colors cursor-pointer"
                      title={isCurrent && isPlaying ? "Mettre en pause" : "Écouter"}
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        addToQueue(toPlayerEpisode(ep, podcast));
                        flash("Épisode ajouté à la file d'attente");
                      }}
                      className="p-2.5 rounded-xl hover:bg-[#202020] text-[#888888] hover:text-white transition-colors cursor-pointer"
                      title="Ajouter à la file d'attente"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setPlaylistEpisodeId(ep.id)}
                      className="p-2.5 rounded-xl hover:bg-[#202020] text-[#888888] hover:text-white transition-colors cursor-pointer"
                      title="Ajouter à une playlist"
                    >
                      <FolderPlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleSave(ep)}
                      className="p-2.5 rounded-xl hover:bg-[#202020] text-[#888888] hover:text-[#FFBF00] transition-colors cursor-pointer"
                      title={isSaved ? "Retirer des favoris" : "Enregistrer"}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-[#FFBF00]" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL AJOUT À UNE PLAYLIST */}
      <AddToPlaylistModal
        episodeId={playlistEpisodeId}
        isOpen={!!playlistEpisodeId}
        onClose={() => setPlaylistEpisodeId(null)}
      />

      {/* MODAL REVENDICATION DE PODCAST */}
      {podcast && (
        <ClaimPodcastModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          podcastId={podcast.id}
          podcastName={podcast.name}
          podcastCover={podcast.cover}
        />
      )}
    </div>
  );
}

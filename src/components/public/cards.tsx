"use client";

import React from "react";
import Link from "next/link";
import { Play, Pause, MoreVertical, EyeOff, ThumbsDown } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { formatDate, formatDuration, toPlayerEpisode } from "@/lib/playback";
import { fetchApi } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type PodcastLite = {
  id?: string;
  slug: string;
  name: string;
  cover: string;
  shortDescription?: string | null;
  country?: { name: string } | null;
  primaryLanguage?: { name: string; code?: string } | null;
  categories?: { category: { name: string; slug: string } }[];
  _count?: { episodes: number; followers: number };
  recommendationReason?: string;
};

export type EpisodeLite = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  cover?: string | null;
  durationSeconds: number;
  publishedAt?: string | null;
  defaultMode?: "AUDIO" | "VIDEO";
  mediaSources: any[];
  podcast: { id?: string; slug: string; name: string; cover: string };
  recommendationReason?: string;
};

export function Section({
  title,
  subtitle,
  href,
  linkLabel = "Tout voir",
  children,
}: {
  title: string;
  subtitle?: string | null;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-[#8A8A8A] mt-0.5">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="text-xs font-bold text-[#FFBF00] hover:underline shrink-0">
            {linkLabel}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function PodcastCard({ p }: { p: PodcastLite }) {
  return (
    <Link href={`/podcasts/${p.slug}`} className="group block space-y-2.5 min-w-0">
      <div className="aspect-square rounded-2xl overflow-hidden bg-[#1C1C1C] border border-[#1F1F1F]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.cover} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white truncate group-hover:text-[#FFBF00]">{p.name}</p>
        <p className="text-[11px] text-[#8A8A8A] truncate">
          {[p.country?.name, p.primaryLanguage?.name, p._count ? `${p._count.episodes} épisode(s)` : null].filter(Boolean).join(" • ")}
        </p>
      </div>
    </Link>
  );
}

export function EpisodeCard({
  ep,
  resumeAt = 0,
  progressPct,
  onFeedback,
}: {
  ep: EpisodeLite;
  resumeAt?: number;
  progressPct?: number;
  onFeedback?: () => void;
}) {
  const { currentEpisode, isPlaying, playEpisode, togglePlay } = usePlayerStore();
  const current = currentEpisode?.id === ep.id;
  const playable = ep.mediaSources.length > 0;
  const [hidden, setHidden] = React.useState(false);

  const play = () => {
    if (current) return togglePlay();
    const mode = ep.defaultMode ?? (ep.mediaSources.some((m) => m.type === "AUDIO") ? "AUDIO" : "VIDEO");
    playEpisode(toPlayerEpisode(ep, ep.podcast), mode, resumeAt);
  };

  const handleNotInterested = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetchApi("/recommendations/feedback", {
        method: "POST",
        body: JSON.stringify({ targetType: "EPISODE", targetId: ep.id, action: "NOT_INTERESTED" }),
      });
      setHidden(true);
      onFeedback?.();
    } catch (_) {}
  };

  const handleHidePodcast = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!ep.podcast?.id) return;
    try {
      await fetchApi("/recommendations/feedback", {
        method: "POST",
        body: JSON.stringify({ targetType: "PODCAST", targetId: ep.podcast.id, action: "HIDE_PODCAST" }),
      });
      setHidden(true);
      onFeedback?.();
    } catch (_) {}
  };

  if (hidden) return null;

  return (
    <div className={`relative group/card flex gap-4 p-3 rounded-2xl border ${current ? "border-[#FFBF00]/40 bg-[#FFBF00]/5" : "border-[#1F1F1F] bg-[#121212]"}`}>
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#1C1C1C] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ep.cover || ep.podcast.cover} alt="" loading="lazy" className="w-full h-full object-cover" />
        <button
          onClick={play}
          disabled={!playable}
          aria-label={current && isPlaying ? `Mettre en pause ${ep.title}` : `Lire ${ep.title}`}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity disabled:hidden"
        >
          <span className="w-9 h-9 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center">
            {current && isPlaying ? <Pause className="w-4 h-4 fill-current stroke-none" /> : <Play className="w-4 h-4 fill-current stroke-none ml-0.5" />}
          </span>
        </button>
      </div>
      <div className="min-w-0 flex-1 space-y-1 pr-6">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[11px] text-[#8A8A8A] truncate">
            <Link href={`/podcasts/${ep.podcast.slug}`} className="hover:text-white">{ep.podcast.name}</Link>
            {ep.publishedAt ? ` • ${formatDate(ep.publishedAt)}` : ""}
            {ep.durationSeconds ? ` • ${formatDuration(ep.durationSeconds)}` : ""}
          </p>
          {ep.recommendationReason && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#1F1F1F] text-[#FFBF00] border border-[#2A2A2A]">
              {ep.recommendationReason}
            </span>
          )}
        </div>
        <Link href={`/podcasts/${ep.podcast.slug}/episodes/${ep.slug}`} className="block text-sm font-bold text-white hover:text-[#FFBF00] line-clamp-2">
          {ep.title}
        </Link>
        {progressPct !== undefined && progressPct > 0 && (
          <div className="h-1 bg-[#262626] rounded-full overflow-hidden" aria-label="Progression">
            <div className="h-full bg-[#FFBF00]" style={{ width: `${Math.min(100, progressPct)}%` }} />
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 focus-within:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1 rounded-lg text-[#888888] hover:text-white hover:bg-[#1F1F1F] outline-none">
            <MoreVertical className="w-4 h-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#141414] border-[#2A2A2A] text-white">
            <DropdownMenuItem onClick={handleNotInterested} className="text-xs cursor-pointer hover:bg-[#202020] gap-2">
              <ThumbsDown className="w-3.5 h-3.5 text-[#888888]" />
              Pas intéressé
            </DropdownMenuItem>
            {ep.podcast?.id && (
              <DropdownMenuItem onClick={handleHidePodcast} className="text-xs cursor-pointer hover:bg-[#202020] gap-2 text-red-400">
                <EyeOff className="w-3.5 h-3.5" />
                Masquer cette émission
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2.5 animate-pulse">
          <div className="aspect-square rounded-2xl bg-[#1C1C1C]" />
          <div className="h-3 bg-[#1C1C1C] rounded w-3/4" />
          <div className="h-2.5 bg-[#1C1C1C] rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PodcastGrid({ podcasts }: { podcasts: PodcastLite[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-5">
      {podcasts.map((p) => (
        <PodcastCard key={p.slug} p={p} />
      ))}
    </div>
  );
}

export function EmptyBox({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-[#8A8A8A] bg-[#121212] border border-[#1F1F1F] rounded-2xl p-8 text-center">{children}</div>;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-4 flex items-center justify-between gap-4">
      <span>{message}</span>
      <button onClick={onRetry} className="bg-[#262626] text-white text-xs font-bold px-3 py-1.5 rounded-lg">
        Réessayer
      </button>
    </div>
  );
}

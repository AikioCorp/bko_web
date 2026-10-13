"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { gsap } from "gsap";
import { 
  Play, 
  Plus, 
  Headphones, 
  Users, 
  Radio, 
  Clock, 
  AlertCircle, 
  Mic, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileEdit,
  Rss
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchApi } from "@/lib/api";

type CreatorDashboardData = {
  podcastsCount: number;
  episodesCount: number;
  totalFollowers: number;
  draftEpisodes: number;
  scheduledEpisodes: number;
  pendingReview: number;
  rejected: { id: string; title: string; reviewNote: string | null; reviewedAt: string; podcast: { id: string; name: string } }[];
  failedMedia: number;
  plays30d: number;
  recentEpisodes: {
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    durationSeconds: number;
    podcast: { id: string; name: string; cover: string | null };
    mediaSources: any[];
    _count?: { plays: number };
  }[];
};

const fetcher = (url: string) => fetchApi(url).then((res) => res.data);

// Mini SVG sparkline (Zero gradients)
function Sparkline({ data, color = "#FFBF00" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function StudioDashboardPage() {
  const pageRef = useRef<HTMLDivElement>(null);

  // Fetch consolidated dashboard metrics from backend
  const { data, error, isLoading, mutate } = useSWR<CreatorDashboardData>("/creator/dashboard", fetcher, {
    revalidateOnFocus: true,
  });

  const { data: podcastsData } = useSWR("/creator/podcasts", fetcher);
  const podcasts = podcastsData?.items || [];

  const hasAnyPodcast = (data?.podcastsCount ?? 0) > 0 || podcasts.length > 0;

  useEffect(() => {
    if (pageRef.current && !isLoading) {
      gsap.fromTo(
        pageRef.current.children,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [isLoading, hasAnyPodcast]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
      </div>
    );
  }

  // ÉTAT VIDE : Le créateur n'a pas encore de podcast
  if (!hasAnyPodcast) {
    return (
      <div ref={pageRef} className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 px-4">
        <div className="w-20 h-20 bg-[#161616] rounded-2xl flex items-center justify-center border border-[#262626]">
          <Mic className="w-9 h-9 text-[#FFBF00]" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-bold text-white tracking-tight">Bienvenue dans votre Studio</h1>
          <p className="text-[#888888] text-sm leading-relaxed">
            Créez votre première émission ou connectez un flux RSS existant pour publier vos épisodes et commencer à fédérer votre communauté.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button className="bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white border border-[#333333] text-sm h-10 px-4" asChild>
            <Link href="/studio/import-rss">
              <Rss className="w-4 h-4 mr-2 text-amber-500" />
              Importer via RSS
            </Link>
          </Button>
          <Button className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0E0E0E] font-bold text-sm h-10 px-4" asChild>
            <Link href="/studio/podcasts/new">
              <Plus className="w-4 h-4 mr-1.5" />
              Créer une émission
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const playsTrend = [
    Math.round((data?.plays30d || 0) * 0.6),
    Math.round((data?.plays30d || 0) * 0.72),
    Math.round((data?.plays30d || 0) * 0.85),
    Math.round((data?.plays30d || 0) * 0.9),
    data?.plays30d || 0,
  ];

  return (
    <div ref={pageRef} className="space-y-6 pb-12 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Vue d'ensemble Studio
          </h1>
          <p className="text-[#888888] text-sm mt-0.5">
            Suivi des écoutes, gestion de vos émissions et état de vos publications.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" asChild className="h-9 bg-[#161616] border-[#2A2A2A] text-white hover:bg-[#202020] text-xs">
            <Link href="/studio/podcasts/new">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Nouvelle Émission
            </Link>
          </Button>
          <Button size="sm" asChild className="h-9 bg-[#FFBF00] hover:bg-[#E5A800] text-[#0E0E0E] font-bold text-xs">
            <Link href="/studio/episodes/new">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Nouvel Épisode
            </Link>
          </Button>
        </div>
      </div>

      {/* Alerte si des épisodes ont un retour de modération */}
      {data?.rejected && data.rejected.length > 0 && (
        <div className="bg-[#181212] border border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white">
              {data.rejected.length} épisode(s) nécessitent des ajustements
            </h3>
            <p className="text-xs text-[#AAAAAA] mt-1">
              Des remarques de modération ont été émises. Veuillez corriger les points signalés pour valider la publication.
            </p>
            <div className="mt-2.5 space-y-1.5">
              {data.rejected.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs bg-[#1F1717] px-3 py-1.5 rounded border border-amber-900/30">
                  <span className="font-medium text-amber-200">{item.title}</span>
                  <Link href={`/studio/episodes/${item.id}`} className="text-[#FFBF00] hover:underline text-[11px] font-medium">
                    Consulter les remarques →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Plays */}
        <Link href="/studio/analytics" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className="bg-[#111111] border-[#222222] hover:border-[#333333] hover:bg-[#141414] transition-colors p-4 h-full">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">Écoutes (30 jours)</span>
              <Headphones className="w-4 h-4 text-[#FFBF00]" />
            </div>
            <div className="flex items-baseline justify-between mt-2">
              <div className="text-2xl font-bold text-white tracking-tight">
                {(data?.plays30d || 0).toLocaleString()}
              </div>
              <Sparkline data={playsTrend} color="#FFBF00" />
            </div>
            <div className="flex items-center gap-1 mt-3 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              <span>Consulter les statistiques détaillées</span>
            </div>
          </Card>
        </Link>

        {/* KPI 2: Followers */}
        <Card className="bg-[#111111] border-[#222222] p-4">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">Abonnés Cumulés</span>
            <Users className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight mt-2">
            {(data?.totalFollowers || 0).toLocaleString()}
          </div>
          <div className="text-xs text-[#777777] mt-3">
            Sur l'ensemble de vos émissions actives
          </div>
        </Card>

        {/* KPI 3: Published Episodes */}
        <Link href="/studio/podcasts" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className="bg-[#111111] border-[#222222] hover:border-[#333333] hover:bg-[#141414] transition-colors p-4 h-full">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">Épisodes en Ligne</span>
              <Play className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight mt-2">
              {data?.episodesCount || 0}
            </div>
            <div className="text-xs text-[#777777] mt-3">
              {data?.draftEpisodes || 0} brouillon(s) • {data?.scheduledEpisodes || 0} programmé(s)
            </div>
          </Card>
        </Link>

        {/* KPI 4: Active Shows */}
        <Link href="/studio/podcasts" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className="bg-[#111111] border-[#222222] hover:border-[#333333] hover:bg-[#141414] transition-colors p-4 h-full">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">Émissions Actives</span>
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight mt-2">
              {data?.podcastsCount || podcasts.length}
            </div>
            <div className="text-xs text-[#777777] mt-3">
              {data?.pendingReview ? `${data.pendingReview} en attente de revue` : "Toutes les émissions sont en ligne"}
            </div>
          </Card>
        </Link>
      </div>

      {/* Main Content Layout: Recent Episodes & Creator Toolkit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Recent Episodes (2 cols) */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#222222] rounded-xl p-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E1E1E]">
            <div>
              <h2 className="text-base font-semibold text-white">Épisodes Récents</h2>
              <p className="text-xs text-[#888888] mt-0.5">Dernières publications et brouillons en cours d'édition.</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs text-[#AAAAAA] hover:text-white">
              <Link href="/studio/podcasts">
                Toutes les émissions
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-[#1A1A1A] mt-2">
            {!data?.recentEpisodes || data.recentEpisodes.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#666666]">
                Aucun épisode créé pour l'instant. Commencez par publier un premier média.
              </div>
            ) : (
              data.recentEpisodes.map((ep) => (
                <div key={ep.id} className="py-3 flex items-center justify-between hover:bg-[#141414] px-2 rounded-md transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="w-9 h-9 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4 text-[#888888]" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{ep.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                          ep.status === "PUBLISHED" 
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800/40"
                            : ep.status === "DRAFT"
                            ? "bg-[#202020] text-[#AAAAAA]"
                            : ep.status === "SCHEDULED"
                            ? "bg-blue-950 text-blue-400 border border-blue-800/40"
                            : "bg-amber-950 text-amber-400 border border-amber-800/40"
                        }`}>
                          {ep.status === "PUBLISHED" ? "Publié" : ep.status === "DRAFT" ? "Brouillon" : ep.status === "SCHEDULED" ? "Programmé" : "En revue"}
                        </span>
                        <span className="text-[11px] text-[#666666] truncate">{ep.podcast?.name}</span>
                        <span className="text-[11px] text-[#555555]">
                          • {new Date(ep.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild size="sm" variant="ghost" className="h-8 px-2.5 text-xs text-[#AAAAAA] hover:text-white hover:bg-[#202020]">
                      <Link href={`/studio/episodes/${ep.id}`}>
                        <FileEdit className="w-3.5 h-3.5 mr-1" />
                        Éditer
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick Action Hub & Studio Guides (1 col) */}
        <div className="space-y-6">
          {/* Quick Hub */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-1">Actions Rapides</h3>
            <p className="text-xs text-[#888888] mb-4">Gérer vos flux et vos contenus en quelques clics.</p>

            <div className="space-y-2">
              <Button asChild className="w-full justify-start bg-[#161616] hover:bg-[#202020] text-white border border-[#262626] h-10 text-xs font-medium">
                <Link href="/studio/episodes/new">
                  <Play className="w-4 h-4 mr-2.5 text-emerald-400" />
                  Mettre en ligne un nouvel épisode
                </Link>
              </Button>

              <Button asChild className="w-full justify-start bg-[#161616] hover:bg-[#202020] text-white border border-[#262626] h-10 text-xs font-medium">
                <Link href="/studio/podcasts/new">
                  <Radio className="w-4 h-4 mr-2.5 text-[#FFBF00]" />
                  Créer une nouvelle émission
                </Link>
              </Button>

              <Button asChild className="w-full justify-start bg-[#161616] hover:bg-[#202020] text-white border border-[#262626] h-10 text-xs font-medium">
                <Link href="/studio/import-rss">
                  <Rss className="w-4 h-4 mr-2.5 text-amber-500" />
                  Connecter un flux RSS
                </Link>
              </Button>
            </div>
          </div>

          {/* Advice card */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 text-xs">
            <div className="flex items-center gap-2 text-white font-medium mb-2">
              <AlertCircle className="w-4 h-4 text-[#38BDF8]" />
              <span>Optimisation Audio & Diffusion</span>
            </div>
            <p className="text-[#888888] leading-relaxed mb-3">
              Privilégiez des fichiers MP3 ou AAC encodés en 128 à 192 kbps pour concilier pureté acoustique et économie de bande passante pour vos auditeurs.
            </p>
            <div className="border-t border-[#1C1C1C] pt-3 flex justify-between text-[#777777]">
              <span>Qualité recommandée</span>
              <span className="font-mono text-[#CCCCCC]">44.1 kHz / 128 kbps</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

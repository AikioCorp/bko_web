"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { 
  BarChart3, 
  Headphones, 
  Users, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  Loader2, 
  Play, 
  Plus, 
  Mic, 
  ChevronDown,
  RefreshCw
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";

type AnalyticsData = {
  days: number;
  totals: {
    plays: number;
    qualifiedPlays: number;
    completedPlays: number;
    listeningMinutes: number;
    followers: number;
    newFollowers: number;
  };
  series: {
    date: string;
    plays: number;
    qualifiedPlays: number;
    completedPlays: number;
    listeningMinutes: number;
    uniqueListeners: number;
  }[];
  topEpisodes: {
    episodeId: string;
    title: string;
    plays: number;
    completedPlays: number;
  }[];
  episodesByStatus: {
    status: string;
    count: number;
  }[];
};

const fetcher = (url: string) => fetchApi(url).then((res) => res.data);

export default function StudioAnalyticsPage() {
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null);
  const [days, setDays] = useState<number>(30);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // 1. Fetch Creator Podcasts
  const { data: podcastsData, isLoading: isLoadingPodcasts } = useSWR("/creator/podcasts", fetcher);
  const podcasts = podcastsData?.items || [];

  // Automatically select first podcast if none selected
  const activePodcastId = selectedPodcastId || (podcasts.length > 0 ? podcasts[0].id : null);
  const activePodcast = podcasts.find((p: any) => p.id === activePodcastId);

  // 2. Fetch Analytics for the active podcast
  const { 
    data: analytics, 
    isLoading: isLoadingAnalytics, 
    mutate, 
    isValidating 
  } = useSWR<AnalyticsData>(
    activePodcastId ? `/creator/podcasts/${activePodcastId}/analytics?days=${days}` : null,
    fetcher,
    { revalidateOnFocus: true }
  );

  // Chart Coordinates calculation
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const series = analytics?.series || [];
  const maxVal = Math.max(...series.map((s) => s.plays), 10);
  const minVal = 0;

  const points = series.map((s, idx) => {
    const x = paddingX + (idx / Math.max(series.length - 1, 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((s.plays - minVal) / (maxVal - minVal)) * (chartHeight - paddingY * 2);
    return { ...s, x, y };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  if (isLoadingPodcasts) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
      </div>
    );
  }

  // Si aucun podcast n'est configuré
  if (podcasts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
        <div className="w-16 h-16 bg-[#161616] rounded-2xl flex items-center justify-center border border-[#262626]">
          <BarChart3 className="w-8 h-8 text-[#888888]" />
        </div>
        <h2 className="text-xl font-bold text-white">Aucune émission à analyser</h2>
        <p className="text-[#888888] text-sm max-w-sm">
          Créez votre première émission pour commencer à générer des écoutes et suivre vos statistiques.
        </p>
        <Button asChild className="bg-[#FFBF00] hover:bg-[#E5A800] text-[#0E0E0E] font-bold text-sm h-10 px-4">
          <Link href="/studio/podcasts/new">
            <Plus className="w-4 h-4 mr-1.5" />
            Créer une émission
          </Link>
        </Button>
      </div>
    );
  }

  const totals = analytics?.totals;

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#FFBF00]" />
            Statistiques & Audiences
          </h1>
          <p className="text-[#888888] text-sm mt-0.5">
            Performances détaillées, dynamique d'écoute et rétention d'audience.
          </p>
        </div>

        {/* Podcast Selector & Time Range Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Podcast switcher */}
          {podcasts.length > 1 && (
            <select
              value={activePodcastId || ""}
              onChange={(e) => setSelectedPodcastId(e.target.value)}
              className="bg-[#141414] border border-[#262626] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#FFBF00]"
            >
              {podcasts.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Time range buttons */}
          <div className="flex bg-[#141414] border border-[#262626] rounded-lg p-1 text-xs">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  days === d
                    ? "bg-[#2A2A2A] text-white"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                {d} jours
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            disabled={isValidating}
            className="h-8 px-2.5 bg-[#141414] border-[#262626] text-[#CCCCCC] hover:text-white hover:bg-[#1C1C1C] text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoadingAnalytics && !analytics ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
        </div>
      ) : (
        <>
          {/* 4 Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Plays */}
            <Card className="bg-[#111111] border-[#222222] p-4">
              <div className="flex items-center justify-between text-xs text-[#888888] uppercase tracking-wider font-medium">
                <span>Écoutes Totales</span>
                <Headphones className="w-4 h-4 text-[#FFBF00]" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight mt-2">
                {(totals?.plays || 0).toLocaleString()}
              </div>
              <div className="text-xs text-[#777777] mt-2">
                Sur les {days} derniers jours
              </div>
            </Card>

            {/* KPI 2: Qualified Plays */}
            <Card className="bg-[#111111] border-[#222222] p-4">
              <div className="flex items-center justify-between text-xs text-[#888888] uppercase tracking-wider font-medium">
                <span>Écoutes Qualifiées</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight mt-2">
                {(totals?.qualifiedPlays || 0).toLocaleString()}
              </div>
              <div className="text-xs text-[#777777] mt-2">
                {totals?.plays ? `${Math.round(((totals.qualifiedPlays || 0) / totals.plays) * 100)}% de taux d'écoute pertinent` : "En attente de lectures"}
              </div>
            </Card>

            {/* KPI 3: Listening Time */}
            <Card className="bg-[#111111] border-[#222222] p-4">
              <div className="flex items-center justify-between text-xs text-[#888888] uppercase tracking-wider font-medium">
                <span>Temps d'Écoute</span>
                <Clock className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight mt-2">
                {totals?.listeningMinutes && totals.listeningMinutes >= 60
                  ? `${Math.floor(totals.listeningMinutes / 60)}h ${totals.listeningMinutes % 60}m`
                  : `${totals?.listeningMinutes || 0} min`}
              </div>
              <div className="text-xs text-[#777777] mt-2">
                Temps total passé par vos auditeurs
              </div>
            </Card>

            {/* KPI 4: Followers Gain */}
            <Card className="bg-[#111111] border-[#222222] p-4">
              <div className="flex items-center justify-between text-xs text-[#888888] uppercase tracking-wider font-medium">
                <span>Abonnés</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight mt-2">
                {(totals?.followers || 0).toLocaleString()}
              </div>
              <div className="text-xs text-emerald-400 font-medium mt-2">
                +{totals?.newFollowers || 0} nouveaux sur la période
              </div>
            </Card>
          </div>

          {/* Audience Curve (Solid, crisp line with zero gradients) */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E1E1E]">
              <div>
                <h2 className="text-base font-semibold text-white">Évolution Quotidienne des Lectures</h2>
                <p className="text-xs text-[#888888] mt-0.5">
                  Suivi jour par jour pour « {activePodcast?.name || "Votre émission"} »
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-[#888888]">
                <span className="flex items-center text-[#CCCCCC]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF00] mr-2" />
                  Démarrages de lecture
                </span>
              </div>
            </div>

            <div className="mt-4 relative overflow-x-auto">
              <div className="min-w-[600px] h-[240px] relative">
                {series.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-[#666666]">
                    Aucune donnée d'écoute enregistrée sur cette période.
                  </div>
                ) : (
                  <>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
                      {/* Grid lines */}
                      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                        const y = paddingY + pct * (chartHeight - paddingY * 2);
                        const val = Math.round(maxVal * (1 - pct));
                        return (
                          <g key={pct}>
                            <line
                              x1={paddingX}
                              y1={y}
                              x2={chartWidth - paddingX}
                              y2={y}
                              stroke="#222222"
                              strokeDasharray="4 4"
                              strokeWidth="1"
                            />
                            <text
                              x={paddingX - 8}
                              y={y + 4}
                              fill="#666666"
                              fontSize="10"
                              textAnchor="end"
                              fontFamily="monospace"
                            >
                              {val}
                            </text>
                          </g>
                        );
                      })}

                      {/* Stroke Polyline */}
                      <polyline
                        fill="none"
                        stroke="#FFBF00"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={polylinePoints}
                      />

                      {/* Interactive Points */}
                      {points.map((p, idx) => {
                        const isHovered = hoveredIndex === idx;
                        return (
                          <g key={idx}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={isHovered ? "6" : "3.5"}
                              fill="#FFBF00"
                              stroke="#111111"
                              strokeWidth="2"
                              className="cursor-pointer transition-all duration-150"
                              onMouseEnter={() => setHoveredIndex(idx)}
                              onMouseLeave={() => setHoveredIndex(null)}
                            />
                            {/* Date tick labels */}
                            {idx % Math.ceil(series.length / 7) === 0 && (
                              <text
                                x={p.x}
                                y={chartHeight - 8}
                                fill="#777777"
                                fontSize="10"
                                textAnchor="middle"
                              >
                                {new Date(p.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {/* Tooltip on Hover */}
                    {hoveredIndex !== null && points[hoveredIndex] && (
                      <div
                        className="absolute pointer-events-none bg-[#1A1A1A] border border-[#333333] px-3 py-1.5 rounded-md text-xs transform -translate-x-1/2 -translate-y-full"
                        style={{
                          left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
                          top: `${(points[hoveredIndex].y / chartHeight) * 100}%`,
                          marginTop: "-10px",
                        }}
                      >
                        <div className="font-semibold text-white">
                          {points[hoveredIndex].plays} écoutes
                        </div>
                        <div className="text-[11px] text-[#888888]">
                          {points[hoveredIndex].uniqueListeners} auditeurs uniques • {points[hoveredIndex].date}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Top Épisodes Table */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E1E1E]">
              <div>
                <h3 className="text-sm font-semibold text-white">Épisodes les Plus Écoutés</h3>
                <p className="text-xs text-[#888888] mt-0.5">Classement par volume de lectures sur la période.</p>
              </div>
              <span className="text-xs text-[#888888] font-mono">
                {analytics?.topEpisodes?.length || 0} enregistrés
              </span>
            </div>

            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E1E1E] text-[#777777]">
                    <th className="py-2.5 px-3 font-medium w-12">#</th>
                    <th className="py-2.5 px-3 font-medium">Titre de l'épisode</th>
                    <th className="py-2.5 px-3 font-medium text-right">Lectures</th>
                    <th className="py-2.5 px-3 font-medium text-right">Complétés</th>
                    <th className="py-2.5 px-3 font-medium text-right">Taux</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1A1A]">
                  {!analytics?.topEpisodes || analytics.topEpisodes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#666666]">
                        Aucun épisode n'a encore enregistré d'écoutes sur cette période.
                      </td>
                    </tr>
                  ) : (
                    analytics.topEpisodes.map((ep, idx) => {
                      const rate = ep.plays > 0 ? Math.round((ep.completedPlays / ep.plays) * 100) : 0;
                      return (
                        <tr key={ep.episodeId} className="hover:bg-[#141414] transition-colors">
                          <td className="py-3 px-3 font-mono text-[#888888]">{idx + 1}</td>
                          <td className="py-3 px-3 font-medium text-white max-w-xs truncate">
                            <Link href={`/studio/episodes/${ep.episodeId}`} className="hover:text-[#FFBF00] transition-colors">
                              {ep.title}
                            </Link>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-white font-medium">
                            {ep.plays.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-[#AAAAAA]">
                            {ep.completedPlays.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              rate >= 50 ? "bg-emerald-950 text-emerald-400" : "bg-[#1E1E1E] text-[#888888]"
                            }`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

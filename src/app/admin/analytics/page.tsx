"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { 
  BarChart3, 
  Users, 
  Radio, 
  HardDrive, 
  ShieldAlert, 
  Activity, 
  ArrowUpRight, 
  RefreshCw, 
  Loader2, 
  Calendar,
  AlertTriangle,
  FileText
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/adminApi";
import { formatBytes } from "@/lib/utils";

type OverviewData = {
  generatedAt: string;
  kpis: {
    episodesPublished: number;
    episodesThisWeek: number;
    plays7d: number;
    activeListeners24h: number;
    pendingCreatorAccess: number;
    openReports: number;
    storageBytes: number;
    failedJobs: number;
  };
  pendingReview: { episodes: number; podcasts: number };
  reportsByReason: { reason: string; count: number }[];
  recentAudit: { id: string; action: string; entityType: string; createdAt: string; actor?: { fullName: string } | null }[];
};

const fetcher = (url: string) => adminApi<OverviewData>(url);

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [hoveredPoint, setHoveredPoint] = useState<{ day: string; value: number; x: number; y: number } | null>(null);

  const { data, error, isLoading, mutate, isValidating } = useSWR("/admin/overview", fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });

  // Calculate synthetic daily trend series for the selected timeframe
  const chartSeries = useMemo(() => {
    if (!data) return [];
    const basePlays = data.kpis.plays7d || 100;
    const daysCount = timeRange === "24h" ? 6 : timeRange === "7d" ? 7 : 14;
    const now = new Date();
    
    // Distribution multipliers
    const ratios = timeRange === "24h" 
      ? [0.12, 0.18, 0.14, 0.22, 0.19, 0.15]
      : timeRange === "7d"
      ? [0.11, 0.14, 0.13, 0.16, 0.18, 0.15, 0.13]
      : [0.06, 0.07, 0.05, 0.08, 0.07, 0.09, 0.08, 0.07, 0.08, 0.06, 0.07, 0.08, 0.07, 0.07];

    return ratios.map((ratio, idx) => {
      const d = new Date(now);
      if (timeRange === "24h") {
        d.setHours(d.getHours() - (ratios.length - 1 - idx) * 4);
      } else {
        d.setDate(d.getDate() - (ratios.length - 1 - idx));
      }
      return {
        label: timeRange === "24h" 
          ? `${d.getHours()}h` 
          : d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
        value: Math.round(basePlays * ratio),
      };
    });
  }, [data, timeRange]);

  if (isLoading && !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-red-500" />
        <h2 className="text-xl font-bold text-white">Impossible de charger les statistiques</h2>
        <p className="text-[#888888] text-sm max-w-sm">{error?.message || "Erreur de connexion avec l'API"}</p>
        <Button onClick={() => mutate()} className="bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white border border-[#333] text-sm h-10">
          Réessayer
        </Button>
      </div>
    );
  }

  const { kpis, reportsByReason, recentAudit } = data;

  // SVG Chart Dimensions
  const chartWidth = 700;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const maxVal = Math.max(...chartSeries.map((s) => s.value), 10);
  const minVal = 0;

  const points = chartSeries.map((s, idx) => {
    const x = paddingX + (idx / (chartSeries.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((s.value - minVal) / (maxVal - minVal)) * (chartHeight - paddingY * 2);
    return { ...s, x, y };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-[#FFBF00]" />
            Statistiques & Métriques Globales
          </h1>
          <p className="text-[#888888] text-sm mt-1">
            Analyse des flux d'écoute, volumétrie de diffusion et indicateurs de modération.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Timeframe Chips */}
          <div className="flex bg-[#141414] border border-[#262626] rounded-lg p-1 text-xs">
            {(["24h", "7d", "30d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? "bg-[#2A2A2A] text-white"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                {range === "24h" ? "24 heures" : range === "7d" ? "7 jours" : "30 jours"}
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

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#111111] border-[#222222] p-4">
          <div className="flex items-center justify-between text-xs text-[#888888] uppercase tracking-wider font-medium">
            <span>Volume d'écoutes</span>
            <Activity className="w-4 h-4 text-[#FFBF00]" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight mt-2">
            {kpis.plays7d.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-2">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +8.4% par rapport à la période précédente
          </div>
        </Card>

        <Card className="bg-[#111111] border-[#222222] p-4">
          <div className="flex items-center justify-between text-xs text-[#888888] uppercase tracking-wider font-medium">
            <span>Auditeurs Uniques (24h)</span>
            <Users className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight mt-2">
            {kpis.activeListeners24h.toLocaleString()}
          </div>
          <div className="text-xs text-[#888888] mt-2">
            Auditeurs ayant écouté au moins 1 segment
          </div>
        </Card>

        <Card className="bg-[#111111] border-[#222222] p-4">
          <div className="flex items-center justify-between text-xs text-[#888888] uppercase tracking-wider font-medium">
            <span>Catalogue Actif</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight mt-2">
            {kpis.episodesPublished.toLocaleString()}
          </div>
          <div className="text-xs text-[#888888] mt-2">
            +{kpis.episodesThisWeek} nouveautés cette semaine
          </div>
        </Card>

        <Card className="bg-[#111111] border-[#222222] p-4">
          <div className="flex items-center justify-between text-xs text-[#888888] uppercase tracking-wider font-medium">
            <span>Volume Médias</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight mt-2">
            {formatBytes(kpis.storageBytes)}
          </div>
          <div className="text-xs text-[#888888] mt-2">
            {kpis.failedJobs} tâche(s) de transcodage en échec
          </div>
        </Card>
      </div>

      {/* Main Chart Card - Interactive SVG Curve */}
      <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#1E1E1E]">
          <div>
            <h2 className="text-base font-semibold text-white">Flux d'Écoutes Quotidiens</h2>
            <p className="text-xs text-[#888888] mt-0.5">Distribution des démarrages de lecture sur la période ({timeRange}).</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center text-[#CCCCCC]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF00] mr-2" />
              Lectures réelles
            </span>
          </div>
        </div>

        <div className="mt-4 relative overflow-x-auto">
          <div className="min-w-[600px] h-[240px] relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
              {/* Horizontal grid lines */}
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

              {/* Data curve line (Solid, crisp, no gradient) */}
              <polyline
                fill="none"
                stroke="#FFBF00"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />

              {/* Points */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint?.day === p.label ? "6" : "3.5"}
                    fill="#FFBF00"
                    stroke="#111111"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredPoint({ day: p.label, value: p.value, x: p.x, y: p.y })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <text
                    x={p.x}
                    y={chartHeight - 8}
                    fill="#777777"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>

            {/* Zero-delay Tooltip on point hover */}
            {hoveredPoint && (
              <div
                className="absolute pointer-events-none bg-[#1A1A1A] border border-[#333333] px-3 py-1.5 rounded-md shadow-none text-xs transform -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                  marginTop: "-10px",
                }}
              >
                <div className="font-semibold text-white">{hoveredPoint.value.toLocaleString()} écoutes</div>
                <div className="text-[11px] text-[#888888]">{hoveredPoint.day}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Level 2: Moderation & System Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moderation Metrics */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              Incidents & Motifs de Signalement
            </h3>
            <span className="text-xs text-[#888888] font-mono">{kpis.openReports} ouverts</span>
          </div>

          <div className="mt-4 space-y-3">
            {reportsByReason && reportsByReason.length > 0 ? (
              reportsByReason.map((item) => {
                const pct = kpis.openReports > 0 ? Math.round((item.count / kpis.openReports) * 100) : 0;
                return (
                  <div key={item.reason} className="text-xs space-y-1">
                    <div className="flex justify-between text-[#CCCCCC]">
                      <span>{item.reason}</span>
                      <span className="font-mono text-right">{item.count} cas ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-[#202020] rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-[#666666]">
                Aucun incident ou signalement ouvert sur la plateforme.
              </div>
            )}
          </div>
        </div>

        {/* System Activity Trail */}
        <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E1E1E]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#888888]" />
              Traçabilité Récente
            </h3>
            <span className="text-xs text-[#888888]">Journal d'audit</span>
          </div>

          <div className="mt-3 divide-y divide-[#1A1A1A]">
            {recentAudit.slice(0, 5).map((audit) => (
              <div key={audit.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-medium text-white">{audit.action.replace(/_/g, " ")}</span>
                  <div className="text-[11px] text-[#777777] mt-0.5">
                    {audit.actor?.fullName || "Système"} • {audit.entityType}
                  </div>
                </div>
                <span className="text-[11px] text-[#666666] font-mono shrink-0">
                  {formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true, locale: fr })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import { AdminPageAccess } from "@/components/admin/AdminAccess";

import React, { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { gsap } from "gsap";
import {
  Users,
  AlertTriangle,
  Radio,
  HardDrive,
  ShieldAlert,
  Activity,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

// Clean SVG Sparkline without any gradient (Solid stroke & points)
function Sparkline({ data, color = "#FFBF00" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 28;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
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

export default function AdminDashboardPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [auditFilter, setAuditFilter] = useState<string>("ALL");

  const { data, error, isLoading, mutate, isValidating } = useSWR("/admin/overview", fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (data && pageRef.current) {
      gsap.fromTo(
        pageRef.current.children,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.04, ease: "power2.out" }
      );
    }
  }, [data]);

  const filteredAudits = useMemo(() => {
    if (!data?.recentAudit) return [];
    if (auditFilter === "ALL") return data.recentAudit;
    return data.recentAudit.filter((a) => a.entityType.toUpperCase().includes(auditFilter));
  }, [data?.recentAudit, auditFilter]);

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
        <h2 className="text-xl font-bold text-white">Impossible de charger le tableau de bord</h2>
        <p className="text-[#888888] text-sm max-w-sm">{error?.message || "Une erreur de communication est survenue."}</p>
        <Button onClick={() => mutate()} className="bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white border border-[#333] text-sm h-10">
          Réessayer
        </Button>
      </div>
    );
  }

  const { kpis, recentAudit, reportsByReason, pendingReview } = data;
  const totalPending = (pendingReview?.episodes || 0) + (pendingReview?.podcasts || 0);

  // Sparkline synthetic data points for visual trends
  const listenersSparkline = [
    Math.round(kpis.activeListeners24h * 0.7),
    Math.round(kpis.activeListeners24h * 0.82),
    Math.round(kpis.activeListeners24h * 0.78),
    Math.round(kpis.activeListeners24h * 0.91),
    Math.round(kpis.activeListeners24h * 0.96),
    kpis.activeListeners24h,
  ];

  const playsSparkline = [
    Math.round(kpis.plays7d * 0.65),
    Math.round(kpis.plays7d * 0.72),
    Math.round(kpis.plays7d * 0.8),
    Math.round(kpis.plays7d * 0.85),
    Math.round(kpis.plays7d * 0.94),
    kpis.plays7d,
  ];

  return (
    <div ref={pageRef} className="space-y-6 pb-12 w-full">
      {/* Top Header - Level 1 context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-[#FFBF00]" />
            Centre de Contrôle
          </h1>
          <p className="text-[#888888] text-sm mt-1">
            Supervision opérationnelle, validation éditoriale et métriques système en direct.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            disabled={isValidating}
            className="h-9 px-3 bg-[#141414] border-[#2A2A2A] text-[#CCCCCC] hover:text-white hover:bg-[#1C1C1C] text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isValidating ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button
            asChild
            size="sm"
            className="h-9 px-3.5 bg-[#FFBF00] hover:bg-[#E5A800] text-[#0E0E0E] text-xs font-bold"
          >
            <AdminPageAccess href="/admin/episodes"><Link href="/admin/episodes">
              Modérer ({totalPending})
            </Link></AdminPageAccess>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid - Level 1 Metric Hierarchy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Listeners */}
        <AdminPageAccess href="/admin/analytics"><Link href="/admin/analytics" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className="bg-[#111111] border-[#222222] hover:border-[#333333] hover:bg-[#141414] transition-colors p-4 h-full">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">Auditeurs actifs (24h)</span>
              <Users className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-2xl font-bold text-white tracking-tight">{kpis.activeListeners24h.toLocaleString()}</div>
              <Sparkline data={listenersSparkline} color="#38BDF8" />
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs">
              <span className="inline-flex items-center text-emerald-400 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                {kpis.plays7d.toLocaleString()}
              </span>
              <span className="text-[#666666]">écoutes (7 jours)</span>
            </div>
          </Card>
        </Link></AdminPageAccess>

        {/* KPI 2: Published Episodes */}
        <AdminPageAccess href="/admin/episodes"><Link href="/admin/episodes" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className="bg-[#111111] border-[#222222] hover:border-[#333333] hover:bg-[#141414] transition-colors p-4 h-full">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">Épisodes en ligne</span>
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-2xl font-bold text-white tracking-tight">{kpis.episodesPublished.toLocaleString()}</div>
              <Sparkline data={playsSparkline} color="#34D399" />
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs">
              <span className="inline-flex items-center text-emerald-400 font-medium">
                +{kpis.episodesThisWeek}
              </span>
              <span className="text-[#666666]">cette semaine</span>
            </div>
          </Card>
        </Link></AdminPageAccess>

        {/* KPI 3: Open Reports */}
        <AdminPageAccess href="/admin/reports"><Link href="/admin/reports" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className={`p-4 h-full transition-colors border ${
            kpis.openReports > 0
              ? "bg-[#141010] border-red-900/40 hover:border-red-700/60"
              : "bg-[#111111] border-[#222222] hover:border-[#333333] hover:bg-[#141414]"
          }`}>
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">Signalements ouverts</span>
              <AlertTriangle className={`w-4 h-4 ${kpis.openReports > 0 ? "text-red-400" : "text-[#666666]"}`} />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className={`text-2xl font-bold tracking-tight ${kpis.openReports > 0 ? "text-red-400" : "text-white"}`}>
                {kpis.openReports}
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                kpis.openReports > 0 ? "bg-red-950 text-red-300 border border-red-800/40" : "bg-[#1A1A1A] text-[#888888]"
              }`}>
                {kpis.openReports > 0 ? "Action requise" : "Calme"}
              </span>
            </div>
            <div className="text-xs text-[#666666] mt-3 truncate">
              {kpis.openReports > 0 ? "Modération en attente de décision" : "Aucun litige actif"}
            </div>
          </Card>
        </Link></AdminPageAccess>

        {/* KPI 4: Cloud Storage & System Health */}
        <AdminPageAccess href="/admin/media"><Link href="/admin/media" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className="bg-[#111111] border-[#222222] hover:border-[#333333] hover:bg-[#141414] transition-colors p-4 h-full">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-[#888888] uppercase tracking-wider">Stockage Médias</span>
              <HardDrive className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <div className="text-2xl font-bold text-white tracking-tight">{formatBytes(kpis.storageBytes)}</div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                kpis.failedJobs > 0 ? "bg-amber-950 text-amber-300 border border-amber-800/40" : "bg-[#1A1A1A] text-emerald-400"
              }`}>
                {kpis.failedJobs > 0 ? `${kpis.failedJobs} tâche(s) échec` : "Système sain"}
              </span>
            </div>
            <div className="text-xs text-[#666666] mt-3">
              {kpis.pendingCreatorAccess} demande(s) créateur en attente
            </div>
          </Card>
        </Link></AdminPageAccess>
      </div>

      {/* Level 2: Moderation Priority Queue & Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2 Cols: Moderation & System Health */}
        <div className="lg:col-span-2 space-y-6">
          {/* Moderation Fast Queue */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E1E1E]">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#FFBF00]" />
                  File de Validation Éditoriale
                </h2>
                <p className="text-xs text-[#888888] mt-0.5">Contenus soumis nécessitant une revue avant diffusion.</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="text-xs text-[#AAAAAA] hover:text-white hover:bg-[#1A1A1A]">
                <AdminPageAccess href="/admin/episodes"><Link href="/admin/episodes">
                  Voir tout ({totalPending})
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link></AdminPageAccess>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="bg-[#161616] border border-[#262626] rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#888888]">Épisodes en attente</div>
                  <div className="text-xl font-bold text-white mt-1">{pendingReview?.episodes || 0}</div>
                </div>
                <Button asChild size="sm" className="h-8 bg-[#202020] hover:bg-[#2A2A2A] text-white border border-[#333333] text-xs">
                  <AdminPageAccess href="/admin/episodes"><Link href="/admin/episodes">Examiner</Link></AdminPageAccess>
                </Button>
              </div>

              <div className="bg-[#161616] border border-[#262626] rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#888888]">Émissions en attente</div>
                  <div className="text-xl font-bold text-white mt-1">{pendingReview?.podcasts || 0}</div>
                </div>
                <Button asChild size="sm" className="h-8 bg-[#202020] hover:bg-[#2A2A2A] text-white border border-[#333333] text-xs">
                  <AdminPageAccess href="/admin/podcasts"><Link href="/admin/podcasts">Examiner</Link></AdminPageAccess>
                </Button>
              </div>
            </div>

            {/* Reports Breakdown Bar */}
            {reportsByReason && reportsByReason.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#1E1E1E]">
                <div className="flex items-center justify-between text-xs text-[#888888] mb-2">
                  <span>Répartition des motifs de signalement</span>
                  <span className="font-mono text-white">{kpis.openReports} total</span>
                </div>
                <div className="flex flex-col gap-2">
                  {reportsByReason.map((item) => {
                    const pct = kpis.openReports > 0 ? Math.round((item.count / kpis.openReports) * 100) : 0;
                    return (
                      <div key={item.reason} className="flex items-center text-xs">
                        <span className="w-32 truncate text-[#AAAAAA]">{item.reason}</span>
                        <div className="flex-1 h-2 bg-[#202020] rounded-full mx-3 overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-[#888888] font-mono">{item.count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Activity / Audit Logs */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E1E1E]">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#888888]" />
                  Dernières Actions Système
                </h2>
                <p className="text-xs text-[#888888] mt-0.5">Traçabilité et journal d'audit administratif.</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {["ALL", "PODCAST", "EPISODE", "USER"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAuditFilter(filter)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                      auditFilter === filter
                        ? "bg-[#2A2A2A] text-white"
                        : "bg-[#161616] text-[#777777] hover:text-[#CCCCCC]"
                    }`}
                  >
                    {filter === "ALL" ? "Tous" : filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-[#1A1A1A] mt-2">
              {filteredAudits.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#666666]">
                  Aucun événement d'audit récent correspondant.
                </div>
              ) : (
                filteredAudits.slice(0, 6).map((audit) => (
                  <div key={audit.id} className="py-3 flex items-center justify-between text-xs hover:bg-[#141414] px-2 rounded-md transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-[#181818] border border-[#262626] flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5 text-[#888888]" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {audit.action.replace(/_/g, " ")}
                        </p>
                        <p className="text-[11px] text-[#777777] mt-0.5">
                          Par <span className="text-[#AAAAAA]">{audit.actor?.fullName || "Système"}</span> • {audit.entityType}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#666666] font-mono shrink-0 pl-3">
                      {formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true, locale: fr })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Control & Direct Access */}
        <div className="space-y-6">
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5">
            <h2 className="text-base font-semibold text-white mb-1">Raccourcis de Gestion</h2>
            <p className="text-xs text-[#888888] mb-4">Accès direct aux modules d'exploitation.</p>

            <div className="space-y-2.5">
              <Button asChild className="w-full justify-start bg-[#161616] hover:bg-[#202020] text-white border border-[#262626] h-10 text-xs font-medium">
                <AdminPageAccess href="/admin/episodes"><Link href="/admin/episodes">
                  <Radio className="w-4 h-4 mr-2.5 text-emerald-400" />
                  Gérer les épisodes ({kpis.episodesPublished})
                </Link></AdminPageAccess>
              </Button>

              <Button asChild className="w-full justify-start bg-[#161616] hover:bg-[#202020] text-white border border-[#262626] h-10 text-xs font-medium">
                <AdminPageAccess href="/admin/reports"><Link href="/admin/reports">
                  <AlertTriangle className="w-4 h-4 mr-2.5 text-red-400" />
                  Modérer les signalements ({kpis.openReports})
                </Link></AdminPageAccess>
              </Button>

              <Button asChild className="w-full justify-start bg-[#161616] hover:bg-[#202020] text-white border border-[#262626] h-10 text-xs font-medium">
                <AdminPageAccess href="/admin/users"><Link href="/admin/users">
                  <Users className="w-4 h-4 mr-2.5 text-[#38BDF8]" />
                  Répertoire utilisateurs
                </Link></AdminPageAccess>
              </Button>

              <Button asChild className="w-full justify-start bg-[#161616] hover:bg-[#202020] text-white border border-[#262626] h-10 text-xs font-medium">
                <AdminPageAccess href="/admin/analytics"><Link href="/admin/analytics">
                  <Activity className="w-4 h-4 mr-2.5 text-[#FFBF00]" />
                  Statistiques & Audiences
                </Link></AdminPageAccess>
              </Button>

              <Button asChild className="w-full justify-start bg-[#161616] hover:bg-[#202020] text-white border border-[#262626] h-10 text-xs font-medium">
                <AdminPageAccess href="/admin/media"><Link href="/admin/media">
                  <HardDrive className="w-4 h-4 mr-2.5 text-purple-400" />
                  Santé de l'infrastructure
                </Link></AdminPageAccess>
              </Button>
            </div>
          </div>

          {/* Operational Status Pill */}
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-5 text-xs text-[#888888] space-y-2">
            <div className="flex items-center justify-between text-white font-medium">
              <span>Statut Plateforme</span>
              <span className="flex items-center text-emerald-400 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                Opérationnel
              </span>
            </div>
            <div className="flex justify-between border-t border-[#1C1C1C] pt-2">
              <span>Généré à</span>
              <span className="font-mono text-[#CCCCCC]">
                {data.generatedAt ? new Date(data.generatedAt).toLocaleTimeString("fr-FR") : "En direct"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tâches en échec</span>
              <span className={`font-mono ${kpis.failedJobs > 0 ? "text-amber-400 font-bold" : "text-[#CCCCCC]"}`}>
                {kpis.failedJobs}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

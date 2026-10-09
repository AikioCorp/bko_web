"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import useSWR from "swr";
import { gsap } from "gsap";
import { Users, AlertTriangle, Radio, HardDrive, ShieldAlert, Activity, Loader2 } from "lucide-react";
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

export default function AdminDashboardPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const { data, error, isLoading } = useSWR("/admin/overview", fetcher, {
    refreshInterval: 60000, // rafraîchissement toutes les 60s
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (data && pageRef.current) {
      gsap.fromTo(
        pageRef.current.children,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "power2.out" }
      );
    }
  }, [data]);

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
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-white">Erreur de connexion</h2>
        <p className="text-[#888]">{error?.message || "Impossible de charger les données"}</p>
      </div>
    );
  }

  const { kpis, recentAudit } = data;

  return (
    <div ref={pageRef} className="space-y-8 pb-12">
      <div className="flex flex-col gap-2 border-b border-[#222] pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-[#FFBF00]" />
          Centre de Contrôle
        </h1>
        <p className="text-[#888888] text-base">
          Supervision en temps réel de la plateforme, modération et santé du système.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/analytics" className="block outline-none ring-offset-[#0E0E0E] focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className="bg-[#111] border-[#222] text-white hover:border-[#444] hover:bg-[#161616] transition-all cursor-pointer h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-[#888]">Auditeurs actifs (24h)</CardTitle>
              <Users className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpis.activeListeners24h.toLocaleString()}</div>
              <p className="text-xs text-blue-400 mt-1 font-medium">{kpis.plays7d.toLocaleString()} écoutes (7j)</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/admin/episodes" className="block outline-none ring-offset-[#0E0E0E] focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className="bg-[#111] border-[#222] text-white hover:border-[#444] hover:bg-[#161616] transition-all cursor-pointer h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-[#888]">Épisodes publiés</CardTitle>
              <Radio className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpis.episodesPublished.toLocaleString()}</div>
              <p className="text-xs text-green-400 mt-1 font-medium">+{kpis.episodesThisWeek} cette semaine</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reports" className="block outline-none ring-offset-[#0E0E0E] focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className={`h-full bg-[#111] border-[#222] text-white transition-all cursor-pointer ${kpis.openReports > 0 ? 'hover:border-red-500/50 hover:bg-red-950/20' : 'hover:border-[#444] hover:bg-[#161616]'}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-[#888]">Signalements ouverts</CardTitle>
              <AlertTriangle className={`w-4 h-4 ${kpis.openReports > 0 ? 'text-red-500' : 'text-[#888]'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${kpis.openReports > 0 ? 'text-white' : 'text-[#666]'}`}>
                {kpis.openReports}
              </div>
              <p className={`text-xs mt-1 font-medium ${kpis.openReports > 0 ? 'text-red-400' : 'text-[#666]'}`}>
                {kpis.openReports > 0 ? "Nécessite votre attention" : "Tout est calme"}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/media" className="block outline-none ring-offset-[#0E0E0E] focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
          <Card className="bg-[#111] border-[#222] text-white hover:border-[#444] hover:bg-[#161616] transition-all cursor-pointer h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-[#888]">Stockage Cloud</CardTitle>
              <HardDrive className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatBytes(kpis.storageBytes)}</div>
              <p className="text-xs text-purple-400 mt-1 font-medium">{kpis.failedJobs} tâches échouées</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#888]" />
            Derniers Audits Système
          </h2>
          <div className="bg-[#111] border border-[#222] rounded-lg overflow-hidden">
            {recentAudit.length === 0 ? (
              <div className="p-8 text-center text-[#666]">
                Aucun log d'audit disponible.
              </div>
            ) : (
              recentAudit.map((audit, i) => (
                <div key={audit.id} className={`flex items-center justify-between p-4 hover:bg-[#1A1A1A] transition-colors ${i !== recentAudit.length - 1 ? 'border-b border-[#222]' : ''}`}>
                  <div className="flex items-center gap-4">
                    <Activity className="w-5 h-5 text-[#666]" />
                    <div>
                      <p className="font-medium text-white text-sm uppercase tracking-wide">{audit.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-[#888] mt-0.5">
                        <span className="text-[#AAA] font-medium">{audit.actor?.fullName || 'Système'}</span> sur {audit.entityType}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-[#666] bg-[#1C1C1C] px-2 py-1 rounded">
                    {formatDistanceToNow(new Date(audit.createdAt), { addSuffix: true, locale: fr })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Actions Rapides</h2>
          <div className="flex flex-col gap-3">
            <Button className="w-full justify-start bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white border border-[#333] h-12" asChild>
              <Link href="/admin/reports">
                <ShieldAlert className="w-4 h-4 mr-3 text-red-500" />
                Gérer les signalements ({kpis.openReports})
              </Link>
            </Button>
            <Button className="w-full justify-start bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white border border-[#333] h-12" asChild>
              <Link href="/admin/users">
                <Users className="w-4 h-4 mr-3 text-blue-500" />
                Rechercher un utilisateur
              </Link>
            </Button>
            <Button className="w-full justify-start bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white border border-[#333] h-12" asChild>
              <Link href="/admin/episodes">
                <Radio className="w-4 h-4 mr-3 text-green-500" />
                Réviser les épisodes ({data.pendingReview.episodes})
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

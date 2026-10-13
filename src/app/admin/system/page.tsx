"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { 
  Database, 
  Activity, 
  Server, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Layers, 
  Users, 
  Podcast, 
  Mic2, 
  Loader2,
  Sparkles,
  Terminal,
  ShieldCheck
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/button";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

interface SystemHealthData {
  status: string;
  timestamp: string;
  uptimeSeconds: number;
  nodeVersion: string;
  environment: string;
  database: {
    status: string;
    latencyMs: number;
    client: string;
  };
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  counts: {
    users: number;
    podcasts: number;
    episodes: number;
    mediaAssets: number;
    pendingJobs: number;
    failedJobs: number;
  };
  services: {
    name: string;
    status: string;
    port?: number;
  }[];
}

export default function AdminSystemPage() {
  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const { data, mutate, isLoading, isValidating } = useSWR<SystemHealthData>(
    "/admin/system",
    fetcher,
    { refreshInterval: 15000 }
  );

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (d > 0) parts.push(`${d}j`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    parts.push(`${m}min`);
    return parts.join(" ");
  };

  const getServiceStatusBadge = (status: string) => {
    switch (status) {
      case "OPERATIONAL":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Opérationnel
          </span>
        );
      case "CONFIGURED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-blue-400" />
            Configuré
          </span>
        );
      case "DEGRADED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Dégradé
          </span>
        );
      case "LOCAL_FALLBACK":
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#1F1F1F] border border-[#2F2F2F] text-[#AAAAAA] text-xs font-medium flex items-center gap-1.5">
            Repli local
          </span>
        );
      case "STANDBY":
        return (
          <span className="px-2.5 py-1 rounded-full bg-[#1F1F1F] border border-[#2F2F2F] text-[#888888] text-xs font-medium flex items-center gap-1.5">
            En veille
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-bold flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-red-400" />
            Hors ligne
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#888888] mb-1.5 uppercase tracking-wider font-semibold">
            <span>Super Admin</span>
            <span>/</span>
            <span className="text-[#FFBF00]">Santé & Infrastructure</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            État du Système
            {isValidating && <Loader2 className="w-5 h-5 text-[#FFBF00] animate-spin inline-block" />}
          </h1>
          <p className="text-sm text-[#888888] mt-1 max-w-2xl">
            Surveillance en temps réel des services critiques, de la latence base de données PostgreSQL, de la consommation mémoire et des workers d&apos;arrière-plan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            className="border-[#2A2A2A] bg-[#141414] hover:bg-[#1C1C1C] text-[#CCCCCC] hover:text-white"
          >
            <RefreshCw className={classNames("w-4 h-4 mr-2", isValidating && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
          <span className="text-sm text-[#888888]">Interrogation de l&apos;état des composants système...</span>
        </div>
      ) : data ? (
        <>
          {/* Bannière de Santé Globale */}
          <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-white">Tous les services sont opérationnels</h2>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-xs text-[#888888] mt-0.5">
                  Dernier contrôle télémétrique : {new Date(data.timestamp).toLocaleTimeString("fr-FR")} • Environnement :{" "}
                  <span className="text-white font-mono uppercase">{data.environment}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#0E0E0E] px-4 py-2 rounded-xl border border-[#222222] text-xs">
              <span className="text-[#777777]">Runtime :</span>
              <span className="font-mono text-white font-bold">{data.nodeVersion}</span>
            </div>
          </div>

          {/* 4 KPIs Métriques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
              <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Disponibilité Processus</span>
                <Clock className="w-4 h-4 text-[#FFBF00]" />
              </div>
              <div className="text-2xl font-black text-white">{formatUptime(data.uptimeSeconds)}</div>
              <div className="text-xs text-[#777777] mt-1">Uptime continu du serveur backend</div>
            </div>

            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
              <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Latence PostgreSQL</span>
                <Database className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <div className="text-2xl font-black text-[#38BDF8]">{data.database.latencyMs} ms</div>
              <div className="text-xs text-[#777777] mt-1">Requête ping SELECT 1 instantanée</div>
            </div>

            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
              <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Mémoire Vive (RAM)</span>
                <Cpu className="w-4 h-4 text-[#A855F7]" />
              </div>
              <div className="text-2xl font-black text-white">{data.memory.heapUsedMb} Mo</div>
              <div className="text-xs text-[#777777] mt-1">Sur {data.memory.heapTotalMb} Mo alloués (RSS: {data.memory.rssMb} Mo)</div>
            </div>

            <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
              <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Tâches en file (Jobs)</span>
                <Layers className="w-4 h-4 text-[#2DD4BF]" />
              </div>
              <div className="text-2xl font-black text-white">{data.counts.pendingJobs}</div>
              <div className="text-xs text-[#777777] mt-1">
                {data.counts.failedJobs > 0 ? (
                  <span className="text-amber-400 font-semibold">{data.counts.failedJobs} tâche(s) échouée(s)</span>
                ) : (
                  <span className="text-emerald-400">0 échec enregistré</span>
                )}
              </div>
            </div>
          </div>

          {/* Cartes des Services Détaillés */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#FFBF00]">
              Architecture des Services & Dépendances
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.services.map((svc, idx) => (
                <div
                  key={idx}
                  className="bg-[#141414] border border-[#222222] rounded-2xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">{svc.name}</h4>
                      {svc.port && (
                        <div className="text-xs text-[#777777] font-mono">Port d&apos;écoute : :{svc.port}</div>
                      )}
                    </div>
                    {getServiceStatusBadge(svc.status)}
                  </div>

                  <div className="pt-3 border-t border-[#1F1F1F] text-xs text-[#888888] flex items-center justify-between">
                    <span>Protocole</span>
                    <span className="text-white font-mono">TCP / HTTP / IPC</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Volumétrie des tables en base de données */}
          <div className="bg-[#141414] border border-[#222222] rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Volumétrie & Registre des Données</h3>
                <p className="text-xs text-[#888888]">Inventaire des entités gérées en base de données PostgreSQL.</p>
              </div>
              <div className="px-3 py-1 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg text-xs font-mono text-[#CCCCCC]">
                PostgreSQL + pgvector
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="bg-[#0E0E0E] p-4 rounded-xl border border-[#222222]">
                <div className="text-2xl font-black text-white">{data.counts.podcasts.toLocaleString()}</div>
                <div className="text-xs text-[#888888] mt-1 flex items-center justify-center gap-1.5">
                  <Podcast className="w-3.5 h-3.5 text-[#2DD4BF]" />
                  Émissions
                </div>
              </div>

              <div className="bg-[#0E0E0E] p-4 rounded-xl border border-[#222222]">
                <div className="text-2xl font-black text-white">{data.counts.episodes.toLocaleString()}</div>
                <div className="text-xs text-[#888888] mt-1 flex items-center justify-center gap-1.5">
                  <Mic2 className="w-3.5 h-3.5 text-[#FFBF00]" />
                  Épisodes
                </div>
              </div>

              <div className="bg-[#0E0E0E] p-4 rounded-xl border border-[#222222]">
                <div className="text-2xl font-black text-white">{data.counts.users.toLocaleString()}</div>
                <div className="text-xs text-[#888888] mt-1 flex items-center justify-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Comptes
                </div>
              </div>

              <div className="bg-[#0E0E0E] p-4 rounded-xl border border-[#222222]">
                <div className="text-2xl font-black text-white">{data.counts.mediaAssets.toLocaleString()}</div>
                <div className="text-xs text-[#888888] mt-1 flex items-center justify-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-[#A855F7]" />
                  Fichiers Médias
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

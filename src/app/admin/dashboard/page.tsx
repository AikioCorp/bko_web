"use client";

import React, { useEffect, useState } from "react";
import { Users, Mic, Radio, FileAudio, AlertTriangle, ShieldCheck, Rss, Layers, CheckCircle } from "lucide-react";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    fetch("http://localhost:8080/api/v1/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMetrics(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement du tableau de bord d'administration...</div>;

  const { overview, alerts, podcastsByCountry, podcastsByLanguage } = metrics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* En-tête Dashboard */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-2">
        <span className="bg-[#E5A93C]/10 text-[#E5A93C] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#E5A93C]/30 uppercase">
          BACKOFFICE MÉDIA & CMS
        </span>
        <h1 className="text-3xl font-black text-white">Tableau de Bord Éditorial</h1>
        <p className="text-xs text-gray-400">
          Vue d'ensemble stratégique du catalogue, des créateurs, des revendications en attente et de la santé technique de la plateforme.
        </p>
      </div>

      {/* Alertes Opérationnelles */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Alertes Opérationnelles Requérant une Action</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((a: any, idx: number) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex items-center space-x-3 text-xs ${
                  a.level === "WARNING"
                    ? "bg-[#E5A93C]/10 border-[#E5A93C]/30 text-[#E5A93C]"
                    : a.level === "ERROR"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                }`}
              >
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="font-semibold">{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Utilisateurs Totaux</span>
            <Users className="w-4 h-4 text-[#E5A93C]" />
          </div>
          <p className="text-2xl font-black text-white">{overview?.usersCount || 0}</p>
        </div>

        <div className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Créateurs Inscrits</span>
            <Mic className="w-4 h-4 text-[#E5A93C]" />
          </div>
          <p className="text-2xl font-black text-white">{overview?.creatorsCount || 0}</p>
        </div>

        <div className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Podcasts au Catalogue</span>
            <Radio className="w-4 h-4 text-[#E5A93C]" />
          </div>
          <p className="text-2xl font-black text-white">{overview?.podcastsCount || 0}</p>
        </div>

        <div className="bg-[#121722] border border-[#1E2638] rounded-xl p-5 space-y-1">
          <div className="flex items-center justify-between text-gray-400 text-xs">
            <span>Épisodes Référencés</span>
            <FileAudio className="w-4 h-4 text-[#E5A93C]" />
          </div>
          <p className="text-2xl font-black text-white">{overview?.episodesCount || 0}</p>
        </div>
      </div>

      {/* Détails du Catalogue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-[#E5A93C]">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Gestion des Propriétés</h3>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center bg-[#0A0D14] p-3 rounded-xl border border-[#1E2638]">
              <span className="text-gray-400">Podcasts Non Revendiqués</span>
              <span className="font-extrabold text-[#E5A93C]">{overview?.unclaimedPodcastsCount || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-[#0A0D14] p-3 rounded-xl border border-[#1E2638]">
              <span className="text-gray-400">Revendications (Claims) en Attente</span>
              <span className="font-extrabold text-blue-400">{overview?.pendingClaimsCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-green-400">
            <Rss className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Répartition par Pays</h3>
          </div>
          <div className="space-y-2 text-xs">
            {podcastsByCountry?.map((item: any) => (
              <div key={item.countryId} className="flex justify-between items-center bg-[#0A0D14] p-2.5 rounded-lg border border-[#1E2638]">
                <span className="text-gray-300 font-bold">{item.countryId}</span>
                <span className="text-gray-400">{item.count} podcasts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-blue-400">
            <Layers className="w-5 h-5" />
            <h3 className="font-bold text-white text-sm">Répartition par Langue</h3>
          </div>
          <div className="space-y-2 text-xs">
            {podcastsByLanguage?.map((item: any) => (
              <div key={item.languageCode} className="flex justify-between items-center bg-[#0A0D14] p-2.5 rounded-lg border border-[#1E2638]">
                <span className="text-gray-300 font-bold uppercase">{item.languageCode}</span>
                <span className="text-gray-400">{item.count} podcasts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

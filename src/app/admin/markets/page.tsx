"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { Globe, Shield, Check, X, Power, Edit3 } from "lucide-react";

export default function AdminMarketsPage() {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarkets = () => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    fetch(`${API_BASE_URL}/admin/markets`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMarkets(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMarkets();
  }, []);

  const handleToggleCapability = async (countryCode: string, field: string, currentValue: boolean) => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/admin/markets/${countryCode}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: !currentValue }),
      });
      fetchMarkets();
    } catch (e) {}
  };

  const handleActivate = async (countryCode: string) => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/admin/markets/${countryCode}/activate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMarkets();
    } catch (e) {}
  };

  const handleSuspend = async (countryCode: string) => {
    const token = localStorage.getItem("bko_access_token");
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/admin/markets/${countryCode}/suspend`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMarkets();
    } catch (e) {}
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement de la gestion des marchés...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-2">
        <span className="bg-[#E5A93C]/10 text-[#E5A93C] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#E5A93C]/30 uppercase">
          ADMINISTRATION BACKOFFICE
        </span>
        <h1 className="text-3xl font-black text-white">Gestion des Pays & Marchés</h1>
        <p className="text-xs text-gray-400">
          Contrôlez la disponibilité géographique et activez progressivement les capacités créateur par pays sans redéploiement.
        </p>
      </div>

      {/* Tableau des Marchés */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0A0D14] text-gray-400 uppercase text-[10px] font-bold border-b border-[#1E2638]">
              <tr>
                <th className="p-4">Pays</th>
                <th className="p-4">Statut Marché</th>
                <th className="p-4 text-center">Découverte</th>
                <th className="p-4 text-center">Insc. Créateur</th>
                <th className="p-4 text-center">Création Podcast</th>
                <th className="p-4 text-center">Publication</th>
                <th className="p-4 text-center">Upload R2</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638]">
              {markets.map((m) => (
                <tr key={m.id} className="hover:bg-[#1A2130] transition">
                  <td className="p-4 font-bold text-white flex items-center space-x-2">
                    <span className="text-lg">{m.country.flagEmoji}</span>
                    <span>{m.country.name} ({m.countryId})</span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        m.status === "ACTIVE"
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : m.status === "CREATOR_BETA"
                          ? "bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/30"
                          : m.status === "CATALOG_ONLY"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          : "bg-gray-500/10 text-gray-400 border border-gray-500/30"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>

                  {/* Interrupteurs de fonctionnalités */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleCapability(m.countryId, "discoveryEnabled", m.discoveryEnabled)}
                      className={`p-1.5 rounded-lg border transition ${
                        m.discoveryEnabled ? "bg-green-500/10 border-green-500/40 text-green-400" : "bg-red-500/10 border-red-500/40 text-red-400"
                      }`}
                    >
                      {m.discoveryEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleCapability(m.countryId, "creatorSignupEnabled", m.creatorSignupEnabled)}
                      className={`p-1.5 rounded-lg border transition ${
                        m.creatorSignupEnabled ? "bg-green-500/10 border-green-500/40 text-green-400" : "bg-red-500/10 border-red-500/40 text-red-400"
                      }`}
                    >
                      {m.creatorSignupEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleCapability(m.countryId, "podcastCreationEnabled", m.podcastCreationEnabled)}
                      className={`p-1.5 rounded-lg border transition ${
                        m.podcastCreationEnabled ? "bg-green-500/10 border-green-500/40 text-green-400" : "bg-red-500/10 border-red-500/40 text-red-400"
                      }`}
                    >
                      {m.podcastCreationEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleCapability(m.countryId, "publishingEnabled", m.publishingEnabled)}
                      className={`p-1.5 rounded-lg border transition ${
                        m.publishingEnabled ? "bg-green-500/10 border-green-500/40 text-green-400" : "bg-red-500/10 border-red-500/40 text-red-400"
                      }`}
                    >
                      {m.publishingEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleCapability(m.countryId, "uploadEnabled", m.uploadEnabled)}
                      className={`p-1.5 rounded-lg border transition ${
                        m.uploadEnabled ? "bg-green-500/10 border-green-500/40 text-green-400" : "bg-red-500/10 border-red-500/40 text-red-400"
                      }`}
                    >
                      {m.uploadEnabled ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <a
                        href={`/admin/markets/${m.countryId}/creators`}
                        className="bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/30 px-2.5 py-1 rounded text-[10px] font-bold hover:bg-[#E5A93C]/20"
                      >
                        Créateurs
                      </a>
                      {m.status !== "ACTIVE" ? (
                        <button
                          onClick={() => handleActivate(m.countryId)}
                          className="bg-green-500/10 text-green-400 border border-green-500/30 px-2.5 py-1 rounded text-[10px] font-bold hover:bg-green-500/20"
                        >
                          Activer
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(m.countryId)}
                          className="bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded text-[10px] font-bold hover:bg-red-500/20"
                        >
                          Suspendre
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

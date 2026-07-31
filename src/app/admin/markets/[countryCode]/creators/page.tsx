"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, X, ShieldCheck, Zap } from "lucide-react";

type Capability = "canCreatePodcast" | "canPublish" | "canUpload" | "canImportRss" | "canMonetize";

const CAPABILITIES: { key: Capability; label: string }[] = [
  { key: "canCreatePodcast", label: "Création podcasts" },
  { key: "canPublish", label: "Publication" },
  { key: "canUpload", label: "Upload natif" },
  { key: "canImportRss", label: "Import RSS" },
  { key: "canMonetize", label: "Monétisation" },
];

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-green-500/10 text-green-400 border-green-500/30",
  PENDING: "bg-[#E5A93C]/10 text-[#E5A93C] border-[#E5A93C]/30",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/30",
  SUSPENDED: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

export default function AdminMarketCreatorsPage() {
  const params = useParams();
  const countryCode = String(params.countryCode ?? "");

  const [market, setMarket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const token = () => (typeof window !== "undefined" ? localStorage.getItem("bko_access_token") : null);

  const fetchMarket = () => {
    const t = token();
    if (!t) return;
    fetch(`${API_BASE_URL}/admin/markets/${countryCode}`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setMarket(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMarket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);

  const patchAccess = async (accessId: string, patch: Record<string, unknown>) => {
    const t = token();
    if (!t) return;
    setSavingId(accessId);
    try {
      await fetch(`${API_BASE_URL}/admin/creator-market-access/${accessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify(patch),
      });
      fetchMarket();
    } catch (e) {
      // silencieux : l'UI se resynchronise via fetchMarket
    } finally {
      setSavingId(null);
    }
  };

  const grantAll = (accessId: string) =>
    patchAccess(accessId, {
      status: "APPROVED",
      canCreatePodcast: true,
      canPublish: true,
      canUpload: true,
      canImportRss: true,
      canMonetize: true,
    });

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement des créateurs du marché…</div>;
  if (!market) return <div className="p-12 text-center text-gray-400">Marché introuvable.</div>;

  const accesses: any[] = market.creatorAccesses ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-3">
        <a href="/admin/markets" className="inline-flex items-center text-xs text-gray-400 hover:text-[#E5A93C]">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux marchés
        </a>
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{market.country?.flagEmoji}</span>
          <h1 className="text-3xl font-black text-white">
            Capacités créateur — {market.country?.name} ({market.countryId})
          </h1>
        </div>
        <p className="text-xs text-gray-400 max-w-3xl">
          Statut du marché :{" "}
          <span className="font-bold text-gray-200">{market.status}</span>. Les capacités individuelles ci-dessous
          sont des <span className="text-[#E5A93C] font-semibold">overrides</span> accordés à un créateur — ils priment
          sur les capacités globales du marché (utile en mode <span className="font-semibold">CREATOR_BETA</span>).
        </p>
      </div>

      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0A0D14] text-gray-400 uppercase text-[10px] font-bold border-b border-[#1E2638]">
              <tr>
                <th className="p-4">Créateur</th>
                <th className="p-4">Statut accès</th>
                {CAPABILITIES.map((c) => (
                  <th key={c.key} className="p-4 text-center">
                    {c.label}
                  </th>
                ))}
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2638]">
              {accesses.length === 0 && (
                <tr>
                  <td colSpan={3 + CAPABILITIES.length} className="p-8 text-center text-gray-500">
                    Aucun créateur n'a demandé l'accès à ce marché pour le moment.
                  </td>
                </tr>
              )}

              {accesses.map((a) => {
                const isSaving = savingId === a.id;
                const approved = a.status === "APPROVED";
                return (
                  <tr key={a.id} className={`hover:bg-[#1A2130] transition ${isSaving ? "opacity-50" : ""}`}>
                    <td className="p-4">
                      <div className="font-bold text-white">{a.creatorProfile?.displayName ?? "—"}</div>
                      <div className="text-[10px] text-gray-500">@{a.creatorProfile?.slug ?? a.creatorProfileId}</div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          STATUS_STYLES[a.status] ?? STATUS_STYLES.SUSPENDED
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>

                    {CAPABILITIES.map((c) => {
                      const value = Boolean(a[c.key]);
                      return (
                        <td key={c.key} className="p-4 text-center">
                          <button
                            disabled={isSaving}
                            onClick={() => patchAccess(a.id, { [c.key]: !value })}
                            title={c.label}
                            className={`p-1.5 rounded-lg border transition ${
                              value
                                ? "bg-green-500/10 border-green-500/40 text-green-400"
                                : "bg-red-500/10 border-red-500/40 text-red-400"
                            }`}
                          >
                            {value ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                      );
                    })}

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          disabled={isSaving}
                          onClick={() => grantAll(a.id)}
                          title="Accorder toutes les capacités"
                          className="inline-flex items-center gap-1 bg-[#E5A93C]/10 text-[#E5A93C] border border-[#E5A93C]/30 px-2.5 py-1 rounded text-[10px] font-bold hover:bg-[#E5A93C]/20"
                        >
                          <Zap className="w-3 h-3" /> Tout accorder
                        </button>
                        {approved ? (
                          <button
                            disabled={isSaving}
                            onClick={() => patchAccess(a.id, { status: "REJECTED" })}
                            className="bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded text-[10px] font-bold hover:bg-red-500/20"
                          >
                            Révoquer accès
                          </button>
                        ) : (
                          <button
                            disabled={isSaving}
                            onClick={() => patchAccess(a.id, { status: "APPROVED" })}
                            className="inline-flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/30 px-2.5 py-1 rounded text-[10px] font-bold hover:bg-green-500/20"
                          >
                            <ShieldCheck className="w-3 h-3" /> Approuver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

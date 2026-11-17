"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import { Radio, Search, ExternalLink, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "En attente", cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  REVIEWED: { label: "En examen", cls: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  APPROVED: { label: "Approuvée", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  REJECTED: { label: "Refusée", cls: "bg-red-500/10 text-red-400 border-red-500/30" },
};

export default function AdminSuggestionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const query = new URLSearchParams();
  if (statusFilter) query.set("status", statusFilter);
  if (search.trim()) query.set("search", search.trim());

  const { data, isLoading, mutate } = useSWR(
    `/admin/discovery/suggestions?${query.toString()}`,
    (url) => fetchApi(url).then((r) => r.data)
  );

  const items = data?.items || [];

  const handleUpdateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await fetchApi(`/admin/discovery/suggestions/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await mutate();
    } catch (err) {
      console.error("Erreur mise à jour statut suggestion:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Radio className="w-6 h-6 text-[#FFBF00]" />
            Suggestions d'émissions
          </h1>
          <p className="text-xs text-[#888888] mt-1">
            Émissions, griots et podcasts proposés par les auditeurs pour intégrer le catalogue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white placeholder-[#666] outline-none focus:border-[#FFBF00]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#141414] border border-[#262626] text-xs text-white outline-none focus:border-[#FFBF00]"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="REVIEWED">En examen</option>
            <option value="APPROVED">Approuvée</option>
            <option value="REJECTED">Refusée</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-[#888]">Chargement des suggestions...</div>
      ) : items.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#141414] border border-[#262626] text-center text-xs text-[#888]">
          Aucune suggestion d'émission trouvée pour ces critères.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item: any) => {
            const badge = STATUS_BADGES[item.status] || STATUS_BADGES.PENDING;
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{item.name}</h3>
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {item.details && (
                    <p className="text-xs text-[#A0A0A0] leading-relaxed">{item.details}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#777]">
                    <span>
                      Proposé par :{" "}
                      <strong className="text-[#CCC]">
                        {item.user?.fullName || item.user?.email || "Auditeur invité"}
                      </strong>
                    </span>
                    <span>
                      Le {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FFBF00] hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Lien source</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={updatingId === item.id || item.status === "REVIEWED"}
                    onClick={() => handleUpdateStatus(item.id, "REVIEWED")}
                    className="px-3 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#282828] border border-[#303030] text-xs font-semibold text-blue-400 disabled:opacity-40 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Examiner</span>
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === item.id || item.status === "APPROVED"}
                    onClick={() => handleUpdateStatus(item.id, "APPROVED")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold text-emerald-400 disabled:opacity-40 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approuver</span>
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === item.id || item.status === "REJECTED"}
                    onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-semibold text-red-400 disabled:opacity-40 flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Refuser</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

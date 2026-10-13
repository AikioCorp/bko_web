"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Search, Headphones, Loader2, ChevronLeft, ChevronRight, Edit2, Trash2,
  Eye, CheckCircle2, FileEdit, Clock, Archive, Plus, AlertTriangle, ImageIcon,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const STATUS: Record<string, { label: string; cls: string }> = {
  PUBLISHED: { label: "Publié", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  DRAFT: { label: "Brouillon", cls: "bg-[#262626] text-[#A3A3A3] border-[#333333]" },
  SCHEDULED: { label: "Programmé", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  PENDING_REVIEW: { label: "À valider", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  REJECTED: { label: "Refusé", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  ARCHIVED: { label: "Archivé", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const TABS = [
  { id: "", label: "Tous" },
  { id: "PUBLISHED", label: "Publiés" },
  { id: "DRAFT", label: "Brouillons" },
  { id: "PENDING_REVIEW", label: "À valider" },
  { id: "SCHEDULED", label: "Programmés" },
  { id: "ARCHIVED", label: "Archivés" },
];

const LIMIT = 25;

function fmtDuration(s?: number | null) {
  if (!s) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

export default function AdminEpisodesPage() {
  const { isAuthenticated } = useAuthStore();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debounced, status]);

  const key = isAuthenticated ? ["/admin/episodes", debounced, status, page] : null;
  const { data, isLoading, error, mutate } = useSWR(key, ([url, q, s, p]: any) =>
    adminApi(`${url}?page=${p}&limit=${LIMIT}&search=${encodeURIComponent(q)}&status=${s}`).then((r: any) => {
      if (!r.success) throw new Error(r.message);
      return r.data;
    })
  );

  const items: any[] = data?.data || [];
  const total: number = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const notify = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const publish = async (ep: any) => {
    setBusyId(ep.id);
    try {
      const r = await adminApi(`/admin/episodes/${ep.id}/publish`, { method: "POST" });
      if (!r.success) throw new Error(r.message);
      notify("success", `« ${ep.title} » publié.`);
      mutate();
    } catch (e: any) {
      notify("error", e.message || "Publication impossible.");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const r = await adminApi(`/admin/episodes/${toDelete.id}`, { method: "DELETE" });
      if (!r.success) throw new Error(r.message);
      notify("success", "Épisode supprimé.");
      setToDelete(null);
      mutate();
    } catch (e: any) {
      notify("error", e.message || "Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#222222] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Headphones className="w-6 h-6 text-[#FFBF00]" />
            Épisodes
          </h1>
          <p className="text-sm text-[#888888] mt-1">
            {total.toLocaleString("fr-FR")} épisode{total > 1 ? "s" : ""} sur l'ensemble du catalogue.
          </p>
        </div>
        <Link
          href="/admin/podcasts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFBF00] hover:bg-[#E5A800] text-black text-xs font-bold self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Ajouter via une émission
        </Link>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-xl text-xs font-bold border ${feedback.type === "success" ? "bg-[#238636]/15 text-[#3fb950] border-[#238636]/30" : "bg-red-500/15 text-red-400 border-red-500/30"}`}>
          {feedback.text}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setStatus(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 border transition-colors ${
                status === t.id ? "bg-white text-black border-white" : "bg-[#141414] text-[#888888] hover:text-white border-[#262626]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un épisode ou une émission…"
            className="w-full bg-[#141414] border border-[#262626] rounded-xl py-2.5 pl-10 pr-3 text-xs text-white outline-none focus:border-[#FFBF00]"
          />
        </div>
      </div>

      <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-[#FFBF00] animate-spin" />
          </div>
        ) : error ? (
          <div className="h-48 flex items-center justify-center text-sm text-red-400">Erreur de chargement des épisodes.</div>
        ) : items.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center gap-2">
            <Headphones className="w-7 h-7 text-[#555555]" />
            <p className="text-sm text-white font-bold">Aucun épisode trouvé</p>
            <p className="text-xs text-[#888888]">Modifiez votre recherche ou vos filtres.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#222222] text-[#777777] uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-3 font-semibold">Épisode</th>
                  <th className="px-3 py-3 font-semibold hidden md:table-cell">Émission</th>
                  <th className="px-3 py-3 font-semibold">Statut</th>
                  <th className="px-3 py-3 font-semibold hidden lg:table-cell">Durée</th>
                  <th className="px-3 py-3 font-semibold hidden lg:table-cell">Écoutes</th>
                  <th className="px-3 py-3 font-semibold hidden xl:table-cell">Créé le</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]">
                {items.map((ep) => {
                  const st = STATUS[ep.status] || { label: ep.status, cls: "bg-[#262626] text-[#A3A3A3] border-[#333333]" };
                  const cover = ep.coverImageUrl || ep.cover || ep.podcast?.cover;
                  return (
                    <tr key={ep.id} className="hover:bg-[#151515] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-[#1C1C1C] border border-[#2A2A2A] overflow-hidden shrink-0 flex items-center justify-center">
                            {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-[#555555]" />}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/admin/episodes/${ep.id}`} className="font-bold text-white hover:text-[#FFBF00] truncate block max-w-[260px]">
                              {ep.title}
                            </Link>
                            {ep.isPremium && <span className="text-[10px] font-bold text-[#FFBF00]">PREMIUM</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[#AAAAAA] hidden md:table-cell truncate max-w-[180px]">{ep.podcast?.name || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-3 py-3 text-[#AAAAAA] hidden lg:table-cell">{fmtDuration(ep.durationSeconds)}</td>
                      <td className="px-3 py-3 text-[#AAAAAA] hidden lg:table-cell">{(ep._count?.histories ?? 0).toLocaleString("fr-FR")}</td>
                      <td className="px-3 py-3 text-[#777777] hidden xl:table-cell">
                        {ep.createdAt ? new Date(ep.createdAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {ep.status !== "PUBLISHED" && (
                            <button
                              onClick={() => publish(ep)}
                              disabled={busyId === ep.id}
                              title="Publier"
                              className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 disabled:opacity-50"
                            >
                              {busyId === ep.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {ep.podcast?.slug && ep.status === "PUBLISHED" && (
                            <Link
                              href={`/podcasts/${ep.podcast.slug}/episodes/${ep.slug}`}
                              target="_blank"
                              title="Voir sur le site"
                              className="p-2 rounded-lg bg-[#1C1C1C] hover:bg-[#262626] text-[#AAAAAA]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <Link href={`/admin/episodes/${ep.id}`} title="Modifier" className="p-2 rounded-lg bg-[#1C1C1C] hover:bg-[#262626] text-[#FFBF00]">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => setToDelete(ep)} title="Supprimer" className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > LIMIT && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#222222] text-xs text-[#888888]">
            <span>Page {page} / {totalPages}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg bg-[#1C1C1C] disabled:opacity-40 hover:bg-[#262626] text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg bg-[#1C1C1C] disabled:opacity-40 hover:bg-[#262626] text-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl max-w-sm w-full p-6 space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Supprimer cet épisode ?</h3>
              <p className="text-xs text-[#888888] leading-relaxed">
                « {toDelete.title} » sera supprimé définitivement ainsi que ses médias associés.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setToDelete(null)} disabled={deleting} className="py-2.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-white text-xs font-bold">
                Annuler
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60">
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

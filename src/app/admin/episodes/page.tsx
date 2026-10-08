"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { 
  Eye, ChevronLeft, ChevronRight, Search, CheckSquare, Square
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => adminApi(url);

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "PUBLISHED": return <span className="bg-[#FFBF00]/10 text-[#FFBF00] border border-[#FFBF00]/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Publié</span>;
    case "DRAFT": return <span className="bg-[#2A2A2A] text-[#B8B8B8] border border-[#3A3A3A] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Brouillon</span>;
    case "SCHEDULED": return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Planifié</span>;
    case "ARCHIVED": return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Archivé</span>;
    default: return <span className="bg-[#2A2A2A] text-[#B8B8B8] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{status}</span>;
  }
};

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

export default function AdminEpisodesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const debouncedSearch = useDebounce(search, 500);
  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: response, error, isLoading, mutate } = useSWR<{data: any[], total: number}>(
    `/admin/episodes?page=${page}&limit=${limit}&search=${encodeURIComponent(debouncedSearch)}`, 
    fetcher, 
    { keepPreviousData: true, revalidateOnFocus: false }
  );

  
  const handleBulkPublish = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Voulez-vous vraiment publier ces ${selected.length} épisodes ?`)) return;
    
    setIsPublishing(true);
    try {
      const res = await adminApi("/admin/episodes/bulk-publish", {
        method: "POST",
        body: JSON.stringify({ ids: selected }),
      });
      if (res.success) {
        alert(res.message || "Opération terminée.");
        setSelected([]);
        void mutate();
      } else {
        alert(res.error || "Une erreur est survenue.");
      }
    } catch (e: any) {
      alert(e.message || "Erreur de connexion.");
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  
  const toggleSelectAll = () => {
    if (selected.length === displayed.length) {
      setSelected([]);
    } else {
      setSelected(displayed.map(ep => ep.id));
    }
  };

  const displayed = response?.data || [];
  const totalItems = response?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Épisodes</h1>
          <p className="text-sm text-[#888888] mt-1">Gérez tous les épisodes de la plateforme.</p>
        </div>
        <div className="flex items-center gap-3">
          {selected.length > 0 && (
            <Button 
              onClick={handleBulkPublish} 
              disabled={isPublishing}
              className="bg-[#FFBF00] text-black hover:bg-[#E5A800] text-sm h-[38px]"
            >
              {isPublishing ? "Publication..." : `Publier (${selected.length})`}
            </Button>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575]" />
            <input 
              type="text" 
              placeholder="Rechercher un épisode..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#1C1C1C] border border-[#2A2A2A] text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-[#FFBF00] w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-[#1A1A1A]">
                <th className="p-4 w-10 text-center">
                  <button onClick={toggleSelectAll} className="text-[#757575] hover:text-white focus:outline-none">
                    {displayed.length > 0 && selected.length === displayed.length ? <CheckSquare className="w-4 h-4 mx-auto" /> : <Square className="w-4 h-4 mx-auto" />}
                  </button>
                </th>
                <th className="p-4 text-xs font-bold text-[#757575] uppercase tracking-wider w-10 text-center">#</th>
                <th className="p-4 text-xs font-bold text-[#757575] uppercase tracking-wider">Épisode</th>
                <th className="p-4 text-xs font-bold text-[#757575] uppercase tracking-wider">Podcast</th>
                <th className="p-4 text-xs font-bold text-[#757575] uppercase tracking-wider">Statut</th>
                <th className="p-4 text-xs font-bold text-[#757575] uppercase tracking-wider text-center">Écoutes</th>
                <th className="p-4 text-xs font-bold text-[#757575] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {isLoading && !displayed.length ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#757575]">Chargement des épisodes...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="p-8 text-center text-red-400">Erreur lors du chargement.</td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-[#757575]">Aucun épisode trouvé.</td></tr>
              ) : (
                displayed.map((ep, idx) => (
                  <tr 
                    key={ep.id} 
                    className="hover:bg-[#1C1C1C] transition-colors cursor-pointer group"
                    onClick={() => router.push(`/podcasts/${ep.podcast?.slug}/episodes/${ep.slug}`)}
                  >
                    <td className="p-4 text-xs font-mono text-[#757575] text-center">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3.5">
                        <img 
                          src={ep.cover || ep.podcast?.cover || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=96&h=96&fit=crop"} 
                          alt={ep.title} 
                          className="w-10 h-10 rounded-lg object-cover bg-[#0B0B0B] border border-[#2A2A2A] shrink-0" 
                        />
                        <div>
                          <p className="font-bold text-white text-sm group-hover:text-[#FFBF00] transition-colors line-clamp-1">
                            {ep.title}
                          </p>
                          <p className="text-xs text-[#757575] flex items-center gap-1.5 mt-0.5">
                            <span className="opacity-70">{new Date(ep.createdAt).toLocaleDateString('fr-FR')}</span>
                            <span className="opacity-40">•</span>
                            <span>{Math.round((ep.durationSeconds || 0) / 60)} min</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[#B8B8B8]">
                      {ep.podcast?.name || "—"}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={ep.status} />
                    </td>
                    <td className="p-4 text-sm font-bold text-center text-[#B8B8B8]">
                      {ep._count?.histories || 0}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-2 text-xs text-[#B8B8B8] hover:text-white hover:bg-[#2A2A2A]" 
                          onClick={() => router.push(`/podcasts/${ep.podcast?.slug}/episodes/${ep.slug}`)} 
                          title="Voir"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#2A2A2A] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#757575]">
          <div>
            <span>{displayed.length > 0 ? (page - 1) * limit + 1 : 0} — {Math.min(page * limit, totalItems)} sur {totalItems}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              className="h-8 text-xs bg-[#171717] border-[#2A2A2A] text-white hover:bg-[#262626] disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Précédent
            </Button>
            <span className="text-white px-2">Page {page} / {Math.max(totalPages, 1)}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              className="h-8 text-xs bg-[#171717] border-[#2A2A2A] text-white hover:bg-[#262626] disabled:opacity-40"
            >
              Suivant <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

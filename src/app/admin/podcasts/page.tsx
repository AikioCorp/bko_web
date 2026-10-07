"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Rss,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit2,
  FolderPlus,
  Trash2,
  Globe,
  Tag,
  MapPin,
  Mic,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { adminApi } from "@/lib/api";

// --- Types & Mocks ---
type PodcastStatus = "PUBLISHED" | "PENDING" | "SUSPENDED";

interface MockPodcast {
  id: string;
  name: string;
  cover: string;
  creatorName: string;
  language: string;
  category: string;
  status: PodcastStatus;
  episodesCount: number;
}

const mockPodcasts: MockPodcast[] = [
  {
    id: "1",
    name: "Les voix de Bamako",
    cover: "https://picsum.photos/seed/bko/48/48",
    creatorName: "Aminata",
    language: "Français",
    category: "Société",
    status: "PUBLISHED",
    episodesCount: 24,
  },
  {
    id: "2",
    name: "Entreprendre au Mali",
    cover: "https://picsum.photos/seed/mali/48/48",
    creatorName: "Studio BKO",
    language: "Bamanankan",
    category: "Économie",
    status: "PENDING",
    episodesCount: 3,
  },
  {
    id: "3",
    name: "Afro Tech",
    cover: "https://picsum.photos/seed/tech/48/48",
    creatorName: "Sekou",
    language: "Français",
    category: "Technologie",
    status: "SUSPENDED",
    episodesCount: 12,
  },
  {
    id: "4",
    name: "Contes de la Savane",
    cover: "https://picsum.photos/seed/contes/48/48",
    creatorName: "Griot Moderne",
    language: "Bamanankan",
    category: "Culture",
    status: "PUBLISHED",
    episodesCount: 45,
  },
];

const TABS = [
  { id: "ALL", label: "Tous", count: 64 },
  { id: "PENDING", label: "À valider", count: 6 },
  { id: "PUBLISHED", label: "Publiés", count: 52 },
  { id: "SUSPENDED", label: "Suspendus", count: 2 },
];

export default function AdminPodcastsPage() {
  const router = useRouter();


  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  
  // Referential data for filters
  const { data: countries } = useSWR('/countries', (url: string) => adminApi(url).then((res: any) => res.data || []));
  const { data: categories } = useSWR('/admin/categories', (url: string) => adminApi(url).then((res: any) => res.data || []));
  const { data: languages } = useSWR('/admin/languages', (url: string) => adminApi(url).then((res: any) => res.data || []));

  // Real API Fetch with all filters
  const statusParam = activeTab !== "ALL" ? activeTab : "";
  const { data, isLoading: loading, mutate } = useSWR(
    ["/admin/catalog", statusParam, search, page, limit, langFilter, catFilter, originFilter],
    ([url, s, q, p, l, lang, cat, origin]) => {
      let query = `${url}?status=${s}&search=${q}&page=${p}&limit=${l}`;
      if (lang) query += `&languageCode=${lang}`;
      if (cat) query += `&categoryId=${cat}`;
      if (origin) query += `&countryId=${origin}`;
      return adminApi(query).then(res => res.data);
    }
  );

  const displayedPodcasts = data?.items || [];
  const totalItems = data?.pagination?.total ?? data?.total ?? displayedPodcasts.length;
  const counts = data?.counts || { ALL: 0, PENDING: 0, PUBLISHED: 0, SUSPENDED: 0 };
  const TABS = [
    { id: "ALL", label: "Tous", count: counts.ALL || displayedPodcasts.length },
    { id: "PENDING", label: "À valider", count: counts.PENDING || 0 },
    { id: "PUBLISHED", label: "Publiés", count: counts.PUBLISHED || 0 },
    { id: "SUSPENDED", label: "Suspendus", count: counts.SUSPENDED || 0 },
  ];

  const totalPages = limit === 1000 ? 1 : Math.ceil(totalItems / limit);
  
  // Reset page when tab, search or limit changes
  React.useEffect(() => { setPage(1); }, [activeTab, search, limit, langFilter, catFilter, originFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.size === displayedPodcasts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedPodcasts.map((p: any) => p.id)));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async (payload: any) => {
    if (isBulkLoading) return;

    if (payload.action === 'DELETE') {
      if (!window.confirm(`ÃŠtes-vous sûr de vouloir supprimer ces ${selectedIds.size} podcast(s) ? Cette action est irréversible.`)) return;
      setIsBulkLoading(true);
      if (data) {
        const updatedItems = data.items.filter((p: any) => !selectedIds.has(p.id));
        mutate({ ...data, items: updatedItems }, false);
      }
      try {
        await Promise.all(
          Array.from(selectedIds).map((id) =>
            adminApi(`/admin/podcasts/${id}`, { method: "DELETE" })
          )
        );
        await mutate();
        setSelectedIds(new Set());
      } catch (e) {
        alert("Erreur lors de la suppression.");
        mutate();
      } finally {
        setIsBulkLoading(false);
      }
      return;
    }

    setIsBulkLoading(true);
    
    // Mise à jour optimiste immédiate (UI instantanée)
    if (data) {
      const updatedItems = data.items.map((p: any) => 
        selectedIds.has(p.id) ? { ...p, ...payload } : p
      );
      mutate({ ...data, items: updatedItems }, false);
    }

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          adminApi(`/admin/podcasts/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        )
      );
      await mutate();
      setSelectedIds(new Set());
    } catch (e) {
      alert("Une erreur est survenue lors de l'action groupée.");
      mutate(); // Annuler l'optimisme
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleToggleOfficial = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Mise à jour optimiste immédiate (UI instantanée)
    if (data) {
      const updatedItems = data.items.map((p: any) => 
        p.id === id ? { ...p, isOfficial: !currentStatus } : p
      );
      mutate({ ...data, items: updatedItems }, false);
    }

    try {
      await adminApi(`/admin/podcasts/${id}`, {
        method: "PUT",
        body: JSON.stringify({ isOfficial: !currentStatus }),
      });
      mutate();
    } catch (e) {
      alert("Erreur lors de la modification");
      mutate(); // Annuler l'optimisme
    }
  };

  const handleRowClick = (id: string, slug?: string) => {
    router.push(`/admin/podcasts/${slug || id}`);
  };

  const StatusBadge = ({ status }: { status: PodcastStatus }) => {
    if (status === "PUBLISHED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
          <CheckCircle className="w-3.5 h-3.5" /> Publié
        </span>
      );
    }
    if (status === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5" /> À valider
        </span>
      );
    }
    if ((status as string) === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2A2A2A] text-[#B8B8B8] border border-[#3A3A3A]">
          Brouillon
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
        <PauseCircle className="w-3.5 h-3.5" /> Suspendu
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col space-y-6 pb-24 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Mic className="w-8 h-8 text-[#FFBF00]" />
            Podcasts
          </h1>
          <p className="text-[#888888] mt-2">Gérez les émissions de la plateforme, depuis leur ajout jusqu'à leur archivage.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-[#171717] hover:bg-[#262626] border-[#2A2A2A] text-white" onClick={() => router.push("/admin/podcasts/import-rss")}>
            <Rss className="w-4 h-4 mr-2" /> Importer un RSS
          </Button>
          <Button className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold" onClick={() => router.push("/admin/podcasts/new")}>
            <Plus className="w-4 h-4 mr-2" /> Ajouter un podcast
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2A2A2A] overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive 
                  ? "border-[#FFBF00] text-white" 
                  : "border-transparent text-[#757575] hover:text-white"
              }`}
            >
              {tab.label} <span className="bg-[#171717] px-2 py-0.5 rounded-full text-[11px] border border-[#2A2A2A]">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575]" />
          <input 
            type="text" 
            placeholder="Rechercher un podcast ou un créateur..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#171717] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#757575]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="bg-[#171717] hover:bg-[#262626] border border-[#2A2A2A] text-white text-xs h-9 pl-3 pr-8 rounded-md outline-none appearance-none cursor-pointer focus:border-[#FFBF00]"
            >
              <option value="">Toutes les langues</option>
              {languages?.map((l: any) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
            <ChevronRight className="w-3 h-3 text-[#757575] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="bg-[#171717] hover:bg-[#262626] border border-[#2A2A2A] text-white text-xs h-9 pl-3 pr-8 rounded-md outline-none appearance-none cursor-pointer focus:border-[#FFBF00]"
            >
              <option value="">Toutes les catégories</option>
              {categories?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronRight className="w-3 h-3 text-[#757575] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-[#171717] hover:bg-[#262626] border border-[#2A2A2A] text-white text-xs h-9 pl-3 pr-8 rounded-md outline-none appearance-none cursor-pointer focus:border-[#FFBF00]"
            >
              <option value="">Toutes les origines</option>
              {countries?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronRight className="w-3 h-3 text-[#757575] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>

          {(langFilter || catFilter || originFilter) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setLangFilter(""); setCatFilter(""); setOriginFilter(""); }}
              className="text-[#757575] hover:text-white h-9 text-xs"
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Selected Action Bar - Notion Style */}
      {selectedIds.size > 0 && (
        <div className="bg-[#171717] border border-[#2A2A2A] shadow-lg text-white px-4 py-2 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFBF00]/10 text-[#FFBF00] font-bold text-xs px-2.5 py-1 rounded-md">
              {selectedIds.size} sélectionné(s)
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            <Button size="sm" onClick={() => handleBulkAction({ status: "PUBLISHED" })} className="h-8 bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs font-medium border border-[#333333]">
              Publier
            </Button>
            <Button size="sm" onClick={() => handleBulkAction({ status: "SUSPENDED" })} className="h-8 bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs font-medium border border-[#333333]">
              Suspendre
            </Button>
            
            <div className="w-px h-4 bg-[#2A2A2A] mx-1"></div>
            
            <Button size="sm" onClick={() => handleBulkAction({ isOfficial: true })} className="h-8 bg-[#2A2A2A] hover:bg-[#333333] text-blue-400 text-xs font-medium border border-[#333333]">
              Certifier
            </Button>
            <Button size="sm" onClick={() => handleBulkAction({ isOfficial: false })} className="h-8 bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs font-medium border border-[#333333]">
              Décertifier
            </Button>

            <div className="w-px h-4 bg-[#2A2A2A] mx-1"></div>

            <Button size="sm" onClick={() => handleBulkAction({ action: "DELETE" })} className="h-8 bg-[#2A2A2A] hover:bg-[#333333] text-red-400 text-xs font-medium border border-[#333333]">
              Supprimer
            </Button>

            <div className="w-px h-4 bg-[#2A2A2A] mx-1"></div>

            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="text-[#757575] hover:text-white hover:bg-transparent h-8 text-xs font-medium px-2">
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl overflow-hidden">
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto min-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] text-xs font-semibold text-[#757575] uppercase tracking-wider">
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={displayedPodcasts.length > 0 && selectedIds.size === displayedPodcasts.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-[#FFBF00] rounded cursor-pointer bg-[#0B0B0B] border-[#2A2A2A]" 
                  />
                </th>
                <th className="p-4">Podcast</th>
                <th className="p-4">Créateur</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-center">Certifié</th>
                <th className="p-4 text-center">Épisodes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {displayedPodcasts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#757575]">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> : "Aucun podcast trouvé."}
                  </td>
                </tr>
              ) : (
                displayedPodcasts.map((p: any) => {
                  const isSelected = selectedIds.has(p.id);

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => handleRowClick(p.id, p.slug)}
                      className={`hover:bg-[#1C1C1C] cursor-pointer transition-colors group ${isSelected ? "bg-[#FFBF00]/5" : ""}`}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(p.id, e as any)}
                          className="w-4 h-4 accent-[#FFBF00] rounded cursor-pointer bg-[#0B0B0B] border-[#2A2A2A]" 
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.cover || p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-[#0B0B0B] border border-[#2A2A2A]" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white text-sm group-hover:text-[#FFBF00] transition-colors">{p.name}</p>
                            </div>
                            <p className="text-xs text-[#757575] flex items-center gap-1 mt-0.5">
                              {p.primaryLanguageCode || p.languageCode || "N/A"} <span className="opacity-50">Â·</span> {p.categories?.[0]?.category?.name || p.category?.name || "Sans catégorie"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-[#B8B8B8]">{p.creator?.name || p.creatorName || "Inconnu"}</td>
                      <td className="p-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={(e) => handleToggleOfficial(p.id, p.isOfficial, e)}
                          className={`w-9 h-5 rounded-full relative transition-colors ${p.isOfficial ? 'bg-blue-500' : 'bg-[#2A2A2A]'}`}
                          title={p.isOfficial ? "Retirer la certification" : "Certifier"}
                        >
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${p.isOfficial ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </td>
                      <td className="p-4 text-sm font-bold text-center text-[#B8B8B8]">{p._count?.episodes || p.episodesCount || 0}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-[#757575] hover:text-[#FFBF00] hover:bg-[#2A2A2A]" onClick={() => handleRowClick(p.id, p.slug)} title="Modifier">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-[#757575] hover:text-white hover:bg-[#2A2A2A]" onClick={() => window.open(`/podcast/${p.slug || p.id}`, '_blank')} title="Voir la page publique">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-[#757575] hover:text-red-400 hover:bg-[#2A2A2A]" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Compact Cards */}
        <div className="md:hidden divide-y divide-[#2A2A2A]">
          {displayedPodcasts.map((p: any) => (

            <div key={p.id} className="p-4 space-y-3" onClick={() => handleRowClick(p.id, p.slug)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(p.id)}
                    onChange={(e) => handleToggleSelect(p.id, e as any)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-[#FFBF00] rounded mt-1" 
                  />
                  <img src={p.cover || p.image} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-[#2A2A2A]" />
                  <div>
                    <p className="font-bold text-white text-sm">{p.name}</p>
                    <p className="text-xs text-[#757575]">{p.creator?.name || p.creatorName || "Inconnu"}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-[#757575] -mr-2" onClick={(e) => { e.stopPropagation(); }}>
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between pl-7">
                <StatusBadge status={p.status} />
                <Button size="sm" variant="ghost" className="h-7 text-xs px-2 bg-[#2A2A2A]/50 text-white hover:bg-[#2A2A2A]" onClick={(e) => { e.stopPropagation(); handleRowClick(p.id, p.slug); }}>
                  Gérer
                </Button>
              </div>
            </div>

          ))}
          {displayedPodcasts.length === 0 && (
            <div className="p-8 text-center text-[#757575] text-sm">Aucun podcast trouvé.</div>
          )}
        </div>


        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#2A2A2A] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#757575] bg-[#171717]">
          <div className="flex items-center gap-3">
            <span>Afficher par page:</span>
            <select 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-[#0B0B0B] border border-[#2A2A2A] rounded px-2 py-1 text-white outline-none focus:border-[#FFBF00]"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={1000}>Tous</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <span>{displayedPodcasts.length > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, totalItems)} sur {totalItems}</span>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                disabled={page <= 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="h-7 px-2 text-[#757575] hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                disabled={page >= totalPages || loading}
                onClick={() => setPage(p => p + 1)}
                className="h-7 px-2 text-[#B8B8B8] hover:text-white disabled:opacity-50"
              >
                Suivant <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

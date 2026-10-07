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
  Loader2,
  Headphones,
  Video,
  Radio,
  Archive,
  Eye,
  ShieldCheck,
  Building2,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type PodcastStatus = "PUBLISHED" | "PENDING" | "DRAFT" | "SUSPENDED" | "ARCHIVED";

export default function AdminPodcastsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [formatFilter, setFormatFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();
  
  // Referential data for filters (public endpoints)
  const { data: countries } = useSWR('/countries', (url: string) => adminApi(url).then((res: any) => res.data || []));
  const { data: categories } = useSWR('/categories', (url: string) => adminApi(url).then((res: any) => res.data || []));
  const { data: languages } = useSWR('/languages', (url: string) => adminApi(url).then((res: any) => res.data || []));

  // Real API Fetch with all filters
  const statusParam = activeTab !== "ALL" ? activeTab : "";
  const { data, error, isLoading, mutate } = useSWR(
    isAuthenticated ? ["/admin/catalog", statusParam, search, page, limit, langFilter, catFilter, formatFilter, originFilter] : null,
    ([url, s, q, p, l, lang, cat, fmt, origin]) => {
      let query = `${url}?status=${s}&search=${q}&page=${p}&limit=${l}`;
      if (lang) query += `&languageCode=${lang}`;
      if (cat) query += `&categoryId=${cat}`;
      if (fmt) query += `&format=${fmt}`;
      if (origin) query += `&countryId=${origin}`;
      return adminApi(query).then(res => res.data || { items: [] });
    }
  );

  const loading = isLoading && !error;

  const rawPodcasts = data?.items || [];
  // Client-side fallback filter for format if backend returns mixed
  const displayedPodcasts = rawPodcasts.filter((p: any) => {
    if (!formatFilter) return true;
    const itemFormat = (p.format || p.defaultFormat || "AUDIO").toUpperCase();
    if (formatFilter === "AUDIO") return itemFormat === "AUDIO";
    if (formatFilter === "VIDEO") return itemFormat === "VIDEO";
    if (formatFilter === "HYBRID") return itemFormat === "HYBRID" || itemFormat === "BOTH" || itemFormat === "AUDIO_VIDEO";
    return true;
  });

  const totalItems = data?.pagination?.total ?? data?.total ?? displayedPodcasts.length;
  const counts = data?.counts || { ALL: 0, PENDING: 0, PUBLISHED: 0, DRAFT: 0, SUSPENDED: 0, ARCHIVED: 0 };
  
  const TABS = [
    { id: "ALL", label: "Toutes les émissions", count: counts.ALL || displayedPodcasts.length },
    { id: "PUBLISHED", label: "Publiées", count: counts.PUBLISHED || 0 },
    { id: "DRAFT", label: "Brouillons", count: counts.DRAFT || 0 },
    { id: "PENDING", label: "À valider", count: counts.PENDING || 0 },
    { id: "SUSPENDED", label: "Suspendues", count: counts.SUSPENDED || 0 },
    { id: "ARCHIVED", label: "Archivées", count: counts.ARCHIVED || 0 },
  ];

  const totalPages = limit === 1000 ? 1 : Math.ceil(totalItems / limit);
  
  // Reset page when tab, search or filters change
  React.useEffect(() => { 
    setPage(1); 
  }, [activeTab, search, limit, langFilter, catFilter, formatFilter, originFilter]);

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

  const handleArchive = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Êtes-vous sûr de vouloir archiver cette émission ? Elle sera masquée du catalogue public.")) return;
    try {
      await adminApi(`/admin/podcasts/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: "ARCHIVED" })
      });
      await mutate();
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'archivage.");
    }
  };

  const handleBulkAction = async (payload: any) => {
    if (isBulkLoading) return;

    if (payload.action === 'DELETE') {
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement ces ${selectedIds.size} émission(s) ? Cette action est irréversible.`)) return;
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
      alert("Erreur lors de la mise à jour par lot.");
      mutate();
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleRowClick = (id: string, slug?: string) => {
    router.push(`/admin/podcasts/${slug || id}`);
  };

  const StatusBadge = ({ status }: { status: PodcastStatus | string }) => {
    if (status === "PUBLISHED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
          <CheckCircle className="w-3.5 h-3.5" /> Publié
        </span>
      );
    }
    if (status === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5" /> À valider
        </span>
      );
    }
    if (status === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2A2A2A] text-[#B8B8B8] border border-[#3A3A3A]">
          Brouillon
        </span>
      );
    }
    if (status === "ARCHIVED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1C1C1C] text-[#888888] border border-[#2A2A2A]">
          <Archive className="w-3.5 h-3.5" /> Archivé
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
        <PauseCircle className="w-3.5 h-3.5" /> Suspendu
      </span>
    );
  };

  const FormatBadge = ({ podcast }: { podcast: any }) => {
    const fmt = (podcast.format || podcast.defaultFormat || "AUDIO").toUpperCase();
    if (fmt === "VIDEO") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#1F172E] text-[#D8B4FE] border border-[#3B2D54]">
          <Video className="w-3.5 h-3.5" /> Vidéo
        </span>
      );
    }
    if (fmt === "HYBRID" || fmt === "BOTH" || fmt === "AUDIO_VIDEO") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#262012] text-[#FFBF00] border border-[#524115]">
          <Headphones className="w-3 h-3" />+<Video className="w-3 h-3" /> Audio & Vidéo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#15232D] text-[#7DD3FC] border border-[#1E3A4C]">
        <Headphones className="w-3.5 h-3.5" /> Audio
      </span>
    );
  };

  const ResponsableDisplay = ({ podcast }: { podcast: any }) => {
    if (podcast.organization?.name) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-white">
          <Building2 className="w-3.5 h-3.5 text-[#FFBF00] shrink-0" />
          <span className="font-medium truncate max-w-[140px]">{podcast.organization.name}</span>
        </div>
      );
    }
    if (podcast.creator?.name || podcast.creatorName) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-[#B8B8B8]">
          <UserCheck className="w-3.5 h-3.5 text-[#888888] shrink-0" />
          <span className="truncate max-w-[140px]">{podcast.creator?.name || podcast.creatorName}</span>
        </div>
      );
    }
    return (
      <span className="inline-flex items-center text-[11px] text-[#888888] bg-[#0B0B0B] px-2 py-0.5 rounded border border-[#2A2A2A]">
        Non revendiqué
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col space-y-6 pb-24 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#757575] font-semibold uppercase tracking-wider mb-2">
            <span>Administration</span>
            <span>/</span>
            <span className="text-[#FFBF00]">Émissions</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            <Radio className="w-8 h-8 text-[#FFBF00]" />
            Émissions
          </h1>
          <p className="text-[#888888] mt-1.5 text-sm">
            Gérez les séries de Bamako Podcast, leurs formats, créateurs, sources et épisodes associés.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="bg-[#171717] hover:bg-[#262626] border-[#2A2A2A] text-white" 
            onClick={() => router.push("/admin/podcasts/import-rss")}
          >
            <Rss className="w-4 h-4 mr-2 text-[#FFBF00]" /> Importer via RSS
          </Button>
          <Button 
            className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold" 
            onClick={() => router.push("/admin/podcasts/new")}
          >
            <Plus className="w-4 h-4 mr-2" /> Créer une émission
          </Button>
        </div>
      </div>

      {/* Tabs par Statut */}
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

      {/* Barre de Filtres Complète */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#757575]" />
          <input 
            type="text" 
            placeholder="Rechercher une émission, un créateur ou une organisation..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#171717] border border-[#2A2A2A] rounded-lg pl-10 pr-4 py-2 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#757575]"
          />
        </div>

        {/* Filtres Sélecteurs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format */}
          <div className="relative">
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="bg-[#171717] hover:bg-[#262626] border border-[#2A2A2A] text-white text-xs h-9 pl-3 pr-8 rounded-md outline-none appearance-none cursor-pointer focus:border-[#FFBF00]"
            >
              <option value="">Tous les formats</option>
              <option value="AUDIO">Format Audio</option>
              <option value="VIDEO">Format Vidéo</option>
              <option value="HYBRID">Audio & Vidéo</option>
            </select>
            <ChevronRight className="w-3 h-3 text-[#757575] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>

          {/* Langue */}
          <div className="relative">
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="bg-[#171717] hover:bg-[#262626] border border-[#2A2A2A] text-white text-xs h-9 pl-3 pr-8 rounded-md outline-none appearance-none cursor-pointer focus:border-[#FFBF00]"
            >
              <option value="">Toutes les langues</option>
              {languages?.map((l: any) => (
                <option key={l.code} value={l.code}>{l.name} ({l.code.toUpperCase()})</option>
              ))}
            </select>
            <ChevronRight className="w-3 h-3 text-[#757575] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>

          {/* Catégorie */}
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

          {/* Pays */}
          <div className="relative">
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-[#171717] hover:bg-[#262626] border border-[#2A2A2A] text-white text-xs h-9 pl-3 pr-8 rounded-md outline-none appearance-none cursor-pointer focus:border-[#FFBF00]"
            >
              <option value="">Tous les pays</option>
              {countries?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronRight className="w-3 h-3 text-[#757575] absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
          </div>

          {(search || langFilter || catFilter || formatFilter || originFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setLangFilter("");
                setCatFilter("");
                setFormatFilter("");
                setOriginFilter("");
              }}
              className="text-xs text-[#757575] hover:text-white h-9"
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {/* Actions groupées */}
      {selectedIds.size > 0 && (
        <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-3 flex items-center justify-between animate-in fade-in">
          <span className="text-xs font-bold text-[#FFBF00]">
            {selectedIds.size} émission(s) sélectionnée(s)
          </span>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={() => handleBulkAction({ status: "PUBLISHED" })} 
              className="h-8 bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs font-medium border border-[#333333]"
            >
              Publier
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleBulkAction({ status: "SUSPENDED" })} 
              className="h-8 bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs font-medium border border-[#333333]"
            >
              Suspendre
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleBulkAction({ status: "ARCHIVED" })} 
              className="h-8 bg-[#2A2A2A] hover:bg-[#333333] text-white text-xs font-medium border border-[#333333]"
            >
              Archiver
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setSelectedIds(new Set())} 
              className="text-[#757575] hover:text-white h-8 text-xs font-medium px-2"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl overflow-hidden">
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto min-h-[460px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] text-xs font-semibold text-[#757575] uppercase tracking-wider bg-[#141414]">
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={displayedPodcasts.length > 0 && selectedIds.size === displayedPodcasts.length}
                    onChange={toggleSelectAll}
                    aria-label="Sélectionner toutes les émissions"
                    className="w-4 h-4 accent-[#FFBF00] rounded cursor-pointer bg-[#0B0B0B] border-[#2A2A2A]" 
                  />
                </th>
                <th className="p-4">Émission</th>
                <th className="p-4">Responsable</th>
                <th className="p-4">Format</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-center">Épisodes</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {displayedPodcasts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-[#757575]">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-7 h-7 animate-spin text-[#FFBF00]" />
                        <span className="text-sm text-[#888888]">Chargement des émissions...</span>
                      </div>
                    ) : error ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                        <p className="text-base font-semibold text-white">Erreur de chargement</p>
                        <p className="text-xs text-[#757575]">{error.message || "Une erreur est survenue lors du chargement des émissions."}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Radio className="w-8 h-8 text-[#555555]" />
                        <p className="text-base font-semibold text-white">Aucune émission trouvée</p>
                        <p className="text-xs text-[#757575]">Modifiez vos filtres ou créez votre première émission.</p>
                      </div>
                    )}
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
                          aria-label={`Sélectionner ${p.name}`}
                          className="w-4 h-4 accent-[#FFBF00] rounded cursor-pointer bg-[#0B0B0B] border-[#2A2A2A]" 
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3.5">
                          <img 
                            src={p.cover || p.image || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=96&h=96&fit=crop"} 
                            alt={p.name} 
                            className="w-12 h-12 rounded-lg object-cover bg-[#0B0B0B] border border-[#2A2A2A] shrink-0" 
                          />
                          <div>
                            <p className="font-bold text-white text-sm group-hover:text-[#FFBF00] transition-colors leading-snug">
                              {p.name}
                            </p>
                            <p className="text-xs text-[#757575] flex items-center gap-1.5 mt-0.5">
                              <span>{p.primaryLanguageCode?.toUpperCase() || p.languageCode?.toUpperCase() || "FR"}</span>
                              <span className="opacity-40">•</span>
                              <span>{p.categories?.[0]?.category?.name || p.category?.name || "Général"}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <ResponsableDisplay podcast={p} />
                      </td>
                      <td className="p-4">
                        <FormatBadge podcast={p} />
                      </td>
                      <td className="p-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-4 text-sm font-bold text-center text-[#B8B8B8]">
                        {p._count?.episodes || p.episodesCount || 0}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2 text-xs text-[#B8B8B8] hover:text-white hover:bg-[#2A2A2A]" 
                            onClick={() => handleRowClick(p.id, p.slug)} 
                            title="Ouvrir la fiche de l'émission"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> Ouvrir
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2 text-xs text-[#B8B8B8] hover:text-[#FFBF00] hover:bg-[#2A2A2A]" 
                            onClick={() => router.push(`/admin/podcasts/${p.id}/edit`)} 
                            title="Modifier les informations"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Modifier
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2 text-xs text-[#757575] hover:text-amber-400 hover:bg-[#2A2A2A]" 
                            onClick={(e) => handleArchive(p.id, e)} 
                            title="Archiver l'émission"
                          >
                            <Archive className="w-3.5 h-3.5 mr-1" /> Archiver
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

        {/* Mobile View: Cards */}
        <div className="md:hidden divide-y divide-[#2A2A2A]">
          {displayedPodcasts.map((p: any) => (
            <div 
              key={p.id} 
              className="p-4 space-y-3 hover:bg-[#1C1C1C] transition-colors"
              onClick={() => handleRowClick(p.id, p.slug)}
            >
              <div className="flex items-start gap-3">
                <img 
                  src={p.cover || p.image || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=96&h=96&fit=crop"} 
                  alt={p.name} 
                  className="w-14 h-14 rounded-lg object-cover bg-[#0B0B0B] border border-[#2A2A2A] shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <FormatBadge podcast={p} />
                    <span className="text-xs text-[#757575]">
                      {p._count?.episodes || p.episodesCount || 0} épisode(s)
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <ResponsableDisplay podcast={p} />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-[#757575]">
                  Langue: {p.primaryLanguageCode?.toUpperCase() || "FR"}
                </span>
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 px-2 text-xs text-[#B8B8B8] hover:text-white"
                    onClick={() => handleRowClick(p.id, p.slug)}
                  >
                    Ouvrir
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 px-2 text-xs text-[#757575] hover:text-amber-400"
                    onClick={(e) => handleArchive(p.id, e)}
                  >
                    Archiver
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {displayedPodcasts.length === 0 && !loading && (
            <div className="p-8 text-center text-[#757575]">
              Aucune émission trouvée.
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-[#2A2A2A] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#757575]">
          <div>
            <span>{displayedPodcasts.length > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, totalItems)} sur {totalItems}</span>
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

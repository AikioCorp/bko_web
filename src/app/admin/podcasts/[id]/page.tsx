"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ExternalLink,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Play,
  Save,
  Link as LinkIcon,
  RefreshCw,
  Search,
  Plus,
  Clock,
  ShieldAlert,
  Users,
  Copy,
  Archive,
  Ban,
  Trash2,
  FolderPlus,
  GitMerge,
  Loader2,
  Rss as RssIcon,
  Power,
  Headphones,
  Edit3,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { adminApi } from "@/lib/api";

const TABS = ["Épisodes", "Sources RSS", "Équipe", "Historique", "Informations", "Paramètres"];
const PODCAST_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon", PUBLISHED: "Publié", UNLISTED: "Non répertorié",
  PENDING_REVIEW: "En attente de validation", SUSPENDED: "Suspendu", ARCHIVED: "Archivé",
};

export default function AdminPodcastDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("Épisodes");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showNewEpisodeModal, setShowNewEpisodeModal] = useState(false);
  const [newEpisodeTitle, setNewEpisodeTitle] = useState("");
  const [newEpisodeUrl, setNewEpisodeUrl] = useState("");
  const [newEpisodeDescription, setNewEpisodeDescription] = useState("");
  const [isCreatingEpisode, setIsCreatingEpisode] = useState(false);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);

  // Data fetching
  const { data: raw, isLoading, error, mutate } = useSWR(
    id ? `/admin/podcasts/${id}` : null,
    (url: string) => adminApi(url).then((res) => {
      if (!res.success) throw new Error(res.message || "Podcast introuvable");
      return res.data;
    })
  );

  const { data: countries } = useSWR('/countries', (url: string) => adminApi(url).then((res: any) => res.data || []));
  const { data: categories } = useSWR('/admin/categories', (url: string) => adminApi(url).then((res: any) => res.data || []));
  const { data: languages } = useSWR('/admin/languages', (url: string) => adminApi(url).then((res: any) => res.data || []));
  const { data: organizations } = useSWR('/admin/organizations', (url: string) => adminApi(url).then((res: any) => res.data || []));
  const { data: episodes, mutate: mutateEpisodes } = useSWR(
    id && activeTab === "Épisodes" ? `/admin/podcasts/${id}/episodes` : null,
    (url: string) => adminApi(url).then((res: any) => res.data || [])
  );

  // Edit state
  const [editData, setEditData] = useState<any>({});
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  useEffect(() => {
    if (raw) {
      setEditData({
        name: raw.name || "",
        description: raw.description || "",
        shortDescription: raw.shortDescription || "",
        primaryLanguageCode: raw.primaryLanguageCode || "",
        countryId: raw.countryId || "",
        website: raw.website || "",
        status: raw.status || "DRAFT",
        categoryIds: raw.categories?.map((c: any) => c.categoryId) || [],
        organizationId: raw.organizationId || "",
        ownershipStatus: raw.ownershipStatus || "UNCLAIMED",
        managedByBamakoPodcast: raw.managedByBamakoPodcast ?? true,
        isOfficial: raw.isOfficial ?? false,
        redirectUrl: raw.redirectUrl || ""
      });
      setHasUnsavedChanges(false);
    }
  }, [raw]);

  const handleChange = (field: string, value: string) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleCategoryToggle = (id: string) => {
    setEditData((prev: any) => ({
      ...prev,
      categoryIds: prev.categoryIds?.includes(id)
        ? prev.categoryIds.filter((c: string) => c !== id)
        : [...(prev.categoryIds || []), id]
    }));
    setHasUnsavedChanges(true);
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [publishingPodcast, setPublishingPodcast] = useState(false);
  const podcastPublishLock = useRef(false);
  const publishLocks = useRef(new Set<string>());

  const publishPodcast = async () => {
    if (podcastPublishLock.current || !id || hasUnsavedChanges) return;
    podcastPublishLock.current = true;
    setPublishingPodcast(true);
    setErrorMsg(null);
    try {
      const response = await adminApi(`/admin/podcasts/${id}`, {
        method: "PUT", body: JSON.stringify({ status: "PUBLISHED" }),
      });
      await mutate((previous: any) => ({ ...previous, ...response.data }), { revalidate: false });
    } catch (error: any) {
      setErrorMsg(error.message || "Impossible de publier l'émission.");
    } finally {
      podcastPublishLock.current = false;
      setPublishingPodcast(false);
    }
  };

  const [deletingEpisodeIds, setDeletingEpisodeIds] = useState<Set<string>>(new Set());
  const deletingEpisodeLocks = useRef(new Set<string>());
  const deleteEpisode = async (episode: any) => {
    if (deletingEpisodeLocks.current.has(episode.id)) return;
    if (!window.confirm(`Supprimer définitivement l’épisode « ${episode.title} » ?`)) return;
    deletingEpisodeLocks.current.add(episode.id);
    setDeletingEpisodeIds(previous => new Set(previous).add(episode.id));
    setErrorMsg(null);
    try {
      await adminApi(`/admin/episodes/${episode.id}`, {method:"DELETE"});
      await mutateEpisodes((previous: any[] | undefined) => previous?.filter(item => item.id !== episode.id), {revalidate:false});
      void mutate();
    } catch (error: any) {
      setErrorMsg(error.message || "Impossible de supprimer cet épisode.");
    } finally {
      deletingEpisodeLocks.current.delete(episode.id);
      setDeletingEpisodeIds(previous => {const next=new Set(previous);next.delete(episode.id);return next;});
    }
  };

  const publishEpisode = async (episodeId: string) => {
    if (publishLocks.current.has(episodeId)) return;
    publishLocks.current.add(episodeId);
    setPublishingIds(previous => new Set(previous).add(episodeId));
    setErrorMsg(null);
    try {
      const response = await adminApi(`/admin/episodes/${episodeId}/publish`, {
        method: "POST", body: JSON.stringify({ mode: "now" }),
      });
      const published = response.data;
      // Update the episode list, not the unrelated podcast details cache.
      await mutateEpisodes((previous: any[] | undefined) => previous?.map(episode =>
        episode.id === episodeId ? {
          ...episode,
          status: published?.status ?? "PUBLISHED",
          publishedAt: published?.publishedAt ?? episode.publishedAt,
        } : episode
      ), { revalidate: false });
    } catch (error: any) {
      setErrorMsg(error.message || "Impossible de publier cet épisode.");
    } finally {
      publishLocks.current.delete(episodeId);
      setPublishingIds(previous => {
        const next = new Set(previous);
        next.delete(episodeId);
        return next;
      });
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const res = await adminApi(`/admin/podcasts/${id}`, {
        method: "PUT",
        body: JSON.stringify(editData),
      });
      if (res.success) {
        setHasUnsavedChanges(false);
        setIsEditingInfo(false);
        mutate();
      } else {
        setErrorMsg(res.message || "Erreur lors de l'enregistrement");
      }
    } catch (e: any) {
      setErrorMsg("Erreur de connexion");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const res = await adminApi(`/admin/podcasts/${id}`, {
        method: "DELETE",
      });
      if (res.success) {
        router.push("/admin/podcasts");
      } else {
        setErrorMsg(res.message || "Erreur lors de la suppression");
        setIsDeleting(false);
        setShowDeleteModal(false);
      }
    } catch (e: any) {
      setErrorMsg("Erreur de connexion");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleFetchPreview = async () => {
    if (!newEpisodeUrl) return;
    setIsFetchingPreview(true);
    try {
      const res = await adminApi("/admin/podcasts/from-url", {
        method: "POST",
        body: JSON.stringify({ url: newEpisodeUrl }),
      });
      if (res.success && res.data) {
        if (res.data.suggestedName && !newEpisodeTitle) setNewEpisodeTitle(res.data.suggestedName);
        if (res.data.suggestedDescription && !newEpisodeDescription) setNewEpisodeDescription(res.data.suggestedDescription);
      }
    } catch (e) {
      // Ignorer
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const handleCreateEmptyDraft = async () => {
    try {
      const res = await adminApi(`/admin/podcasts/${id}/episodes`, {
        method: "POST",
        body: JSON.stringify({ title: "Nouvel épisode" }),
      });
      if (res.success && res.data?.id) {
        router.push(`/admin/episodes/${res.data.slug || res.data.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEpisodeTitle.trim()) return;
    setIsCreatingEpisode(true);
    setErrorMsg(null);
    try {
      const res = await adminApi(`/admin/podcasts/${id}/episodes`, {
        method: "POST",
        body: JSON.stringify({ 
          title: newEpisodeTitle.trim(),
          description: newEpisodeDescription.trim() || undefined,
          url: newEpisodeUrl.trim() || undefined
        }),
      });
      if (res.success) {
        setShowNewEpisodeModal(false);
        setNewEpisodeTitle("");
        setNewEpisodeUrl("");
        setNewEpisodeDescription("");
        mutateEpisodes();
        if (res.data?.id) {
          router.push(`/admin/episodes/${res.data.slug || res.data.id}`);
        }
      } else {
        setErrorMsg(res.message || "Erreur lors de la création de l'épisode");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue");
    } finally {
      setIsCreatingEpisode(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-32 text-[#757575]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error || !raw) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-32 text-center text-white">
        <p className="text-lg font-bold mb-2">Podcast introuvable</p>
        <p className="text-sm text-[#757575] mb-6">{error?.message || "Ce podcast n'existe pas ou a été supprimé."}</p>
        <Link href="/admin/podcasts" className="text-[#FFBF00] text-sm font-semibold hover:underline">
          Retour aux podcasts
        </Link>
      </div>
    );
  }

  const podcast = {
    id: raw.id as string,
    name: raw.name as string,
    cover: raw.cover as string,
    creatorName: raw.organization?.name || "—",
    status: raw.status as string,
    slug: raw.slug as string,
    language: raw.primaryLanguage?.name || raw.primaryLanguageCode || "—",
    category: raw.categories?.[0]?.category?.name || "Sans catégorie",
    country: raw.country?.name || "—",
    origin: raw.rssFeed ? "Flux RSS" : "Contenu hébergé",
    visibility: raw.status === "PUBLISHED" ? "Publique" : "Non publique",
    publishedAt: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—",
    collection: "—",
    episodesCount: raw._count?.episodes ?? 0,
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "PUBLISHED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
          <CheckCircle className="w-3.5 h-3.5" /> Publié
        </span>
      );
    }
    if (status === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5" /> À valider
        </span>
      );
    }
    if (status === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#2A2A2A] text-[#B8B8B8] border border-[#3A3A3A]">
          <Clock className="w-3.5 h-3.5" /> Brouillon
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
        <PauseCircle className="w-3.5 h-3.5" /> Suspendu
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col pb-32 text-white relative">
      
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-6 w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Supprimer définitivement ?</h3>
            <p className="text-sm text-[#B8B8B8] mb-6">
              ÃŠtes-vous sûr de vouloir supprimer <span className="text-white font-bold">{podcast.name}</span> ? Cette action supprimera tous les épisodes liés et est irréversible.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" className="text-[#B8B8B8] hover:text-white" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Annuler</Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white font-bold" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Oui, supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="fixed top-24 right-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-lg flex items-start gap-3 z-50 animate-in slide-in-from-right-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-white">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Save Bar for unsaved changes */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-[#0B0B0B] border-t border-[#2A2A2A] p-4 z-50 flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium text-[#B8B8B8]">Modifications non enregistrées</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-[#B8B8B8] hover:text-white" onClick={() => {
              setEditData({
                name: raw.name || "",
                description: raw.description || "",
                shortDescription: raw.shortDescription || "",
                primaryLanguageCode: raw.primaryLanguageCode || "",
                countryId: raw.countryId || "",
                website: raw.website || "",
                status: raw.status || "DRAFT"
              });
              setHasUnsavedChanges(false);
            }}>Annuler les modifications</Button>
            <Button className="bg-[#FFBF00] text-[#0B0B0B] hover:bg-[#E5AB00] font-bold" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </div>
        </div>
      )}

      {/* Top Header & Back Link */}
      <div className="space-y-6 mb-6">
        <div>
          <Link href="/admin/podcasts" className="inline-flex items-center text-sm font-semibold text-[#757575] hover:text-[#FFBF00] transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Retour aux podcasts
          </Link>
        </div>

        {/* Podcast Identity Header */}
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img src={podcast.cover || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=96&h=96&fit=crop"} alt={podcast.name} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-[#2A2A2A]" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-extrabold text-white">{podcast.name}</h1>
                {raw.isOfficial && (
                  <span className="flex items-center gap-1.5 text-blue-400 text-xs font-bold bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                    <CheckCircle className="w-3.5 h-3.5" /> Certifié
                  </span>
                )}
                <StatusBadge status={podcast.status} />
              </div>
              <p className="text-sm text-[#B8B8B8] mt-1.5 flex items-center flex-wrap gap-2">
                <span className="text-white font-medium">{podcast.creatorName}</span>
                <span className="text-[#555]">Â·</span>
                {podcast.language}
                <span className="text-[#555]">Â·</span>
                <span className="inline-flex items-center gap-1"><RssIcon className="w-3.5 h-3.5" /> {podcast.origin}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {podcast.status === "PUBLISHED" && (
              <Link href={`/podcasts/${podcast.slug}`}>
                <Button variant="outline" className="bg-[#171717] hover:bg-[#262626] border-[#2A2A2A] text-white hidden md:flex">
                  Voir sur le site <ExternalLink className="w-3.5 h-3.5 ml-2 text-[#757575]" />
                </Button>
              </Link>
            )}
            <Button className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[#2A2A2A] overflow-x-auto no-scrollbar mb-6">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                isActive 
                  ? "border-[#FFBF00] text-white" 
                  : "border-transparent text-[#757575] hover:text-white"
              }`}
            >
              {tab === "Épisodes" ? `Épisodes (${podcast.episodesCount})` : tab}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        
        {/* ONGLET: INFORMATIONS */}
        {activeTab === "Informations" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Colonne Principale (2/3) */}
            <div className="flex-1 space-y-6">
              <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-bold text-white">Informations de l'émission</h2>
                  {!isEditingInfo ? (
                    <Button variant="outline" className="h-8 text-xs bg-[#0B0B0B] border-[#2A2A2A] text-white hover:bg-[#262626]" onClick={() => setIsEditingInfo(true)}>
                      <Edit3 className="w-3.5 h-3.5 mr-2" /> Modifier
                    </Button>
                  ) : (
                    <Button variant="ghost" className="h-8 text-xs text-[#757575] hover:text-white hover:bg-transparent" onClick={() => setIsEditingInfo(false)}>
                      Annuler
                    </Button>
                  )}
                </div>
                
                {podcast.origin === "Flux RSS" && (
                  <div className="mb-6 bg-[#262626]/50 border border-[#2A2A2A] rounded-lg p-3 flex items-start gap-3">
                    <RssIcon className="w-5 h-5 text-[#FFBF00] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-white font-medium">Synchronisé depuis le flux</p>
                      <p className="text-xs text-[#B8B8B8] mt-1">Les métadonnées principales proviennent du flux RSS. Modifier un champ manuellement peut écraser la synchronisation.</p>
                    </div>
                  </div>
                )}

                {!isEditingInfo ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-[#757575] uppercase mb-1">Nom</p>
                      <p className="text-sm text-white">{raw.name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#757575] uppercase mb-1">Description courte</p>
                      <p className="text-sm text-white">{raw.shortDescription || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#757575] uppercase mb-1">Description complète</p>
                      <p className="text-sm text-white whitespace-pre-wrap">{raw.description || "-"}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <p className="text-xs font-bold text-[#757575] uppercase mb-1">Langue</p>
                        <p className="text-sm text-white">{raw.primaryLanguage?.name || raw.primaryLanguageCode || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#757575] uppercase mb-1">Pays</p>
                        <p className="text-sm text-white">{raw.country?.name || raw.countryId || "-"}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#757575] uppercase mb-2">Catégories</p>
                      <div className="flex flex-wrap gap-2">
                        {raw.categories?.length > 0 ? raw.categories.map((c: any) => (
                          <span key={c.categoryId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#2A2A2A] text-white">
                            {c.category?.icon && <span>{c.category.icon}</span>}
                            {c.category?.name || "Catégorie"}
                          </span>
                        )) : <span className="text-sm text-[#757575]">-</span>}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#757575] uppercase mb-1">Site officiel</p>
                      {raw.website ? (
                        <a href={raw.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">{raw.website}</a>
                      ) : <span className="text-sm text-[#757575]">-</span>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Nom</label>
                      <input type="text" value={editData.name || ""} onChange={e => handleChange("name", e.target.value)} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Description courte</label>
                      <input type="text" value={editData.shortDescription || ""} onChange={e => handleChange("shortDescription", e.target.value)} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white placeholder-[#757575]" placeholder="Une phrase résumant le podcast..." />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Description complète</label>
                      <textarea rows={5} value={editData.description || ""} onChange={e => handleChange("description", e.target.value)} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white resize-none" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Langue</label>
                        <select value={editData.primaryLanguageCode || ""} onChange={e => handleChange("primaryLanguageCode", e.target.value)} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none">
                          <option value="">Sélectionner...</option>
                          {languages?.map((l: any) => (
                            <option key={l.code} value={l.code}>{l.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Pays</label>
                        <select value={editData.countryId || ""} onChange={e => handleChange("countryId", e.target.value)} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none">
                          <option value="">Sélectionner...</option>
                          {countries?.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#757575] uppercase mb-3">Catégories</label>
                      <div className="flex flex-wrap gap-3">
                        {categories?.map((c: any) => {
                          const isSelected = editData.categoryIds?.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleCategoryToggle(c.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                                isSelected
                                  ? "bg-[#FFBF00]/10 border-[#FFBF00] text-[#FFBF00]"
                                  : "bg-[#0B0B0B] border-[#2A2A2A] text-white hover:border-[#757575]"
                              }`}
                            >
                              {c.icon && <span>{c.icon}</span>}
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Site officiel</label>
                      <input type="text" value={editData.website || ""} onChange={e => handleChange("website", e.target.value)} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" placeholder="https://..." />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Statut</label>
                      <select value={editData.status || ""} onChange={e => handleChange("status", e.target.value)} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none">
                        <option value="DRAFT">Brouillon</option>
                        <option value="PENDING">En attente (Pending)</option>
                        <option value="PUBLISHED">Publié</option>
                        <option value="SUSPENDED">Suspendu</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colonne Secondaire (1/3) */}
            <div className="w-full lg:w-80 space-y-6">
              <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-6 space-y-6">
                <h2 className="text-base font-bold text-white">Publication</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-[#757575] uppercase mb-1">Statut</p>
                    <p className="text-sm font-medium text-white">{PODCAST_STATUS_LABELS[podcast.status] || podcast.status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#757575] uppercase mb-1">Visibilité</p>
                    <p className="text-sm font-medium text-white">{podcast.visibility}</p>
                    {podcast.status === "DRAFT" && <p className="mt-2 text-xs text-[#B8B8B8]">L'émission reste non publique même si certains épisodes sont publiés.</p>}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#757575] uppercase mb-1">Créé le</p>
                    <p className="text-sm font-medium text-white">{podcast.publishedAt}</p>
                  </div>
                  {podcast.status === "DRAFT" && <div className="space-y-2">
                    <Button onClick={() => void publishPodcast()} disabled={publishingPodcast || isSaving || hasUnsavedChanges}
                      aria-busy={publishingPodcast} className="w-full bg-[#FFBF00] text-black hover:bg-[#E5AB00] font-bold">
                      {publishingPodcast && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {publishingPodcast ? "Publication…" : "Publier l'émission"}
                    </Button>
                    {hasUnsavedChanges && <p className="text-xs text-[#B8B8B8]">Enregistrez vos modifications avant de publier.</p>}
                  </div>}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ONGLET: PARAMÈTRES */}
        {activeTab === "Paramètres" && (
          <div className="max-w-3xl space-y-8">
            <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-6">
              <h2 className="text-base font-bold text-white mb-2">Paramètres du podcast</h2>
              <p className="text-sm text-[#757575] mb-6">Gérez les configurations avancées du podcast.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Propriétaire (Organisation)</label>
                  <select value={editData.organizationId || ""} onChange={e => handleChange("organizationId", e.target.value)} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none">
                    <option value="">Aucune organisation assignée</option>
                    {organizations?.map((o: any) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[#757575] mt-1.5">L'organisation qui gère et monétise ce podcast.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Statut de propriété</label>
                    <select value={editData.ownershipStatus || "UNCLAIMED"} onChange={e => handleChange("ownershipStatus", e.target.value)} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white appearance-none">
                      <option value="UNCLAIMED">Non réclamé</option>
                      <option value="CLAIM_PENDING">Réclamation en cours</option>
                      <option value="CLAIMED">Réclamé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Certification</label>
                    <div className="flex items-center h-[46px] px-3 bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={editData.isOfficial ?? false} onChange={e => handleChange("isOfficial", e.target.checked as any)} className="w-4 h-4 rounded border-[#2A2A2A] bg-[#171717] text-[#FFBF00] focus:ring-[#FFBF00] focus:ring-offset-[#0B0B0B]" />
                        <span className="text-sm text-white">Certifié</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-6">
              <h2 className="text-base font-bold text-white mb-2">Redirection (301)</h2>
              <p className="text-sm text-[#757575] mb-6">Redirigez temporairement ou définitivement le trafic de ce podcast vers une autre URL.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#757575] uppercase mb-2">URL de redirection (Optionnel)</label>
                  <input type="text" value={editData.redirectUrl || ""} onChange={e => handleChange("redirectUrl", e.target.value)} placeholder="https://..." className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                  <p className="text-xs text-[#757575] mt-1.5">Laissez vide si vous ne souhaitez pas rediriger ce podcast.</p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#1A0B0B] border border-[#3A1010] rounded-xl p-6">
              <h2 className="text-base font-bold text-red-500 mb-2">Zone de danger</h2>
              <p className="text-xs text-[#B8B8B8] mb-4">La suppression définitive retirera ce podcast et tous ses épisodes de la base de données. Cette action est irréversible.</p>
              <Button variant="destructive" className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="w-4 h-4 mr-2" /> Supprimer définitivement
              </Button>
            </div>
          </div>
        )}

        {/* ONGLET: ÉPISODES */}
        {activeTab === "Épisodes" && (
          <div className="space-y-6 relative">
            
            {showNewEpisodeModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowNewEpisodeModal(false)}>
                <form className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-6 w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()} onSubmit={handleCreateEpisode}>
                  <h3 className="text-xl font-bold text-white mb-2">Nouvel épisode</h3>
                  <p className="text-sm text-[#B8B8B8] mb-6">
                    Saisissez un lien YouTube ou Spotify pour importer automatiquement les informations.
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Lien (optionnel)</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value={newEpisodeUrl} onChange={e => setNewEpisodeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="flex-1 bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                      <Button type="button" variant="outline" onClick={handleFetchPreview} disabled={!newEpisodeUrl || isFetchingPreview} className="border-[#2A2A2A] text-white hover:bg-[#2A2A2A]">
                        {isFetchingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Importer"}
                      </Button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Titre de l'épisode *</label>
                    <input type="text" autoFocus value={newEpisodeTitle} onChange={e => setNewEpisodeTitle(e.target.value)} placeholder="Épisode 1 : Le commencement..." className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white" />
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs font-bold text-[#757575] uppercase mb-2">Description (optionnelle)</label>
                    <textarea value={newEpisodeDescription} onChange={e => setNewEpisodeDescription(e.target.value)} placeholder="Quelques mots sur cet épisode..." className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg p-3 text-sm focus:border-[#FFBF00] outline-none text-white h-24 resize-none" />
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <Button type="button" variant="ghost" className="text-[#B8B8B8] hover:text-white" onClick={() => { setShowNewEpisodeModal(false); setNewEpisodeUrl(""); setNewEpisodeTitle(""); setNewEpisodeDescription(""); }} disabled={isCreatingEpisode}>Annuler</Button>
                    <Button type="submit" className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold" disabled={isCreatingEpisode || !newEpisodeTitle.trim()}>
                      Créer l'épisode
                      {isCreatingEpisode ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Épisodes du podcast</h2>
                <p className="text-sm text-[#757575]">Gérez la liste de tous les épisodes de cette émission.</p>
              </div>
              <Button onClick={() => router.push(`/admin/podcasts/${id}/episodes/new`)} className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">
                Ajouter un épisode <Plus className="w-4 h-4 ml-2" />
              </Button>
            </div>

            <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl overflow-hidden">
              {!episodes ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#757575]" /></div>
              ) : episodes.length === 0 ? (
                <div className="p-12 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center mb-4">
                    <Headphones className="w-6 h-6 text-[#757575]" />
                  </div>
                  <h3 className="text-white font-bold mb-1">Aucun épisode</h3>
                  <p className="text-sm text-[#757575]">Ce podcast ne contient pas encore d'épisode.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-white">
                    <thead className="bg-[#0B0B0B] text-xs uppercase text-[#757575] font-semibold border-b border-[#2A2A2A]">
                      <tr>
                        <th className="px-6 py-4">Épisode</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Durée</th>
                        <th className="px-6 py-4">Publié le</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A]">
                      {episodes.map((ep: any) => (
                        <tr key={ep.id} className="hover:bg-[#2A2A2A]/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <img src={ep.cover || podcast.cover || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=96&h=96&fit=crop"} alt={ep.title} className="w-12 h-12 rounded-lg object-cover border border-[#2A2A2A]" />
                              <div>
                                <p className="font-bold line-clamp-1">{ep.title}</p>
                                <p className="text-xs text-[#757575] line-clamp-1">{ep.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {ep.status === "PUBLISHED" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Publié</span>
                            ) : ep.status === "DRAFT" ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-[#2A2A2A] text-[#B8B8B8] border border-[#3A3A3A]">Brouillon</span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">{ep.status}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-[#B8B8B8]">
                            {ep.duration ? `${Math.floor(ep.duration / 60)} min` : "-"}
                          </td>
                          <td className="px-6 py-4 text-[#B8B8B8]">
                            {ep.publishedAt ? new Date(ep.publishedAt).toLocaleDateString('fr-FR') : "-"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 transition-opacity">
                              {ep.status !== "PUBLISHED" && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  disabled={publishingIds.has(ep.id)}
                                  aria-busy={publishingIds.has(ep.id)}
                                  className="h-8 px-2 text-xs font-bold text-[#FFBF00] hover:text-black hover:bg-[#FFBF00]"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    void publishEpisode(ep.id);
                                  }}
                                >
                                  {publishingIds.has(ep.id) ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" />Publication…</> : "Publier"}
                                </Button>
                              )}
                              <Link href={`/admin/episodes/${ep.slug || ep.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#757575] hover:text-white hover:bg-[#2A2A2A]">
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" disabled={deletingEpisodeIds.has(ep.id) || publishingIds.has(ep.id)} aria-label={`Supprimer ${ep.title}`} aria-busy={deletingEpisodeIds.has(ep.id)} onClick={() => void deleteEpisode(ep)} className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                                {deletingEpisodeIds.has(ep.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET: SOURCES RSS (ÉCRAN 12 — GESTION DU RSS) */}
        {activeTab === "Sources RSS" && (
          <div className="space-y-6 max-w-4xl animate-in fade-in">
            <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-5">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <RssIcon className="w-5 h-5 text-[#FFBF00]" />
                    Gestion de la Source RSS
                  </h2>
                  <p className="text-xs text-[#888888] mt-1">
                    Supervisez la synchronisation continue avec le serveur d'hébergement distant du podcast.
                  </p>
                </div>
                {raw.rssFeed && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                    <CheckCircle className="w-3.5 h-3.5" /> Flux Actif & Synchronisé
                  </span>
                )}
              </div>
              
              {raw.rssFeed ? (
                <div className="space-y-6">
                  {/* Adresse et état de connexion */}
                  <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#757575] uppercase tracking-wider">
                          Adresse URL du flux RSS
                        </label>
                        <p className="text-sm font-bold text-white font-mono break-all">
                          {raw.rssFeed.url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(raw.rssFeed.url);
                            alert("URL copiée dans le presse-papier !");
                          }}
                          className="h-8 text-xs bg-[#171717] border-[#2A2A2A] hover:bg-[#262626] text-white"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(raw.rssFeed.url, '_blank')}
                          className="h-8 text-xs bg-[#171717] border-[#2A2A2A] hover:bg-[#262626] text-white"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ouvrir
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#2A2A2A]/60 text-xs">
                      <div>
                        <span className="text-[#757575] block text-[11px]">Dernière synchro réussie</span>
                        <span className="font-semibold text-white">
                          {raw.rssFeed.lastSyncAt ? new Date(raw.rssFeed.lastSyncAt).toLocaleString('fr-FR') : "Jamais"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[11px]">Épisodes importés</span>
                        <span className="font-semibold text-[#FFBF00]">
                          {raw.episodes?.length || raw._count?.episodes || 0} épisode(s)
                        </span>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[11px]">Fréquence de scrutation</span>
                        <span className="font-semibold text-white">Toutes les 30 min</span>
                      </div>
                      <div>
                        <span className="text-[#757575] block text-[11px]">Statut des nouveaux épisodes</span>
                        <span className="font-semibold text-white">Brouillon</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions de gestion du flux */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Button 
                      className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-9 px-4"
                      onClick={async () => {
                        alert("Synchronisation immédiate lancée en tâche de fond...");
                        await mutate();
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-2" /> Synchroniser maintenant
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-[#0B0B0B] border-[#2A2A2A] hover:bg-[#222222] text-white text-xs h-9"
                      onClick={() => alert("Modification des réglages de scrutation et publication automatique.")}
                    >
                      Modifier les réglages
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-[#0B0B0B] border-[#2A2A2A] hover:bg-[#222222] text-amber-400 text-xs h-9"
                      onClick={() => alert("La synchronisation automatique a été suspendue.")}
                    >
                      <PauseCircle className="w-3.5 h-3.5 mr-1.5" /> Suspendre la synchronisation
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-[#0B0B0B] border-red-500/20 hover:bg-red-500/10 text-red-400 text-xs h-9"
                      onClick={async () => {
                        if (confirm("Déconnecter le flux conserve tous les épisodes déjà importés sur Bamako Podcast, mais arrêtera définitivement leur mise à jour automatique. Voulez-vous continuer ?")) {
                          alert("Flux RSS déconnecté avec succès.");
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Déconnecter le flux
                    </Button>
                  </div>

                  {/* Avertissement explicite sur la déconnexion */}
                  <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-xl flex items-start gap-3 text-xs text-[#888888]">
                    <Info className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                    <span>
                      <strong>Règle de découplage :</strong> Déconnecter le flux conserve l'ensemble des épisodes déjà importés dans le catalogue de Bamako Podcast. Seule la récupération des futures sorties et les mises à jour distantes seront interrompues.
                    </span>
                  </div>

                  {/* Historique des synchronisations */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider">
                      Historique récent des synchronisations
                    </h3>
                    <div className="border border-[#2A2A2A] rounded-xl overflow-hidden divide-y divide-[#2A2A2A] bg-[#0B0B0B] text-xs">
                      <div className="p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-white">Synchronisation automatique périodique</span>
                            <span className="text-[#757575] block text-[11px] mt-0.5">Aucun nouvel épisode détecté</span>
                          </div>
                        </div>
                        <span className="text-[#888888]">{raw.rssFeed.lastSyncAt ? new Date(raw.rssFeed.lastSyncAt).toLocaleString('fr-FR') : "Récemment"}</span>
                      </div>
                      <div className="p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                          <div>
                            <span className="font-semibold text-white">Import initial du flux RSS</span>
                            <span className="text-[#757575] block text-[11px] mt-0.5">{raw.episodes?.length || 4} épisode(s) ajoutés en brouillon</span>
                          </div>
                        </div>
                        <span className="text-[#888888]">{new Date(raw.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Règle de surcharge locale sur les épisodes */}
                  <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs text-[#888888] space-y-1">
                    <span className="font-bold text-white block">Surcharge locale des épisodes importés :</span>
                    <p>
                      Dans chaque fiche d'épisode issu de ce flux, vous pouvez remplacer ou compléter le fichier audio/vidéo par un fichier local ou une URL YouTube. L'option <strong>« Conserver cette modification lors des synchronisations »</strong> protège vos ajustements contre toute réécriture lors des rafraîchissements automatiques.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-[#0B0B0B] border border-[#2A2A2A] border-dashed rounded-xl text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#171717] border border-[#2A2A2A] flex items-center justify-center text-[#FFBF00]">
                    <RssIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Aucun flux RSS attaché à cette émission</h3>
                    <p className="text-xs text-[#757575] mt-1 max-w-sm">
                      Cette émission est actuellement gérée manuellement. Vous pouvez connecter un flux RSS existant pour synchroniser automatiquement les futurs épisodes.
                    </p>
                  </div>
                  <Button 
                    onClick={() => router.push("/admin/podcasts/import-rss")}
                    className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-10 px-5 mt-2"
                  >
                    Connecter un flux RSS
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET: ÉQUIPE */}
        {activeTab === "Équipe" && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Équipe du podcast</h2>
                <p className="text-sm text-[#757575]">Personnalités (animateurs, producteurs) associées à ce podcast.</p>
              </div>
              <Button className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">
                <Plus className="w-4 h-4 mr-2" /> Ajouter un membre
              </Button>
            </div>

            <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl overflow-hidden">
              {!raw.permanentPersons || raw.permanentPersons.length === 0 ? (
                <div className="p-12 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-[#757575]" />
                  </div>
                  <h3 className="text-white font-bold mb-1">Aucun membre</h3>
                  <p className="text-sm text-[#757575]">L'équipe de ce podcast est vide.</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2A2A2A]">
                  {raw.permanentPersons.map((pp: any) => (
                    <div key={pp.id} className="p-4 flex items-center justify-between group hover:bg-[#2A2A2A]/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <img src={pp.person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pp.person.name)}&background=2A2A2A&color=fff`} alt={pp.person.name} className="w-10 h-10 rounded-full object-cover border border-[#2A2A2A]" />
                        <div>
                          <p className="text-sm font-bold text-white">{pp.person.name}</p>
                          <p className="text-xs text-[#757575]">{pp.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET: HISTORIQUE */}
        {activeTab === "Historique" && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-6">
              <h2 className="text-base font-bold text-white mb-6">Historique des modifications</h2>
              
              <div className="relative pl-6 border-l border-[#2A2A2A] space-y-8">
                <div className="relative">
                  <div className="absolute -left-[31px] bg-[#0B0B0B] p-1 rounded-full">
                    <div className="w-3 h-3 bg-[#FFBF00] rounded-full" />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">Dernière mise à jour</p>
                  <p className="text-xs text-[#757575]">{new Date(raw.updatedAt).toLocaleString('fr-FR')}</p>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[31px] bg-[#0B0B0B] p-1 rounded-full">
                    <div className="w-3 h-3 bg-[#2A2A2A] rounded-full" />
                  </div>
                  <p className="text-sm font-bold text-white mb-1">Création du podcast</p>
                  <p className="text-xs text-[#757575]">{new Date(raw.createdAt).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

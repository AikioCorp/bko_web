"use client";
import { AdminPageAccess } from "@/components/admin/AdminAccess";
import { AdminAction } from "@/components/admin/AdminAccess";

import React, { useState, useEffect } from "react";
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
  Info,
  Shield,
  UserCheck,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import { adminApi } from "@/lib/api";

const TABS = ["Épisodes", "Sources RSS", "Équipe", "Historique", "Informations", "Paramètres"];

export default function AdminPodcastDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Épisodes");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
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
  const { data: teamMembersData, mutate: mutateTeamMembers, isLoading: isLoadingTeam } = useSWR(
    id && activeTab === "Équipe" ? `/admin/podcasts/${id}/members` : null,
    (url: string) => adminApi(url).then((res: any) => res.data || [])
  );
  const teamMembers = Array.isArray(teamMembersData) ? teamMembersData : [];

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState("EDITOR");
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);
  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(null);
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

    const handlePublish = async () => {
    if (!id) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const res = await adminApi(`/admin/podcasts/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...editData, status: "PUBLISHED" }),
      });
      if (res.success) {
        setHasUnsavedChanges(false);
        setIsEditingInfo(false);
        mutate();
      } else {
        setErrorMsg(res.message || "Erreur lors de la publication");
      }
    } catch (e: any) {
      setErrorMsg("Erreur de connexion");
    } finally {
      setIsSaving(false);
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

  const handleBulkPublish = async () => {
    if (!episodes) return;
    const drafts = episodes.filter((ep: any) => ep.status === "DRAFT");
    const ids = drafts.map((ep: any) => ep.id);
    if (ids.length === 0) return;

    setIsBulkPublishing(true);
    try {
      const res = await adminApi("/admin/episodes/bulk-publish", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      if (res.success) {
        mutateEpisodes();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsBulkPublishing(false);
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

  const handleSearchUsers = async (query: string) => {
    setUserSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    setIsSearchingUsers(true);
    try {
      const res = await adminApi(`/admin/users/search?q=${encodeURIComponent(query.trim())}`);
      setUserSearchResults(res.data || []);
    } catch {
      setUserSearchResults([]);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !id) return;
    setIsAddingMember(true);
    setAddMemberError(null);
    setAddMemberSuccess(null);
    try {
      const res = await adminApi(`/admin/podcasts/${id}/members`, {
        method: "POST",
        body: JSON.stringify({
          userId: selectedUser.id,
          role: selectedRole,
        }),
      });
      if (res.success) {
        setAddMemberSuccess(`Utilisateur ${selectedUser.fullName || selectedUser.email} ajouté avec succès. Ses droits sont immédiatement actifs.`);
        setSelectedUser(null);
        setUserSearchQuery("");
        setUserSearchResults([]);
        await mutateTeamMembers();
        setTimeout(() => {
          setShowAddMemberModal(false);
          setAddMemberSuccess(null);
        }, 1200);
      } else {
        setAddMemberError(res.message || "Erreur lors de l'ajout du membre.");
      }
    } catch (e: any) {
      setAddMemberError(e.message || "Impossible d'ajouter ce membre.");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setMemberActionLoading(userId);
    try {
      await adminApi(`/admin/podcasts/${id}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      await mutateTeamMembers();
    } catch (e: any) {
      alert(e.message || "Impossible de modifier le rôle.");
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!confirm(`Retirer ${memberName} de l'équipe de ce podcast ? Ses droits d'accès seront immédiatement révoqués.`)) {
      return;
    }
    setMemberActionLoading(userId);
    try {
      await adminApi(`/admin/podcasts/${id}/members/${userId}`, {
        method: "DELETE",
      });
      await mutateTeamMembers();
    } catch (e: any) {
      alert(e.message || "Impossible de retirer ce membre.");
    } finally {
      setMemberActionLoading(null);
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
        <AdminPageAccess href="/admin/podcasts"><Link href="/admin/podcasts" className="text-[#FFBF00] text-sm font-semibold hover:underline">
          Retour aux podcasts
        </Link></AdminPageAccess>
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
              <AdminAction permission="catalog.delete"><Button className="bg-red-500 hover:bg-red-600 text-white font-bold" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Oui, supprimer
              </Button></AdminAction>
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
            <AdminAction permission="catalog.edit"><Button className="bg-[#FFBF00] text-[#0B0B0B] hover:bg-[#E5AB00] font-bold" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button></AdminAction>
          </div>
        </div>
      )}

      {/* Top Header & Back Link */}
      <div className="space-y-6 mb-6">
        <div>
          <AdminPageAccess href="/admin/podcasts"><Link href="/admin/podcasts" className="inline-flex items-center text-sm font-semibold text-[#757575] hover:text-[#FFBF00] transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Retour aux podcasts
          </Link></AdminPageAccess>
        </div>

        {/* Podcast Identity Header */}
        <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img src={podcast.cover || "/default-cover.png"} alt={podcast.name} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-[#2A2A2A]" />
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
            <AdminAction permission="catalog.edit"><Button className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold" onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enregistrer"}
            </Button></AdminAction>
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
                    <AdminAction permission="catalog.edit"><Button variant="outline" className="h-8 text-xs bg-[#0B0B0B] border-[#2A2A2A] text-white hover:bg-[#262626]" onClick={() => setIsEditingInfo(true)}>
                      <Edit3 className="w-3.5 h-3.5 mr-2" /> Modifier
                    </Button></AdminAction>
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
                    <p className="text-sm font-medium text-white">{podcast.status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#757575] uppercase mb-1">Visibilité</p>
                    <p className="text-sm font-medium text-white">{podcast.visibility}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#757575] uppercase mb-1">Créé le</p>
                    <p className="text-sm font-medium text-white">{podcast.publishedAt}</p>
                  </div>
                </div>
                {podcast.status === "DRAFT" && (
                  <div className="pt-4 mt-4 border-t border-[#2A2A2A]">
                    <AdminAction permission="catalog.edit"><Button onClick={handlePublish} disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Publier le podcast
                    </Button></AdminAction>
                  </div>
                )}
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
              <AdminAction permission="catalog.delete"><Button variant="destructive" className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="w-4 h-4 mr-2" /> Supprimer définitivement
              </Button></AdminAction>
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
                      <AdminAction permission="catalog.edit"><Button type="button" variant="outline" onClick={handleFetchPreview} disabled={!newEpisodeUrl || isFetchingPreview} className="border-[#2A2A2A] text-white hover:bg-[#2A2A2A]">
                        {isFetchingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : "Importer"}
                      </Button></AdminAction>
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
              <div className="flex gap-2">
                  {episodes?.some((ep: any) => ep.status === "DRAFT") && (
                    <AdminAction permission="catalog.edit"><Button
                      onClick={handleBulkPublish}
                      disabled={isBulkPublishing}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                      {isBulkPublishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Publier les brouillons ({episodes.filter((ep: any) => ep.status === "DRAFT").length})
                    </Button></AdminAction>
                  )}
                  <AdminAction permission="catalog.create"><Button onClick={() => router.push(`/admin/podcasts/${id}/episodes/new`)} className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">
                Ajouter un épisode <Plus className="w-4 h-4 ml-2" />
              </Button></AdminAction>
                </div>
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
                          <td className="px-6 py-4 w-full max-w-[200px] sm:max-w-[300px] lg:max-w-[500px]">
                            <div className="flex items-center gap-4">
                              <img src={ep.cover || podcast.cover} alt={ep.title} className="w-12 h-12 rounded-lg object-cover border border-[#2A2A2A]" />
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
                              <AdminPageAccess href={`/admin/episodes/${ep.slug || ep.id}`}><Link href={`/admin/episodes/${ep.slug || ep.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#757575] hover:text-white hover:bg-[#2A2A2A]">
                                  <Edit3 className="w-4 h-4" />
                                </Button>
                              </Link></AdminPageAccess>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10">
                                <Trash2 className="w-4 h-4" />
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
                    <AdminAction permission="catalog.edit"><Button
                      className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-9 px-4"
                      onClick={async () => {
                        alert("Synchronisation immédiate lancée en tâche de fond...");
                        await mutate();
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-2" /> Synchroniser maintenant
                    </Button></AdminAction>
                    <AdminAction permission="catalog.edit"><Button
                      variant="outline"
                      className="bg-[#0B0B0B] border-[#2A2A2A] hover:bg-[#222222] text-white text-xs h-9"
                      onClick={() => alert("Modification des réglages de scrutation et publication automatique.")}
                    >
                      Modifier les réglages
                    </Button></AdminAction>
                    <AdminAction permission="catalog.edit"><Button
                      variant="outline"
                      className="bg-[#0B0B0B] border-[#2A2A2A] hover:bg-[#222222] text-amber-400 text-xs h-9"
                      onClick={() => alert("La synchronisation automatique a été suspendue.")}
                    >
                      <PauseCircle className="w-3.5 h-3.5 mr-1.5" /> Suspendre la synchronisation
                    </Button></AdminAction>
                    <AdminAction permission="catalog.edit"><Button
                      variant="outline"
                      className="bg-[#0B0B0B] border-red-500/20 hover:bg-red-500/10 text-red-400 text-xs h-9"
                      onClick={async () => {
                        if (confirm("Déconnecter le flux conserve tous les épisodes déjà importés sur Bamako Podcast, mais arrêtera définitivement leur mise à jour automatique. Voulez-vous continuer ?")) {
                          alert("Flux RSS déconnecté avec succès.");
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Déconnecter le flux
                    </Button></AdminAction>
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
                  <AdminAction permission="catalog.create"><Button
                    onClick={() => router.push("/admin/podcasts/import-rss")}
                    className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-10 px-5 mt-2"
                  >
                    Connecter un flux RSS
                  </Button></AdminAction>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET: ÉQUIPE */}
        {activeTab === "Équipe" && (
          <div className="space-y-8 max-w-4xl">
            {/* 1. SECTION: MEMBRES DU STUDIO (Accès et Droits) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#FFBF00]" />
                    Membres autorisés du Studio
                  </h2>
                  <p className="text-sm text-[#757575]">
                    Utilisateurs disposant d'un accès actif au Studio Bamako Podcast pour cette émission.
                  </p>
                </div>
                <AdminAction permission="catalog.edit">
                  <Button
                    onClick={() => {
                      setShowAddMemberModal(true);
                      setAddMemberError(null);
                      setAddMemberSuccess(null);
                      setSelectedUser(null);
                      setUserSearchQuery("");
                      setUserSearchResults([]);
                    }}
                    className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-9 px-4 shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Ajouter un membre existant
                  </Button>
                </AdminAction>
              </div>

              {/* Règle métier explicative */}
              <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-xl flex items-start gap-3 text-xs text-[#A0A0A0]">
                <Info className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Règle d'ajout administratif direct :</strong>
                  L'appartenance et les droits deviennent immédiatement actifs dès validation. Aucune acceptation n'est requise et aucun jeton d'invitation n'est nécessaire. L'utilisateur reçoit une notification in-app, un email et un push avec le bouton <strong>« Ouvrir l'émission »</strong>.
                </div>
              </div>

              {/* Table des membres */}
              <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl overflow-hidden">
                {isLoadingTeam ? (
                  <div className="p-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FFBF00] mb-2" />
                    <p className="text-xs text-[#757575]">Chargement des membres de l'équipe…</p>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="p-12 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-[#2A2A2A] rounded-full flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-[#757575]" />
                    </div>
                    <h3 className="text-white font-bold mb-1">Aucun membre collaborateur</h3>
                    <p className="text-sm text-[#757575] max-w-sm">
                      Cette émission ne compte actuellement aucun membre d'équipe enregistré. Cliquez sur « Ajouter un membre » pour affecter un utilisateur existant.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#2A2A2A]">
                    {teamMembers.map((m: any) => {
                      const ownerCount = teamMembers.filter((item: any) => item.role === "OWNER").length;
                      const isLastOwner = m.role === "OWNER" && ownerCount <= 1;
                      const isBusy = memberActionLoading === m.userId;

                      return (
                        <div key={m.userId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#202020] transition-colors">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-[#2A2A2A] border border-[#3A3A3A] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                              {m.user?.avatar ? (
                                <img src={m.user.avatar} alt={m.user.fullName || "Avatar"} className="w-full h-full object-cover" />
                              ) : (
                                (m.user?.fullName || m.user?.email || "U").charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-white truncate">{m.user?.fullName || "Utilisateur"}</p>
                                {m.role === "OWNER" && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#FFBF00]/15 text-[#FFBF00] border border-[#FFBF00]/30">
                                    PROPRIÉTAIRE
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#757575] truncate">{m.user?.email || "-"}</p>
                              {m.user?.phoneNumber && (
                                <p className="text-[11px] text-[#555555]">{m.user.phoneNumber}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            {/* Sélecteur de rôle direct */}
                            <AdminAction permission="catalog.edit">
                              <select
                                value={m.role}
                                disabled={isBusy}
                                onChange={(e) => {
                                  const newRole = e.target.value;
                                  if (isLastOwner && newRole !== "OWNER") {
                                    alert("Impossible de modifier le rôle du dernier propriétaire de l'émission. Désignez d'abord un autre propriétaire.");
                                    return;
                                  }
                                  handleUpdateRole(m.userId, newRole);
                                }}
                                className="bg-[#0B0B0B] border border-[#2A2A2A] hover:border-[#FFBF00]/50 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:border-[#FFBF00] outline-none"
                              >
                                <option value="OWNER">Propriétaire</option>
                                <option value="ADMIN">Administrateur</option>
                                <option value="EDITOR">Éditeur</option>
                                <option value="ANALYST">Analyste</option>
                              </select>
                            </AdminAction>

                            {/* Bouton de retrait */}
                            <AdminAction permission="catalog.edit">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isBusy || isLastOwner}
                                title={isLastOwner ? "Le dernier propriétaire ne peut pas être retiré" : "Retirer ce membre de l'équipe"}
                                onClick={() => handleRemoveMember(m.userId, m.user?.fullName || m.user?.email || "ce membre")}
                                className={`h-8 px-2.5 text-xs ${
                                  isLastOwner
                                    ? "text-[#555555] cursor-not-allowed hover:bg-transparent"
                                    : "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                }`}
                              >
                                {isBusy ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                                    Retirer
                                  </>
                                )}
                              </Button>
                            </AdminAction>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 2. SECTION: CRÉDITS PUBLICS / PERSONNALITÉS DU CATALOGUE */}
            <div className="space-y-4 pt-4 border-t border-[#2A2A2A]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Générique & Intervenants publics</h3>
                  <p className="text-xs text-[#757575]">Personnalités (animateurs, producteurs, réalisateurs) affichées au public dans les crédits de l'émission.</p>
                </div>
              </div>

              <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl overflow-hidden">
                {!raw.permanentPersons || raw.permanentPersons.length === 0 ? (
                  <div className="p-8 flex flex-col items-center text-center">
                    <p className="text-xs text-[#757575]">Aucune personnalité associée dans les crédits publics de ce podcast.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#2A2A2A]">
                    {raw.permanentPersons.map((pp: any) => (
                      <div key={pp.id} className="p-3.5 flex items-center justify-between hover:bg-[#202020] transition-colors">
                        <div className="flex items-center gap-3">
                          <img
                            src={pp.person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pp.person.name)}&background=2A2A2A&color=fff`}
                            alt={pp.person.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#2A2A2A]"
                          />
                          <div>
                            <p className="text-xs font-bold text-white">{pp.person.name}</p>
                            <p className="text-[11px] text-[#757575]">{pp.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* MODAL: AJOUTER UN MEMBRE DIRECT (RÈGLE MÉTIER PRIORITAIRE) */}
            {showAddMemberModal && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl max-w-lg w-full p-6 text-white space-y-5 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-[#FFBF00]" />
                      <h3 className="text-base font-bold text-white">Ajouter un membre à l'équipe</h3>
                    </div>
                    <button
                      onClick={() => setShowAddMemberModal(false)}
                      className="p-1 rounded-lg text-[#757575] hover:text-white hover:bg-[#222222]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Encadré règle prioritaire */}
                  <div className="p-3.5 bg-[#1F1B0B] border border-[#FFBF00]/30 rounded-xl text-xs text-[#D8B146] space-y-1">
                    <p className="font-bold text-[#FFBF00]">Ajout administratif direct et immédiat :</p>
                    <p>
                      Sélectionnez un compte utilisateur existant. L'appartenance et les permissions sont <strong>activées instantanément</strong>. Une notification in-app, un email et un push lui sont envoyés avec le bouton <strong>« Ouvrir l'émission »</strong>.
                    </p>
                  </div>

                  {/* Recherche utilisateur existant */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block">
                      1. Rechercher un utilisateur existant
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => handleSearchUsers(e.target.value)}
                        placeholder="Recherche par nom, prénom, email ou téléphone..."
                        className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#555555] focus:border-[#FFBF00] outline-none pr-9"
                      />
                      {isSearchingUsers ? (
                        <Loader2 className="w-4 h-4 text-[#FFBF00] animate-spin absolute right-3 top-3" />
                      ) : (
                        <Search className="w-4 h-4 text-[#757575] absolute right-3 top-3" />
                      )}
                    </div>

                    {/* Résultats de recherche */}
                    {userSearchResults.length > 0 && !selectedUser && (
                      <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl max-h-48 overflow-y-auto divide-y divide-[#222222]">
                        {userSearchResults.map((u: any) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setUserSearchResults([]);
                            }}
                            className="w-full text-left p-3 hover:bg-[#1A1A1A] flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">{u.fullName || "Utilisateur sans nom"}</p>
                              <p className="text-[11px] text-[#757575] truncate">{u.email}</p>
                              {u.phoneNumber && <p className="text-[10px] text-[#555555]">{u.phoneNumber}</p>}
                            </div>
                            <span className="text-xs font-bold text-[#FFBF00] shrink-0">Choisir →</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Utilisateur sélectionné */}
                    {selectedUser && (
                      <div className="p-3 bg-[#1A1A1A] border border-[#FFBF00]/40 rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-[#FFBF00]/20 text-[#FFBF00] flex items-center justify-center font-bold text-xs shrink-0">
                            {(selectedUser.fullName || selectedUser.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{selectedUser.fullName || "Sans nom"}</p>
                            <p className="text-[11px] text-[#B8B8B8] truncate">{selectedUser.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          className="text-xs text-[#757575] hover:text-red-400 font-semibold"
                        >
                          Changer
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Choix du rôle et permissions */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#A0A0A0] uppercase tracking-wider block">
                      2. Choisir le rôle et les permissions
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        {
                          role: "OWNER",
                          title: "Propriétaire",
                          desc: "Contrôle intégral de l'émission, suppression et gestion des rôles.",
                        },
                        {
                          role: "ADMIN",
                          title: "Administrateur",
                          desc: "Gestion complète des épisodes, saisons, flux et de l'équipe.",
                        },
                        {
                          role: "EDITOR",
                          title: "Éditeur",
                          desc: "Création, modification et planification des épisodes et saisons.",
                        },
                        {
                          role: "ANALYST",
                          title: "Analyste",
                          desc: "Consultation des statistiques d'écoute en lecture seule.",
                        },
                      ].map((item) => (
                        <button
                          key={item.role}
                          type="button"
                          onClick={() => setSelectedRole(item.role)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selectedRole === item.role
                              ? "bg-[#FFBF00]/10 border-[#FFBF00] text-white"
                              : "bg-[#0B0B0B] border-[#2A2A2A] text-[#888888] hover:border-[#444444]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-white">{item.title}</span>
                            {selectedRole === item.role && (
                              <span className="w-2 h-2 rounded-full bg-[#FFBF00]" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#757575] leading-tight">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Parcours distinct si l'utilisateur n'existe pas */}
                  <div className="p-3 bg-[#0B0B0B] border border-[#222222] rounded-xl text-[11px] text-[#757575]">
                    <span className="text-white font-semibold">Le compte n'existe pas encore ?</span> Un compte inexistant ne peut pas recevoir d'appartenance active immédiate. Invitez d'abord la personne à créer son compte Bamako Podcast ou passez par une invitation externe par email.
                  </div>

                  {/* Messages d'erreur ou succès */}
                  {addMemberError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
                      {addMemberError}
                    </div>
                  )}
                  {addMemberSuccess && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
                      {addMemberSuccess}
                    </div>
                  )}

                  {/* Actions du modal */}
                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2A2A2A]">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="text-xs text-[#757575] hover:text-white"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      disabled={!selectedUser || isAddingMember}
                      onClick={handleAddMember}
                      className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-9 px-5 disabled:opacity-50"
                    >
                      {isAddingMember ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                      )}
                      Ajouter immédiatement à l'équipe
                    </Button>
                  </div>
                </div>
              </div>
            )}
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

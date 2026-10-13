"use client";

import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  UserCheck,
  Search,
  BadgeCheck,
  Podcast,
  Users,
  Plus,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  MoreVertical,
  SlidersHorizontal,
  X,
  AlertCircle,
  Loader2,
  Globe,
  Trash2,
  ShieldAlert,
  ArrowUpRight,
  Radio,
  CheckCircle2,
  FileEdit,
  Shield,
  Layers,
  Sparkles,
  Link2,
  Calendar,
  Grid,
  ListFilter
} from "lucide-react";
import { Button } from "@/components/ui/button";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

interface CreatorItem {
  id: string;
  userId: string;
  displayName: string;
  slug: string;
  bio?: string | null;
  avatar?: string | null;
  banner?: string | null;
  website?: string | null;
  socialLinks?: any;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  country?: {
    id: string;
    name: string;
    code: string;
    flagEmoji?: string | null;
  } | null;
  user: {
    id: string;
    email: string;
    fullName: string;
    isSuspended: boolean;
    suspendedReason?: string | null;
    createdAt: string;
    roles: string[];
  };
  followersCount: number;
  podcastsCount: number;
  podcasts: {
    id: string;
    name: string;
    slug: string;
    cover: string;
    status: string;
    _count: { episodes: number };
  }[];
  marketAccess?: {
    id: string;
    status: string;
    canCreatePodcast: boolean;
    canPublish: boolean;
    canMonetize: boolean;
    market: {
      id: string;
      countryId: string;
      country: { code: string; name: string; flagEmoji?: string | null };
    };
  }[];
}

const DEFAULT_COUNTRIES = [
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GN", name: "Guinée", flag: "🇬🇳" },
  { code: "FR", name: "France", flag: "🇫🇷" },
];

export default function CreatorsAdminPage() {
  const { user: currentUser } = useAuthStore();

  // Filtres & pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterVerified, setFilterVerified] = useState<string>("all"); // 'all' | 'verified' | 'unverified' | 'has_podcasts'
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Debounce de recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // SWR data fetching
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filterVerified === "verified") params.set("verified", "true");
    if (filterVerified === "unverified") params.set("verified", "false");
    if (countryFilter !== "all") params.set("countryId", countryFilter);
    return params.toString();
  }, [page, limit, debouncedSearch, filterVerified, countryFilter]);

  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const { data: creatorsData, mutate, isLoading, isValidating } = useSWR(
    `/admin/creators?${queryString}`,
    fetcher
  );

  const creators: CreatorItem[] = creatorsData?.items || [];
  const stats = creatorsData?.stats || {
    totalCreators: 0,
    verifiedCount: 0,
    totalFollowers: 0,
  };
  const total = creatorsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Copier ID / Slug
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const handleCopySlug = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/creators/${slug}`);
    setCopiedSlug(slug);
    showToast(`Lien public copié : /creators/${slug}`);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  // Modale ou Panneau latéral
  const [activeCreator, setActiveCreator] = useState<CreatorItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<"info" | "podcasts" | "market">("info");
  const [isUpdating, setIsUpdating] = useState(false);

  // Formulaire d'édition dans le panneau
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editCountryId, setEditCountryId] = useState("");
  const [editVerified, setEditVerified] = useState(false);

  useEffect(() => {
    if (activeCreator) {
      setEditDisplayName(activeCreator.displayName || "");
      setEditSlug(activeCreator.slug || "");
      setEditBio(activeCreator.bio || "");
      setEditWebsite(activeCreator.website || "");
      setEditCountryId(activeCreator.country?.id || "");
      setEditVerified(activeCreator.isVerified || false);
      setDrawerTab("info");
    }
  }, [activeCreator]);

  // Sauvegarde des modifications du créateur
  const handleSaveCreatorEdits = async () => {
    if (!activeCreator) return;
    try {
      setIsUpdating(true);
      await adminApi(`/admin/creators/${activeCreator.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          displayName: editDisplayName.trim(),
          slug: editSlug.trim(),
          bio: editBio.trim(),
          website: editWebsite.trim(),
          countryId: editCountryId || undefined,
          isVerified: editVerified,
        }),
      });
      await mutate();
      showToast("Profil créateur mis à jour avec succès.");
      setActiveCreator((prev) =>
        prev
          ? {
              ...prev,
              displayName: editDisplayName.trim(),
              slug: editSlug.trim(),
              bio: editBio.trim(),
              website: editWebsite.trim(),
              isVerified: editVerified,
            }
          : null
      );
    } catch (e: any) {
      alert("Erreur lors de la mise à jour : " + e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Bascule rapide de la certification
  const handleQuickToggleVerified = async (creator: CreatorItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const nextVerified = !creator.isVerified;
      await adminApi(`/admin/creators/${creator.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isVerified: nextVerified }),
      });
      await mutate();
      showToast(
        nextVerified
          ? `Badge certifié accordé à ${creator.displayName}.`
          : `Certification révoquée pour ${creator.displayName}.`
      );
    } catch (e: any) {
      alert("Erreur : " + e.message);
    }
  };

  // Modale de création d'un nouveau créateur
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createUserId, setCreateUserId] = useState("");
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createBio, setCreateBio] = useState("");
  const [createWebsite, setCreateWebsite] = useState("");
  const [createCountryId, setCreateCountryId] = useState("");
  const [createVerified, setCreateVerified] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Recherche d'utilisateurs pour l'attribution
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const { data: usersSearchData } = useSWR(
    isCreateModalOpen && userSearchTerm.length >= 2
      ? `/admin/users?limit=8&search=${encodeURIComponent(userSearchTerm)}`
      : null,
    fetcher
  );

  const handleCreateCreatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserId) {
      alert("Veuillez sélectionner un compte utilisateur.");
      return;
    }
    if (!createDisplayName.trim()) {
      alert("Le nom d'affichage est requis.");
      return;
    }

    try {
      setIsCreating(true);
      await adminApi("/admin/creators", {
        method: "POST",
        body: JSON.stringify({
          userId: createUserId,
          displayName: createDisplayName.trim(),
          slug: createSlug.trim() || undefined,
          bio: createBio.trim() || undefined,
          website: createWebsite.trim() || undefined,
          countryId: createCountryId || undefined,
          isVerified: createVerified,
        }),
      });
      await mutate();
      showToast(`Profil créateur créé avec succès pour ${createDisplayName}.`);
      setIsCreateModalOpen(false);
      // Réinitialiser
      setCreateUserId("");
      setCreateDisplayName("");
      setCreateSlug("");
      setCreateBio("");
      setCreateWebsite("");
      setCreateVerified(false);
      setUserSearchTerm("");
    } catch (err: any) {
      alert("Erreur lors de la création : " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Modale d'assignation d'émission
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [creatorForAssign, setCreatorForAssign] = useState<CreatorItem | null>(null);
  const [podcastSearchTerm, setPodcastSearchTerm] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: podcastsSearchData } = useSWR(
    isAssignModalOpen
      ? `/admin/catalog?limit=15${podcastSearchTerm ? `&search=${encodeURIComponent(podcastSearchTerm)}` : ""}`
      : null,
    fetcher
  );

  const handleAssignPodcastSubmit = async (podcastId: string) => {
    if (!creatorForAssign) return;
    try {
      setIsAssigning(true);
      await adminApi(`/admin/creators/${creatorForAssign.id}/assign-podcast`, {
        method: "POST",
        body: JSON.stringify({ podcastId, role: "OWNER" }),
      });
      await mutate();
      showToast(`Émission rattachée avec succès à ${creatorForAssign.displayName}.`);
      setIsAssignModalOpen(false);
      setCreatorForAssign(null);
    } catch (err: any) {
      alert("Erreur lors du rattachement : " + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  // Modale de suppression de profil créateur
  const [creatorToDelete, setCreatorToDelete] = useState<CreatorItem | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCreatorSubmit = async () => {
    if (!creatorToDelete) return;
    if (deleteConfirmationText.trim().toLowerCase() !== "supprimer") {
      alert("Veuillez saisir 'supprimer' pour confirmer la suppression.");
      return;
    }

    try {
      setIsDeleting(true);
      await adminApi(`/admin/creators/${creatorToDelete.id}`, {
        method: "DELETE",
      });
      await mutate();
      showToast(`Profil créateur de ${creatorToDelete.displayName} supprimé.`);
      setCreatorToDelete(null);
      setDeleteConfirmationText("");
      if (activeCreator?.id === creatorToDelete.id) {
        setActiveCreator(null);
      }
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1A1A] border border-[#333333] text-white px-5 py-3 rounded-xl shadow-2xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#FFBF00]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#888888] mb-1.5 uppercase tracking-wider font-semibold">
            <span>Administration</span>
            <span>/</span>
            <span className="text-[#FFBF00]">Gestion des Créateurs</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Créateurs & Artistes
            {isValidating && <Loader2 className="w-5 h-5 text-[#FFBF00] animate-spin inline-block" />}
          </h1>
          <p className="text-sm text-[#888888] mt-1 max-w-2xl">
            Supervisez les profils d&apos;artistes officiels, accordez le badge certifié, assignez les émissions et régulez les autorisations du studio.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            className="border-[#2A2A2A] bg-[#141414] hover:bg-[#1C1C1C] text-[#CCCCCC] hover:text-white"
          >
            <RefreshCw className={classNames("w-4 h-4 mr-2", isValidating && "animate-spin")} />
            Actualiser
          </Button>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#FFBF00] hover:bg-[#E5AC00] text-[#0B0B0B] font-bold text-sm shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau profil créateur
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Profils Créateurs</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] flex items-center justify-center text-[#FFBF00]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{stats.totalCreators}</div>
          <div className="text-xs text-[#777777] mt-1">Comptes configurés avec profil public</div>
        </div>

        <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Créateurs Certifiés</span>
            <div className="w-8 h-8 rounded-lg bg-[#0F223D] border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA]">
              <BadgeCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-[#60A5FA]">{stats.verifiedCount}</div>
          <div className="text-xs text-[#777777] mt-1">
            {stats.totalCreators > 0 ? Math.round((stats.verifiedCount / stats.totalCreators) * 100) : 0}% du catalogue créateur
          </div>
        </div>

        <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Émissions Associées</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] flex items-center justify-center text-[#2DD4BF]">
              <Podcast className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {creators.reduce((acc, c) => acc + (c.podcastsCount || 0), 0)}
          </div>
          <div className="text-xs text-[#777777] mt-1">Podcasts administrés par des créateurs</div>
        </div>

        <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Abonnés Cumulés</span>
            <div className="w-8 h-8 rounded-lg bg-[#222222] flex items-center justify-center text-[#FFBF00]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{stats.totalFollowers}</div>
          <div className="text-xs text-[#777777] mt-1">Abonnements aux profils créateurs</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#141414] border border-[#222222] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Barre de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, @slug, email, bio..."
            className="w-full h-10 pl-10 pr-4 bg-[#0E0E0E] border border-[#262626] rounded-xl text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#FFBF00] transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Onglets Filtres & Sélecteurs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Onglets statut vérifié */}
          <div className="flex bg-[#0E0E0E] p-1 rounded-xl border border-[#262626] text-xs font-medium">
            <button
              onClick={() => {
                setFilterVerified("all");
                setPage(1);
              }}
              className={classNames(
                "px-3 py-1.5 rounded-lg transition-colors",
                filterVerified === "all" ? "bg-[#222222] text-white" : "text-[#888888] hover:text-white"
              )}
            >
              Tous ({total})
            </button>
            <button
              onClick={() => {
                setFilterVerified("verified");
                setPage(1);
              }}
              className={classNames(
                "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
                filterVerified === "verified" ? "bg-[#0F223D] text-[#60A5FA]" : "text-[#888888] hover:text-white"
              )}
            >
              <BadgeCheck className="w-3.5 h-3.5 text-[#60A5FA]" />
              Certifiés
            </button>
            <button
              onClick={() => {
                setFilterVerified("unverified");
                setPage(1);
              }}
              className={classNames(
                "px-3 py-1.5 rounded-lg transition-colors",
                filterVerified === "unverified" ? "bg-[#222222] text-white" : "text-[#888888] hover:text-white"
              )}
            >
              Non certifiés
            </button>
          </div>

          {/* Sélecteur de vue */}
          <div className="flex bg-[#0E0E0E] p-1 rounded-xl border border-[#262626]">
            <button
              onClick={() => setViewMode("grid")}
              className={classNames(
                "p-1.5 rounded-lg text-xs transition-colors",
                viewMode === "grid" ? "bg-[#222222] text-white" : "text-[#777777] hover:text-white"
              )}
              title="Vue grille"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={classNames(
                "p-1.5 rounded-lg text-xs transition-colors",
                viewMode === "table" ? "bg-[#222222] text-white" : "text-[#777777] hover:text-white"
              )}
              title="Vue tableau"
            >
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
          <span className="text-sm text-[#888888]">Chargement des profils créateurs...</span>
        </div>
      ) : creators.length === 0 ? (
        <div className="bg-[#141414] border border-[#222222] rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center mx-auto mb-4 text-[#888888]">
            <UserCheck className="w-8 h-8 text-[#FFBF00]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Aucun créateur trouvé</h3>
          <p className="text-sm text-[#888888] mb-6">
            {debouncedSearch
              ? `Aucun résultat ne correspond à la recherche « ${debouncedSearch} ».`
              : "Aucun profil créateur n'est encore configuré dans cette sélection."}
          </p>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#FFBF00] hover:bg-[#E5AC00] text-[#0B0B0B] font-bold text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer le premier profil créateur
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        /* VUE GRILLE DE CARTES */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {creators.map((c) => {
            const initials = c.displayName
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();

            return (
              <div
                key={c.id}
                onClick={() => setActiveCreator(c)}
                className="bg-[#141414] hover:bg-[#181818] border border-[#222222] hover:border-[#333333] rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer group relative"
              >
                <div>
                  {/* Top Bar Card */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {c.avatar ? (
                        <img
                          src={c.avatar}
                          alt={c.displayName}
                          className="w-12 h-12 rounded-xl object-cover border border-[#2A2A2A] bg-[#222222]"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#222222] border border-[#2A2A2A] flex items-center justify-center font-bold text-white text-base">
                          {initials || "C"}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-white text-base truncate group-hover:text-[#FFBF00] transition-colors">
                            {c.displayName}
                          </h3>
                          {c.isVerified && (
                            <span title="Créateur Certifié Officiel" className="inline-flex">
                              <BadgeCheck className="w-4 h-4 text-[#60A5FA] shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#888888] font-mono flex items-center gap-1">
                          <span>@{c.slug}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySlug(c.slug);
                            }}
                            className="text-[#666666] hover:text-white p-0.5"
                            title="Copier le lien public"
                          >
                            {copiedSlug === c.slug ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Badge Pays */}
                    {c.country && (
                      <div className="px-2 py-1 bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg text-xs text-[#CCCCCC] flex items-center gap-1.5 shrink-0">
                        <span>{c.country.flagEmoji || "🌍"}</span>
                        <span>{c.country.code}</span>
                      </div>
                    )}
                  </div>

                  {/* Bio condensée */}
                  <p className="text-xs text-[#999999] line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
                    {c.bio || <span className="italic text-[#666666]">Aucune biographie renseignée</span>}
                  </p>

                  {/* Émissions rattachées */}
                  <div className="mb-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#777777] mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Podcast className="w-3 h-3 text-[#2DD4BF]" />
                        Émissions ({c.podcastsCount})
                      </span>
                      {c.podcastsCount > 0 && (
                        <span className="text-[10px] text-[#555555]">
                          {c.podcasts.reduce((acc, p) => acc + (p._count?.episodes || 0), 0)} épisodes
                        </span>
                      )}
                    </div>

                    {c.podcasts.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {c.podcasts.slice(0, 2).map((pod) => (
                          <div
                            key={pod.id}
                            className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg px-2.5 py-1 text-xs text-[#CCCCCC] flex items-center gap-1.5 truncate max-w-[200px]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="truncate">{pod.name}</span>
                          </div>
                        ))}
                        {c.podcasts.length > 2 && (
                          <span className="bg-[#1A1A1A] border border-[#262626] rounded-lg px-2 py-1 text-[11px] text-[#777777]">
                            +{c.podcasts.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreatorForAssign(c);
                          setIsAssignModalOpen(true);
                        }}
                        className="text-xs text-[#FFBF00] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Rattacher une émission
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Carte */}
                <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[#777777]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {c.followersCount} abonnés
                    </span>
                    <span>•</span>
                    <span className="text-[#666666] truncate max-w-[120px]">{c.user.email}</span>
                  </div>

                  {/* Actions Rapides */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleQuickToggleVerified(c, e)}
                      className={classNames(
                        "p-1.5 rounded-lg text-xs transition-colors",
                        c.isVerified
                          ? "bg-[#0F223D] text-[#60A5FA] hover:bg-[#16335C]"
                          : "bg-[#1C1C1C] text-[#888888] hover:text-white hover:bg-[#262626]"
                      )}
                      title={c.isVerified ? "Révoquer certification" : "Attribuer certification badge bleu"}
                    >
                      <BadgeCheck className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/creators/${c.slug}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-[#1C1C1C] text-[#888888] hover:text-white hover:bg-[#262626] transition-colors"
                      title="Voir page publique"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VUE TABLEAU COMPACT */
        <div className="bg-[#141414] border border-[#222222] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#222222] bg-[#101010] text-[#777777] text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Créateur / Artiste</th>
                  <th className="py-3.5 px-4">Compte lié</th>
                  <th className="py-3.5 px-4">Pays</th>
                  <th className="py-3.5 px-4">Émissions</th>
                  <th className="py-3.5 px-4">Abonnés</th>
                  <th className="py-3.5 px-4">Certification</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {creators.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setActiveCreator(c)}
                    className="hover:bg-[#1A1A1A] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#222222] border border-[#2A2A2A] flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                          {c.avatar ? (
                            <img src={c.avatar} alt={c.displayName} className="w-full h-full object-cover" />
                          ) : (
                            c.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-[#FFBF00] transition-colors flex items-center gap-1.5">
                            <span>{c.displayName}</span>
                            {c.isVerified && <BadgeCheck className="w-4 h-4 text-[#60A5FA]" />}
                          </div>
                          <div className="text-xs text-[#777777] font-mono">@{c.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs text-white">{c.user.email}</div>
                      <div className="text-[11px] text-[#777777]">{c.user.fullName}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.country ? (
                        <span className="text-xs text-[#CCCCCC] flex items-center gap-1.5">
                          <span>{c.country.flagEmoji || "🌍"}</span>
                          <span>{c.country.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-[#666666]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium text-white">{c.podcastsCount} podcast(s)</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs text-[#CCCCCC]">{c.followersCount}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={(e) => handleQuickToggleVerified(c, e)}
                        className={classNames(
                          "px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors",
                          c.isVerified
                            ? "bg-[#0F223D] text-[#60A5FA] border border-[#3B82F6]/30"
                            : "bg-[#1E1E1E] text-[#888888] border border-[#2E2E2E]"
                        )}
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        {c.isVerified ? "Certifié" : "Standard"}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveCreator(c)}
                          className="h-8 px-2 text-[#CCCCCC] hover:text-white hover:bg-[#262626]"
                        >
                          Gérer
                        </Button>
                        <Link
                          href={`/creators/${c.slug}`}
                          target="_blank"
                          className="p-1.5 text-[#777777] hover:text-white rounded-lg hover:bg-[#262626] transition-colors"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#222222] pt-4 text-xs text-[#888888]">
          <div>
            Affichage de {creators.length} sur {total} créateurs
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="border-[#2A2A2A] bg-[#141414] text-white disabled:opacity-30"
            >
              Précédent
            </Button>
            <span className="px-3 py-1 bg-[#141414] border border-[#2A2A2A] rounded-lg text-white font-medium">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="border-[#2A2A2A] bg-[#141414] text-white disabled:opacity-30"
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SLIDE-OVER PANNEAU LATÉRAL DE GESTION CRÉATEUR              */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeCreator && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay sombre */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveCreator(null)}
          />

          {/* Panneau */}
          <div className="relative w-full max-w-xl bg-[#111111] border-l border-[#262626] h-full flex flex-col z-10 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header du panneau */}
            <div className="p-6 border-b border-[#222222] flex items-center justify-between bg-[#141414] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#222222] border border-[#2A2A2A] flex items-center justify-center font-bold text-white text-base shrink-0 overflow-hidden">
                  {activeCreator.avatar ? (
                    <img src={activeCreator.avatar} alt={activeCreator.displayName} className="w-full h-full object-cover" />
                  ) : (
                    activeCreator.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{activeCreator.displayName}</h2>
                    {activeCreator.isVerified && <BadgeCheck className="w-5 h-5 text-[#60A5FA]" />}
                  </div>
                  <div className="text-xs text-[#888888] font-mono">@{activeCreator.slug}</div>
                </div>
              </div>

              <button
                onClick={() => setActiveCreator(null)}
                className="w-8 h-8 rounded-lg bg-[#222222] hover:bg-[#2A2A2A] text-[#888888] hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Onglets du tiroir */}
            <div className="flex border-b border-[#222222] bg-[#141414] px-6 text-xs font-semibold uppercase tracking-wider shrink-0">
              <button
                onClick={() => setDrawerTab("info")}
                className={classNames(
                  "py-3 px-4 border-b-2 transition-colors flex items-center gap-2",
                  drawerTab === "info" ? "border-[#FFBF00] text-white" : "border-transparent text-[#777777] hover:text-white"
                )}
              >
                <FileEdit className="w-3.5 h-3.5" />
                Profil & Détails
              </button>
              <button
                onClick={() => setDrawerTab("podcasts")}
                className={classNames(
                  "py-3 px-4 border-b-2 transition-colors flex items-center gap-2",
                  drawerTab === "podcasts" ? "border-[#FFBF00] text-white" : "border-transparent text-[#777777] hover:text-white"
                )}
              >
                <Podcast className="w-3.5 h-3.5" />
                Émissions ({activeCreator.podcastsCount})
              </button>
              <button
                onClick={() => setDrawerTab("market")}
                className={classNames(
                  "py-3 px-4 border-b-2 transition-colors flex items-center gap-2",
                  drawerTab === "market" ? "border-[#FFBF00] text-white" : "border-transparent text-[#777777] hover:text-white"
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                Droits & Marchés
              </button>
            </div>

            {/* Corps défilant du panneau */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {drawerTab === "info" && (
                <div className="space-y-5">
                  {/* Formulaire de modification */}
                  <div className="space-y-4 bg-[#141414] border border-[#222222] rounded-2xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFBF00] mb-3">
                      Informations Publiques
                    </h3>

                    <div>
                      <label className="block text-xs text-[#888888] font-medium mb-1.5">Nom d&apos;affichage officiel</label>
                      <input
                        type="text"
                        value={editDisplayName}
                        onChange={(e) => setEditDisplayName(e.target.value)}
                        className="w-full h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFBF00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#888888] font-medium mb-1.5">Slug URL public</label>
                      <div className="flex items-center">
                        <span className="h-10 px-3 bg-[#1C1C1C] border border-r-0 border-[#2A2A2A] rounded-l-xl text-xs text-[#888888] flex items-center font-mono">
                          /creators/
                        </span>
                        <input
                          type="text"
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          className="flex-1 h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-r-xl text-sm text-white font-mono focus:outline-none focus:border-[#FFBF00]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#888888] font-medium mb-1.5">Biographie de l&apos;artiste</label>
                      <textarea
                        rows={4}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Présentez l'artiste, son parcours et son univers sonore..."
                        className="w-full p-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFBF00] resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#888888] font-medium mb-1.5">Site web ou portfolio</label>
                      <input
                        type="url"
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        placeholder="https://..."
                        className="w-full h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFBF00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#888888] font-medium mb-1.5">Pays d&apos;attache</label>
                      <select
                        value={editCountryId}
                        onChange={(e) => setEditCountryId(e.target.value)}
                        className="w-full h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFBF00]"
                      >
                        <option value="">Sélectionner un pays</option>
                        {DEFAULT_COUNTRIES.map((cty) => (
                          <option key={cty.code} value={cty.code}>
                            {cty.flag} {cty.name} ({cty.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Interrupteur Certification Badge Bleu */}
                    <div className="pt-3 border-t border-[#222222]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Badge Créateur Certifié</span>
                            <BadgeCheck className="w-4 h-4 text-[#60A5FA]" />
                          </div>
                          <p className="text-xs text-[#888888] mt-0.5">
                            Active le badge bleu officiel visible sur l&apos;application mobile et le web.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditVerified(!editVerified)}
                          className={classNames(
                            "w-12 h-6 rounded-full transition-colors relative",
                            editVerified ? "bg-[#3B82F6]" : "bg-[#2A2A2A]"
                          )}
                        >
                          <span
                            className={classNames(
                              "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                              editVerified ? "right-1" : "left-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="pt-3">
                      <Button
                        onClick={handleSaveCreatorEdits}
                        disabled={isUpdating}
                        className="w-full bg-[#FFBF00] hover:bg-[#E5AC00] text-[#0B0B0B] font-bold text-sm"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          "Enregistrer les modifications"
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Compte Utilisateur lié */}
                  <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#888888]">
                      Compte Utilisateur Associé
                    </h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888888]">Email de connexion :</span>
                      <span className="text-white font-mono font-medium">{activeCreator.user.email}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888888]">Nom complet du compte :</span>
                      <span className="text-white font-medium">{activeCreator.user.fullName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888888]">Rôles système :</span>
                      <div className="flex gap-1">
                        {activeCreator.user.roles.map((r) => (
                          <span key={r} className="px-2 py-0.5 rounded bg-[#222222] text-[#CCCCCC] text-[10px] font-mono">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#888888]">Statut du compte :</span>
                      <span
                        className={classNames(
                          "px-2 py-0.5 rounded text-[11px] font-semibold",
                          activeCreator.user.isSuspended ? "bg-red-950 text-red-300" : "bg-emerald-950 text-emerald-300"
                        )}
                      >
                        {activeCreator.user.isSuspended ? "Compte Suspendu" : "Compte Actif"}
                      </span>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/admin/users`}
                        className="text-xs text-[#FFBF00] hover:underline flex items-center gap-1"
                      >
                        <span>Gérer ce compte dans Utilisateurs & Rôles</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Zone de danger */}
                  <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Zone de Danger
                    </h3>
                    <p className="text-xs text-[#A0A0A0] leading-relaxed mb-4">
                      La suppression du profil créateur retire sa page publique, ses abonnements et son identifiant d&apos;artiste. Le compte utilisateur reste actif avec le rôle auditeur standard.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setCreatorToDelete(activeCreator)}
                      className="border-red-900/60 bg-red-950/40 text-red-300 hover:bg-red-900/60 hover:text-white text-xs w-full font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Supprimer le profil créateur
                    </Button>
                  </div>
                </div>
              )}

              {/* Onglet Podcasts */}
              {drawerTab === "podcasts" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Émissions administrées</h3>
                      <p className="text-xs text-[#888888]">
                        Podcasts dont ce créateur est propriétaire ou éditeur.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setCreatorForAssign(activeCreator);
                        setIsAssignModalOpen(true);
                      }}
                      className="bg-[#222222] hover:bg-[#2A2A2A] text-white border border-[#333333] text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5 text-[#FFBF00]" />
                      Rattacher une émission
                    </Button>
                  </div>

                  {activeCreator.podcasts.length === 0 ? (
                    <div className="bg-[#141414] border border-[#222222] rounded-2xl p-8 text-center">
                      <Podcast className="w-8 h-8 text-[#555555] mx-auto mb-2" />
                      <p className="text-xs text-[#888888] mb-3">Aucune émission n&apos;est actuellement rattachée à ce créateur.</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setCreatorForAssign(activeCreator);
                          setIsAssignModalOpen(true);
                        }}
                        className="bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Attribuer un podcast existant
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeCreator.podcasts.map((pod) => (
                        <div
                          key={pod.id}
                          className="bg-[#141414] border border-[#222222] rounded-xl p-3.5 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={pod.cover || "/default-cover.jpg"}
                              alt={pod.name}
                              className="w-11 h-11 rounded-lg object-cover bg-[#222222] shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-white truncate">{pod.name}</h4>
                              <div className="text-xs text-[#777777] flex items-center gap-2">
                                <span>{pod._count?.episodes || 0} épisodes</span>
                                <span>•</span>
                                <span className="uppercase text-[10px] text-emerald-400 font-semibold">{pod.status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Link
                              href={`/admin/podcasts/${pod.id}`}
                              className="px-2.5 py-1.5 bg-[#222222] hover:bg-[#2A2A2A] text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                              <span>Gérer</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Droits & Marchés */}
              {drawerTab === "market" && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Accès aux Marchés & Capacités Studio</h3>
                    <p className="text-xs text-[#888888]">
                      Contrôlez les autorisations de création, publication et monétisation par pays.
                    </p>
                  </div>

                  <div className="bg-[#141414] border border-[#222222] rounded-2xl p-4 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#FFBF00] mb-2">
                      Permissions Globales Créateur
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-2 border-b border-[#222222]">
                        <div>
                          <span className="font-bold text-white">Création d&apos;émissions</span>
                          <p className="text-[#777777] text-[11px]">Peut initialiser de nouveaux flux et podcasts</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold text-[10px]">
                          AUTORISÉ
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-[#222222]">
                        <div>
                          <span className="font-bold text-white">Publication d&apos;épisodes</span>
                          <p className="text-[#777777] text-[11px]">Peut diffuser des fichiers audios/vidéos</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold text-[10px]">
                          AUTORISÉ
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div>
                          <span className="font-bold text-white">Monétisation Studio</span>
                          <p className="text-[#777777] text-[11px]">Accès à la régie publicitaire et sponsoring</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-semibold text-[10px]">
                          SUR DEMANDE
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#141414] border border-[#222222] rounded-2xl text-xs text-[#888888]">
                    Pour configurer les pays ouverts ou la bêta fermée, consultez le module{" "}
                    <Link href="/admin/categories" className="text-[#FFBF00] hover:underline font-medium">
                      Catégories et Marchés
                    </Link>.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODALE : CRÉER UN NOUVEAU PROFIL CRÉATEUR                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-6 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#222222] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Nouveau Profil Créateur</h3>
                <p className="text-xs text-[#888888]">
                  Associez une identité d&apos;artiste officielle à un compte utilisateur existant.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#222222] text-[#888888] hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCreatorSubmit} className="space-y-4">
              {/* Étape 1 : Sélection de l'utilisateur */}
              <div>
                <label className="block text-xs text-[#CCCCCC] font-medium mb-1.5">
                  1. Rechercher et sélectionner l&apos;utilisateur *
                </label>
                <input
                  type="text"
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  placeholder="Tapez le nom ou email de l'utilisateur..."
                  className="w-full h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFBF00]"
                />

                {usersSearchData?.items && usersSearchData.items.length > 0 && (
                  <div className="mt-2 max-h-36 overflow-y-auto bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl p-1 divide-y divide-[#1C1C1C]">
                    {usersSearchData.items.map((u: any) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setCreateUserId(u.id);
                          if (!createDisplayName) setCreateDisplayName(u.fullName || "");
                          setUserSearchTerm(`${u.fullName} (${u.email})`);
                        }}
                        className={classNames(
                          "p-2 text-xs rounded-lg cursor-pointer flex items-center justify-between transition-colors",
                          createUserId === u.id ? "bg-[#2A2A2A] text-white" : "text-[#AAAAAA] hover:bg-[#1A1A1A] hover:text-white"
                        )}
                      >
                        <div>
                          <div className="font-semibold text-white">{u.fullName}</div>
                          <div className="text-[11px] text-[#777777]">{u.email}</div>
                        </div>
                        {createUserId === u.id && <Check className="w-4 h-4 text-[#FFBF00]" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Étape 2 : Nom d'artiste & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#CCCCCC] font-medium mb-1.5">Nom d&apos;artiste / Marque *</label>
                  <input
                    type="text"
                    required
                    value={createDisplayName}
                    onChange={(e) => setCreateDisplayName(e.target.value)}
                    placeholder="Ex: Salif Keïta"
                    className="w-full h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFBF00]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[#CCCCCC] font-medium mb-1.5">Slug personnalisé</label>
                  <input
                    type="text"
                    value={createSlug}
                    onChange={(e) => setCreateSlug(e.target.value)}
                    placeholder="ex: salif-keita"
                    className="w-full h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#FFBF00]"
                  />
                </div>
              </div>

              {/* Bio & Pays */}
              <div>
                <label className="block text-xs text-[#CCCCCC] font-medium mb-1.5">Pays de résidence</label>
                <select
                  value={createCountryId}
                  onChange={(e) => setCreateCountryId(e.target.value)}
                  className="w-full h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFBF00]"
                >
                  <option value="">Sélectionner un pays</option>
                  {DEFAULT_COUNTRIES.map((cty) => (
                    <option key={cty.code} value={cty.code}>
                      {cty.flag} {cty.name} ({cty.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#CCCCCC] font-medium mb-1.5">Biographie</label>
                <textarea
                  rows={2}
                  value={createBio}
                  onChange={(e) => setCreateBio(e.target.value)}
                  placeholder="Courte description de l'artiste..."
                  className="w-full p-2.5 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFBF00] resize-none"
                />
              </div>

              {/* Certification immédiate */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="createVerifiedCheckbox"
                  checked={createVerified}
                  onChange={(e) => setCreateVerified(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#0E0E0E] border-[#333333] text-[#3B82F6] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="createVerifiedCheckbox" className="text-xs text-white font-medium cursor-pointer">
                  Accorder immédiatement le badge créateur certifié (badge bleu)
                </label>
              </div>

              {/* Actions submit */}
              <div className="pt-3 border-t border-[#222222] flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="border-[#2A2A2A] bg-[#1C1C1C] text-[#CCCCCC]"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !createUserId}
                  className="bg-[#FFBF00] hover:bg-[#E5AC00] text-[#0B0B0B] font-bold text-sm"
                >
                  {isCreating ? "Création en cours..." : "Créer le créateur"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODALE : ASSIGNER UNE ÉMISSION À UN CRÉATEUR                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isAssignModalOpen && creatorForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsAssignModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Rattacher une émission</h3>
                <p className="text-xs text-[#888888]">
                  Assigner la propriété d&apos;un podcast à <strong className="text-white">{creatorForAssign.displayName}</strong>.
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-[#222222] text-[#888888] hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <input
                type="text"
                value={podcastSearchTerm}
                onChange={(e) => setPodcastSearchTerm(e.target.value)}
                placeholder="Filtrer parmi les émissions du catalogue..."
                className="w-full h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none focus:border-[#FFBF00]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-[#1C1C1C]">
              {podcastsSearchData?.items?.map((p: any) => (
                <div
                  key={p.id}
                  className="pt-1.5 flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-[#1A1A1A] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={p.cover || "/default-cover.jpg"}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover bg-[#222222] shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{p.name}</div>
                      <div className="text-[11px] text-[#777777] truncate">{p.primaryLanguageCode}</div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    disabled={isAssigning}
                    onClick={() => handleAssignPodcastSubmit(p.id)}
                    className="h-8 bg-[#FFBF00] hover:bg-[#E5AC00] text-[#0B0B0B] font-bold text-xs shrink-0"
                  >
                    Rattacher
                  </Button>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAssignModalOpen(false)}
                className="border-[#2A2A2A] bg-[#1C1C1C] text-[#CCCCCC]"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODALE : SUPPRESSION SÉCURISÉE DE PROFIL CRÉATEUR            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {creatorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCreatorToDelete(null)} />
          <div className="relative w-full max-w-md bg-[#161616] border border-red-900/60 rounded-2xl shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-white mb-1">Supprimer le profil créateur ?</h3>
              <p className="text-xs text-[#999999] leading-relaxed">
                Êtes-vous sûr de vouloir supprimer le profil de <strong className="text-white">{creatorToDelete.displayName}</strong> ?
                La fiche publique et les données d&apos;artiste seront effacées. Le compte utilisateur ({creatorToDelete.user.email}) restera intact.
              </p>
            </div>

            <div>
              <label className="block text-xs text-[#888888] mb-1.5">
                Tapez <strong className="text-white">supprimer</strong> pour confirmer :
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="supprimer"
                className="w-full h-10 px-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-sm text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setCreatorToDelete(null)}
                className="flex-1 border-[#2A2A2A] bg-[#1F1F1F] text-white"
              >
                Annuler
              </Button>
              <Button
                disabled={isDeleting || deleteConfirmationText.trim().toLowerCase() !== "supprimer"}
                onClick={handleDeleteCreatorSubmit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm disabled:opacity-40"
              >
                {isDeleting ? "Suppression..." : "Confirmer la suppression"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

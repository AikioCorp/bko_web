"use client";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Search,
  Loader2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileAudio,
  Layers,
} from "lucide-react";
import Link from "next/link";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type SearchContentType = "PODCAST" | "EPISODE" | "COLLECTION";

export default function EditorialEditPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const { data: section, mutate, error, isLoading } = useSWR(
    `/admin/editorial/sections/${id}`,
    fetcher
  );

  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchType, setSearchType] = useState<SearchContentType>("PODCAST");

  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title || "",
        subtitle: section.subtitle || "",
        type: section.type || "HERO",
        sourceMode: section.sourceMode || "MANUAL",
        maxItems: section.maxItems || 12,
        priority: section.priority || 0,
        isFixedPlacement: section.isFixedPlacement || false,
        isActive: section.isActive ?? true,
      });

      // Default search tab based on section type
      if (section.type === "EPISODE_ROW") {
        setSearchType("EPISODE");
      } else if (section.type === "COLLECTION_ROW") {
        setSearchType("COLLECTION");
      } else {
        setSearchType("PODCAST");
      }
    }
  }, [section]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      await adminApi(`/admin/editorial/sections/${section.id}`, {
        method: "PATCH",
        body: JSON.stringify(formData),
      });
      await mutate();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSection = async () => {
    try {
      setIsDeleting(true);
      await adminApi(`/admin/editorial/sections/${section.id}`, {
        method: "DELETE",
      });
      router.push("/admin/editorial");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
      setIsDeleting(false);
    }
  };

  const searchItems = async (q: string, type: SearchContentType) => {
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setIsSearching(true);
      if (type === "PODCAST") {
        const res = await adminApi(
          `/admin/catalog?search=${encodeURIComponent(q)}&limit=15`
        );
        const list =
          res.data?.items ||
          res.data?.podcasts ||
          (Array.isArray(res.data) ? res.data : []);
        setSearchResults(
          list.map((p: any) => ({
            id: p.id,
            title: p.name || p.title,
            cover: p.cover,
            subtitle: p.primaryLanguage?.name || p.languageCode || "Podcast",
            targetType: "PODCAST",
          }))
        );
      } else if (type === "EPISODE") {
        const res = await adminApi(
          `/admin/episodes?search=${encodeURIComponent(q)}&limit=15`
        );
        const list =
          res.data?.data ||
          res.data?.items ||
          (Array.isArray(res.data) ? res.data : []);
        setSearchResults(
          list.map((ep: any) => ({
            id: ep.id,
            title: ep.title,
            cover: ep.cover || ep.podcast?.cover,
            subtitle: ep.podcast?.name ? `Épisode • ${ep.podcast.name}` : "Épisode",
            targetType: "EPISODE",
          }))
        );
      } else if (type === "COLLECTION") {
        const res = await adminApi("/admin/collections");
        const list = Array.isArray(res.data) ? res.data : [];
        const lowerQ = q.toLowerCase();
        const filtered = list.filter((c: any) =>
          (c.title || "").toLowerCase().includes(lowerQ)
        );
        setSearchResults(
          filtered.map((c: any) => ({
            id: c.id,
            title: c.title,
            cover: c.cover,
            subtitle: "Collection",
            targetType: "COLLECTION",
          }))
        );
      }
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchItems(searchQuery, searchType);
    }, 350);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchType]);

  const handleAddItem = async (item: any) => {
    try {
      const payload: any = {};
      if (item.targetType === "PODCAST") {
        payload.podcastId = item.id;
      } else if (item.targetType === "EPISODE") {
        payload.episodeId = item.id;
      } else if (item.targetType === "COLLECTION") {
        payload.collectionId = item.id;
      }

      await adminApi(`/admin/editorial/sections/${section.id}/items`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await mutate();
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout de l'élément");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      mutate(
        {
          ...section,
          items: (section.items || []).filter((i: any) => i.id !== itemId),
        },
        false
      );
      await adminApi(`/admin/editorial/sections/items/${itemId}`, {
        method: "DELETE",
      });
      mutate();
    } catch (err) {
      console.error(err);
      alert("Erreur lors du retrait");
    }
  };

  const handleMoveItem = async (index: number, direction: "up" | "down") => {
    const items = [...(section.items || [])];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    // Swap items
    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);

    // Optimistic update
    mutate({ ...section, items }, false);

    try {
      const ids = items.map((i: any) => i.id);
      await adminApi(`/admin/editorial/sections/${section.id}/items/reorder`, {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      mutate();
    } catch (err) {
      console.error(err);
      mutate(); // rollback
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-[#888888] flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#FFBF00]" />
        Chargement de la section...
      </div>
    );

  if (error || !section)
    return (
      <div className="p-8 text-red-500">
        Section introuvable ou erreur de chargement.
      </div>
    );

  return (
    <div className="w-full pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/editorial"
            className="p-2 hover:bg-[#1A1A1A] rounded-full transition-colors text-[#888888] hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white leading-tight">
                {formData.title || section.title || "Éditer la section"}
              </h1>
              {formData.isActive ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                  Actif
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Inactif
                </span>
              )}
            </div>
            <p className="text-sm text-[#888888] mt-0.5">Identifiant : {section.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
              <CheckCircle2 className="w-4 h-4" />
              Enregistré !
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-white text-black px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings */}
        <div className="space-y-6">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 space-y-6">
            <h2 className="font-semibold text-white text-lg">Paramètres</h2>

            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1.5">
                Titre
              </label>
              <input
                type="text"
                value={formData.title ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#FFBF00] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1.5">
                Sous-titre (optionnel)
              </label>
              <input
                type="text"
                value={formData.subtitle ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                placeholder="Ex : Sélection hebdomadaire de la rédaction"
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#FFBF00] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1.5">
                Type d'affichage
              </label>
              <select
                value={formData.type ?? "PODCAST_ROW"}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#FFBF00] transition-colors"
              >
                <option value="HERO">Hero (Bannière d'en-tête)</option>
                <option value="PODCAST_ROW">Ligne de Podcasts</option>
                <option value="EPISODE_ROW">Ligne d'Épisodes</option>
                <option value="COLLECTION_ROW">Ligne de Collections</option>
                <option value="PERSON_ROW">Ligne de Personnalités</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1.5">
                Mode de contenu
              </label>
              <select
                value={formData.sourceMode || "MANUAL"}
                onChange={(e) =>
                  setFormData({ ...formData, sourceMode: e.target.value })
                }
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#FFBF00] transition-colors"
              >
                <option value="MANUAL">Manuel (Éléments choisis à la main)</option>
                <option value="AUTOMATIC">Automatique (Algorithme)</option>
                <option value="HYBRID">
                  Hybride (Manuel complété par recommandation)
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#888888] mb-1.5">
                  Nb max d'éléments
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.maxItems || 12}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxItems: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888888] mb-1.5">
                  Priorité d'affichage
                </label>
                <input
                  type="number"
                  value={formData.priority || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#FFBF00] transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="font-medium text-white text-sm">
                  Emplacement fixe
                </div>
                <div className="text-xs text-[#888888]">
                  Ne pas réordonner cette section automatiquement
                </div>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.isFixedPlacement)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isFixedPlacement: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-[#FFBF00] rounded"
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
              <div>
                <div className="font-medium text-white text-sm">
                  Statut d'affichage
                </div>
                <div className="text-xs text-[#888888]">
                  {formData.isActive
                    ? "Visible sur l'accueil et découverte"
                    : "Masqué (inactif)"}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, isActive: !formData.isActive })
                }
                className={classNames(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  formData.isActive ? "bg-[#FFBF00]" : "bg-[#2A2A2A]"
                )}
              >
                <span
                  className={classNames(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out",
                    formData.isActive ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Delete Section Danger Card */}
          <div className="bg-[#141414] border border-red-500/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-red-400">
              Zone de danger
            </h3>
            <p className="text-xs text-[#888888]">
              Supprimer cette section éditoriale retirera tous ses éléments associés
              de la page d'accueil.
            </p>
            {showDeleteConfirm ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Êtes-vous sûr de vouloir supprimer cette sélection ?
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-[#2A2A2A] text-white hover:bg-[#333333] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteSection}
                    disabled={isDeleting}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    Confirmer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-center px-4 py-2 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/30"
              >
                Supprimer cette section
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Items */}
        <div className="lg:col-span-2">
          <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-white text-lg">
                  Éléments de la section
                </h2>
                <p className="text-xs text-[#888888]">
                  {section.items?.length || 0} élément(s) configuré(s)
                </p>
              </div>
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="bg-white text-black hover:bg-gray-100 px-4 py-2 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter un élément
              </button>
            </div>

            {/* Search Box */}
            {isSearchOpen && (
              <div className="mb-6 p-4 border border-[#2A2A2A] rounded-xl bg-[#0B0B0B] space-y-3">
                {/* Search Type Tabs */}
                <div className="flex gap-2 pb-1 border-b border-[#242424]">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchType("PODCAST");
                      setSearchResults([]);
                    }}
                    className={classNames(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors",
                      searchType === "PODCAST"
                        ? "bg-[#FFBF00] text-black"
                        : "text-[#888888] hover:text-white bg-[#141414]"
                    )}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    Podcasts
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchType("EPISODE");
                      setSearchResults([]);
                    }}
                    className={classNames(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors",
                      searchType === "EPISODE"
                        ? "bg-[#FFBF00] text-black"
                        : "text-[#888888] hover:text-white bg-[#141414]"
                    )}
                  >
                    <FileAudio className="w-3.5 h-3.5" />
                    Épisodes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchType("COLLECTION");
                      setSearchResults([]);
                    }}
                    className={classNames(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors",
                      searchType === "COLLECTION"
                        ? "bg-[#FFBF00] text-black"
                        : "text-[#888888] hover:text-white bg-[#141414]"
                    )}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Collections
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchType === "PODCAST"
                        ? "Rechercher un podcast par nom..."
                        : searchType === "EPISODE"
                        ? "Rechercher un épisode par titre..."
                        : "Rechercher une collection..."
                    }
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#FFBF00] transition-colors"
                  />
                </div>

                {isSearching ? (
                  <div className="flex items-center justify-center py-6 text-xs text-[#888888] gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFBF00]" />
                    Recherche en cours...
                  </div>
                ) : searchResults.length > 0 ? (
                  <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {searchResults.map((res: any) => (
                      <li
                        key={res.id}
                        className="flex items-center justify-between p-2.5 hover:bg-[#1A1A1A] rounded-xl transition-colors group border border-transparent hover:border-[#2A2A2A]"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          {res.cover ? (
                            <img
                              src={res.cover}
                              alt=""
                              className="w-11 h-11 rounded-lg object-cover shrink-0 border border-[#2A2A2A]"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-[#1C1C1C] border border-[#2A2A2A] shrink-0 flex items-center justify-center text-xs text-[#666666]">
                              BKO
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {res.title}
                            </p>
                            <p className="text-xs text-[#888888] truncate mt-0.5">
                              {res.subtitle}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddItem(res)}
                          className="shrink-0 text-xs font-bold bg-[#FFBF00] text-black px-3.5 py-1.5 rounded-full hover:bg-[#E5AC00] transition-colors"
                        >
                          Ajouter
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : searchQuery ? (
                  <div className="text-center py-6 text-sm text-[#888888]">
                    Aucun résultat trouvé pour "{searchQuery}".
                  </div>
                ) : null}
              </div>
            )}

            {/* Items List */}
            <div className="space-y-2.5">
              {!section.items || section.items.length === 0 ? (
                <div className="text-center py-12 border border-[#2A2A2A] border-dashed rounded-2xl text-[#888888] text-sm bg-[#0B0B0B] space-y-2">
                  <p className="font-medium text-white">Cette section est vide.</p>
                  <p className="text-xs text-[#777777]">
                    Cliquez sur "Ajouter un élément" ci-dessus pour enrichir cette
                    sélection.
                  </p>
                </div>
              ) : (
                section.items.map((item: any, index: number) => {
                  const target = item.podcast || item.episode || item.collection;
                  const itemTitle = target?.title || target?.name || "Sans titre";
                  const itemCover = target?.cover || target?.imageUrl;
                  const itemKind = item.podcast
                    ? "Podcast"
                    : item.episode
                    ? "Épisode"
                    : item.collection
                    ? "Collection"
                    : "Élément";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3.5 group hover:border-[#444444] transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 pr-3">
                        {/* Position indicator */}
                        <span className="w-6 text-center text-xs font-mono text-[#666666] font-semibold shrink-0">
                          {index + 1}
                        </span>

                        {/* Cover */}
                        {itemCover ? (
                          <img
                            src={itemCover}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border border-[#2A2A2A] shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-[#1C1C1C] border border-[#2A2A2A] shrink-0 flex items-center justify-center text-xs text-[#666666]">
                            BKO
                          </div>
                        )}

                        {/* Title and metadata */}
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-white truncate">
                            {itemTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1C1C1C] text-[#AAAAAA] border border-[#2A2A2A]">
                              {itemKind}
                            </span>
                            {target?.slug && (
                              <span className="text-xs text-[#666666] truncate font-mono">
                                {target.slug}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls: Move Up/Down + Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveItem(index, "up")}
                          disabled={index === 0}
                          title="Monter"
                          className="p-1.5 text-[#888888] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveItem(index, "down")}
                          disabled={index === (section.items?.length || 0) - 1}
                          title="Descendre"
                          className="p-1.5 text-[#888888] hover:text-white hover:bg-[#1A1A1A] rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-[#888888] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
                          title="Retirer de la section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

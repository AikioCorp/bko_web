"use client";
import { AdminPageAccess } from "@/components/admin/AdminAccess";
import { AdminAction } from "@/components/admin/AdminAccess";
import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import {
  Plus,
  Trash2,
  LayoutList,
  ChevronUp,
  ChevronDown,
  Loader2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function EditorialListPage() {
  const router = useRouter();
  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const { data: sections, mutate, error, isLoading } = useSWR(
    "/admin/editorial/sections",
    fetcher
  );

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("PODCAST_ROW");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await adminApi("/admin/editorial/sections", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          type: newType,
          isActive: true,
        }),
      });
      await mutate();
      setIsCreating(false);
      setNewTitle("");
      showNotification("Section créée avec succès !");
      router.push(`/admin/editorial/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création de la section");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (section: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = !section.isActive;
    // Optimistic UI update
    mutate(
      sections.map((s: any) =>
        s.id === section.id ? { ...s, isActive: newStatus } : s
      ),
      false
    );

    try {
      await adminApi(`/admin/editorial/sections/${section.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: newStatus }),
      });
      mutate();
      showNotification(
        newStatus
          ? `"${section.title}" est maintenant active sur l'accueil`
          : `"${section.title}" a été désactivée`
      );
    } catch (err) {
      console.error(err);
      mutate();
    }
  };

  const handleMoveSection = async (
    index: number,
    direction: "up" | "down",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (!sections) return;
    const items = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const [moved] = items.splice(index, 1);
    items.splice(targetIndex, 0, moved);

    // Optimistic UI
    mutate(items, false);

    try {
      const ids = items.map((s: any) => s.id);
      await adminApi("/admin/editorial/sections/reorder", {
        method: "POST",
        body: JSON.stringify({ ids }),
      });
      mutate();
    } catch (err) {
      console.error(err);
      mutate();
    }
  };

  const handleDelete = async (section: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement la section "${section.title}" ?`
      )
    ) {
      return;
    }

    // Optimistic UI
    mutate(
      sections.filter((s: any) => s.id !== section.id),
      false
    );

    try {
      await adminApi(`/admin/editorial/sections/${section.id}`, {
        method: "DELETE",
      });
      mutate();
      showNotification(`Section "${section.title}" supprimée.`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
      mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-[#888888] flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[#FFBF00]" />
        Chargement des sélections...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Erreur de chargement des sélections éditoriales.
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      {/* Top Banner / Toast */}
      {actionSuccess && (
        <div className="fixed top-20 right-8 z-50 flex items-center gap-2 bg-[#1A1A1A] border border-green-500/40 text-green-400 px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          {actionSuccess}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Sélections Éditoriales
          </h1>
          <p className="text-[#888888] text-sm">
            Organisez les sections, bannières et listes de recommandations
            affichées sur l'accueil et la découverte.
          </p>
        </div>
        <AdminAction permission="catalog.edit"><button
          onClick={() => setIsCreating(true)}
          className="bg-white text-black px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Section
        </button></AdminAction>
      </div>

      {/* Create Section Modal / Form */}
      {isCreating && (
        <AdminAction permission="catalog.edit"><form
          onSubmit={handleCreate}
          className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 mb-8 shadow-xl space-y-4"
        >
          <h2 className="text-lg font-semibold text-white">
            Créer une nouvelle sélection
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1.5">
                Titre de la section
              </label>
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#FFBF00] transition-colors"
                placeholder="Ex : Produits par notre Studio"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1.5">
                Type d'affichage
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2.5 text-white outline-none focus:border-[#FFBF00] transition-colors"
              >
                <option value="PODCAST_ROW">Ligne de Podcasts</option>
                <option value="EPISODE_ROW">Ligne d'Épisodes</option>
                <option value="HERO">Hero (Bannière d'en-tête)</option>
                <option value="COLLECTION_ROW">Ligne de Collections</option>
                <option value="PERSON_ROW">Ligne de Personnalités</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim()}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-[#FFBF00] text-black hover:bg-[#E5AC00] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isSubmitting ? "Création..." : "Créer et configurer"}
            </button>
          </div>
        </form></AdminAction>
      )}

      {/* Empty State */}
      {!sections || sections.length === 0 ? (
        <div className="text-center py-16 border border-[#2A2A2A] border-dashed rounded-2xl bg-[#0B0B0B]">
          <LayoutList className="w-12 h-12 text-[#333333] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Aucune sélection éditoriale
          </h3>
          <p className="text-[#888888] text-sm max-w-md mx-auto mb-6">
            Créez votre première sélection pour mettre en avant vos meilleures
            émissions ou séries audio sur la page d'accueil.
          </p>
          <AdminAction permission="catalog.edit"><button
            onClick={() => setIsCreating(true)}
            className="bg-white text-black px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Créer une section
          </button></AdminAction>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-[#0B0B0B]">
                <th className="px-4 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider w-16 text-center">
                  Ordre
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">
                  Titre
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">
                  Éléments
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {sections.map((section: any, index: number) => {
                const itemCount = section._count?.items ?? section.items?.length ?? 0;
                return (
                  <tr
                    key={section.id}
                    className="hover:bg-[#1A1A1A] transition-colors group cursor-pointer"
                    onClick={() =>
                      router.push(`/admin/editorial/${section.id}`)
                    }
                  >
                    {/* Move Up / Down */}
                    <td
                      className="px-4 py-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <AdminAction permission="catalog.edit"><button
                          type="button"
                          onClick={(e) => handleMoveSection(index, "up", e)}
                          disabled={index === 0}
                          title="Monter"
                          className="p-1 text-[#666666] hover:text-white hover:bg-[#2A2A2A] rounded disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button></AdminAction>
                        <AdminAction permission="catalog.edit"><button
                          type="button"
                          onClick={(e) => handleMoveSection(index, "down", e)}
                          disabled={index === sections.length - 1}
                          title="Descendre"
                          className="p-1 text-[#666666] hover:text-white hover:bg-[#2A2A2A] rounded disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button></AdminAction>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white group-hover:text-[#FFBF00] transition-colors flex items-center gap-2">
                        {section.title}
                      </div>
                      <p className="text-xs text-[#888888] mt-0.5 font-mono">
                        {section.slug}
                      </p>
                      {section.subtitle && (
                        <p className="text-xs text-[#666666] mt-0.5 truncate max-w-sm">
                          {section.subtitle}
                        </p>
                      )}
                    </td>

                    {/* Type Badge */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#2A2A2A] text-gray-300">
                        {section.type === "PODCAST_ROW"
                          ? "Podcasts"
                          : section.type === "EPISODE_ROW"
                          ? "Épisodes"
                          : section.type === "HERO"
                          ? "Bannière Hero"
                          : section.type === "COLLECTION_ROW"
                          ? "Collections"
                          : section.type}
                      </span>
                    </td>

                    {/* Items Count */}
                    <td className="px-6 py-4 text-sm text-[#888888]">
                      <span
                        className={classNames(
                          "font-semibold",
                          itemCount > 0 ? "text-white" : "text-amber-500/80"
                        )}
                      >
                        {itemCount}
                      </span>{" "}
                      {itemCount > 1 ? "éléments" : "élément"}
                      {itemCount === 0 && (
                        <span className="block text-[11px] text-amber-500/80 mt-0.5">
                          Section vide
                        </span>
                      )}
                    </td>

                    {/* Active Toggle Switch */}
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AdminAction permission="catalog.edit"><button
                        type="button"
                        onClick={(e) => handleToggleStatus(section, e)}
                        className={classNames(
                          "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          section.isActive ? "bg-[#FFBF00]" : "bg-[#2A2A2A]"
                        )}
                        title={
                          section.isActive
                            ? "Cliquer pour désactiver"
                            : "Cliquer pour activer"
                        }
                      >
                        <span
                          className={classNames(
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out",
                            section.isActive
                              ? "translate-x-5"
                              : "translate-x-0"
                          )}
                        />
                      </button></AdminAction>
                    </td>

                    {/* Actions: Edit, Delete */}
                    <td
                      className="px-6 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <AdminPageAccess href={`/admin/editorial/${section.id}`}><Link
                          href={`/admin/editorial/${section.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#2A2A2A] text-white hover:bg-[#333333] transition-colors"
                        >
                          Gérer
                          <ExternalLink className="w-3 h-3" />
                        </Link></AdminPageAccess>
                        <AdminAction permission="catalog.edit"><button
                          type="button"
                          onClick={(e) => handleDelete(section, e)}
                          className="p-1.5 text-[#888888] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer la section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button></AdminAction>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { Plus, Edit2, Trash2, GripVertical, AlertCircle, LayoutList } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function EditorialListPage() {
  const router = useRouter();
  const fetcher = (url: string) => adminApi(url).then(res => res.data);
  const { data: sections, mutate, error, isLoading } = useSWR("/admin/editorial/sections", fetcher);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("HERO");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await adminApi("/admin/editorial/sections", { method: "POST", body: JSON.stringify({ title: newTitle, type: newType }) });
      await mutate();
      setIsCreating(false);
      router.push(`/admin/editorial/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-[#888888]">Chargement...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Erreur de chargement des sections.</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Sélections Éditoriales</h1>
          <p className="text-[#888888]">Gérez les sections de la page d'accueil et de découverte.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-white text-black px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Section
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Créer une section</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1">Titre de la section</label>
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white outline-none focus:border-[#444444]"
                placeholder="Ex: Nouveautés"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1">Type d'affichage</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white outline-none focus:border-[#444444]"
              >
                <option value="HERO">Hero (Bannière d'en-tête)</option>
                <option value="PODCAST_ROW">Ligne de Podcasts</option>
                <option value="EPISODE_ROW">Ligne d'Épisodes</option>
                <option value="PERSON_ROW">Ligne de Personnalités</option>
                <option value="COLLECTION_ROW">Ligne de Collections</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:bg-[#2A2A2A] transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white text-black hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Création..." : "Créer"}
              </button>
            </div>
          </div>
        </form>
      )}

      {sections?.length === 0 ? (
        <div className="text-center py-12 border border-[#2A2A2A] border-dashed rounded-2xl bg-[#0B0B0B]">
          <LayoutList className="w-12 h-12 text-[#333333] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune section</h3>
          <p className="text-[#888888]">Créez votre première sélection pour animer l'application.</p>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2A2A] bg-[#0B0B0B]">
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider w-10"></th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Titre</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Éléments</th>
                <th className="px-6 py-4 text-xs font-semibold text-[#888888] uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {sections?.map((section: any) => (
                <tr key={section.id} className="hover:bg-[#1A1A1A] transition-colors group">
                  <td className="px-6 py-4">
                    <GripVertical className="w-5 h-5 text-[#333333] cursor-grab hover:text-white" />
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/editorial/${section.slug || section.id}`} className="font-semibold text-white hover:underline">
                      {section.title}
                    </Link>
                    {section.subtitle && <p className="text-xs text-[#888888] mt-1">{section.subtitle}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2A2A2A] text-gray-300">
                      {section.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#888888]">
                    {section._count.items} {section._count.items > 1 ? "éléments" : "élément"}
                  </td>
                  <td className="px-6 py-4">
                    {section.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
                        Inactif
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/editorial/${section.slug || section.id}`}
                      className="opacity-0 group-hover:opacity-100 inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-[#2A2A2A] text-white hover:bg-[#333333] transition-all"
                    >
                      Modifier
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { adminApi } from "@/lib/api";
import { Plus, LayoutGrid, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CollectionsListPage() {
  const router = useRouter();
  const fetcher = (url: string) => adminApi(url).then(res => res.data);
  const { data: collections, mutate, error, isLoading } = useSWR("/admin/collections", fetcher);
  
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setIsSubmitting(true);
      const res = await adminApi("/admin/collections", { method: "POST", body: JSON.stringify({ title: newTitle }) });
      await mutate();
      setIsCreating(false);
      router.push(`/admin/collections/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-[#888888]">Chargement...</div>;
  if (error) return <div className="p-8 text-red-500">Erreur de chargement.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Collections</h1>
          <p className="text-[#888888]">Créez des regroupements thématiques de contenus.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-white text-black px-4 py-2 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Collection
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 mb-8 max-w-md">
          <h2 className="text-lg font-semibold text-white mb-4">Créer une collection</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#888888] mb-1">Titre de la collection</label>
              <input
                autoFocus
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl px-4 py-2 text-white outline-none focus:border-[#444444]"
                placeholder="Ex: Les classiques du Mali"
                required
              />
            </div>
            <div className="flex justify-end gap-3 mt-2">
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

      {collections?.length === 0 ? (
        <div className="text-center py-12 border border-[#2A2A2A] border-dashed rounded-2xl bg-[#0B0B0B]">
          <LayoutGrid className="w-12 h-12 text-[#333333] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune collection</h3>
          <p className="text-[#888888]">Créez votre première collection pour regrouper vos meilleurs podcasts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections?.map((collection: any) => (
            <Link
              href={`/admin/collections/${collection.slug || collection.id}`}
              key={collection.id}
              className="bg-[#141414] border border-[#2A2A2A] hover:border-[#444444] rounded-2xl p-4 transition-colors group flex gap-4"
            >
              <div className="w-20 h-20 rounded-xl bg-[#1C1C1C] border border-[#2A2A2A] flex-shrink-0 flex items-center justify-center overflow-hidden">
                {collection.cover ? (
                  <img src={collection.cover} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[#333333]" />
                )}
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="font-semibold text-white group-hover:text-[#FFBF00] transition-colors line-clamp-1">{collection.title}</h3>
                <p className="text-xs text-[#888888] mt-1 line-clamp-2">{collection.description || "Aucune description"}</p>
                <div className="mt-2 text-xs font-medium text-[#888888]">
                  {collection._count.items} {collection._count.items > 1 ? "éléments" : "élément"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import { API_BASE_URL } from "@/lib/api";
import React from "react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";

export const dynamic = "force-dynamic";

async function getCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (e) {
    return [];
  }
}

export default async function CategoriesIndexPage() {
  const categories: any[] = await getCategories();

  return (
    <div className="w-full px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-2">
        <span className="bg-[#E5A93C]/10 text-[#E5A93C] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#E5A93C]/30 uppercase">
          EXPLORER PAR THÈME
        </span>
        <h1 className="text-3xl font-black text-white">Catégories</h1>
        <p className="text-xs text-gray-400">Parcourez les podcasts maliens et africains par catégorie.</p>
      </div>

      {categories.length === 0 ? (
        <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-12 text-center text-xs text-gray-400">
          Aucune catégorie disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className="bg-[#121722] border border-[#1E2638] hover:border-[#E5A93C]/50 rounded-2xl p-5 space-y-3 transition group"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white ${cat.color || "bg-[#E5A93C]"}`}>
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-white text-sm group-hover:text-[#E5A93C] transition">{cat.name}</h3>
                {cat.description && <p className="text-[11px] text-gray-400 line-clamp-2">{cat.description}</p>}
              </div>
              <div className="text-[11px] text-gray-500 font-mono">{cat._count?.podcasts ?? 0} podcasts</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

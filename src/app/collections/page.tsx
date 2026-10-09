import { API_BASE_URL } from "@/lib/api";
import React from "react";
import Link from "next/link";
import { FolderHeart } from "lucide-react";

export const dynamic = "force-dynamic";

async function getCollections() {
  try {
    const res = await fetch(`${API_BASE_URL}/collections`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (e) {
    return [];
  }
}

export default async function CollectionsIndexPage() {
  const collections: any[] = await getCollections();

  return (
    <div className="w-full px-4 py-8 space-y-8">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-2">
        <span className="bg-[#E5A93C]/10 text-[#E5A93C] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#E5A93C]/30 uppercase">
          SÃ‰LECTIONS Ã‰DITORIALES
        </span>
        <h1 className="text-3xl font-black text-white">Collections</h1>
        <p className="text-xs text-gray-400">Des sÃ©lections thÃ©matiques prÃ©parÃ©es par l'Ã©quipe Bamako Podcast.</p>
      </div>

      {collections.length === 0 ? (
        <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-12 text-center text-xs text-gray-400">
          Aucune collection disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="bg-[#121722] border border-[#1E2638] hover:border-[#E5A93C]/50 rounded-2xl overflow-hidden transition group"
            >
              {col.cover ? (
                <img src={col.cover} alt={col.title} className="w-full h-36 object-cover border-b border-[#1E2638]" />
              ) : (
                <div className="w-full h-36 bg-[#0A0D14] border-b border-[#1E2638] flex items-center justify-center text-[#E5A93C]">
                  <FolderHeart className="w-10 h-10" />
                </div>
              )}
              <div className="p-5 space-y-2">
                <h3 className="font-extrabold text-white text-sm group-hover:text-[#E5A93C] transition">{col.title}</h3>
                {col.description && <p className="text-[11px] text-gray-400 line-clamp-2">{col.description}</p>}
                <div className="text-[11px] text-gray-500 font-mono">{col._count?.items ?? 0} contenus</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


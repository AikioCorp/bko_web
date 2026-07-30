import React from "react";
import Link from "next/link";
import { FolderHeart } from "lucide-react";

export const dynamic = "force-dynamic";

async function getCollectionData(slug: string) {
  try {
    const res = await fetch(`http://localhost:8080/api/v1/collections/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (e) {
    return null;
  }
}

export default async function CollectionDetailPage({ params }: { params: { slug: string } }) {
  const collection = await getCollectionData(params.slug);

  if (!collection) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-black text-white">Collection Introuvable</h1>
        <p className="text-xs text-gray-400">Cette sélection éditoriale n'existe pas ou a été retirée.</p>
        <Link href="/" className="inline-block bg-[#E5A93C] text-black px-6 py-2 rounded-xl text-xs font-bold">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Collection */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
        {collection.cover ? (
          <img src={collection.cover} alt={collection.title} className="w-44 h-44 rounded-2xl object-cover border border-[#1E2638] shadow-2xl shrink-0" />
        ) : (
          <div className="w-44 h-44 bg-[#0A0D14] border border-[#1E2638] rounded-2xl flex items-center justify-center text-[#E5A93C] shrink-0">
            <FolderHeart className="w-16 h-16" />
          </div>
        )}

        <div className="space-y-3 text-center md:text-left flex-1">
          <span className="bg-[#E5A93C]/10 text-[#E5A93C] text-[10px] font-bold px-3 py-1 rounded-full border border-[#E5A93C]/30 uppercase tracking-wider">
            COLLECTION ÉDITORIALE
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white">{collection.title}</h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">{collection.description}</p>
          <div className="text-xs text-gray-500 pt-2 font-mono">
            {collection.items?.length || 0} contenus sélectionnés par l'équipe éditoriale
          </div>
        </div>
      </div>

      {/* Grille des Contenus de la Collection */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white">Sélection de la Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {collection.items?.map((item: any) => {
            const podcast = item.podcast;
            const episode = item.episode;
            const person = item.person;

            if (podcast) {
              return (
                <Link
                  key={item.id}
                  href={`/podcasts/${podcast.slug}`}
                  className="bg-[#121722] border border-[#1E2638] hover:border-[#E5A93C]/50 rounded-2xl p-5 space-y-4 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <img src={podcast.cover} alt={podcast.name} className="w-14 h-14 rounded-xl object-cover border border-[#1E2638]" />
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] text-[#E5A93C] font-bold uppercase">{podcast.country?.flagEmoji} {podcast.countryId}</span>
                      <h3 className="font-extrabold text-white text-sm truncate group-hover:text-[#E5A93C] transition">{podcast.name}</h3>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{podcast.shortDescription || podcast.description}</p>
                    </div>
                  </div>
                </Link>
              );
            }

            if (episode) {
              return (
                <div key={item.id} className="bg-[#121722] border border-[#1E2638] rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] text-blue-400 font-bold uppercase">Épisode Sélectionné</span>
                  <h3 className="font-extrabold text-white text-sm">{episode.title}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{episode.description}</p>
                </div>
              );
            }

            if (person) {
              return (
                <div key={item.id} className="bg-[#121722] border border-[#1E2638] rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] text-green-400 font-bold uppercase">Personnalité</span>
                  <h3 className="font-extrabold text-white text-sm">{person.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{person.bio}</p>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}

import { API_BASE_URL } from "@/lib/api";
import React from "react";
import Link from "next/link";
import { Building2, Globe, Radio } from "lucide-react";

async function getOrgData(slug: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/organizations/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (e) {
    return null;
  }
}

export default async function OrganizationDetailPage({ params }: { params: { slug: string } }) {
  const org = await getOrgData(params.slug);

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-black text-white">Organisation Introuvable</h1>
        <p className="text-xs text-gray-400">Cette organisation n'existe pas ou a été retirée.</p>
        <Link href="/" className="inline-block bg-[#E5A93C] text-black px-6 py-2 rounded-xl text-xs font-bold">
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8 space-y-8">
      {/* En-tête Organisation */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
        {org.logo ? (
          <img src={org.logo} alt={org.name} className="w-32 h-32 rounded-2xl object-cover border border-[#1E2638] shadow-2xl shrink-0" />
        ) : (
          <div className="w-32 h-32 bg-[#0A0D14] border border-[#1E2638] rounded-2xl flex items-center justify-center text-[#E5A93C] shrink-0">
            <Building2 className="w-12 h-12" />
          </div>
        )}

        <div className="space-y-3 text-center md:text-left flex-1">
          <span className="bg-[#E5A93C]/10 text-[#E5A93C] text-[10px] font-bold px-3 py-1 rounded-full border border-[#E5A93C]/30 uppercase tracking-wider">
            ORGANISATION & PRODUCTION
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white">{org.name}</h1>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed">{org.description}</p>
          {org.website && (
            <a
              href={org.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs text-[#E5A93C] hover:underline font-bold pt-1"
            >
              <Globe className="w-4 h-4" />
              <span>{org.website}</span>
            </a>
          )}
        </div>
      </div>

      {/* Podcasts de l'Organisation */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white">Podcasts Produits par {org.name}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {org.podcasts?.map((podcast: any) => (
            <Link
              key={podcast.id}
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
          ))}
        </div>
      </div>
    </div>
  );
}

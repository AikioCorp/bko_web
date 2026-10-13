"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface AdCampaignItem {
  id: string;
  advertiserName: string;
  title: string;
  description?: string | null;
  ctaLabel?: string | null;
  targetUrl: string;
  imageUrlDesktop: string;
  imageUrlMobile?: string | null;
  altText?: string | null;
  isSponsored: boolean;
}

interface AdBannerSlotProps {
  ad?: AdCampaignItem | null;
  onOpenInquiry?: () => void;
}

export function AdBannerSlot({ ad, onOpenInquiry }: AdBannerSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);

  useEffect(() => {
    if (!ad || hasRecordedImpression) return;

    const el = containerRef.current;
    if (!el) return;

    // Utilisation d'IntersectionObserver pour enregistrer l'impression uniquement lorsque la bannière est visible
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setHasRecordedImpression(true);
          fetchApi(`/ads/${ad.id}/impression`, { method: "POST" }).catch(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.5 } // 50% de la bannière dans le viewport
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [ad, hasRecordedImpression]);

  if (!ad) return null;

  const handleClick = (e: React.MouseEvent) => {
    // Enregistrement asynchrone du clic sans bloquer la navigation
    fetchApi(`/ads/${ad.id}/click`, { method: "POST" }).catch(() => {});
  };

  return (
    <div
      ref={containerRef}
      className="w-full my-6 p-4 md:p-6 rounded-2xl bg-[#141414] border border-[#222222] shadow-sm relative overflow-hidden"
    >
      {/* Sponsor / Ad label & advertiser info */}
      <div className="flex items-center justify-between gap-2 mb-3 text-[10px] uppercase tracking-wider text-[#888888]">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-[#222222] text-[#A0A0A0] font-black">
            {ad.isSponsored ? "Sponsorisé" : "Partenaire"}
          </span>
          <span className="font-bold text-[#FFBF00]">{ad.advertiserName}</span>
        </div>
        {onOpenInquiry && (
          <button
            onClick={onOpenInquiry}
            className="hover:text-white transition-colors text-[10px] lowercase tracking-normal"
          >
            Annoncer sur Bamako Podcast ?
          </button>
        )}
      </div>

      {/* Responsive Banner Card */}
      <a
        href={ad.targetUrl}
        target={ad.targetUrl.startsWith("http") ? "_blank" : "_self"}
        rel={ad.targetUrl.startsWith("http") ? "noopener noreferrer" : undefined}
        onClick={handleClick}
        className="group block relative rounded-xl overflow-hidden bg-[#1A1A1A] border border-[#262626] hover:border-[#383838] transition-all"
      >
        <div className="flex flex-col md:flex-row items-center">
          {/* Visual section */}
          <div className="relative w-full md:w-2/5 h-44 sm:h-52 md:h-48 shrink-0 bg-[#0B0B0B]">
            {/* Desktop visual */}
            <div className="hidden md:block absolute inset-0">
              <Image
                unoptimized
                src={ad.imageUrlDesktop}
                alt={ad.altText || ad.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            {/* Mobile visual */}
            <div className="block md:hidden absolute inset-0">
              <Image
                unoptimized
                src={ad.imageUrlMobile || ad.imageUrlDesktop}
                alt={ad.altText || ad.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          {/* Copy & CTA Section */}
          <div className="p-4 sm:p-6 w-full flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-[#FFBF00] transition-colors leading-snug">
                {ad.title}
              </h4>
              {ad.description && (
                <p className="text-xs text-[#A0A0A0] line-clamp-2 leading-relaxed">
                  {ad.description}
                </p>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFBF00] text-[#0B0B0B] font-bold text-xs group-hover:bg-[#e6ac00] transition-colors shadow-sm">
                <span>{ad.ctaLabel || "En savoir plus"}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
              <span className="text-[11px] text-[#666666] font-medium hidden sm:inline">
                Offre partenaire officielle
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}

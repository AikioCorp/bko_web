import React from "react";
import Link from "next/link";
import { BkoLogo } from "./ui/BkoLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0B0B0B] border-t border-[#1C1C1C] text-[#888888] text-xs pt-12 pb-8 mt-12">
      <div className="bko-container">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-12 border-b border-[#1C1C1C]">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <BkoLogo size="md" />
            <p className="text-[#888888] leading-relaxed">
              La plateforme de référence pour découvrir, écouter et valoriser les podcasts et récits du Mali et du Mandé.
            </p>
            <p className="text-[11px] text-[#666666]">
              © {new Date().getFullYear()} Bamako Podcast. Tous droits réservés.
            </p>
          </div>

          {/* Column 1: Découvrir */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Découvrir</h4>
            <ul className="space-y-2">
              <li><Link href="/explore?view=episodes" className="hover:text-[#FFBF00] transition-colors">Tous les épisodes</Link></li>
              <li><Link href="/explore?view=podcasts" className="hover:text-[#FFBF00] transition-colors">Toutes les émissions</Link></li>
              <li><Link href="/support" className="hover:text-[#FFBF00] transition-colors">Contacter l’assistance</Link></li>
              <li><Link href="/explore" className="hover:text-[#FFBF00] transition-colors">Thématiques & Catégories</Link></li>
              <li><Link href="/library" className="hover:text-[#FFBF00] transition-colors">Bibliothèque & Favoris</Link></li>
            </ul>
          </div>

          {/* Column 2: Créateurs */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Créateurs</h4>
            <ul className="space-y-2">
              <li><Link href="/become-creator" className="hover:text-[#FFBF00] transition-colors">Devenir créateur</Link></li>
              <li><Link href="/studio" className="hover:text-[#FFBF00] transition-colors">Espace Studio & Publication</Link></li>
              <li><Link href="/tarifs" className="hover:text-[#FFBF00] transition-colors">Tarifs d'enregistrement</Link></li>
            </ul>
          </div>

          {/* Column 3: Bko Podcast & Studio Physique */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Studio & Partenariats</h4>
            <ul className="space-y-2">
              <li><Link href="/tarifs" className="hover:text-[#FFBF00] transition-colors">Studio Bamako (Badalabougou)</Link></li>
              <li><Link href="/tarifs" className="text-[#FFBF00] hover:underline transition-colors font-semibold">Réserver une session 🎙️</Link></li>
              <li><Link href="/explore" className="hover:text-[#FFBF00] transition-colors">Annoncer & Sponsoriser</Link></li>
            </ul>
          </div>

          {/* Column 4: Support & Légal */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Plateforme</h4>
            <ul className="space-y-2">
              <li><Link href="/explore" className="hover:text-[#FFBF00] transition-colors">Catalogue certifié</Link></li>
              <li><Link href="/library" className="hover:text-[#FFBF00] transition-colors">Historique d'écoute</Link></li>
              <li><span className="text-[#666666]">Mali & Diaspora</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Mention */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6E7681]">
          <span>Conçu avec passion pour la culture et les voix du Mali et d'Afrique.</span>
          <span>Version 1.0.0 — Production Readiness</span>
        </div>
      </div>
    </footer>
  );
};

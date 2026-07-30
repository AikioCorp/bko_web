import React from "react";
import Link from "next/link";
import { BkoLogo } from "./ui/BkoLogo";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0B0F17] border-t border-[#21262D] text-[#8B949E] text-xs pt-12 pb-8 mt-16">
      <div className="bko-container">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-12 border-b border-[#21262D]">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <BkoLogo size="md" />
            <p className="text-[#8B949E] leading-relaxed">
              La plateforme de référence pour découvrir, écouter et regarder les podcasts du Mali et d'Afrique.
            </p>
            <p className="text-[11px] text-[#6E7681]">
              © {new Date().getFullYear()} Bko Podcast. Tous droits réservés.
            </p>
          </div>

          {/* Column 1: Découvrir */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#F0F6FC] uppercase tracking-wider text-[11px]">Découvrir</h4>
            <ul className="space-y-2">
              <li><Link href="/explore" className="hover:text-[#E6B009] transition-colors">Explorer</Link></li>
              <li><Link href="/podcasts" className="hover:text-[#E6B009] transition-colors">Podcasts</Link></li>
              <li><Link href="/categories" className="hover:text-[#E6B009] transition-colors">Catégories</Link></li>
              <li><Link href="/collections" className="hover:text-[#E6B009] transition-colors">Collections Éditoriales</Link></li>
            </ul>
          </div>

          {/* Column 2: Créateurs */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#F0F6FC] uppercase tracking-wider text-[11px]">Créateurs</h4>
            <ul className="space-y-2">
              <li><Link href="/studio" className="hover:text-[#E6B009] transition-colors">Espace Créateur</Link></li>
              <li><Link href="/register" className="hover:text-[#E6B009] transition-colors">Devenir créateur</Link></li>
              <li><Link href="/podcasts" className="hover:text-[#E6B009] transition-colors">Revendiquer un podcast</Link></li>
            </ul>
          </div>

          {/* Column 3: Bko Podcast & Studio Physique */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#F0F6FC] uppercase tracking-wider text-[11px]">Bko Podcast</h4>
            <ul className="space-y-2">
              <li><Link href="/explore" className="hover:text-[#E6B009] transition-colors">À propos</Link></li>
              <li><span className="text-[#6E7681]">Studio Bamako Podcast (Physique)</span></li>
              <li>
                <a
                  href="https://bamakopodcast.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#E6B009] transition-colors inline-flex items-center gap-1"
                >
                  <span>Réserver le studio</span>
                  <span className="text-[10px]">↗</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & Légal */}
          <div className="space-y-3">
            <h4 className="font-bold text-[#F0F6FC] uppercase tracking-wider text-[11px]">Aide & Légal</h4>
            <ul className="space-y-2">
              <li><Link href="/explore" className="hover:text-[#E6B009] transition-colors">Centre d'aide</Link></li>
              <li><Link href="/explore" className="hover:text-[#E6B009] transition-colors">Signaler un problème</Link></li>
              <li><Link href="/explore" className="hover:text-[#E6B009] transition-colors">Confidentialité</Link></li>
              <li><Link href="/explore" className="hover:text-[#E6B009] transition-colors">Conditions d'utilisation</Link></li>
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

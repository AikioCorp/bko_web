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
              La plateforme de rÃ©fÃ©rence pour dÃ©couvrir, Ã©couter et valoriser les podcasts et rÃ©cits du Mali et du MandÃ©.
            </p>
            <p className="text-[11px] text-[#666666]">
              Â© {new Date().getFullYear()} Bamako Podcast. Tous droits rÃ©servÃ©s.
            </p>
          </div>

          {/* Column 1: DÃ©couvrir */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">DÃ©couvrir</h4>
            <ul className="space-y-2">
              <li><Link href="/explore" className="hover:text-[#FFBF00] transition-colors">Explorer</Link></li>
              <li><Link href="/podcasts" className="hover:text-[#FFBF00] transition-colors">Podcasts</Link></li>
              <li><Link href="/categories" className="hover:text-[#FFBF00] transition-colors">CatÃ©gories</Link></li>
              <li><Link href="/collections" className="hover:text-[#FFBF00] transition-colors">Collections Ã‰ditoriales</Link></li>
              <li><Link href="/#telecharger-app" className="text-[#FFBF00] hover:underline transition-colors font-semibold">Application Mobile ðŸ“±</Link></li>
            </ul>
          </div>

          {/* Column 2: CrÃ©ateurs */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">CrÃ©ateurs</h4>
            <ul className="space-y-2">
              <li><Link href="/studio" className="hover:text-[#FFBF00] transition-colors">Espace CrÃ©ateur</Link></li>
              <li><Link href="/studio" className="hover:text-[#FFBF00] transition-colors">Devenir crÃ©ateur</Link></li>
              <li><Link href="/podcasts" className="hover:text-[#FFBF00] transition-colors">Revendiquer un podcast</Link></li>
            </ul>
          </div>

          {/* Column 3: Bko Podcast & Studio Physique */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Bamako Podcast</h4>
            <ul className="space-y-2">
              <li><Link href="/explore" className="hover:text-[#FFBF00] transition-colors">Ã€ propos</Link></li>
              <li><span className="text-[#666666]">Studio Bamako (Badalabougou)</span></li>
              <li>
                <a
                  href="https://bamakopodcast.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#FFBF00] transition-colors inline-flex items-center gap-1"
                >
                  <span>RÃ©server le studio</span>
                  <span className="text-[10px]">â†—</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Support & LÃ©gal */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Aide & LÃ©gal</h4>
            <ul className="space-y-2">
              <li><Link href="/explore" className="hover:text-[#FFBF00] transition-colors">Centre d'aide</Link></li>
              <li><Link href="/explore" className="hover:text-[#FFBF00] transition-colors">Signaler un problÃ¨me</Link></li>
              <li><Link href="/explore" className="hover:text-[#FFBF00] transition-colors">ConfidentialitÃ©</Link></li>
              <li><Link href="/explore" className="hover:text-[#FFBF00] transition-colors">Conditions d'utilisation</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Mention */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6E7681]">
          <span>ConÃ§u avec passion pour la culture et les voix du Mali et d'Afrique.</span>
          <span>Version 1.0.0 â€” Production Readiness</span>
        </div>
      </div>
    </footer>
  );
};


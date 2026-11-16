import React from "react";
import Link from "next/link";
import { BkoLogo } from "./ui/BkoLogo";
import { ShieldCheck, Youtube } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0B0B0B] border-t border-[#1C1C1C] text-[#888888] text-xs pt-12 pb-8 mt-12 print:hidden">
      <div className="bko-container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-[#1C1C1C]">
          {/* Brand Info */}
          <div className="sm:col-span-2 md:col-span-1 space-y-4">
            <BkoLogo size="md" />
            <p className="text-[#888888] leading-relaxed">
              La plateforme de référence pour découvrir, écouter et valoriser les podcasts et récits du Mali, du Mandé et d'Afrique.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-semibold bg-[#161616] text-[#B8B8B8] border border-[#242424]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFBF00]" />
                Conforme APDP Mali & RGPD
              </span>
            </div>
            <p className="text-[11px] text-[#666666]">
              © {new Date().getFullYear()} Bamako Podcast SARL. Tous droits réservés.
            </p>
          </div>

          {/* Column 1: Découvrir */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Découvrir</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-[#FFBF00] transition-colors">
                  À propos de nous
                </Link>
              </li>
              <li>
                <Link href="/explore?view=episodes" className="hover:text-[#FFBF00] transition-colors">
                  Tous les épisodes
                </Link>
              </li>
              <li>
                <Link href="/explore?view=podcasts" className="hover:text-[#FFBF00] transition-colors">
                  Toutes les émissions
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="hover:text-[#FFBF00] transition-colors">
                  Studio Badalabougou
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-[#FFBF00] transition-colors">
                  Centre d’aide & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Créateurs */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Créateurs & Studio</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/become-creator" className="hover:text-[#FFBF00] transition-colors">
                  Devenir créateur
                </Link>
              </li>
              <li>
                <Link href="/studio" className="hover:text-[#FFBF00] transition-colors">
                  Espace Studio & Publication
                </Link>
              </li>
              <li>
                <Link href="/studio/import-youtube" className="hover:text-[#FFBF00] transition-colors">
                  Connecter une chaîne YouTube
                </Link>
              </li>
              <li>
                <Link href="/studio/import-rss" className="hover:text-[#FFBF00] transition-colors">
                  Importer un flux RSS
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="text-[#FFBF00] hover:underline transition-colors font-semibold">
                  Réserver le Studio 🎙️
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Légal & Confidentialité */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Légal & Vie Privée</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-white hover:text-[#FFBF00] transition-colors font-medium">
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[#FFBF00] transition-colors">
                  Conditions d'utilisation (CGU)
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-[#FFBF00] transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-[#FFBF00] transition-colors">
                  Gestion des cookies
                </Link>
              </li>
              <li>
                <Link href="/data-deletion" className="hover:text-[#FFBF00] transition-colors">
                  Suppression de compte & données
                </Link>
              </li>
              <li>
                <Link href="/community-guidelines" className="hover:text-[#FFBF00] transition-colors">
                  Règles & Droit d'auteur
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Partenaires & API */}
          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Conformité & Tiers</h4>
            <div className="space-y-2 text-[11px] text-[#777777]">
              <p className="flex items-center gap-1.5 text-[#B0B0B0]">
                <Youtube className="w-3.5 h-3.5 text-[#FF0000]" />
                <span>YouTube API Services</span>
              </p>
              <p className="leading-snug">
                Vidéos officielles lues sous les{" "}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#AAAAAA] hover:text-[#FFBF00] underline"
                >
                  CGU YouTube
                </a>{" "}
                et la{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#AAAAAA] hover:text-[#FFBF00] underline"
                >
                  politique Google
                </a>.
              </p>
              <div className="pt-2 border-t border-[#1C1C1C]">
                <p className="text-[#AAAAAA] font-semibold text-white">Contact DPO :</p>
                <Link
                  href="mailto:privacy@bamakopodcast.com"
                  className="text-[#FFBF00] hover:underline"
                >
                  privacy@bamakopodcast.com
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Mention */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6E7681]">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Confidentialité
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Conditions
            </Link>
            <span>•</span>
            <Link href="/legal" className="hover:text-white transition-colors">
              Mentions Légales
            </Link>
            <span>•</span>
            <Link href="/cookies" className="hover:text-white transition-colors">
              Cookies
            </Link>
            <span>•</span>
            <Link href="/data-deletion" className="hover:text-white transition-colors">
              Suppression de compte
            </Link>
          </div>
          <span>Bamako Podcast • Bamako, Mali</span>
        </div>
      </div>
    </footer>
  );
};

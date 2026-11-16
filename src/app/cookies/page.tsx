import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Cookie,
  CheckCircle2,
  XCircle,
  Shield,
  Sliders,
  Info,
  Lock,
  Volume2,
} from "lucide-react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Gestion des Cookies & Traceurs | Bamako Podcast",
  description:
    "Découvrez comment Bamako Podcast utilise les cookies et traceurs locaux : session sécurisée, reprise d'écoute audio, sans revente de profil publicitaire.",
  openGraph: {
    title: "Politique relative aux Cookies — Bamako Podcast",
    description: "Transparence totale sur les cookies et technologies de stockage local utilisées sur Bamako Podcast.",
  },
};

export default function CookiesPage() {
  return (
    <LegalPageLayout
      title="Politique relative aux Cookies & Traceurs"
      subtitle="Une transparence absolue sur l'utilisation des traceurs : nous utilisons uniquement les technologies strictement nécessaires au confort de votre écoute et à la sécurité de vos sessions."
      badgeText="Zéro cookie publicitaire intrusif"
      lastUpdated="26 Octobre 2026"
    >
      <div className="space-y-12 text-[#D0D0D0] leading-relaxed text-sm sm:text-base">
        {/* Résumé de notre approche */}
        <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 font-bold">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Notre engagement éthique sur les traceurs
              </h2>
              <p className="text-xs sm:text-sm text-[#888888]">
                L'essentiel pour une expérience d'écoute rapide et fluide
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Contrairement à de nombreux sites web, <strong className="text-white">Bamako Podcast n'utilise aucun cookie de profilage publicitaire invasif</strong>, aucun traceur destiné à revendre vos habitudes de navigation à des courtiers tiers. Les technologies de stockage utilisées ont pour unique but de vous maintenir connecté en toute sécurité et de mémoriser vos préférences de lecture.
          </p>
        </section>

        {/* 1. Qu'est-ce qu'un cookie ? */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">1.</span>
            <h2>Qu'est-ce qu'un cookie et un traceur local ?</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette ou smartphone) lors de la visite d'un site web. Il permet au site de mémoriser temporairement des données de session (par exemple, si vous êtes connecté) ou des préférences d'interface. Nous utilisons également le stockage local du navigateur (<code className="text-[#FFBF00] bg-[#161616] px-1 py-0.5 rounded text-xs">localStorage</code> et <code className="text-[#FFBF00] bg-[#161616] px-1 py-0.5 rounded text-xs">sessionStorage</code>) pour sauvegarder la position d'un épisode audio lorsque vous changez de page.
          </p>
        </section>

        {/* 2. Tableau détaillé des cookies utilisés */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">2.</span>
            <h2>Traceurs utilisés sur Bamako Podcast</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-white bg-[#141414]">
                  <th className="py-3 px-4 font-bold">Nom / Clé</th>
                  <th className="py-3 px-4 font-bold">Type</th>
                  <th className="py-3 px-4 font-bold">Finalité</th>
                  <th className="py-3 px-4 font-bold">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020] text-[#AAAAAA]">
                <tr>
                  <td className="py-3 px-4 font-mono text-white text-xs">bko_token / access_token</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFBF00] text-[#0B0B0B]">
                      Essentiel
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Maintien de votre session sécurisée JWT (connexion chiffrée, accès Studio/Favoris).
                  </td>
                  <td className="py-3 px-4">30 jours (ou déconnexion)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-white text-xs">bko_player_progress</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F1F1F] text-white border border-[#333333]">
                      Fonctionnel
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Mémorisation de la position de reprise du podcast audio (minutes et secondes écoulées).
                  </td>
                  <td className="py-3 px-4">Persistant (local)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-white text-xs">bko_player_volume</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F1F1F] text-white border border-[#333333]">
                      Fonctionnel
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Niveau sonore de lecture préféré par l'auditeur pour éviter les sauts de volume.
                  </td>
                  <td className="py-3 px-4">1 an</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-white text-xs">scroll-[path]</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F1F1F] text-white border border-[#333333]">
                      Fonctionnel
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Maintien de la position de défilement de l'écran lors du retour à la page précédente.
                  </td>
                  <td className="py-3 px-4">Session en cours</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono text-white text-xs">theme / lang</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1F1F1F] text-white border border-[#333333]">
                      Préférence
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    Préférence de langue d'interface et affichage sombre optimisé.
                  </td>
                  <td className="py-3 px-4">1 an</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Traceurs de tiers (YouTube & Vidéo) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">3.</span>
            <h2>Traceurs et lecteurs multimédias tiers</h2>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3 text-xs sm:text-sm text-[#AAAAAA]">
            <p>
              Lorsque vous lisez un épisode vidéo au format YouTube directement sur Bamako Podcast, le lecteur officiel de YouTube peut déposer des cookies techniques indispensables à la lecture vidéo et à la comptabilisation des vues pour le créateur.
            </p>
            <p>
              Pour en savoir plus sur la gestion de ces cookies par Google et YouTube, vous pouvez consulter les{" "}
              <a
                href="https://policies.google.com/technologies/cookies"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFBF00] hover:underline font-semibold"
              >
                Règles de Google relatives aux cookies
              </a>.
            </p>
          </div>
        </section>

        {/* 4. Comment contrôler vos cookies */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">4.</span>
            <h2>Comment désactiver ou gérer vos cookies ?</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Vous pouvez à tout moment configurer votre navigateur internet pour être averti de la création de cookies, bloquer les cookies tiers ou supprimer l'ensemble des cookies existants :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-1">
              <p className="font-bold text-white">Google Chrome</p>
              <p className="text-[#888888]">
                Paramètres &gt; Confidentialité et sécurité &gt; Cookies et données de sites.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-1">
              <p className="font-bold text-white">Mozilla Firefox</p>
              <p className="text-[#888888]">
                Options &gt; Vie privée et sécurité &gt; Protection renforcée contre le pistage.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-1">
              <p className="font-bold text-white">Apple Safari (iOS / Mac)</p>
              <p className="text-[#888888]">
                Réglages Safari &gt; Confidentialité &gt; Bloquer tous les cookies.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-1">
              <p className="font-bold text-white">Microsoft Edge</p>
              <p className="text-[#888888]">
                Paramètres &gt; Cookies et autorisations de site &gt; Gérer et supprimer les cookies.
              </p>
            </div>
          </div>
          <p className="text-xs text-[#888888] pt-1">
            <strong className="text-[#FFBF00]">Attention :</strong> La désactivation totale des cookies essentiels peut vous empêcher de rester connecté à votre compte ou réinitialiser votre progression d'écoute à chaque actualisation.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}

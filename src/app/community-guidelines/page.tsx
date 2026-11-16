import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  Ban,
  Heart,
  Flag,
  FileCheck,
  Mail,
  Copyright,
  Mic,
} from "lucide-react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Règles Communautaires & Copyright | Bamako Podcast",
  description:
    "Directives de la communauté Bamako Podcast : liberté d'expression, respect, tolérance zéro pour les discours de haine et procédure de signalement d'atteinte aux droits d'auteur.",
  openGraph: {
    title: "Règles Communautaires & Copyright — Bamako Podcast",
    description: "Charte éthique et procédure de signalement de contenus illicites ou contrefaisants.",
  },
};

export default function CommunityGuidelinesPage() {
  return (
    <LegalPageLayout
      title="Règles Communautaires & Droits d'Auteur"
      subtitle="Faire de Bamako Podcast un espace d'expression libre, inspirant et respectueux : découvrez les règles de vie de la plateforme et notre procédure de signalement."
      badgeText="Charte d'Excellence & Respect"
      lastUpdated="26 Octobre 2026"
    >
      <div className="space-y-12 text-[#D0D0D0] leading-relaxed text-sm sm:text-base">
        {/* Notre vision */}
        <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 font-bold">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Notre vision : Célébrer la diversité des voix dans le respect
              </h2>
              <p className="text-xs sm:text-sm text-[#888888]">
                Une communauté vivante, fière de ses cultures et bienveillante
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Bamako Podcast a été fondé pour donner la parole aux artistes, conteurs, journalistes, entrepreneurs, historiens et citoyens du Mali et d’Afrique. Pour que cet espace reste chaleureux, constructif et sécurisé pour tous, nous demandons à chaque auditeur, créateur et intervenant de respecter ces règles fondamentales.
          </p>
        </section>

        {/* 1. Ce qui est encouragé */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">1.</span>
            <h2>Ce que nous encourageons</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Mic className="w-4 h-4 text-[#FFBF00]" />
                Audace & Récits Authentiques
              </div>
              <p className="text-xs text-[#888888]">
                Partagez des histoires vécues, des sagesses traditionnelles, des débats d’idées profonds et des innovations porteuses d’avenir.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Heart className="w-4 h-4 text-[#FFBF00]" />
                Commentaires Constructifs
              </div>
              <p className="text-xs text-[#888888]">
                Exprimez vos désaccords avec politesse et nuance. Le débat grandit quand l'argument respecte la personne de l’interlocuteur.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Copyright className="w-4 h-4 text-[#FFBF00]" />
                Crédit aux Créateurs
              </div>
              <p className="text-xs text-[#888888]">
                Citez vos sources, créditez les musiciens, les co-auteurs et les conteurs traditionnels dont les œuvres nourrissent vos épisodes.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Ce qui est strictement interdit */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">2.</span>
            <h2>Contenus strictement prohibés (Tolérance Zéro)</h2>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3 text-xs sm:text-sm text-[#AAAAAA]">
            <p className="text-white font-semibold">
              Tout contenu ou commentaire relevant des catégories suivantes sera immédiatement supprimé et pourra faire l'objet de poursuites judiciaires :
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2">
              <li>
                <strong className="text-white">Discours de haine et incitation à la violence :</strong> Attaques basées sur l'ethnie, la nationalité, la religion, le genre, l'orientation sexuelle ou l'état de santé.
              </li>
              <li>
                <strong className="text-white">Harcèlement, diffamation et menaces :</strong> Intimidation ciblée, insultes répétées, divulgation malveillante de données privées (doxing).
              </li>
              <li>
                <strong className="text-white">Désinformation dangereuse & Manipulation :</strong> Diffusion délibérée de fausses nouvelles susceptibles de troubler l'ordre public ou de porter atteinte à la santé publique.
              </li>
              <li>
                <strong className="text-white">Contenus à caractère sexuel explicite ou violent :</strong> Pornographie, violence graphique gratuite ou exploitation de mineurs.
              </li>
              <li>
                <strong className="text-white">Escroquerie et spam :</strong> Promotion de faux investissements, arnaques financières, pyramides de Ponzi ou liens malveillants.
              </li>
            </ul>
          </div>
        </section>

        {/* 3. Procédure Droits d'auteur & Signalement Copyright */}
        <section className="space-y-4 border border-[#FFBF00]/30 bg-[#121212] rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
            <Copyright className="w-5 h-5 text-[#FFBF00]" />
            <h3>3. Respect des Droits d'Auteur & Procédure de Signalement (Takedown)</h3>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Bamako Podcast respecte scrupuleusement la propriété intellectuelle. Si vous êtes titulaire de droits d'auteur (ou son représentant légal) et estimez qu'un épisode ou un fichier diffusé sur notre plateforme enfreint vos droits, vous pouvez déclencher notre procédure de retrait rapide.
          </p>

          <div className="bg-[#1A1A1A] p-5 rounded-xl border border-[#2A2A2A] space-y-3 text-xs sm:text-sm">
            <p className="font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#FFBF00]" />
              Comment déposer un avis d'infraction ?
            </p>
            <p className="text-[#AAAAAA]">
              Envoyez une notification écrite complète à notre équipe juridique :{" "}
              <Link href="mailto:copyright@bamakopodcast.com" className="text-[#FFBF00] font-bold hover:underline">
                copyright@bamakopodcast.com
              </Link>
            </p>
            <p className="text-white font-semibold pt-1">Informations indispensables à joindre :</p>
            <ul className="list-disc list-inside space-y-1 text-[#888888] pl-2">
              <li>Votre nom complet, qualité (auteur ou mandataire) et coordonnées de contact (email, téléphone).</li>
              <li>L'identification précise de l'œuvre protégée par le droit d'auteur prétendument violée.</li>
              <li>Le lien URL exact de l'épisode ou de l'émission incriminée sur Bamako Podcast.</li>
              <li>Une déclaration sur l'honneur attestant de votre bonne foi et de l'absence d'autorisation d'usage.</li>
              <li>Votre signature électronique ou physique.</li>
            </ul>
          </div>

          <div className="space-y-1 text-xs text-[#888888]">
            <p>
              <strong className="text-white">Délai d'intervention :</strong> Dès réception d'un avis conforme, nous procédons à la désactivation préventive du contenu sous 24 à 48 heures ouvrées et notifions le podcasteur concerné qui dispose d'un droit de contre-notification s'il justifie de ses licences.
            </p>
          </div>
        </section>

        {/* 4. Sanctions progressives */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">4.</span>
            <h2>Application des sanctions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-1">
              <p className="font-bold text-white text-sm">Niveau 1 : Avertissement</p>
              <p className="text-xs text-[#888888]">
                Suppression du contenu non conforme et notification pédagogique par email au contrevenant.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-1">
              <p className="font-bold text-white text-sm">Niveau 2 : Suspension temporaire</p>
              <p className="text-xs text-[#888888]">
                Blocage des droits de publication et de commentaire pour une durée de 14 à 30 jours en cas de récidive.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-1">
              <p className="font-bold text-white text-sm">Niveau 3 : Bannissement définitif</p>
              <p className="text-xs text-[#888888]">
                Clôture irrévocable du compte et transmission aux autorités compétentes en cas d'infraction pénale.
              </p>
            </div>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}

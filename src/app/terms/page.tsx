import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Scale,
  Shield,
  Youtube,
  Radio,
  UserCheck,
  Ban,
  Clock,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation (CGU) | Bamako Podcast",
  description:
    "Conditions générales d'utilisation du service Bamako Podcast : droits et devoirs des auditeurs et des créateurs, diffusion audio/vidéo, respect de la propriété intellectuelle.",
  openGraph: {
    title: "Conditions Générales d'Utilisation — Bamako Podcast",
    description: "Cadre contractuel d'utilisation de la plateforme Bamako Podcast.",
  },
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Conditions Générales d'Utilisation"
      subtitle="Le cadre contractuel clair et équitable qui régit l'accès, l'écoute, l'interaction et la publication sur Bamako Podcast pour les auditeurs et les créateurs."
      badgeText="Version contractuelle en vigueur"
      lastUpdated="26 Octobre 2026"
    >
      <div className="space-y-12 text-[#D0D0D0] leading-relaxed text-sm sm:text-base">
        {/* Préambule */}
        <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Préambule & Acceptation des conditions
              </h2>
              <p className="text-xs sm:text-sm text-[#888888]">
                Lisez attentivement ces conditions avant d'utiliser nos services
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA] pt-2">
            Les présentes Conditions Générales d’Utilisation (ci-après les « <strong className="text-white">CGU</strong> ») définissent les règles d'accès et d'utilisation de la plateforme numérique <strong className="text-white">Bamako Podcast</strong>, accessible via le site internet <code className="text-[#FFBF00] bg-[#161616] px-1 py-0.5 rounded text-xs">bamakopodcast.com</code> et ses applications mobiles associées. En naviguant sur le site, en écoutant un contenu ou en créant un compte, vous acceptez sans réserve les présentes CGU.
          </p>
        </section>

        {/* 1. Objet et Description du Service */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">1.</span>
            <h2>Objet et description de la plateforme</h2>
          </div>
          <p>
            Bamako Podcast est une plateforme multimédia dédiée à la diffusion, au streaming, à la valorisation et à la promotion des créations sonores et audiovisuelles d'Afrique, en particulier du Mali et de l'espace mandingue. La plateforme propose :
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-[#AAAAAA] pl-2">
            <li>Un accès gratuit à un catalogue riche de podcasts audio et vidéo natifs ou syndiqués.</li>
            <li>Un lecteur audio et vidéo persistant avec reprise de lecture intelligente.</li>
            <li>Un espace personnel permettant de créer des playlists, enregistrer des favoris et suivre des créateurs.</li>
            <li>Un espace « Studio » permettant aux podcasteurs autorisés d'administrer leurs émissions, de synchroniser leurs flux RSS ou de connecter leur chaîne YouTube.</li>
            <li>Des services de studio physique d'enregistrement acoustique basés à Badalabougou (Bamako).</li>
          </ul>
        </section>

        {/* 2. Accès, Inscription et Sécurité du Compte */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">2.</span>
            <h2>Accès, inscription et sécurité du compte</h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-[#AAAAAA]">
            <p>
              <strong className="text-white">A. Écoute libre :</strong> La consultation du catalogue et l'écoute des épisodes publics ne requièrent aucune création de compte obligatoire.
            </p>
            <p>
              <strong className="text-white">B. Création de compte :</strong> L'accès aux fonctionnalités communautaires (favoris, notation, commentaires, studio) exige la création d'un compte gratuit. L'utilisateur s'engage à fournir des informations véridiques et à valider son adresse e-mail par le code temporaire OTP sécurisé.
            </p>
            <p>
              <strong className="text-white">C. Sécurité des identifiants :</strong> L'utilisateur est seul responsable de la confidentialité de son mot de passe. Toute activité réalisée depuis son compte est réputée effectuée par lui-même. En cas de perte ou de compromission suspectée, il doit immédiatement réinitialiser son mot de passe.
            </p>
          </div>
        </section>

        {/* 3. Règles applicables aux Auditeurs */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">3.</span>
            <h2>Engagements et règles applicables aux auditeurs</h2>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3 text-xs sm:text-sm">
            <p className="text-white font-semibold">Dans le cadre de l'utilisation de la plateforme, il est strictement interdit de :</p>
            <ul className="list-disc list-inside space-y-1.5 text-[#AAAAAA] pl-2">
              <li>Capturer, aspirer (scraping massif), réenregistrer ou redistribuer les fichiers audio ou vidéo en dehors du cadre d'écoute personnelle proposé.</li>
              <li>Contourner ou tenter de contourner les mesures techniques de protection (DRM, signatures d'URL temporaires, sécurités API).</li>
              <li>Publier des commentaires à caractère injurieux, haineux, diffamatoire, raciste, xénophobe ou contraire aux lois en vigueur.</li>
              <li>Utiliser la plateforme pour diffuser des spams, sollicitations commerciales non autorisées ou virus.</li>
            </ul>
          </div>
        </section>

        {/* 4. Règles applicables aux Créateurs & Studio */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">4.</span>
            <h2>Règles applicables aux créateurs et producteurs</h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-[#AAAAAA]">
            <p>
              <strong className="text-white">A. Garantie de droits :</strong> Tout créateur publiant ou syndiquant une émission sur Bamako Podcast garantit expressément être l'auteur légitime ou détenir l'intégralité des droits, autorisations et licences nécessaires sur les voix, musiques, sons et images composant ses œuvres.
            </p>
            <p>
              <strong className="text-white">B. Licence de diffusion accordée :</strong> Le créateur conserve l'entière propriété intellectuelle de ses contenus. Il concède à Bamako Podcast une licence non-exclusive, gratuite et mondiale pour la durée de mise en ligne, autorisant la plateforme à héberger, indexer, transcrire, diffuser et promouvoir ses épisodes sur ses canaux officiels.
            </p>
            <p>
              <strong className="text-white">C. Retrait et déconnexion :</strong> Le créateur peut à tout moment suspendre, mettre en pause ou déconnecter son flux RSS ou sa chaîne YouTube depuis l'espace Studio. Par défaut, la déconnexion d'un flux n'efface pas rétroactivement les épisodes déjà indexés afin de préserver l'historique des auditeurs, sauf demande explicite de purge.
            </p>
          </div>
        </section>

        {/* 5. Intégration YouTube & Services tiers */}
        <section className="space-y-4 border border-[#FFBF00]/30 bg-[#121212] rounded-xl p-6">
          <div className="flex items-center gap-2.5 text-white font-bold text-base sm:text-lg">
            <Youtube className="w-5 h-5 text-[#FF0000]" />
            <h3>5. Conditions relatives aux services d'API YouTube</h3>
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-[#AAAAAA]">
            <p>
              Pour les épisodes au format vidéo YouTube, Bamako Podcast intègre le lecteur officiel de YouTube via les services d'API YouTube.
            </p>
            <p>
              En utilisant ou en visionnant des contenus vidéo YouTube sur notre plateforme, vous reconnaissez et acceptez d'être lié par les{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFBF00] hover:underline font-semibold inline-flex items-center gap-1"
              >
                Conditions d'utilisation de YouTube (YouTube Terms of Service)
                <ExternalLink className="w-3 h-3" />
              </a>{" "}
              ainsi que les{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFBF00] hover:underline font-semibold inline-flex items-center gap-1"
              >
                Règles de confidentialité de Google
                <ExternalLink className="w-3 h-3" />
              </a>.
            </p>
            <p>
              Les vues générées par le lecteur officiel intégré sont directement comptabilisées au bénéfice du créateur sur YouTube selon les standards officiels de la plateforme vidéo.
            </p>
          </div>
        </section>

        {/* 6. Propriété intellectuelle de Bamako Podcast */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">6.</span>
            <h2>Propriété intellectuelle de la plateforme</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            L'ensemble des éléments constituant l'infrastructure et l'identité de <strong className="text-white">Bamako Podcast</strong> — notamment la marque verbale et figurative, le logo, la charte graphique, les designs d'interfaces, le code source, les bases de données, les algorithmes de recommandation et les textes éditoriaux — sont la propriété exclusive de Bamako Podcast SARL et protégés par le droit de la propriété intellectuelle en vigueur au Mali et dans l'espace OAPI (Organisation Africaine de la Propriété Intellectuelle).
          </p>
        </section>

        {/* 7. Suspension et Clôture de Compte */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">7.</span>
            <h2>Sanctions, suspension et résiliation</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Bamako Podcast se réserve le droit de suspendre temporairement ou de résilier définitivement, de plein droit et sans préavis, tout compte utilisateur ou émission en cas de violation avérée des présentes CGU (fraude, piratage, harcèlement, publication de contenus illicites). L'utilisateur peut contester la décision auprès de l'équipe de modération à{" "}
            <Link href="/support" className="text-[#FFBF00] hover:underline">
              support@bamakopodcast.com
            </Link>.
          </p>
        </section>

        {/* 8. Droit Applicable et Juridiction Compétente */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">8.</span>
            <h2>Droit applicable et règlement des litiges</h2>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2 text-xs sm:text-sm text-[#AAAAAA]">
            <p>
              Les présentes Conditions Générales d'Utilisation sont régies et interprétées conformément au <strong className="text-white">droit de la République du Mali</strong> et aux traités régionaux applicables (OHADA, UEMOA).
            </p>
            <p>
              En cas de différend relatif à l'interprétation ou à l'exécution des présentes, les parties s'engagent à privilégier une solution amiable. À défaut d’accord amiable dans un délai de 30 jours, compétence expresse est attribuée aux <strong className="text-white">tribunaux compétents du ressort de Bamako (Mali)</strong>.
            </p>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}

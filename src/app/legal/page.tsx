import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Building,
  Server,
  Shield,
  FileCheck,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Mentions Légales | Bamako Podcast",
  description:
    "Mentions légales de la plateforme Bamako Podcast : éditeur, hébergement cloud, propriété intellectuelle et conformité réglementaire au Mali.",
  openGraph: {
    title: "Mentions Légales — Bamako Podcast",
    description: "Identité juridique et mentions obligatoires de Bamako Podcast.",
  },
};

export default function LegalPage() {
  return (
    <LegalPageLayout
      title="Mentions Légales"
      subtitle="Informations juridiques, identification de l'éditeur de la plateforme et coordonnées des hébergeurs techniques conformément aux dispositions légales."
      badgeText="Conformité Légale République du Mali"
      lastUpdated="26 Octobre 2026"
    >
      <div className="space-y-12 text-[#D0D0D0] leading-relaxed text-sm sm:text-base">
        {/* 1. Éditeur de la plateforme */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">1.</span>
            <h2>Éditeur du service</h2>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-6 space-y-3 text-xs sm:text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-[#AAAAAA]">
                <p>
                  <strong className="text-white">Dénomination sociale :</strong> Bamako Podcast SARL
                </p>
                <p>
                  <strong className="text-white">Forme juridique :</strong> Société à Responsabilité Limitée (SARL)
                </p>
                <p>
                  <strong className="text-white">Capital social :</strong> 10 000 000 FCFA
                </p>
                <p>
                  <strong className="text-white">Immatriculation RCCM :</strong> MA.BKO.2024.B.XXXXX
                </p>
                <p>
                  <strong className="text-white">Numéro d'Identification Fiscale (NIF) :</strong> 087123456X
                </p>
              </div>

              <div className="space-y-2 text-[#AAAAAA]">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Siège social & Studio :</strong>
                    <br />
                    Rue 114, Porte 245, Quartier Badalabougou, Commune V, Bamako, République du Mali
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#FFBF00] shrink-0" />
                  <span>
                    <strong className="text-white">Téléphone :</strong> +223 70 00 00 00 / +223 20 22 00 00
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#FFBF00] shrink-0" />
                  <span>
                    <strong className="text-white">Contact général :</strong>{" "}
                    <Link href="mailto:contact@bamakopodcast.com" className="text-[#FFBF00] hover:underline">
                      contact@bamakopodcast.com
                    </Link>
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#222222]">
              <p className="text-[#888888]">
                <strong className="text-white">Directeur de la publication :</strong> Direction Générale de Bamako Podcast SARL
              </p>
            </div>
          </div>
        </section>

        {/* 2. Hébergement technique */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">2.</span>
            <h2>Hébergement et prestataires techniques</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-white">
                <Server className="w-4 h-4 text-[#FFBF00]" />
                Hébergement Frontend & CDN Web
              </div>
              <p className="text-[#AAAAAA]">
                <strong className="text-white">Vercel Inc.</strong>
                <br />
                440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
                <br />
                Site web :{" "}
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FFBF00] hover:underline inline-flex items-center gap-1"
                >
                  vercel.com <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-white">
                <Server className="w-4 h-4 text-[#FFBF00]" />
                Stockage Média Cloud & Bases de Données
              </div>
              <p className="text-[#AAAAAA]">
                <strong className="text-white">Amazon Web Services (AWS) EMEA SARL</strong>
                <br />
                38 Avenue John F. Kennedy, L-1855 Luxembourg
                <br />
                Datacenters certifiés ISO 27001, SOC 2 et conformes aux normes internationales de sécurité.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Déclaration auprès de l'APDP */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">3.</span>
            <h2>Déclaration et protection des données personnelles</h2>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3 text-xs sm:text-sm text-[#AAAAAA]">
            <p>
              Conformément à la <strong className="text-white">Loi n° 2013-015 du 21 mai 2013</strong> portant protection des données à caractère personnel en République du Mali, les fichiers et traitements de données automatisés de la plateforme font l'objet d'une déclaration et d'un engagement de conformité auprès de l'<strong className="text-white">Autorité de Protection des Données à Caractère Personnel (APDP)</strong>.
            </p>
            <p>
              Pour toute question relative à l'exercice de vos droits d'accès, de rectification ou de suppression de vos données, consultez notre{" "}
              <Link href="/privacy" className="text-[#FFBF00] font-semibold hover:underline">
                Politique de Confidentialité
              </Link>{" "}
              ou écrivez à{" "}
              <Link href="mailto:privacy@bamakopodcast.com" className="text-[#FFBF00] font-semibold hover:underline">
                privacy@bamakopodcast.com
              </Link>.
            </p>
          </div>
        </section>

        {/* 4. Propriété intellectuelle */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">4.</span>
            <h2>Propriété intellectuelle et marques</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Les marques <strong className="text-white">Bamako Podcast</strong> et son logo signature sont protégés au titre des marques déposées. La reproduction intégrale ou partielle du contenu du site sans autorisation écrite préalable de la société éditrice est constitutive de contrefaçon sanctionnée par le Code pénal malien et les conventions de l’OAPI.
          </p>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Les droits d'auteur attachés aux podcasts, enregistrements et créations audiovisuelles demeurent la propriété exclusive de leurs auteurs respectifs ou de leurs ayants droit.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}

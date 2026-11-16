import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Youtube,
  Lock,
  UserCheck,
  Database,
  Trash2,
  Bell,
  Mail,
  ExternalLink,
  AlertCircle,
  FileCheck,
  Smartphone,
  Eye,
  Server,
  Key,
} from "lucide-react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | Bamako Podcast",
  description:
    "Découvrez comment Bamako Podcast protège vos données personnelles conformément à la loi malienne n° 2013-015 (APDP), au RGPD et aux conditions d'utilisation des services d'API YouTube.",
  openGraph: {
    title: "Politique de Confidentialité — Bamako Podcast",
    description:
      "Engagement de transparence, protection des données et respect de votre vie privée.",
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Politique de Confidentialité"
      subtitle="Notre engagement fondamental pour la transparence, la protection de vos données personnelles et le respect de votre vie privée sur le web et nos applications mobiles."
      badgeText="Conforme APDP Mali, RGPD & YouTube API"
      lastUpdated="26 Octobre 2026"
    >
      <div className="space-y-12 text-[#D0D0D0] leading-relaxed text-sm sm:text-base">
        {/* Résumé exécutif en encadré solide */}
        <section className="bg-[#141414] border border-[#262626] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                En résumé : Nos 4 piliers de protection
              </h2>
              <p className="text-xs sm:text-sm text-[#888888]">
                Ce que vous devez savoir en priorité sur vos données
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2D2D2D] space-y-1.5">
              <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-wide">
                1. Zéro Revente
              </span>
              <p className="text-xs text-[#B0B0B0]">
                Nous ne vendons, ne louons et ne commercialisons jamais vos données personnelles ou votre historique d'écoute à des courtiers tiers.
              </p>
            </div>

            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2D2D2D] space-y-1.5">
              <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-wide">
                2. Intégration YouTube Certifiée
              </span>
              <p className="text-xs text-[#B0B0B0]">
                Les vidéos YouTube sont diffusées via les services d'API officiels de YouTube en totale conformité avec les règles Google et YouTube.
              </p>
            </div>

            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2D2D2D] space-y-1.5">
              <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-wide">
                3. Maîtrise & Droit à l'oubli
              </span>
              <p className="text-xs text-[#B0B0B0]">
                Vous pouvez exporter vos données ou supprimer votre compte et toutes vos traces à tout moment depuis les paramètres ou par simple demande.
              </p>
            </div>

            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2D2D2D] space-y-1.5">
              <span className="text-xs font-bold text-[#FFBF00] uppercase tracking-wide">
                4. Régulation Malienne & APDP
              </span>
              <p className="text-xs text-[#B0B0B0]">
                Traitements déclarés conformément à la Loi n° 2013-015 du Mali portant protection des données à caractère personnel.
              </p>
            </div>
          </div>
        </section>

        {/* 1. Responsable de Traitement */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">1.</span>
            <h2>Responsable du traitement des données</h2>
          </div>
          <p>
            La présente Politique de Confidentialité s’applique à l’ensemble des services numériques édités sous la marque{" "}
            <strong className="text-white">Bamako Podcast</strong>, comprenant notamment le site web{" "}
            <code className="text-[#FFBF00] bg-[#161616] px-1.5 py-0.5 rounded text-xs">
              https://bamakopodcast.com
            </code>
            , le portail studio, ainsi que les applications mobiles pour Android et iOS.
          </p>
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 text-xs sm:text-sm space-y-2">
            <p className="text-white font-semibold">Identité de l'éditeur :</p>
            <ul className="space-y-1 text-[#AAAAAA]">
              <li>
                <strong className="text-white">Dénomination :</strong> Bamako Podcast SARL
              </li>
              <li>
                <strong className="text-white">Siège social :</strong> Quartier Badalabougou, Commune V, Bamako, République du Mali
              </li>
              <li>
                <strong className="text-white">Registre du Commerce :</strong> Immatriculation RCCM Bamako
              </li>
              <li>
                <strong className="text-white">Délégué à la Protection des Données (DPO) :</strong> Direction Juridique et Conformité
              </li>
              <li>
                <strong className="text-white">Contact direct Confidentialité :</strong>{" "}
                <Link
                  href="mailto:privacy@bamakopodcast.com"
                  className="text-[#FFBF00] hover:underline"
                >
                  privacy@bamakopodcast.com
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Données collectées */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">2.</span>
            <h2>Données personnelles que nous collectons</h2>
          </div>
          <p>
            Nous limitons strictement la collecte des données aux éléments indispensables au bon fonctionnement de la plateforme d'écoute et de publication :
          </p>

          <div className="space-y-4">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#FFBF00]" />
                A. Données de compte utilisateur (si inscription)
              </h3>
              <p className="text-xs sm:text-sm text-[#AAAAAA]">
                Lorsque vous créez un compte (auditeur ou créateur) : votre nom ou pseudonyme, adresse e-mail, numéro de téléphone facultatif, mot de passe haché de manière sécurisée (non réversible), photo de profil optionnelle, pays de résidence et langues préférées (ex. Français, Bambara).
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#FFBF00]" />
                B. Données d'activité et d'écoute
              </h3>
              <p className="text-xs sm:text-sm text-[#AAAAAA]">
                Pour assurer la reprise automatique de vos épisodes là où vous vous êtes arrêté, synchroniser vos favoris, playlists et abonnements aux émissions entre votre mobile et le web. Vous pouvez effacer l'intégralité de cet historique à tout moment en un clic.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#FFBF00]" />
                C. Notifications Push et données d'appareil (App mobile)
              </h3>
              <p className="text-xs sm:text-sm text-[#AAAAAA]">
                Identifiant technique d'appareil pseudonymisé et jeton de notification Firebase Cloud Messaging (FCM) afin de vous alerter lors de la sortie d'un nouvel épisode de vos créateurs suivis. Vous pouvez désactiver les notifications push à tout instant depuis les paramètres de votre téléphone.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-[#FFBF00]" />
                D. Données créateur & Studio
              </h3>
              <p className="text-xs sm:text-sm text-[#AAAAAA]">
                Informations publiques des émissions (titres, descriptions, pochettes, flux RSS, URL de chaîne YouTube associée, crédits, invitations des membres de l'équipe).
              </p>
            </div>
          </div>
        </section>

        {/* 3. CONFORMITÉ SPÉCIFIQUE YOUTUBE API SERVICES */}
        <section className="space-y-4 border-2 border-[#FFBF00]/40 bg-[#121212] rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FF0000] text-white flex items-center justify-center shrink-0">
              <Youtube className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                3. Intégration des Services d'API YouTube (YouTube API Services)
              </h2>
              <p className="text-xs sm:text-sm text-[#AAAAAA]">
                Dispositions expresses régissant l'utilisation des contenus et vidéos YouTube
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 text-xs sm:text-sm">
            <p>
              Bamako Podcast utilise les <strong className="text-white">services d'API YouTube (YouTube API Services)</strong> pour permettre aux créateurs d'émissions de lier leur chaîne YouTube publique et de diffuser leurs épisodes vidéo au moyen du lecteur officiel YouTube intégré.
            </p>

            <div className="bg-[#181818] border border-[#2A2A2A] rounded-xl p-4 space-y-2">
              <p className="font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[#FFBF00]" />
                Documents contractuels tiers obligatoires :
              </p>
              <p className="text-[#AAAAAA]">
                En utilisant les fonctionnalités vidéo YouTube sur Bamako Podcast, vous reconnaissez et acceptez expressément être lié par :
              </p>
              <ul className="list-disc list-inside space-y-1 text-white font-medium pl-2">
                <li>
                  Les{" "}
                  <a
                    href="https://www.youtube.com/t/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FFBF00] hover:underline inline-flex items-center gap-1"
                  >
                    Conditions d'utilisation de YouTube (YouTube Terms of Service)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  Les{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FFBF00] hover:underline inline-flex items-center gap-1"
                  >
                    Règles de confidentialité de Google (Google Privacy Policy)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2 text-[#BBBBBB]">
              <p>
                <strong className="text-white">Données YouTube collectées & traitées :</strong>{" "}
                Bamako Podcast traite exclusivement les métadonnées publiques transmises par l'API YouTube (identifiant de chaîne, titre de l'émission, titres et descriptions de vidéos, date de publication, durée, identifiant officiel de la vidéo et vignettes publiques).
              </p>
              <p>
                <strong className="text-white">Absence d'accès aux données privées :</strong>{" "}
                Bamako Podcast n'accède pas à vos données de compte Google privées, messages, historique de navigation ou vidéos privées non répertoriées non autorisées.
              </p>
              <p>
                <strong className="text-white">Révocation des autorisations d'accès :</strong>{" "}
                Tout utilisateur ou créateur peut révoquer à tout moment l'accès de l'application aux données YouTube via la page des paramètres de sécurité Google :{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FFBF00] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  Paramètres de sécurité Google — Autorisations accordées
                  <ExternalLink className="w-3 h-3" />
                </a>
                .
              </p>
              <p>
                <strong className="text-white">Non-revente des données API :</strong>{" "}
                Aucune donnée issue des services d'API YouTube n'est vendue, louée ou cédée à des tiers. Les métadonnées sont uniquement mises en cache localement le temps strictement nécessaire à l'affichage du catalogue et à l'optimisation des performances du Studio.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Finalités du traitement */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">4.</span>
            <h2>Finalités et bases légales des traitements</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-white bg-[#141414]">
                  <th className="py-3 px-4 font-bold">Finalité du traitement</th>
                  <th className="py-3 px-4 font-bold">Données concernées</th>
                  <th className="py-3 px-4 font-bold">Base légale (APDP & RGPD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020] text-[#AAAAAA]">
                <tr>
                  <td className="py-3 px-4 font-medium text-white">
                    Fourniture du service d'écoute et streaming audio/vidéo
                  </td>
                  <td className="py-3 px-4">Flux audio, lecteur vidéo YouTube, progression</td>
                  <td className="py-3 px-4 text-[#FFBF00]">Exécution du contrat d'utilisation</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">
                    Gestion du compte et sécurité des accès (authentification OTP)
                  </td>
                  <td className="py-3 px-4">Nom, email, mot de passe haché, code temporaire</td>
                  <td className="py-3 px-4 text-[#FFBF00]">Exécution du contrat & Intérêt légitime</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">
                    Synchronisation multi-appareils (Favoris, Playlists, Reprise)
                  </td>
                  <td className="py-3 px-4">Identifiant utilisateur, historique d'écoute</td>
                  <td className="py-3 px-4 text-[#FFBF00]">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">
                    Envoi d'alertes & notifications de nouveaux épisodes
                  </td>
                  <td className="py-3 px-4">Jeton push Firebase, préférences de notification</td>
                  <td className="py-3 px-4 text-[#FFBF00]">Consentement de l'utilisateur</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">
                    Espace Studio, gestion d'équipe et importation RSS/YouTube
                  </td>
                  <td className="py-3 px-4">Profil créateur, flux RSS déclarés, rôles membres</td>
                  <td className="py-3 px-4 text-[#FFBF00]">Exécution du contrat de publication</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">
                    Sécurité, prévention des fraudes et conformité légale
                  </td>
                  <td className="py-3 px-4">Logs de connexion, audits d'actions administratives</td>
                  <td className="py-3 px-4 text-[#FFBF00]">Obligation légale & Intérêt légitime</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Sécurité et Chiffrement */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">5.</span>
            <h2>Mesures techniques de sécurité et stockage</h2>
          </div>
          <p>
            Bamako Podcast applique les standards industriels les plus rigoureux pour assurer la confidentialité et l'intégrité de vos données :
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Lock className="w-4 h-4 text-[#FFBF00]" />
                Chiffrement TLS 1.3
              </div>
              <p className="text-xs text-[#888888]">
                Toutes les communications entre vos navigateurs, l'application mobile et nos serveurs sont protégées par HTTPS / TLS 1.3.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Key className="w-4 h-4 text-[#FFBF00]" />
                Hachage Bcrypt
              </div>
              <p className="text-xs text-[#888888]">
                Vos mots de passe ne sont jamais stockés en clair. Ils sont irréversiblement salés et hachés avec l'algorithme Bcrypt.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Database className="w-4 h-4 text-[#FFBF00]" />
                Protection SSRF & Rôles
              </div>
              <p className="text-xs text-[#888888]">
                Isolation stricte des bases de données PostgreSQL, contrôles d'accès par rôle (RBAC) et filtres anti-SSRF sur l'ingestion de flux.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Durée de conservation */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">6.</span>
            <h2>Durée de conservation des données</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm text-[#AAAAAA] pl-2">
            <li>
              <strong className="text-white">Compte utilisateur actif :</strong> Conservé pendant toute la durée d'utilisation de votre compte.
            </li>
            <li>
              <strong className="text-white">Comptes inactifs :</strong> Suppression automatique ou anonymisation après 36 mois d'inactivité continue, précédée d'un email d'avertissement.
            </li>
            <li>
              <strong className="text-white">Historique d'écoute :</strong> Effaçable immédiatement par l'utilisateur depuis son interface à volonté.
            </li>
            <li>
              <strong className="text-white">Données de session & logs techniques :</strong> Conservés au maximum 12 mois à des fins de sécurité et de diagnostic d'erreurs.
            </li>
            <li>
              <strong className="text-white">En cas de demande de suppression :</strong> Données de profil et métadonnées effacées sous 48 heures.
            </li>
          </ul>
        </section>

        {/* 7. Vos Droits et Modalités d'exercice */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">7.</span>
            <h2>Vos droits fondamentaux sur vos données</h2>
          </div>
          <p>
            Conformément aux dispositions de la <strong className="text-white">Loi malienne n° 2013-015</strong> et aux standards internationaux de protection des données, vous disposez des droits suivants :
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-sm">Droit d'accès et de portabilité</h3>
              <p className="text-xs text-[#888888]">
                Vous pouvez télécharger une copie intégrale de vos données personnelles au format JSON directement depuis votre espace personnel ou sur simple demande.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-sm">Droit de rectification</h3>
              <p className="text-xs text-[#888888]">
                Vous pouvez modifier votre nom, photo, pays ou préférences linguistiques à tout instant depuis les paramètres de votre compte.
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-sm">Droit à l'effacement (« Droit à l'oubli »)</h3>
              <p className="text-xs text-[#888888]">
                Vous pouvez supprimer définitivement votre compte et toutes vos données associées à tout moment via notre page dédiée :{" "}
                <Link
                  href="/data-deletion"
                  className="text-[#FFBF00] font-semibold hover:underline"
                >
                  Instructions de suppression de compte
                </Link>
                .
              </p>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-sm">Droit d'opposition et de retrait du consentement</h3>
              <p className="text-xs text-[#888888]">
                Vous pouvez révoquer votre consentement aux notifications push ou à la synchronisation à tout moment sans incidence sur la gratuité de l'écoute.
              </p>
            </div>
          </div>

          <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl p-5 mt-4 text-xs sm:text-sm">
            <p className="font-bold text-white mb-1">Comment exercer vos droits ?</p>
            <p className="text-[#AAAAAA]">
              Contactez notre Délégué à la Protection des Données par email à :{" "}
              <Link
                href="mailto:privacy@bamakopodcast.com"
                className="text-[#FFBF00] font-bold hover:underline"
              >
                privacy@bamakopodcast.com
              </Link>{" "}
              ou par courrier postal adressé à : <span className="text-white">Bamako Podcast SARL, Service Conformité / DPO, Quartier Badalabougou, Bamako, Mali</span>.
              Nous vous répondrons sous un délai maximum de 30 jours (48 heures pour les demandes de suppression de compte).
            </p>
          </div>
        </section>

        {/* 8. Autorité de Contrôle (APDP) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">8.</span>
            <h2>Autorité de régulation et réclamations</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous avez le droit d’introduire une réclamation auprès de l'autorité compétente en République du Mali :
          </p>
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-xs text-[#B8B8B8] space-y-1">
            <p className="font-bold text-white">
              Autorité de Protection des Données à Caractère Personnel (APDP) du Mali
            </p>
            <p>Hamdallaye ACI 2000, Bamako, Mali</p>
            <p>
              Site web officiel :{" "}
              <a
                href="http://www.apdp.ml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FFBF00] hover:underline"
              >
                www.apdp.ml
              </a>
            </p>
          </div>
        </section>

        {/* 9. Modifications de la politique */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">9.</span>
            <h2>Mises à jour de la présente politique</h2>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Nous pouvons actualiser la présente Politique de Confidentialité pour refléter les évolutions légales, techniques ou l'intégration de nouveaux services. En cas de modification substantielle, vous en serez informé par notification dans l'application ou par email au moins 15 jours avant son entrée en vigueur.
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
}

function Headphones(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

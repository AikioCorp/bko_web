import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  UserX,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Smartphone,
  Globe,
  Clock,
  ShieldAlert,
  ArrowRight,
  Database,
} from "lucide-react";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Suppression de Compte & Données | Bamako Podcast",
  description:
    "Instructions officielles et formulaire pour supprimer définitivement votre compte Bamako Podcast et toutes vos données personnelles conformément aux exigences Google Play et RGPD.",
  openGraph: {
    title: "Suppression de Compte & Données Personnelles — Bamako Podcast",
    description: "Procédure complète de suppression de compte pour l'application mobile et le site web.",
  },
};

export default function DataDeletionPage() {
  return (
    <LegalPageLayout
      title="Suppression de Compte & Données Personnelles"
      subtitle="Conformément aux exigences de transparence de Google Play, de l'App Store d'Apple et de l'APDP Mali, vous pouvez demander à tout moment la suppression totale et irréversible de votre compte et de toutes vos données personnelles."
      badgeText="Conforme Exigences Google Play & APDP"
      lastUpdated="26 Octobre 2026"
    >
      <div className="space-y-12 text-[#D0D0D0] leading-relaxed text-sm sm:text-base">
        {/* Avertissement important */}
        <section className="bg-[#141414] border border-[#FFBF00]/30 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shrink-0 font-bold">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Votre droit incontestable à la suppression définitive
              </h2>
              <p className="text-xs sm:text-sm text-[#888888]">
                Contrôle total sans obstacles ni démarches fastidieuses
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#AAAAAA]">
            Chez Bamako Podcast, vous n'êtes jamais captif. Si vous décidez de quitter notre service, nous nous engageons à effacer l'intégralité de vos données de nos bases de données actives sous 48 heures.
          </p>
        </section>

        {/* Deux méthodes de suppression */}
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">1.</span>
            <h2>Comment supprimer votre compte ? (2 méthodes simples)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Méthode A : Depuis l'application ou le site */}
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Smartphone className="w-5 h-5 text-[#FFBF00]" />
                  <span>Méthode 1 : En direct depuis l'application</span>
                </div>
                <p className="text-xs text-[#888888]">
                  Si vous êtes connecté sur votre mobile Android/iOS ou sur le site web :
                </p>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-[#AAAAAA] pl-1">
                  <li>Ouvrez le menu latéral ou votre profil.</li>
                  <li>
                    Accédez à la section <strong className="text-white">Paramètres</strong> ou{" "}
                    <strong className="text-white">Confidentialité & Données</strong>.
                  </li>
                  <li>
                    Faites défiler jusqu'à la section rouge <strong className="text-red-400">Zone de danger</strong>.
                  </li>
                  <li>
                    Cliquez sur <strong className="text-white">« Supprimer définitivement mon compte »</strong>.
                  </li>
                  <li>Saisissez votre mot de passe pour confirmer votre identité.</li>
                </ol>
              </div>

              <div className="pt-2">
                <Link
                  href="/settings"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1F1F1F] hover:bg-[#2A2A2A] text-white border border-[#333333] transition-colors"
                >
                  <span>Accéder à mes paramètres</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Méthode B : Par email sans connexion */}
            <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-base">
                  <Globe className="w-5 h-5 text-[#FFBF00]" />
                  <span>Méthode 2 : Sans connexion (formulaire e-mail)</span>
                </div>
                <p className="text-xs text-[#888888]">
                  Si vous n'avez plus l'application installée ou si vous avez oublié votre mot de passe :
                </p>
                <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2D2D2D] space-y-2 text-xs">
                  <p className="text-white font-semibold">Envoyez simplement un e-mail à :</p>
                  <p className="text-[#FFBF00] font-mono font-bold text-sm">
                    privacy@bamakopodcast.com
                  </p>
                  <p className="text-[#888888]">
                    <strong className="text-white">Objet :</strong> Demande de suppression de compte
                  </p>
                  <p className="text-[#888888]">
                    <strong className="text-white">Important :</strong> Envoyez le message depuis l'adresse e-mail associée à votre compte Bamako Podcast afin que nous puissions authentifier la demande.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="mailto:privacy@bamakopodcast.com?subject=Demande%20de%20suppression%20de%20compte"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Envoyer ma demande par email</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Détail des données supprimées vs conservées */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">2.</span>
            <h2>Quelles sont les données immédiatement supprimées ?</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Supprimé immédiatement et irréversiblement :
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#AAAAAA] pl-2">
                <li>Votre nom, pseudonyme, photo d'avatar et identifiant unique.</li>
                <li>Votre adresse email et mot de passe chiffré.</li>
                <li>L'intégralité de votre historique d'écoute et progression.</li>
                <li>Toutes vos playlists personnalisées et épisodes mis en favoris.</li>
                <li>Vos abonnements aux émissions et préférences linguistiques.</li>
                <li>Vos jetons de notification push (FCM) et identifiants d'appareils.</li>
                <li>Vos commentaires et interactions publiques sur les épisodes.</li>
              </ul>
            </div>

            <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-2">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#FFBF00]" />
                Cas particuliers & Obligations légales :
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-[#AAAAAA] pl-2">
                <li>
                  <strong className="text-white">Créateurs de podcasts :</strong> Si vous administrez une émission active, vous pouvez choisir de la supprimer ou d'en transférer la propriété à un co-créateur avant la clôture de votre compte.
                </li>
                <li>
                  <strong className="text-white">Facturation Studio / Abonnements :</strong> Les justificatifs comptables légaux (factures de réservation studio à Badalabougou ou abonnements payants) sont archivés pour la durée légale fiscale imposée par le Code général des impôts du Mali (conservation obligatoire des preuves d'écritures).
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Délais et confirmation */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-white font-bold text-lg sm:text-xl border-b border-[#222222] pb-3">
            <span className="text-[#FFBF00]">3.</span>
            <h2>Délais d'exécution et notification</h2>
          </div>
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 space-y-3 text-xs sm:text-sm text-[#AAAAAA]">
            <p>
              • <strong className="text-white">Via l'application :</strong> La suppression est immédiate au clic et votre session est déconnectée instantanément.
            </p>
            <p>
              • <strong className="text-white">Via demande par e-mail :</strong> Notre équipe conformité traite votre demande sous un délai maximum garanti de <strong className="text-white">48 heures ouvrées</strong> et vous adresse un e-mail de confirmation dès la purge définitive réalisée.
            </p>
            <p>
              • <strong className="text-white">Sauvegardes de sécurité :</strong> Les sauvegardes chiffrées automatiques sont purgées selon un cycle tournant de 30 jours au terme duquel aucune trace résiduelle ne subsiste.
            </p>
          </div>
        </section>
      </div>
    </LegalPageLayout>
  );
}

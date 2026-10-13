"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  Crown,
  CheckCircle2,
  Check,
  Sparkles,
  Zap,
  Volume2,
  Download,
  ShieldCheck,
  Smartphone,
  ChevronDown,
  ArrowRight,
  Headphones,
  Star,
  Users,
  Radio,
  Lock,
  X,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionCheckoutModal } from "@/components/modals/SubscriptionCheckoutModal";

const fetcher = (url: string) => fetchApi(url).then((res) => res.data);

const FAQS = [
  {
    q: "Comment fonctionne le paiement par Orange Money ou Wave ?",
    a: "C'est instantané et sécurisé. Lors de la validation, vous renseignez simplement votre numéro de téléphone. Une notification push USSD s'affiche sur votre mobile pour approuver la transaction avec votre code secret habituel. Votre accès Premium est débloqué immédiatement.",
  },
  {
    q: "L'abonnement est-il avec ou sans engagement ?",
    a: "Absolument sans engagement. Vous pouvez résilier votre renouvellement en un seul clic à tout moment depuis votre profil ou les paramètres de votre compte. Vous conserverez vos avantages jusqu'au dernier jour de votre période en cours.",
  },
  {
    q: "Puis-je écouter mes podcasts hors-ligne ?",
    a: "Oui ! Avec l'application mobile Bamako Podcast et le Pass Premium, vous pouvez télécharger vos épisodes favoris pour les écouter dans les transports ou dans les zones sans connexion internet à Bamako ou en région.",
  },
  {
    q: "Quelle est la différence entre le Pass Mensuel et le Pass Annuel ?",
    a: "Le Pass Annuel vous fait économiser 4 000 FCFA (soit 2 mois totalement offerts) et vous donne en plus un accès prioritaire aux sessions d'enregistrement en direct dans notre studio physique à Bamako.",
  },
  {
    q: "Que se passe-t-il si je ne souhaite pas m'abonner au mois ?",
    a: "L'essentiel de notre catalogue reste gratuit ! De plus, pour les épisodes exclusifs, vous avez la possibilité d'acheter l'épisode de votre choix à l'unité (500 FCFA) sans souscrire à un forfait mensuel.",
  },
];

export default function PremiumPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Charger les formules depuis l'API
  const { data: plansData, isLoading } = useSWR("/subscriptions/plans", fetcher);

  // Vérifier l'abonnement en cours de l'utilisateur
  const { data: userSubData, mutate: mutateUserSub } = useSWR(
    isAuthenticated ? "/subscriptions/me" : null,
    fetcher
  );

  const activeSub = userSubData?.activeSubscription;

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="w-full min-h-screen text-white pb-32">
      {/* HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-16 max-w-6xl mx-auto text-center">
        {/* Badge supérieur */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A1608] border border-[#FFBF00]/40 text-[#FFBF00] text-xs font-semibold mb-6">
          <Crown className="w-4 h-4" />
          <span>L'Expérience Sonore Sans Compromis</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Écoutez le meilleur de Bamako <br className="hidden sm:inline" />
          <span className="text-[#FFBF00]">en illimité et sans publicité</span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#AAAAAA] mb-10 leading-relaxed">
          Accédez à 100% des épisodes exclusifs, profitez d'une qualité audio studio 320 kbps et téléchargez vos émissions favorites pour une écoute hors-ligne partout au Mali et dans le monde.
        </p>

        {/* Statut si déjà abonné */}
        {activeSub && (
          <div className="mb-8 p-4 rounded-2xl bg-[#102A1A] border border-emerald-900/50 max-w-md mx-auto flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#1DB954] shrink-0" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#1DB954]">Abonnement Actif</div>
                <div className="text-sm font-semibold text-white">{activeSub.plan?.name}</div>
                <div className="text-[11px] text-[#AAAAAA]">
                  Valable jusqu'au {new Date(activeSub.currentPeriodEnd).toLocaleDateString("fr-FR")}
                </div>
              </div>
            </div>
            <Link href="/settings/subscription">
              <Button className="bg-[#181818] hover:bg-[#222222] text-xs h-8 px-3 rounded-lg border border-[#333333]">
                Gérer
              </Button>
            </Link>
          </div>
        )}

        {/* Bascule Mensuel / Annuel */}
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-[#141414] border border-[#242424] mb-12">
          <button
            onClick={() => setBillingCycle("MONTHLY")}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              billingCycle === "MONTHLY"
                ? "bg-[#FFBF00] text-black shadow-md font-bold"
                : "text-[#888888] hover:text-white"
            }`}
          >
            Paiement Mensuel
          </button>
          <button
            onClick={() => setBillingCycle("YEARLY")}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
              billingCycle === "YEARLY"
                ? "bg-[#FFBF00] text-black shadow-md font-bold"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <span>Pass Annuel</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#1DB954] text-black">
              -17% (2 MOIS OFFERTS)
            </span>
          </button>
        </div>

        {/* GRILLE DES FORMULES TARIFAIRES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
          {/* Formule 1 : Soutien Créateur */}
          <div className="bg-[#111111] border border-[#242424] rounded-2xl p-6 flex flex-col justify-between hover:border-[#383838] transition-colors shadow-xl">
            <div>
              <div className="text-xs uppercase font-bold text-[#AAAAAA] tracking-wider mb-2">Formule Solidaire</div>
              <h3 className="text-xl font-bold text-white mb-2">Soutien Créateur</h3>
              <p className="text-xs text-[#888888] mb-6 min-h-[36px]">
                Pour soutenir directement les podcasteurs indépendants maliens et accéder à leurs coulisses.
              </p>

              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-3xl font-extrabold text-white">1 000</span>
                <span className="text-xs font-semibold text-[#888888]">FCFA / mois</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#1F1F1F] mb-6">
                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                  <Check className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                  <span>Épisodes bonus et coulisses réservés</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                  <Check className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                  <span>Salon de discussion privé avec les créateurs</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                  <Check className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                  <span>Accès anticipé 48h avant tout le monde</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleSelectPlan(plansData?.find((p: any) => p.slug === "soutien-createur-mensuel") || { id: "p1", name: "Soutien Créateur Mensuel", price: 1000, interval: "MONTHLY" })}
              className="w-full bg-[#1C1C1C] hover:bg-[#282828] text-white border border-[#333333] font-semibold text-xs h-10 rounded-xl"
            >
              Choisir ce soutien
            </Button>
          </div>

          {/* Formule 2 : PASS ILLIMITÉ (FORMULE PHARE RECOMMANDÉE) */}
          <div className="bg-[#16140D] border-2 border-[#FFBF00] rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative shadow-2xl scale-100 md:scale-105 z-10">
            {/* Ruban Recommandé */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#FFBF00] text-black text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Recommandé
            </div>

            <div>
              <div className="text-xs uppercase font-bold text-[#FFBF00] tracking-wider mb-2">Formule Complète</div>
              <h3 className="text-2xl font-black text-white mb-2">Pass Bamako Illimité</h3>
              <p className="text-xs text-gray-300 mb-6 min-h-[36px]">
                L'expérience sonore ultime : zéro publicité, 100% des épisodes exclusifs et son qualité Studio HD.
              </p>

              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-4xl font-extrabold text-[#FFBF00]">2 000</span>
                <span className="text-xs font-semibold text-gray-400">FCFA / mois</span>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#2E2405] mb-6">
                <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                  <Check className="w-4 h-4 text-[#1DB954] shrink-0 mt-0.5" />
                  <span>Écoute 100% sans coupures publicitaires</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                  <Check className="w-4 h-4 text-[#1DB954] shrink-0 mt-0.5" />
                  <span>Accès à tous les épisodes payants & archives</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                  <Check className="w-4 h-4 text-[#1DB954] shrink-0 mt-0.5" />
                  <span>Téléchargement hors-ligne illimité</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                  <Check className="w-4 h-4 text-[#1DB954] shrink-0 mt-0.5" />
                  <span>Qualité audio studio haute fidélité (320 kbps)</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-white font-medium">
                  <Check className="w-4 h-4 text-[#1DB954] shrink-0 mt-0.5" />
                  <span>Badge Auditeur VIP dans la communauté</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleSelectPlan(plansData?.find((p: any) => p.slug === "pass-illimite-mensuel") || { id: "p2", name: "Pass Bamako Podcast Illimité", price: 2000, interval: "MONTHLY" })}
              className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-extrabold text-sm h-11 rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              <span>Prendre le Pass Illimité</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Formule 3 : Pass Annuel Privilège */}
          <div className="bg-[#111111] border border-[#242424] rounded-2xl p-6 flex flex-col justify-between hover:border-[#383838] transition-colors shadow-xl">
            <div>
              <div className="text-xs uppercase font-bold text-[#AAAAAA] tracking-wider mb-2">Formule Annuelle</div>
              <h3 className="text-xl font-bold text-white mb-2">Pass Annuel Privilège</h3>
              <p className="text-xs text-[#888888] mb-6 min-h-[36px]">
                12 mois de tranquillité avec 2 mois offerts et des invitations physiques à nos enregistrements studio.
              </p>

              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-3xl font-extrabold text-white">20 000</span>
                <span className="text-xs font-semibold text-[#888888]">FCFA / an</span>
              </div>
              <div className="text-[11px] text-[#1DB954] font-semibold mb-6">
                Économisez 4 000 FCFA par an
              </div>

              <div className="space-y-3 pt-4 border-t border-[#1F1F1F] mb-6">
                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                  <Check className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                  <span>Tous les avantages du Pass Illimité inclus</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                  <Check className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                  <span>Invitations aux enregistrements live en studio à Bamako</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-gray-300">
                  <Check className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                  <span>Support VIP direct par WhatsApp avec l'équipe</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => handleSelectPlan(plansData?.find((p: any) => p.slug === "pass-annuel-privilege") || { id: "p3", name: "Pass Annuel Privilège", price: 20000, interval: "YEARLY" })}
              className="w-full bg-[#1C1C1C] hover:bg-[#282828] text-white border border-[#333333] font-semibold text-xs h-10 rounded-xl"
            >
              Choisir le Pass Annuel
            </Button>
          </div>
        </div>
      </section>

      {/* BANDEAU MOYENS DE PAIEMENT LOCAUX */}
      <section className="px-4 max-w-4xl mx-auto my-12">
        <div className="p-6 rounded-2xl bg-[#121212] border border-[#242424] text-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#AAAAAA] mb-4">
            Moyens de paiement acceptés en Afrique de l'Ouest
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
            <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] text-center">
              <span className="font-extrabold text-sm text-orange-400">Orange Money</span>
              <div className="text-[10px] text-[#777777] mt-0.5">Mali & UEMOA</div>
            </div>
            <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] text-center">
              <span className="font-extrabold text-sm text-sky-400">Wave</span>
              <div className="text-[10px] text-[#777777] mt-0.5">Mali & Sénégal</div>
            </div>
            <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] text-center">
              <span className="font-extrabold text-sm text-blue-400">Moov Money</span>
              <div className="text-[10px] text-[#777777] mt-0.5">Moov Africa Malitel</div>
            </div>
            <div className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] text-center">
              <span className="font-extrabold text-sm text-gray-200">Carte Bancaire</span>
              <div className="text-[10px] text-[#777777] mt-0.5">Visa / Mastercard</div>
            </div>
          </div>
        </div>
      </section>

      {/* TABLEAU COMPARATIF */}
      <section className="px-4 max-w-4xl mx-auto my-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Comparatif des Fonctionnalités</h2>
          <p className="text-xs text-[#888888]">Découvrez la différence entre l'accès standard et l'expérience Premium</p>
        </div>

        <div className="bg-[#111111] border border-[#222222] rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0A0A0A]">
                <th className="py-4 px-6 text-gray-400 font-bold uppercase">Avantages</th>
                <th className="py-4 px-6 text-center text-[#888888] font-bold uppercase w-32">Gratuit</th>
                <th className="py-4 px-6 text-center text-[#FFBF00] font-bold uppercase w-36 bg-[#16140D]">Pass Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]">
              <tr>
                <td className="py-3.5 px-6 font-medium text-gray-200">Catalogue général & découvertes</td>
                <td className="py-3.5 px-6 text-center"><Check className="w-4 h-4 text-[#1DB954] mx-auto" /></td>
                <td className="py-3.5 px-6 text-center bg-[#16140D]"><Check className="w-4 h-4 text-[#1DB954] mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-gray-200">Zéro coupure publicitaire</td>
                <td className="py-3.5 px-6 text-center"><X className="w-4 h-4 text-[#555555] mx-auto" /></td>
                <td className="py-3.5 px-6 text-center bg-[#16140D]"><Check className="w-4 h-4 text-[#1DB954] mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-gray-200">Accès aux épisodes payants & exclusifs</td>
                <td className="py-3.5 px-6 text-center"><X className="w-4 h-4 text-[#555555] mx-auto" /></td>
                <td className="py-3.5 px-6 text-center bg-[#16140D]"><Check className="w-4 h-4 text-[#1DB954] mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-gray-200">Qualité sonore HD 320 kbps</td>
                <td className="py-3.5 px-6 text-center text-[#777777]">128 kbps</td>
                <td className="py-3.5 px-6 text-center bg-[#16140D] text-[#FFBF00] font-bold">Studio 320 kbps</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-gray-200">Téléchargement hors-ligne sur mobile</td>
                <td className="py-3.5 px-6 text-center"><X className="w-4 h-4 text-[#555555] mx-auto" /></td>
                <td className="py-3.5 px-6 text-center bg-[#16140D]"><Check className="w-4 h-4 text-[#1DB954] mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-medium text-gray-200">Badge Auditeur VIP dans la communauté</td>
                <td className="py-3.5 px-6 text-center"><X className="w-4 h-4 text-[#555555] mx-auto" /></td>
                <td className="py-3.5 px-6 text-center bg-[#16140D]"><Check className="w-4 h-4 text-[#FFBF00] mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="px-4 max-w-3xl mx-auto my-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Foire aux Questions</h2>
          <p className="text-xs text-[#888888]">Toutes les réponses à vos interrogations sur l'abonnement</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="bg-[#111111] border border-[#222222] rounded-xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#888888] shrink-0 transition-transform ${isOpen ? "rotate-180 text-[#FFBF00]" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-[#AAAAAA] leading-relaxed border-t border-[#1C1C1C]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* MODALE DE PAIEMENT CHECKOUT */}
      <SubscriptionCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        plan={selectedPlan}
        onSuccess={() => {
          mutateUserSub();
        }}
      />
    </div>
  );
}

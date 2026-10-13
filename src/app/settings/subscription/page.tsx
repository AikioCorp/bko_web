"use client";

import React, { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  CreditCard,
  Crown,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  FileText,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionCheckoutModal } from "@/components/modals/SubscriptionCheckoutModal";

const fetcher = (url: string) => fetchApi(url).then((res) => res.data);

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  ORANGE_MONEY: "Orange Money Mali",
  WAVE: "Wave",
  MOOV_MONEY: "Moov Money Malitel",
  CARD: "Carte Bancaire",
  ADMIN_GRANT: "Attribué par l'Administration",
  FREE_TRIAL: "Période d'essai",
};

export default function UserSubscriptionSettingsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data, error, mutate, isLoading } = useSWR(
    isAuthenticated ? "/subscriptions/me" : null,
    fetcher
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCancelSubscription = async () => {
    if (!data?.activeSubscription?.id) return;
    try {
      setIsCanceling(true);
      await fetchApi("/subscriptions/cancel", {
        method: "POST",
        body: JSON.stringify({ subscriptionId: data.activeSubscription.id }),
      });
      await mutate();
      setIsCancelModalOpen(false);
      showToast("Votre demande de résiliation a été prise en compte.");
    } catch (err: any) {
      showToast(err.message || "Erreur lors de la résiliation");
    } finally {
      setIsCanceling(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-full py-20 text-center max-w-md mx-auto px-4">
        <Crown className="w-12 h-12 text-[#FFBF00] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Connexion requise</h2>
        <p className="text-xs text-[#888888] mb-6">
          Veuillez vous connecter pour consulter vos informations d'abonnement et vos factures.
        </p>
        <Link href="/login?redirect=/settings/subscription">
          <Button className="w-full bg-[#FFBF00] text-black font-bold text-xs h-10 rounded-xl">
            Se connecter
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-[#888888]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFBF00] mb-3" />
        <p className="text-xs">Chargement de votre abonnement...</p>
      </div>
    );
  }

  const activeSub = data?.activeSubscription;
  const transactions = data?.transactions || [];

  return (
    <div className="w-full px-4 sm:px-6 py-6 pb-32 text-white">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] border border-[#2E2E2E] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#1DB954]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Retour */}
      <div className="flex items-center gap-2 mb-6 text-xs text-[#888888]">
        <Link href="/settings" className="hover:text-white flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Paramètres</span>
        </Link>
        <span>/</span>
        <span className="text-white font-medium">Abonnement & Facturation</span>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1.5">
          Mon Abonnement & Factures
        </h1>
        <p className="text-xs sm:text-sm text-[#888888]">
          Gérez votre formule Bamako Podcast, vos moyens de paiement Mobile Money et vos reçus d'écoute.
        </p>
      </div>

      {/* CARTE ÉTAT DE L'ABONNEMENT */}
      <div className="mb-8 p-6 sm:p-7 rounded-2xl bg-[#121212] border border-[#262626] shadow-xl">
        {activeSub ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222222]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#102A1A] text-[#1DB954] border border-emerald-900/50">
                    ABONNEMENT ACTIF
                  </span>
                  <span className="text-xs text-[#888888]">
                    Membre VIP depuis le {new Date(activeSub.currentPeriodStart).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white">{activeSub.plan?.name}</h2>
                <div className="text-sm text-[#FFBF00] font-bold mt-1">
                  {activeSub.plan?.price?.toLocaleString("fr-FR")} {activeSub.plan?.currency || "XOF"} / {activeSub.plan?.interval === "YEARLY" ? "an" : "mois"}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="bg-[#201517] hover:bg-[#2C1A1D] text-[#EF4444] border border-red-900/40 text-xs h-9 px-4 rounded-xl"
                >
                  Résilier
                </Button>
                <Link href="/premium">
                  <Button className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-bold text-xs h-9 px-4 rounded-xl">
                    Changer de formule
                  </Button>
                </Link>
              </div>
            </div>

            {/* Détails du contrat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-xs">
              <div className="p-3.5 rounded-xl bg-[#161616] border border-[#242424]">
                <div className="text-[#888888] mb-1">Date d'expiration / Renouvellement</div>
                <div className="font-bold text-white text-sm">
                  {new Date(activeSub.currentPeriodEnd).toLocaleDateString("fr-FR")}
                </div>
                <div className="text-[11px] text-[#777777] mt-0.5">
                  {activeSub.cancelAtPeriodEnd ? "Ne sera pas reconduit" : "Renouvellement automatique"}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161616] border border-[#242424]">
                <div className="text-[#888888] mb-1">Moyen de règlement</div>
                <div className="font-bold text-white text-sm">
                  {PAYMENT_METHOD_NAMES[activeSub.paymentMethod] || activeSub.paymentMethod}
                </div>
                <div className="text-[11px] text-[#1DB954] mt-0.5">Compte vérifié</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161616] border border-[#242424]">
                <div className="text-[#888888] mb-1">Privilèges actifs</div>
                <div className="font-bold text-[#FFBF00] text-sm">Pass Illimité Débloqué</div>
                <div className="text-[11px] text-[#777777] mt-0.5">Zéro pub & Son Studio HD</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-[#181818] border border-[#2E2E2E] flex items-center justify-center mx-auto mb-4 text-[#888888]">
              <Crown className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Vous n'avez pas d'abonnement actif</h3>
            <p className="text-xs text-[#888888] max-w-md mx-auto mb-6">
              Passez à Bamako Podcast Premium pour profiter de l'écoute sans publicité, débloquer tous les épisodes payants et soutenir vos podcasteurs maliens préférés.
            </p>
            <Link href="/premium">
              <Button className="bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-extrabold text-xs h-10 px-6 rounded-xl shadow-lg">
                <Sparkles className="w-4 h-4 mr-2" /> Découvrir les formules dès 1 000 FCFA
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* HISTORIQUE DES FACTURES & TRANSACTIONS */}
      <div className="rounded-2xl bg-[#121212] border border-[#262626] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Historique de Facturation & Reçus</h3>
            <p className="text-xs text-[#777777]">Vos paiements Mobile Money et achats unitaires</p>
          </div>
          {data?.totalSpent > 0 && (
            <span className="text-xs font-mono font-bold text-[#FFBF00]">
              Total dépensé : {data.totalSpent.toLocaleString("fr-FR")} FCFA
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#222222] bg-[#0A0A0A] text-[#777777]">
                <th className="px-6 py-3 font-semibold uppercase">Date</th>
                <th className="px-6 py-3 font-semibold uppercase">Désignation</th>
                <th className="px-6 py-3 font-semibold uppercase">Moyen</th>
                <th className="px-6 py-3 font-semibold uppercase">Référence</th>
                <th className="px-6 py-3 font-semibold uppercase">Montant</th>
                <th className="px-6 py-3 font-semibold uppercase text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C1C1C]">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#777777]">
                    Aucune transaction enregistrée.
                  </td>
                </tr>
              ) : (
                transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-[#161616] transition-colors">
                    <td className="px-6 py-3 text-gray-300 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-3 text-white font-medium">
                      {tx.subscription?.plan?.name
                        ? `Abonnement : ${tx.subscription.plan.name}`
                        : tx.episode?.title
                        ? `Épisode : ${tx.episode.title}`
                        : tx.note || "Achat Bamako Podcast"}
                    </td>
                    <td className="px-6 py-3 text-gray-300">
                      {PAYMENT_METHOD_NAMES[tx.paymentMethod] || tx.paymentMethod}
                    </td>
                    <td className="px-6 py-3 font-mono text-[#888888]">{tx.transactionRef || tx.id}</td>
                    <td className="px-6 py-3 font-mono font-bold text-white">
                      {tx.amount?.toLocaleString("fr-FR")} {tx.currency || "XOF"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#102A1A] text-[#1DB954] border border-emerald-900/40">
                        RÉGLÉ
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALE DE CONFIRMATION DE RÉSILIATION */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#282828] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Confirmer la résiliation</h3>
            <p className="text-xs text-[#888888] mb-4">
              Êtes-vous sûr de vouloir résilier votre formule « {activeSub?.plan?.name} » ? Vous conserverez vos avantages jusqu'au {activeSub ? new Date(activeSub.currentPeriodEnd).toLocaleDateString("fr-FR") : ""}. Aucun renouvellement ne sera effectué par la suite.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                onClick={() => setIsCancelModalOpen(false)}
                className="bg-transparent hover:bg-[#222222] text-[#AAAAAA] text-xs h-9 px-4 rounded-xl"
              >
                Garder mon abonnement
              </Button>
              <Button
                onClick={handleCancelSubscription}
                disabled={isCanceling}
                className="bg-[#EF4444] hover:bg-red-600 text-white font-bold text-xs h-9 px-4 rounded-xl"
              >
                {isCanceling ? "Traitement..." : "Confirmer la résiliation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPortal } from "@/components/ui/ClientPortal";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: string;
  description?: string;
  features?: string[];
}

interface EpisodeTarget {
  id: string;
  title: string;
  podcastName?: string;
  price?: number;
}

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan | null;
  episode?: EpisodeTarget | null;
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  {
    id: "ORANGE_MONEY",
    name: "Orange Money",
    badge: "🇲🇱 Mali & UEMOA",
    color: "border-orange-500/50 bg-[#1E140A] text-orange-400",
    description: "Validation instantanée par push USSD (*144#)",
  },
  {
    id: "WAVE",
    name: "Wave",
    badge: "🌊 1% de frais",
    color: "border-sky-500/50 bg-[#0A1724] text-sky-400",
    description: "Paiement direct et sans tracas",
  },
  {
    id: "MOOV_MONEY",
    name: "Moov Money",
    badge: "🇲🇱 Moov Africa",
    color: "border-blue-500/50 bg-[#081320] text-blue-400",
    description: "Validation via votre compte Moov",
  },
  {
    id: "CARD",
    name: "Carte Bancaire",
    badge: "💳 Visa / Mastercard",
    color: "border-[#333333] bg-[#141414] text-gray-200",
    description: "Paiement international sécurisé 3D Secure",
  },
];

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  episode,
  onSuccess,
}) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [paymentMethod, setPaymentMethod] = useState<string>("ORANGE_MONEY");
  const [countryCode, setCountryCode] = useState<string>("+223");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [autoRenew, setAutoRenew] = useState<boolean>(true);

  // Étape du parcours : "FORM" -> "PROCESSING" -> "SUCCESS"
  const [step, setStep] = useState<"FORM" | "PROCESSING" | "SUCCESS">("FORM");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [completedTxRef, setCompletedTxRef] = useState<string>("");

  if (!isOpen) return null;

  // Calcul du montant
  const isEpisodePurchase = Boolean(episode && !plan);
  const amount = isEpisodePurchase ? (episode?.price || 500) : (plan?.price || 2000);
  const currency = "XOF";
  const title = isEpisodePurchase ? `Achat : ${episode?.title}` : (plan?.name || "Pass Premium Bamako Podcast");

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!isAuthenticated) {
      // Rediriger vers login avec retour
      onClose();
      router.push(`/login?redirect=/premium`);
      return;
    }

    if (paymentMethod !== "CARD" && !phoneNumber.trim()) {
      setErrorMessage("Veuillez renseigner votre numéro Mobile Money.");
      return;
    }

    try {
      setIsSubmitting(true);
      setStep("PROCESSING");

      // Simulation réaliste de l'interrogation de la passerelle Mobile Money (1.8s)
      await new Promise((resolve) => setTimeout(resolve, 1800));

      let res;
      if (isEpisodePurchase && episode) {
        res = await fetchApi("/subscriptions/buy-episode", {
          method: "POST",
          body: JSON.stringify({
            episodeId: episode.id,
            paymentMethod,
            phoneNumber: `${countryCode} ${phoneNumber}`.trim(),
          }),
        });
      } else if (plan) {
        res = await fetchApi("/subscriptions/checkout", {
          method: "POST",
          body: JSON.stringify({
            planId: plan.id,
            paymentMethod,
            phoneNumber: `${countryCode} ${phoneNumber}`.trim(),
            autoRenew,
          }),
        });
      }

      setCompletedTxRef(res?.data?.transaction?.transactionRef || `BKO-PAY-${Date.now().toString().slice(-6)}`);
      setStep("SUCCESS");

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setStep("FORM");
      setErrorMessage(err.message || "Erreur lors du traitement du paiement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClientPortal>
      <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111111] border border-[#242424] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        {/* Bouton Fermer */}
        {step !== "PROCESSING" && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[#777777] hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ÉTAPE 1 : FORMULAIRE DE RÈGLEMENT */}
        {step === "FORM" && (
          <div>
            {/* Header Récapitulatif */}
            <div className="mb-5 pb-5 border-b border-[#222222]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#FFBF00] mb-1">
                <Crown className="w-4 h-4" />
                <span>Règlement Sécurisé</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{title}</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">
                  {amount.toLocaleString("fr-FR")} {currency}
                </span>
                {!isEpisodePurchase && plan && (
                  <span className="text-xs text-[#888888]">
                    / {plan.interval === "YEARLY" ? "an (2 mois offerts)" : "mois"}
                  </span>
                )}
              </div>
              {episode?.podcastName && (
                <p className="text-xs text-[#888888] mt-1">Émission : {episode.podcastName}</p>
              )}
            </div>

            {/* Message d'erreur */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-[#281315] border border-red-900/50 flex items-start gap-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Avertissement non-connecté */}
            {!isAuthenticated && (
              <div className="mb-4 p-3 rounded-xl bg-[#211A07] border border-[#FFBF00]/40 flex items-start gap-2.5 text-xs text-[#FFBF00]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Vous devez être connecté à votre compte Bamako Podcast pour associer votre abonnement.</span>
              </div>
            )}

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Choix du Moyen de Paiement */}
              <div>
                <label className="block text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider mb-2">
                  Choisissez votre moyen de paiement
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = paymentMethod === method.id;
                    return (
                      <button
                        type="button"
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-3 rounded-xl border text-left transition-colors flex flex-col justify-between ${
                          isSelected
                            ? `${method.color} border-2`
                            : "border-[#242424] bg-[#161616] text-[#888888] hover:border-[#383838]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white">{method.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#FFBF00]" />}
                        </div>
                        <span className="text-[10px] text-[#777777] leading-tight">{method.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Champ Numéro Mobile Money si sélectionné */}
              {paymentMethod !== "CARD" && (
                <div>
                  <label className="block text-xs font-semibold text-[#AAAAAA] uppercase tracking-wider mb-1.5">
                    Numéro de compte {PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.name}
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-[#181818] border border-[#2A2A2A] rounded-xl px-2.5 py-2.5 text-xs text-white outline-none shrink-0"
                    >
                      <option value="+223">🇲🇱 +223 (Mali)</option>
                      <option value="+225">🇨🇮 +225 (RCI)</option>
                      <option value="+221">🇸🇳 +221 (SN)</option>
                      <option value="+226">🇧🇫 +226 (BF)</option>
                      <option value="+224">🇬🇳 +224 (GN)</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ex: 70 00 00 90"
                        className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#FFBF00] font-mono transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-[#777777] mt-1.5">
                    Un prompt de confirmation sera envoyé sur votre téléphone pour valider le débit de {amount.toLocaleString("fr-FR")} {currency}.
                  </p>
                </div>
              )}

              {/* Si Carte Bancaire */}
              {paymentMethod === "CARD" && (
                <div className="p-3.5 rounded-xl bg-[#181818] border border-[#282828] text-xs text-[#888888] space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Lock className="w-3.5 h-3.5 text-[#1DB954]" />
                    <span>Paiement sécurisé par carte</span>
                  </div>
                  <p className="text-[11px]">
                    Vous allez être débité de {amount.toLocaleString("fr-FR")} {currency} via le protocole sécurisé 3D Secure.
                  </p>
                </div>
              )}

              {/* Renouvellement automatique pour les abonnements */}
              {!isEpisodePurchase && (
                <label className="flex items-center gap-2.5 pt-1 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(e) => setAutoRenew(e.target.checked)}
                    className="accent-[#FFBF00] w-4 h-4 rounded"
                  />
                  <span>Renouvellement automatique (résiliable en 1 clic à tout moment)</span>
                </label>
              )}

              {/* Bouton de confirmation */}
              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-bold text-sm h-11 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    Payer {amount.toLocaleString("fr-FR")} {currency}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#666666] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1DB954]" />
                <span>Paiement chiffré de bout en bout • Sans engagement</span>
              </div>
            </form>
          </div>
        )}

        {/* ÉTAPE 2 : EN COURS DE TRAITEMENT PUSH MOBILE MONEY */}
        {step === "PROCESSING" && (
          <div className="py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#1F1907] border-2 border-[#FFBF00] flex items-center justify-center mx-auto text-[#FFBF00] animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Validation en cours...</h3>
              <p className="text-xs text-[#888888] max-w-sm mx-auto">
                Veuillez valider la demande de paiement de <span className="text-white font-bold">{amount.toLocaleString("fr-FR")} {currency}</span> reçue sur votre téléphone {paymentMethod.replace("_", " ")}.
              </p>
            </div>
            <div className="p-3 bg-[#161616] border border-[#262626] rounded-xl text-[11px] text-[#777777] max-w-xs mx-auto">
              Ne fermez pas cette fenêtre, confirmation automatique dès validation.
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : PAIEMENT CONFIRMÉ AVEC SUCCÈS */}
        {step === "SUCCESS" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#102A1A] border-2 border-[#1DB954] flex items-center justify-center mx-auto text-[#1DB954]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1DB954]">Paiement Réussi</span>
              <h3 className="text-xl font-bold text-white mt-1">Félicitations & Bienvenue !</h3>
              <p className="text-xs text-[#888888] mt-1 max-w-sm mx-auto">
                {isEpisodePurchase
                  ? `L'épisode « ${episode?.title} » est maintenant débloqué sans aucune limite.`
                  : `Votre abonnement « ${title} » est actif. Vous profitez immédiatement de tous les privilèges VIP.`}
              </p>
            </div>

            {/* Récapitulatif reçu */}
            <div className="bg-[#161616] border border-[#262626] rounded-xl p-4 text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-[#888888]">
                <span>Référence reçu</span>
                <span className="font-mono text-white font-semibold">{completedTxRef}</span>
              </div>
              <div className="flex items-center justify-between text-[#888888]">
                <span>Montant réglé</span>
                <span className="font-semibold text-[#1DB954]">
                  {amount.toLocaleString("fr-FR")} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#888888]">
                <span>Mode de paiement</span>
                <span className="text-white">{PAYMENT_METHODS.find((p) => p.id === paymentMethod)?.name}</span>
              </div>
            </div>

            <Button
              onClick={() => {
                onClose();
                if (isEpisodePurchase) {
                  router.refresh();
                } else {
                  router.push("/explore");
                }
              }}
              className="w-full bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-bold text-sm h-11 rounded-xl shadow-lg mt-2"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Commencer l'écoute immédiate</span>
            </Button>
          </div>
        )}
      </div>
    </div>
    </ClientPortal>
  );
};

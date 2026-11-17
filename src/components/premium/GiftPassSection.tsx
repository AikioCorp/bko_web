"use client";

import React, { useState } from "react";
import { Gift, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface GiftPassSectionProps {
  plansData?: any[];
  onRedeemed?: () => void;
}

export function GiftPassSection({ plansData, onRedeemed }: GiftPassSectionProps) {
  const [tab, setTab] = useState<"BUY" | "REDEEM">("BUY");
  const [planId, setPlanId] = useState<string>("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ORANGE_MONEY");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const [redeemCode, setRedeemCode] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const availablePlans = Array.isArray(plansData) && plansData.length > 0 ? plansData : [];
  const selectedPlanId = planId || availablePlans[0]?.id || "";

  const handleBuyGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId) {
      setError("Aucune formule disponible.");
      return;
    }
    setLoading(true);
    setError("");
    setGeneratedCode(null);
    try {
      const res = await fetchApi("/subscriptions/gift", {
        method: "POST",
        body: JSON.stringify({
          planId: selectedPlanId,
          recipientName: recipientName.trim() || undefined,
          recipientEmail: recipientEmail.trim() || undefined,
          message: message.trim() || undefined,
          paymentMethod,
        }),
      });
      if (!res.success || !res.data?.code) {
        throw new Error(res.error?.message || res.message || "Erreur lors de la création du Pass Cadeau");
      }
      setGeneratedCode(res.data.code);
    } catch (err: any) {
      setError(err.message || "Impossible de générer le Pass Cadeau.");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) return;
    setLoading(true);
    setError("");
    setRedeemSuccess("");
    try {
      const res = await fetchApi("/subscriptions/gift/redeem", {
        method: "POST",
        body: JSON.stringify({ code: redeemCode.trim().toUpperCase() }),
      });
      if (!res.success) {
        throw new Error(res.error?.message || res.message || "Code invalide ou déjà utilisé");
      }
      setRedeemSuccess("Pass Cadeau activé ! Votre abonnement Premium est maintenant actif.");
      setRedeemCode("");
      if (onRedeemed) onRedeemed();
    } catch (err: any) {
      setError(err.message || "Impossible d'activer ce code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121212] border border-[#242424] rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1C1810] border border-[#FFBF00]/30 text-[#FFBF00] flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Pass Cadeaux Bamako Podcast</h2>
            <p className="text-xs text-[#888888]">
              Offrez un Pass Premium à un proche ou activez un code cadeau reçu.
            </p>
          </div>
        </div>

        <div className="flex bg-[#181818] p-1 rounded-xl border border-[#282828] shrink-0">
          <button
            type="button"
            onClick={() => {
              setTab("BUY");
              setError("");
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              tab === "BUY" ? "bg-[#FFBF00] text-black" : "text-[#AAA] hover:text-white"
            }`}
          >
            Offrir un Pass
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("REDEEM");
              setError("");
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              tab === "REDEEM" ? "bg-[#FFBF00] text-black" : "text-[#AAA] hover:text-white"
            }`}
          >
            Activer un code
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
          {error}
        </div>
      )}

      {tab === "BUY" ? (
        generatedCode ? (
          <div className="p-6 rounded-2xl bg-[#161616] border border-emerald-500/30 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Pass Cadeau prêt !</h3>
            <p className="text-xs text-[#AAA]">
              Partagez ce code avec votre proche pour activer son abonnement :
            </p>
            <div className="inline-block px-5 py-2.5 rounded-xl bg-[#0B0B0B] border border-[#FFBF00]/40 font-mono text-lg font-black text-[#FFBF00] tracking-wider">
              {generatedCode}
            </div>
            <div>
              <button
                type="button"
                onClick={() => setGeneratedCode(null)}
                className="text-xs text-[#AAA] hover:text-white underline"
              >
                Offrir un autre Pass
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBuyGift} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-[#CCC] block mb-1">Formule à offrir</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-white outline-none focus:border-[#FFBF00]"
              >
                {availablePlans.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price.toLocaleString("fr-FR")} FCFA
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#CCC] block mb-1">Moyen de paiement</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-white outline-none focus:border-[#FFBF00]"
              >
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="WAVE">Wave</option>
                <option value="MOOV_MONEY">Moov Money</option>
                <option value="CARD">Carte Bancaire</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#CCC] block mb-1">Nom du bénéficiaire (optionnel)</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Moussa Traoré"
                className="w-full px-3 py-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-white outline-none focus:border-[#FFBF00]"
              />
            </div>

            <div>
              <label className="font-semibold text-[#CCC] block mb-1">Email du bénéficiaire (envoi auto)</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="proche@exemple.com"
                className="w-full px-3 py-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-white outline-none focus:border-[#FFBF00]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-[#CCC] block mb-1">Petit mot personnalisé (optionnel)</label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Bonne écoute sur Bamako Podcast !"
                className="w-full px-3 py-2.5 rounded-xl bg-[#181818] border border-[#2A2A2A] text-white outline-none focus:border-[#FFBF00]"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading || availablePlans.length === 0}
                className="px-6 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-black flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Générer le Pass Cadeau</span>
              </button>
            </div>
          </form>
        )
      ) : (
        <form onSubmit={handleRedeem} className="space-y-4">
          {redeemSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{redeemSuccess}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              placeholder="BKO-GIFT-XXXX-XXXX"
              className="flex-1 px-4 py-3 rounded-xl bg-[#181818] border border-[#2A2A2A] text-sm text-white font-mono uppercase outline-none focus:border-[#FFBF00]"
            />
            <button
              type="submit"
              disabled={loading || !redeemCode.trim()}
              className="px-6 py-3 rounded-xl bg-[#FFBF00] hover:bg-[#E6AC00] text-black font-black text-xs disabled:opacity-50"
            >
              {loading ? "Activation..." : "Activer mon Pass"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

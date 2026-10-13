"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Sliders, RotateCcw, ShieldCheck, Check } from "lucide-react";

export default function SettingsPersonalizationPage() {
  const { user } = useAuthStore();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data: profileData, mutate } = useSWR("/me", (url) =>
    fetchApi(url).then((res) => res.data)
  );

  const handleResetProfile = async () => {
    if (!confirm("Voulez-vous réinitialiser vos recommandations et effacer l'historique d'affinité ?")) {
      return;
    }
    try {
      setIsResetting(true);
      await fetchApi("/recommendations/reset-profile", { method: "POST" });
      setMessage("Votre profil de recommandations a été réinitialisé.");
      await mutate();
    } catch (err: any) {
      setMessage("Erreur lors de la réinitialisation: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleTogglePersonalization = async (active: boolean) => {
    try {
      await fetchApi("/recommendations/settings", {
        method: "PATCH",
        body: JSON.stringify({ personalizationActive: active }),
      });
      setMessage(active ? "Recommandations personnalisées activées." : "Recommandations personnalisées désactivées.");
      await mutate();
    } catch (err: any) {
      setMessage("Erreur: " + err.message);
    }
  };

  return (
    <div className="w-full py-6 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-[#FFBF00]" />
          Personnalisation & Confidentialité
        </h1>
        <p className="text-[#888888] text-sm">
          Contrôlez vos recommandations, vos signaux d'écoute et la façon dont votre profil s'adapte à vos goûts.
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-xl bg-[#141414] border border-[#2A2A2A] text-[#FFBF00] text-sm flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Toggle Personalization */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-base">Recommandations personnalisées</h3>
            <p className="text-xs text-[#888888] mt-1 max-w-lg">
              Lorsque cette option est activée, vos écoutes, abonnements et thèmes favoris adaptent l'accueil et la découverte.
            </p>
          </div>
          <button
            onClick={() => handleTogglePersonalization(true)}
            className="px-4 py-2 bg-[#FFBF00] text-black font-semibold text-xs rounded-xl hover:bg-[#E5AB00] transition-colors"
          >
            Activé
          </button>
        </div>

        {/* Reset Profile */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-base flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-red-400" />
              Réinitialiser mon profil de goûts
            </h3>
            <p className="text-xs text-[#888888] mt-1 max-w-lg">
              Efface les scores d'affinité calculés et les exclusions pour repartir sur une page d'accueil fraîche.
            </p>
          </div>
          <button
            onClick={handleResetProfile}
            disabled={isResetting}
            className="px-4 py-2 bg-[#1F1F1F] text-red-300 border border-red-500/20 font-semibold text-xs rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {isResetting ? "Réinitialisation..." : "Réinitialiser"}
          </button>
        </div>

        {/* Onboarding Thématique */}
        <div className="bg-[#141414] border border-[#262626] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white text-base">Thèmes & Langues préférés</h3>
            <p className="text-xs text-[#888888] mt-1 max-w-lg">
              Mettez à jour vos choix d'onboarding pour explorer de nouveaux sujets.
            </p>
          </div>
          <a
            href="/onboarding"
            className="px-4 py-2 bg-[#202020] text-white font-semibold text-xs rounded-xl hover:bg-[#2A2A2A] transition-colors"
          >
            Modifier
          </a>
        </div>
      </div>
    </div>
  );
}

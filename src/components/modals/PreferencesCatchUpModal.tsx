"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sparkles, X, Compass, Clock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { shouldShowCatchUpInvitation } from "@/lib/auth-navigation";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/token";

export function PreferencesCatchUpModal() {
  const router = useRouter();
  const pathname = usePathname() || "";
  const { user, updateUser, isAuthenticated } = useAuthStore();
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const [isOpen, setIsOpen] = useState(false);
  const [hasPromptedServer, setHasPromptedServer] = useState(false);
  const dismissedInSession = useRef(false);

  useEffect(() => {
    // 1. Ne pas afficher si déjà ignoré ou ouvert dans la session courante
    if (dismissedInSession.current) return;

    // 2. Ne pas interrompre sur les routes critiques (authentification, onboarding, admin, studio)
    const ignoredRoutes = [
      "/onboarding",
      "/login",
      "/register",
      "/verify-otp",
      "/suspended",
      "/reset-password",
    ];
    if (ignoredRoutes.some((route) => pathname.startsWith(route))) {
      return;
    }

    // 3. Ne pas interrompre pendant une écoute active
    if (isPlaying) {
      return;
    }

    // 4. Vérifier si l'utilisateur est éligible selon la décision canonique
    if (isAuthenticated && shouldShowCatchUpInvitation(user)) {
      // Temporiser légèrement pour ne pas surprendre l'utilisateur au premier rendu (2s après chargement)
      const timer = setTimeout(() => {
        // Revérifier les conditions avant ouverture
        if (
          !dismissedInSession.current &&
          !usePlayerStore.getState().isPlaying &&
          shouldShowCatchUpInvitation(useAuthStore.getState().user)
        ) {
          setIsOpen(true);

          // Notifier le serveur que l'invitation a été réellement présentée
          if (!hasPromptedServer) {
            setHasPromptedServer(true);
            const token = getAccessToken();
            if (token) {
              fetch(`${API_BASE_URL}/recommendations/onboarding/state`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ state: "PROMPTED" }),
              }).catch(() => {});
            }
          }
        }
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
    }
  }, [user, isAuthenticated, pathname, isPlaying, hasPromptedServer]);

  // Fermeture ou choix "Plus tard" -> marquer DISMISSED pour ne plus jamais relancer
  const handleDismiss = async () => {
    dismissedInSession.current = true;
    setIsOpen(false);

    // Mettre à jour l'état local immédiatement
    updateUser({
      onboardingState: "DISMISSED",
      recommendationProfile: {
        ...(user?.recommendationProfile || {}),
        onboardingState: "DISMISSED",
        onboardingDismissedAt: new Date().toISOString(),
      },
    });

    // Synchroniser avec le serveur pour l'ensemble des appareils
    const token = getAccessToken();
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/recommendations/onboarding/state`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ state: "DISMISSED" }),
        });
      } catch (_) {}
    }
  };

  // Clic sur "Personnaliser mes écoutes" -> Ouvrir /onboarding avec pré-remplissage
  const handleAccept = () => {
    dismissedInSession.current = true;
    setIsOpen(false);
    router.push("/onboarding");
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="catchup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[#141414] border border-[#262626] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        {/* Bouton de fermeture discret (équivaut à Plus tard) */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Fermer et reporter"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1C1E] border border-[#2C2C2E] text-[#8E8E93] hover:text-white hover:bg-[#2C2C2E] flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* En-tête avec badge sobre (Zéro gradient) */}
        <div className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1C1810] border border-[#FFBF00]/30 text-[#FFBF00] flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2
              id="catchup-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-white tracking-tight"
            >
              Des écoutes qui vous ressemblent
            </h2>
            <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
              Choisissez vos langues d’écoute et vos centres d’intérêt pour découvrir des émissions qui vous plaisent.
            </p>
          </div>
        </div>

        {/* Détails rassurants */}
        <div className="p-3.5 bg-[#0E0E0E] border border-[#242424] rounded-2xl text-[11px] text-[#8E8E93] space-y-1.5">
          <div className="flex items-center gap-2 text-[#D4D4D8]">
            <Compass className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span className="font-semibold">Recommandations sur mesure</span>
          </div>
          <p>
            Vous pourrez toujours modifier vos langues et vos centres d'intérêt à tout moment dans votre profil.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 py-3.5 px-4 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-black font-extrabold text-xs transition-colors flex items-center justify-center gap-2 shadow"
          >
            <span>Personnaliser mes écoutes</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="py-3 px-4 rounded-xl bg-[#1C1C1E] hover:bg-[#2C2C2E] text-[#A1A1AA] hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Plus tard</span>
          </button>
        </div>
      </div>
    </div>
  );
}

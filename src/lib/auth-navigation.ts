import type { UserProfile } from "@/store/authStore";

/**
 * Nettoie et valide une URL de redirection pour éviter :
 * - Les failles Open Redirect ("//evil.com", "https://…", "javascript:…")
 * - Les boucles de redirection infinies (/login, /verify-otp, /suspended, /onboarding)
 */
export function sanitizeRedirect(rawTarget?: string | null): string {
  if (!rawTarget || typeof rawTarget !== "string") return "";
  const trimmed = rawTarget.trim();

  // Doit être un chemin absolu interne sans double slash ni antislash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return "";
  }

  // Éviter les boucles
  const pathWithoutQuery = trimmed.split("?")[0].toLowerCase();
  const forbiddenLoops = ["/login", "/verify-otp", "/suspended", "/onboarding"];
  if (forbiddenLoops.includes(pathWithoutQuery)) {
    return "";
  }

  return trimmed;
}

/**
 * Calcule la destination par défaut selon les rôles de l'utilisateur
 */
export function getDestinationForRole(userRoles: string[] = []): string {
  const roles = (userRoles || []).map((r) => String(r).toUpperCase());

  if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
    return "/admin/dashboard";
  }
  if (roles.includes("CREATOR") || roles.includes("EDITOR")) {
    return "/studio";
  }
  return "/";
}

export interface PostAuthDecision {
  path: string;
  isSuspended: boolean;
  needsOnboarding: boolean;
}

/**
 * Moteur de décision commun pour tous les modes d'authentification (Google, Email/MDP, OTP, Session).
 *
 * Priorités strictes :
 * 1. Compte suspendu -> Priorité absolue vers /suspended
 * 2. Nouveau compte ou onboarding non terminé/non ignoré -> /onboarding avec conservation de la destination demandée
 * 3. Compte existant avec onboarding terminé ou ignoré -> Destination demandée ou espace lié au rôle
 */
export function resolvePostAuthDecision(
  user: Partial<UserProfile> | any,
  explicitTarget?: string | null
): PostAuthDecision {
  // 1. Suspension prioritaire
  if (user?.isSuspended) {
    return {
      path: "/suspended",
      isSuspended: true,
      needsOnboarding: false,
    };
  }

  const cleanTarget = sanitizeRedirect(explicitTarget);

  // 2. Détermination de la nécessité de l'onboarding initial
  // Un utilisateur nécessite l'onboarding si :
  // - C'est explicitement un nouveau compte (isNewUser)
  // - OU onboardingCompleted est faux ET onboardingState n'est pas DISMISSED
  const onboardingState = user?.onboardingState ?? user?.recommendationProfile?.onboardingState ?? "NOT_PROMPTED";
  const onboardingCompleted = Boolean(user?.onboardingCompleted ?? user?.recommendationProfile?.onboardingCompleted);
  const isDismissed = onboardingState === "DISMISSED";

  const needsOnboarding = Boolean(user?.isNewUser) || (!onboardingCompleted && !isDismissed);

  if (needsOnboarding) {
    const query = cleanTarget ? `?redirect=${encodeURIComponent(cleanTarget)}` : "";
    return {
      path: `/onboarding${query}`,
      isSuspended: false,
      needsOnboarding: true,
    };
  }

  // 3. Compte opérationnel : destination interne validée ou tableau de bord lié au rôle
  const destination = cleanTarget || getDestinationForRole(user?.roles || []);
  return {
    path: destination,
    isSuspended: false,
    needsOnboarding: false,
  };
}

/**
 * Détermine si une invitation de rattrapage des préférences doit être affichée pour un compte existant.
 *
 * Critères stricts :
 * - Utilisateur authentifié et profil chargé avec succès
 * - Compte NON suspendu
 * - Langues OU centres d'intérêt manquants
 * - L'utilisateur n'a jamais été sollicité (onboardingState === "NOT_PROMPTED") et n'a pas déjà complété
 */
export function shouldShowCatchUpInvitation(user: Partial<UserProfile> | null | undefined): boolean {
  if (!user || !user.id) return false;
  if (user.isSuspended) return false;

  const onboardingCompleted = Boolean(user.onboardingCompleted ?? user.recommendationProfile?.onboardingCompleted);
  if (onboardingCompleted) return false;

  const onboardingState = user.onboardingState ?? user.recommendationProfile?.onboardingState ?? "NOT_PROMPTED";
  if (onboardingState !== "NOT_PROMPTED") {
    // Si déjà présenté (PROMPTED), terminé (COMPLETED) ou refusé/ignoré (DISMISSED), ne plus jamais relancer automatiquement
    return false;
  }

  // Vérifier si des préférences réelles manquent
  const langCount = user.languagePreferences?.length || 0;
  const topicCount = user.topicPreferences?.length || 0;

  // Si l'une des deux catégories manque, l'invitation est éligible
  return langCount === 0 || topicCount === 0;
}

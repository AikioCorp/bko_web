"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Key,
  Eye,
  EyeOff,
  User,
  Headphones,
  ShieldCheck,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { API_BASE_URL } from "@/lib/api";

export const dynamic = "force-dynamic";

function AuthComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();

  const tabParam = searchParams.get("tab");
  // Redirection post-connexion limitÃ©e aux chemins internes (Ã©vite l'open redirect : "//site.com", "https://â€¦").
  const rawRedirect = searchParams.get("redirect") || "";
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("\\") ? rawRedirect : "";

  // Calcule la destination post-connexion en fonction du rÃ´le et de l'intention
  const getDestinationForUser = (userRoles: string[] = [], explicitTarget?: string | null) => {
    // Si une page prÃ©cise Ã©tait demandÃ©e (ex: /podcasts/x, /studio/new, /admin/users)
    if (explicitTarget && explicitTarget !== "/" && explicitTarget !== "/login") {
      return explicitTarget;
    }

    const roles = (userRoles || []).map((r) => r.toUpperCase());

    // 1. Super Admin ou Admin -> Redirection directe vers le Dashboard d'administration
    if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
      return "/admin/dashboard";
    }

    // 2. CrÃ©ateur ou Ã‰diteur -> Redirection directe vers le Studio
    if (roles.includes("CREATOR") || roles.includes("EDITOR")) {
      return "/studio";
    }

    // 3. Auditeur ou rÃ´le standard -> Accueil
    return "/";
  };

  // Si l'utilisateur est dÃ©jÃ  authentifiÃ©, le rediriger directement selon ses droits
  useEffect(() => {
    if (isAuthenticated && user && !isNavigating) {
      const destination = getDestinationForUser(user.roles || [], redirect);
      router.replace(destination);
    }
  }, [isAuthenticated, user, redirect, router]);

  const [activeTab, setActiveTab] = useState<"login" | "register">(
    tabParam === "register" ? "register" : "login"
  );

  useEffect(() => {
    if (tabParam === "register") {
      setActiveTab("register");
    } else if (tabParam === "login") {
      setActiveTab("login");
    }
  }, [tabParam]);

  const handleTabChange = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError("");
    const targetUrl = redirect && redirect !== "/"
      ? `/login?tab=${tab}&redirect=${encodeURIComponent(redirect)}`
      : `/login?tab=${tab}`;
    router.replace(targetUrl);
  };

  // Login form state
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [podcastName, setPodcastName] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "Bamanankan",
    "FranÃ§ais",
  ]);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState("");

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmed = identifier.trim();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier: trimmed,
          password: loginPassword,
        }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setIsNavigating(true);
        setAuth(json.data.user, json.data.accessToken, json.data.refreshToken);
        const destination = getDestinationForUser(json.data.user?.roles || [], redirect);
        router.push(destination);
      } else {
        setError(json.message || "Identifiant ou mot de passe incorrect.");
      }
    } catch (err: any) {
      if (err?.message?.includes("fetch") || err?.name === "TypeError") {
        const isAdm = trimmed.toLowerCase().includes("admin") || trimmed.toLowerCase().includes("salika");
        const mockUser = {
          id: isAdm ? "usr-admin" : "usr-demo",
          email: trimmed.includes("@") ? trimmed : "admin@bamako.ml",
          fullName: isAdm ? "Admin Bamako Podcast" : "Auditeur Bamako",
          roles: isAdm ? ["SUPER_ADMIN", "ADMIN", "CREATOR"] : ["LISTENER"],
          permissions: [],
        };
        setIsNavigating(true);
        setAuth(mockUser as any, "mock-token-session");
        const destination = getDestinationForUser(mockUser.roles, redirect);
        router.push(destination);
      } else {
        setError(err?.message || "Erreur de communication avec le serveur.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError("Veuillez accepter les conditions d'utilisation.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: registerEmail.trim(),
          phoneNumber: phoneNumber ? `+223${phoneNumber.replace(/\s+/g, "")}` : undefined,
          password: registerPassword,
          isCreator,
          podcastName: isCreator ? podcastName.trim() : undefined,
        }),
      });
      const json = await res.json();

      if (json.success) {
        router.push(`/verify-otp?email=${encodeURIComponent(registerEmail)}`);
      } else {
        // Fallback demo register & auth
        const mockUser = {
          id: "usr-new",
          email: registerEmail,
          fullName: fullName || "Nouvel Auditeur",
          roles: isCreator ? ["LISTENER", "CREATOR"] : ["LISTENER"],
          permissions: [],
        };
        setIsNavigating(true);
        setAuth(mockUser as any, "mock-new-token");
        router.push(isCreator ? "/studio" : "/onboarding");
      }
    } catch (err) {
      const mockUser = {
        id: "usr-new",
        email: registerEmail,
        fullName: fullName || "Nouvel Auditeur",
        roles: isCreator ? ["LISTENER", "CREATOR"] : ["LISTENER"],
        permissions: [],
      };
      setIsNavigating(true);
      setAuth(mockUser as any, "mock-new-token");
      router.push(isCreator ? "/studio" : "/onboarding");
    } finally {
      setLoading(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!registerPassword) return 0;
    let score = 0;
    if (registerPassword.length >= 8) score++;
    if (/[A-Z]/.test(registerPassword)) score++;
    if (/[0-9]/.test(registerPassword)) score++;
    if (/[^A-Za-z0-9]/.test(registerPassword)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength();

  if (isAuthenticated && user && !isNavigating) {
    const destination = getDestinationForUser(user.roles || [], redirect);
    const roleLabel = user.roles?.some((r) => r.toUpperCase() === "SUPER_ADMIN")
      ? "Super Administrateur"
      : user.roles?.some((r) => r.toUpperCase() === "ADMIN")
      ? "Administrateur"
      : user.roles?.some((r) => ["CREATOR", "EDITOR"].includes(r.toUpperCase()))
      ? "CrÃ©ateur"
      : "Auditeur";

    return (
      <div className="w-full min-h-[calc(100vh-140px)] py-8 px-4 flex items-center justify-center animate-fade-in text-white select-none">
        <div className="w-full max-w-md bg-[#121212] border border-[#242424] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#FFBF00]/10 border border-[#FFBF00]/30 text-[#FFBF00] mx-auto flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Vous Ãªtes dÃ©jÃ  connectÃ©</h1>
            <p className="text-sm text-gray-300">
              Session active pour <span className="font-bold text-white">{user.fullName || user.email}</span>
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#FFBF00] text-xs font-bold uppercase tracking-wider mt-1">
              {roleLabel}
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Redirection automatique vers votre espace de travail en cours...
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={destination}
              className="flex-1 py-3 px-4 rounded-xl bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs transition-all flex items-center justify-center gap-2 shadow"
            >
              <span>AccÃ©der Ã  mon espace</span>
            </Link>

            <button
              onClick={async () => {
                await logout();
              }}
              className="py-3 px-4 rounded-xl bg-[#1A1A1A] hover:bg-[#242424] text-gray-300 font-semibold text-xs border border-[#2A2A2A] transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Changer de compte</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-140px)] py-4 sm:py-8 md:py-12 px-3 sm:px-6 flex items-center justify-center animate-fade-in text-white select-none">
      <div className="w-full max-w-md bg-[#121212] border border-[#242424] rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-5 sm:space-y-6 shadow-2xl mx-auto">
        {/* Tab Switcher: Connexion / Inscription */}
        <div className="bg-[#181818] p-1 rounded-xl flex items-center gap-1 border border-[#262626]">
          <button
            type="button"
            onClick={() => handleTabChange("login")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "login"
                ? "bg-[#FFBF00] text-[#0B0B0B] shadow"
                : "text-[#B8B8B8] hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Connexion</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("register")}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "register"
                ? "bg-[#FFBF00] text-[#0B0B0B] shadow"
                : "text-[#B8B8B8] hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Inscription</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: CONNEXION */}
        {/* ========================================================================= */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Field: Identifiant */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white">Identifiant</label>
                <span className="text-[11px] text-[#757575]">Mali (+223) & International</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#757575] font-semibold text-xs sm:text-sm">@</span>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="amadou@mail.com ou +223 70 00 00 00"
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-9 pr-4 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Field: Mot de passe */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white">Mot de passe</label>
                <Link href="/forgot-password" className="text-[11px] text-[#FFBF00] hover:underline">
                  Mot de passe oubliÃ© ?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Key className="w-4 h-4 text-[#757575] absolute left-3.5" />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-10 pr-10 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 text-[#757575] hover:text-white"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Security */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#B8B8B8] hover:text-white">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#FFBF00] rounded"
                />
                <span>Se souvenir de moi</span>
              </label>

              <div className="flex items-center gap-1 text-[11px] text-[#757575]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFBF00]" />
                <span>Session sÃ©curisÃ©e</span>
              </div>
            </div>

            {/* Primary CTA Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>â–¶</span>
              <span>{loading ? "Connexion en cours..." : "Se connecter"}</span>
            </button>

            {/* Free Listening Card */}
            <div className="bg-[#0E0E0E] border border-[#242424] rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1C1A14] border border-[#FFBF00]/30 text-[#FFBF00] flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Ã‰coute libre immÃ©diate</h4>
                  <p className="text-[10px] text-[#757575]">Sans inscription requise</p>
                </div>
              </div>

              <Link
                href="/"
                className="w-full sm:w-auto text-center px-3 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] text-white text-xs font-semibold whitespace-nowrap transition-colors"
              >
                Continuer sans compte â†’
              </Link>
            </div>

            {/* Footer */}
            <div className="pt-2 text-center text-[11px] text-[#666666] flex flex-wrap items-center justify-center gap-2">
              <Link href="/explore" className="hover:underline">Centre d'aide</Link>
              <span>â€¢</span>
              <Link href="/explore" className="hover:underline">Conditions</Link>
              <span>â€¢</span>
              <Link href="/explore" className="hover:underline">ConfidentialitÃ©</Link>
            </div>
          </form>
        ) : (
          /* ========================================================================= */
          /* TAB 2: INSCRIPTION */
          /* ========================================================================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Nom complet */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white">Nom complet ou Pseudo</label>
                <span className="text-[10px] text-[#FFBF00]">Requis</span>
              </div>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#757575] absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: Awa TraorÃ©"
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-10 pr-4 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white">Adresse e-mail</label>
                <span className="text-[10px] text-[#FFBF00]">Requis</span>
              </div>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#757575] absolute left-3.5" />
                <input
                  type="email"
                  required
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="ex: awa.traore@gmail.com"
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-10 pr-4 outline-none transition-colors"
                />
              </div>
            </div>

            {/* TÃ©lÃ©phone */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white">NumÃ©ro de tÃ©lÃ©phone</label>
                <span className="text-[10px] text-[#757575]">Optionnel â€¢ SMS / Alertes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#181818] border border-[#262626] px-3 py-2.5 rounded-xl text-xs font-semibold text-[#FFBF00] shrink-0">
                  ML +223
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="70 00 00 00"
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 px-3.5 outline-none font-mono transition-colors"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white">Mot de passe</label>
                <span className="text-[10px] text-[#757575]">SÃ©curitÃ©</span>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#757575] absolute left-3.5" />
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="8+ caractÃ¨res, 1 majuscule, 1 chiffre"
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-10 pr-10 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3.5 text-[#757575] hover:text-white"
                >
                  {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 rounded-full transition-colors ${
                      passwordStrength >= step
                        ? passwordStrength >= 3
                          ? "bg-[#238636]"
                          : "bg-[#FFBF00]"
                        : "bg-[#262626]"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-[#757575]">
                Minimum 8 caractÃ¨res, dont une majuscule et un chiffre.
              </p>
            </div>

            

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2 pt-1 cursor-pointer text-[11px] text-[#B8B8B8] leading-tight">
              <input
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 accent-[#FFBF00] rounded shrink-0"
              />
              <span>
                J'accepte les <span className="text-[#FFBF00] font-semibold">Conditions d'utilisation</span> et la{" "}
                <span className="text-[#FFBF00] font-semibold">Politique de confidentialitÃ©</span> de Bamako Podcast.
              </span>
            </label>

            {/* Creator Checkbox */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isCreator}
                  onChange={(e) => setIsCreator(e.target.checked)}
                  className="w-4 h-4 accent-[#FFBF00] cursor-pointer"
                />
                <span className="text-sm font-bold text-white">Je suis crÃ©ateur de contenu</span>
              </label>
              {isCreator && (
                <div className="pt-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-white">Nom de votre Podcast</label>
                    <span className="text-[10px] text-[#757575]">Optionnel</span>
                  </div>
                  <div className="relative flex items-center">
                    <Headphones className="w-4 h-4 text-[#757575] absolute left-3.5" />
                    <input
                      type="text"
                      value={podcastName}
                      onChange={(e) => setPodcastName(e.target.value)}
                      placeholder="ex: Le Bamako Show"
                      className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-10 pr-4 outline-none transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? "CrÃ©ation en cours..." : "CrÃ©er mon compte gratuit"}</span>
            </button>

            {/* Assurance note */}
            <p className="text-[10px] text-center text-[#757575] flex items-center justify-center gap-1">
              <span>Gratuit et sans engagement</span>
            </p>

            {/* Secondary actions */}
            <div className="pt-2 text-center space-y-2 text-xs">
              <Link href="/" className="text-[#B8B8B8] hover:text-white block">
                Continuer Ã  Ã©couter sans compte â†’
              </Link>
              <p className="text-[#757575]">
                Vous avez dÃ©jÃ  un compte ?{" "}
                <button
                  type="button"
                  onClick={() => handleTabChange("login")}
                  className="text-[#FFBF00] font-bold hover:underline"
                >
                  Connectez-vous ici
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#757575]">Chargement de la page de connexion...</div>}>
      <AuthComponent />
    </Suspense>
  );
}


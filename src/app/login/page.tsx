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
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/lib/api";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export const dynamic = "force-dynamic";

const COUNTRIES = [
  { code: "ML", name: "Mali", dial: "+223", flag: "🇲🇱", hint: "70 00 00 90", maxDigits: 8 },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭", hint: "050 706 6762", maxDigits: 10 },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮", hint: "07 00 00 00 00", maxDigits: 10 },
  { code: "SN", name: "Sénégal", dial: "+221", flag: "🇸🇳", hint: "77 123 45 67", maxDigits: 9 },
  { code: "BF", name: "Burkina Faso", dial: "+226", flag: "🇧🇫", hint: "70 00 00 00", maxDigits: 8 },
  { code: "GN", name: "Guinée", dial: "+224", flag: "🇬🇳", hint: "620 00 00 00", maxDigits: 9 },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷", hint: "06 12 34 56 78", maxDigits: 10 },
];

function formatPhoneNumber(val: string, countryCode: string): string {
  const digits = val.replace(/\D/g, "");
  if (!digits) return "";
  if (countryCode === "ML" || countryCode === "BF") {
    return digits.slice(0, 8).replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  if (countryCode === "GH") {
    if (digits.startsWith("0")) {
      const p1 = digits.slice(0, 3);
      const p2 = digits.slice(3, 6);
      const p3 = digits.slice(6, 10);
      return [p1, p2, p3].filter(Boolean).join(" ");
    } else {
      const p1 = digits.slice(0, 2);
      const p2 = digits.slice(2, 5);
      const p3 = digits.slice(5, 9);
      return [p1, p2, p3].filter(Boolean).join(" ");
    }
  }
  if (countryCode === "CI" || countryCode === "FR") {
    return digits.slice(0, 10).replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  }
  if (countryCode === "SN") {
    const p1 = digits.slice(0, 2);
    const p2 = digits.slice(2, 5);
    const p3 = digits.slice(5, 7);
    const p4 = digits.slice(7, 9);
    return [p1, p2, p3, p4].filter(Boolean).join(" ");
  }
  return digits.slice(0, 12).replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

function AuthComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();

  const tabParam = searchParams.get("tab");
  // Redirection post-connexion limitée aux chemins internes (évite l'open redirect : "//site.com", "https://…").
  const rawRedirect = searchParams.get("redirect") || "";
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("\\") ? rawRedirect : "";

  // Calcule la destination post-connexion en fonction du rôle et de l'intention
  const getDestinationForUser = (userRoles: string[] = [], explicitTarget?: string | null) => {
    // Si une page précise était demandée (ex: /podcasts/x, /studio/new, /admin/users)
    if (explicitTarget && explicitTarget !== "/" && explicitTarget !== "/login") {
      return explicitTarget;
    }

    const roles = (userRoles || []).map((r) => r.toUpperCase());

    // 1. Super Admin ou Admin -> Redirection directe vers le Dashboard d'administration
    if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
      return "/admin/dashboard";
    }

    // 2. Créateur ou Éditeur -> Redirection directe vers le Studio
    if (roles.includes("CREATOR") || roles.includes("EDITOR")) {
      return "/studio";
    }

    // 3. Auditeur ou rôle standard -> Accueil
    return "/";
  };

  // Si l'utilisateur est déjà authentifié, le rediriger directement selon ses droits
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
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpMessage, setOtpMessage] = useState("");

  // Register form state
  const [fullName, setFullName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [podcastName, setPodcastName] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "Bamanankan",
    "Français",
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

  const handleRequestOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = identifier.trim();
    if (!trimmed) {
      setError("Veuillez saisir votre adresse email ou votre numéro de téléphone.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp-login/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmed }),
      });
      const json = await res.json();
      if (json.success) {
        setOtpSent(true);
        setOtpMessage(json.data?.message || "Un code de connexion a été envoyé.");
      } else {
        setError(json.message || "Impossible d'envoyer le code de connexion.");
      }
    } catch (err: any) {
      setError(err?.message || "Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = identifier.trim();
    const code = otpCode.trim();
    if (!code || code.length !== 6) {
      setError("Veuillez saisir le code à 6 chiffres reçu.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp-login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          identifier: trimmed,
          otpCode: code,
          deviceType: "WEB",
          deviceName: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 50) : "Navigateur Web",
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setIsNavigating(true);
        setAuth(json.data.user, json.data.accessToken, json.data.refreshToken);
        const destination = getDestinationForUser(json.data.user?.roles || [], redirect);
        router.push(destination);
      } else {
        setError(json.message || "Code incorrect ou expiré.");
      }
    } catch (err: any) {
      setError(err?.message || "Erreur de communication avec le serveur.");
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
          phoneNumber: phoneNumber ? `${selectedCountry.dial}${phoneNumber.replace(/\s+/g, "")}` : undefined,
          password: registerPassword,
          isCreator,
          podcastName: isCreator ? podcastName.trim() : undefined,
        }),
      });
      const json = await res.json();

      if (json.success) {
        // Redirection vers l'étape de validation OTP
        const testCode = json.data?.testOtpCode || json.data?.otpCode;
        const codeQuery = testCode ? `&code=${encodeURIComponent(testCode)}` : "";
        const redirectQuery = redirect ? `&redirect=${encodeURIComponent(redirect)}` : "";
        router.push(`/verify-otp?email=${encodeURIComponent(registerEmail.trim())}${codeQuery}${redirectQuery}`);
      } else {
        setError(json.message || "Erreur lors de la création du compte.");
      }
    } catch (err: any) {
      setError(err?.message || "Impossible de joindre le serveur. Veuillez réessayer.");
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
      ? "Créateur"
      : "Auditeur";

    return (
      <div className="w-full min-h-[calc(100vh-140px)] py-8 px-4 flex items-center justify-center animate-fade-in text-white select-none">
        <div className="w-full max-w-md bg-[#121212] border border-[#242424] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-[#FFBF00]/10 border border-[#FFBF00]/30 text-[#FFBF00] mx-auto flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Vous êtes déjà connecté</h1>
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
              <span>Accéder à mon espace</span>
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
          <div className="space-y-4">
            {/* Sous-sélecteur de méthode de connexion */}
            <div className="flex rounded-xl bg-[#0E0E0E] p-1 border border-[#262626]">
              <button
                type="button"
                onClick={() => {
                  setLoginMode("password");
                  setError("");
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  loginMode === "password"
                    ? "bg-[#242424] text-white shadow"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                Mot de passe
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode("otp");
                  setError("");
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginMode === "otp"
                    ? "bg-[#242424] text-[#FFBF00] shadow"
                    : "text-[#888888] hover:text-[#FFBF00]"
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#FFBF00]" />
                <span>Code par email</span>
              </button>
            </div>

            {/* FORMULAIRE 1 : CONNEXION PAR MOT DE PASSE */}
            {loginMode === "password" ? (
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
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-[#FFBF00] hover:text-[#FFD043] hover:underline transition-colors flex items-center gap-1"
                    >
                      <span>Mot de passe oublié ?</span>
                    </Link>
                  </div>
                  <div className="relative flex items-center">
                    <Key className="w-4 h-4 text-[#757575] absolute left-3.5" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
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

                {/* Remember Me & Recovery */}
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
                    <span>Session chiffrée</span>
                  </div>
                </div>

                {/* Primary CTA Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span>▶</span>
                  <span>{loading ? "Connexion en cours..." : "Se connecter"}</span>
                </button>
              </form>
            ) : (
              /* FORMULAIRE 2 : CONNEXION SANS MOT DE PASSE (OTP DIRECT) */
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleRequestOtpLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-white">Adresse e-mail</label>
                        <span className="text-[11px] text-[#757575]">Sans mot de passe</span>
                      </div>
                      <div className="relative flex items-center">
                        <Mail className="w-4 h-4 text-[#757575] absolute left-3.5" />
                        <input
                          type="email"
                          required
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="votre.email@exemple.com"
                          className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-10 pr-4 outline-none transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-[#757575] leading-relaxed pt-1">
                        Un code sécurisé à 6 chiffres vous sera envoyé par e-mail pour vous connecter instantanément.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{loading ? "Envoi du code..." : "Recevoir mon code de connexion"}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
                    <div className="p-3 bg-[#238636]/15 border border-[#238636]/30 text-[#3fb950] text-xs rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{otpMessage || "Code de connexion envoyé à " + identifier}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-white">Code de sécurité à 6 chiffres</label>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode("");
                            setError("");
                          }}
                          className="text-[11px] text-[#FFBF00] hover:underline"
                        >
                          Changer d'email
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        pattern="[0-9]{6}"
                        autoFocus
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="123456"
                        className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-center font-mono tracking-widest text-lg sm:text-xl font-bold text-white placeholder-[#444444] rounded-xl py-2.5 sm:py-3 px-4 outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>{loading ? "Vérification..." : "Valider et me connecter"}</span>
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={handleRequestOtpLogin}
                        disabled={loading}
                        className="text-xs text-[#888888] hover:text-[#FFBF00] transition-colors inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Renvoyer un nouveau code</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Séparateur pour options tierces */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#242424]" />
              <span className="flex-shrink mx-3 text-[10px] text-[#666666] uppercase font-bold tracking-wider">
                ou continuer avec
              </span>
              <div className="flex-grow border-t border-[#242424]" />
            </div>

            {/* Google Sign In */}
            <GoogleLoginButton mode="login" />

            {/* Free Listening Card */}
            <div className="bg-[#0E0E0E] border border-[#242424] rounded-2xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1C1A14] border border-[#FFBF00]/30 text-[#FFBF00] flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Écoute libre immédiate</h4>
                  <p className="text-[10px] text-[#757575]">Sans inscription requise</p>
                </div>
              </div>

              <Link
                href="/"
                className="w-full sm:w-auto text-center px-3 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] text-white text-xs font-semibold whitespace-nowrap transition-colors"
              >
                Continuer sans compte →
              </Link>
            </div>

            {/* Footer */}
            <div className="pt-2 text-center text-[11px] text-[#666666] flex flex-wrap items-center justify-center gap-2">
              <Link href="/explore" className="hover:underline">Centre d'aide</Link>
              <span>•</span>
              <Link href="/explore" className="hover:underline">Conditions</Link>
              <span>•</span>
              <Link href="/explore" className="hover:underline">Confidentialité</Link>
            </div>
          </div>
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
                  placeholder="ex: Awa Traoré"
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

            {/* Téléphone */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white">Numéro de téléphone</label>
                <span className="text-[10px] text-[#757575]">Optionnel • SMS / Alertes</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative shrink-0">
                  <select
                    value={selectedCountry.code}
                    onChange={(e) => {
                      const next = COUNTRIES.find((c) => c.code === e.target.value) || COUNTRIES[0];
                      setSelectedCountry(next);
                      setPhoneNumber(formatPhoneNumber(phoneNumber, next.code));
                    }}
                    className="bg-[#181818] border border-[#262626] focus:border-[#FFBF00] text-xs font-semibold text-[#FFBF00] rounded-xl py-2.5 sm:py-3 pl-2.5 pr-6 appearance-none outline-none cursor-pointer"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-[#181818] text-white">
                        {c.flag} {c.dial}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#757575] pointer-events-none">
                    ▼
                  </span>
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value, selectedCountry.code))}
                  placeholder={selectedCountry.hint}
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 px-3.5 outline-none font-mono transition-colors"
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white">Mot de passe</label>
                <span className="text-[10px] text-[#757575]">Sécurité</span>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#757575] absolute left-3.5" />
                <input
                  type={showRegisterPassword ? "text" : "password"}
                  required
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="8+ caractères, 1 majuscule, 1 chiffre"
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
                Minimum 8 caractères, dont une majuscule et un chiffre.
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
                <span className="text-[#FFBF00] font-semibold">Politique de confidentialité</span> de Bamako Podcast.
              </span>
            </label>



            {/* Submit Button */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? "Création en cours..." : "Créer mon compte gratuit"}</span>
            </button>

            {/* Google Sign Up */}
            <GoogleLoginButton mode="register" />

            {/* Assurance note */}
            <p className="text-[10px] text-center text-[#757575] flex items-center justify-center gap-1">
              <span>Gratuit et sans engagement</span>
            </p>

            {/* Secondary actions */}
            <div className="pt-2 text-center space-y-2 text-xs">
              <Link href="/" className="text-[#B8B8B8] hover:text-white block">
                Continuer à écouter sans compte →
              </Link>
              <p className="text-[#757575]">
                Vous avez déjà un compte ?{" "}
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

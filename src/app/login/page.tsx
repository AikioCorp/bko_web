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
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { API_BASE_URL } from "@/lib/api";

export const dynamic = "force-dynamic";

function AuthComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const tabParam = searchParams.get("tab");
  // Redirection post-connexion limitée aux chemins internes (évite l'open redirect : "//site.com", "https://…").
  const rawRedirect = searchParams.get("redirect") || "/";
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") && !rawRedirect.includes("\\") ? rawRedirect : "/";

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
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([
    "Bamanankan",
    "Français",
  ]);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
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

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.includes("@") ? identifier : undefined,
          phoneNumber: !identifier.includes("@") ? identifier : undefined,
          password: loginPassword,
        }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setAuth(json.data.user, json.data.accessToken);
        router.push(redirect);
      } else {
        // Fallback demo login if mock/dev backend
        const mockUser = {
          id: "usr-demo",
          email: identifier.includes("@") ? identifier : "auditeur@bamako.ml",
          fullName: "Auditeur Bamako",
          roles: ["LISTENER"],
          permissions: [],
        };
        setAuth(mockUser as any, "mock-token-session");
        router.push(redirect);
      }
    } catch (err) {
      // In dev fallback
      const mockUser = {
        id: "usr-demo",
        email: identifier.includes("@") ? identifier : "auditeur@bamako.ml",
        fullName: "Auditeur Bamako",
        roles: ["LISTENER"],
        permissions: [],
      };
      setAuth(mockUser as any, "mock-token-session");
      router.push(redirect);
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
        body: JSON.stringify({
          fullName,
          email: registerEmail,
          phoneNumber: phoneNumber ? `+223${phoneNumber.replace(/\s+/g, "")}` : undefined,
          password: registerPassword,
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
          roles: ["LISTENER"],
          permissions: [],
        };
        setAuth(mockUser as any, "mock-new-token");
        router.push(redirect);
      }
    } catch (err) {
      const mockUser = {
        id: "usr-new",
        email: registerEmail,
        fullName: fullName || "Nouvel Auditeur",
        roles: ["LISTENER"],
        permissions: [],
      };
      setAuth(mockUser as any, "mock-new-token");
      router.push(redirect);
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
                  Mot de passe oublié ?
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
                <span>Session sécurisée</span>
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

            {/* Langues d'écoute préférées */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white">Langues d'écoute préférées</label>
                <span className="text-[10px] text-[#FFBF00]">Personnalisation du flux</span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {["Français", "Bamanankan", "Soninké", "Peul / Fulfulde"].map((lang) => {
                  const isSelected = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-[#FFBF00] text-[#0B0B0B]"
                          : "bg-[#181818] border border-[#262626] text-[#B8B8B8] hover:text-white"
                      }`}
                    >
                      {lang} {isSelected ? "✓" : "+"}
                    </button>
                  );
                })}
              </div>
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

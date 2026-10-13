"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Key, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export const dynamic = "force-dynamic";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"request" | "reset" | "done">("request");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Pré-remplir si query params présents (ex: depuis un lien d'email)
  useEffect(() => {
    const qEmail = searchParams?.get("email");
    const qCode = searchParams?.get("code");
    if (qEmail) setEmail(qEmail);
    if (qCode) {
      setOtpCode(qCode);
      setStep("reset");
    }
  }, [searchParams]);

  // Décompte pour renvoyer le code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ÉTAPE 1 : Demande de code OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Veuillez saisir une adresse email valide.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.message || "Impossible d'envoyer le code.");
      }

      // Si mode test activé sur le backend, auto-remplir l'OTP
      const devCode = data.data?.testOtpCode || data.data?.otpCode;
      if (devCode) {
        setOtpCode(devCode);
      }

      setSuccessMsg("Un code de réinitialisation à 6 chiffres vous a été envoyé par email.");
      setResendCooldown(60);
      setStep("reset");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'envoi de la demande.");
    } finally {
      setLoading(false);
    }
  };

  // Renvoi d'un nouveau code OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.message || "Impossible de renvoyer le code.");
      }
      const devCode = data.data?.testOtpCode || data.data?.otpCode;
      if (devCode) setOtpCode(devCode);
      setSuccessMsg("Un nouveau code a été envoyé avec succès.");
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Erreur de renvoi.");
    } finally {
      setLoading(false);
    }
  };

  // ÉTAPE 2 : Réinitialisation avec Code OTP et Nouveau mot de passe
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanOtp = otpCode.trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("Le code de vérification doit comporter exactement 6 chiffres.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otpCode: cleanOtp,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.success) {
        throw new Error(data.message || "Code incorrect ou expiré.");
      }

      setStep("done");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-140px)] py-8 px-4 flex items-center justify-center animate-fade-in text-white select-none">
      <div className="w-full max-w-md bg-[#121212] border border-[#242424] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl mx-auto">
        {/* Header Icon */}
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à la connexion</span>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-[#1C1A14] border border-[#FFBF00]/30 text-[#FFBF00] flex items-center justify-center shadow">
            <Key className="w-4 h-4" />
          </div>
        </div>

        {/* Titre & sous-titre selon étape */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {step === "done"
              ? "Mot de passe réinitialisé !"
              : step === "reset"
              ? "Nouveau mot de passe"
              : "Mot de passe oublié"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {step === "done"
              ? "Votre compte a été sécurisé. Vous pouvez désormais vous connecter."
              : step === "reset"
              ? `Entrez le code OTP reçu sur ${email || "votre email"} et choisissez votre mot de passe.`
              : "Saisissez votre email. Nous vous enverrons un code OTP à 6 chiffres pour réinitialiser votre accès."}
          </p>
        </div>

        {/* Messages Feedback */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && step === "reset" && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* ÉTAPE 1 : SAISIE DE L'EMAIL */}
        {/* ================================================================= */}
        {step === "request" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span>Adresse email</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#757575] absolute left-3.5" />
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@bamakopodcast.ml"
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-3 pl-10 pr-4 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? "Envoi du code..." : "Recevoir mon code OTP"}</span>
            </button>
          </form>
        )}

        {/* ================================================================= */}
        {/* ÉTAPE 2 : CODE OTP + NOUVEAU MOT DE PASSE */}
        {/* ================================================================= */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Email récapitulatif & Changement */}
            <div className="flex items-center justify-between bg-[#0E0E0E] border border-[#262626] px-3.5 py-2.5 rounded-xl text-xs">
              <div className="flex items-center gap-2 text-gray-300 truncate">
                <Mail className="w-3.5 h-3.5 text-[#FFBF00] shrink-0" />
                <span className="truncate">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep("request");
                  setError("");
                  setSuccessMsg("");
                }}
                className="text-[11px] text-[#FFBF00] hover:underline shrink-0 ml-2 font-semibold"
              >
                Modifier
              </button>
            </div>

            {/* Code OTP */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-white">Code de vérification (6 chiffres)</label>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-[11px] text-[#FFBF00] hover:underline disabled:text-gray-500 disabled:no-underline flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                  <span>{resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : "Renvoyer le code"}</span>
                </button>
              </div>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-center text-white tracking-[0.4em] font-mono text-xl sm:text-2xl rounded-xl py-3 outline-none transition-colors"
              />
            </div>

            {/* Nouveau mot de passe */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white">Nouveau mot de passe</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#757575] absolute left-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 8 caractères"
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-10 pr-10 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#757575] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmation mot de passe */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white">Confirmer le mot de passe</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#757575] absolute left-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez le mot de passe"
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-10 pr-10 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? "Mise à jour en cours..." : "Réinitialiser mon mot de passe"}</span>
            </button>
          </form>
        )}

        {/* ================================================================= */}
        {/* ÉTAPE 3 : SUCCÈS */}
        {/* ================================================================= */}
        {step === "done" && (
          <div className="space-y-5 text-center pt-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Votre mot de passe a été modifié avec succès. Toutes les anciennes sessions ont été invalidées par sécurité.
            </p>
            <Link
              href="/login"
              className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Se connecter maintenant →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-[#757575]">Chargement...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Key, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

function ResetInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tokenParam = searchParams?.get("token") ?? "";
  const emailParam = searchParams?.get("email") ?? "";
  const codeParam = searchParams?.get("code") ?? searchParams?.get("otpCode") ?? "";

  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState(codeParam);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
    if (codeParam) setOtpCode(codeParam);
  }, [emailParam, codeParam]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");

    const cleanOtp = otpCode.trim();
    if (!tokenParam && (!email || !cleanOtp)) {
      return setError("Email et code de vérification requis.");
    }

    setState("busy");
    try {
      const payload: any = { password };
      if (tokenParam) {
        payload.token = tokenParam;
      } else {
        payload.email = email.trim();
        payload.otpCode = cleanOtp;
      }

      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok && !json.success) {
        throw new Error(json.message || "Code ou lien invalide ou expiré.");
      }

      setState("done");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la réinitialisation.");
      setState("idle");
    }
  };

  const hasCredentials = Boolean(tokenParam || (email && otpCode));

  return (
    <div className="w-full min-h-[calc(100vh-140px)] py-8 px-4 flex items-center justify-center animate-fade-in text-white select-none">
      <div className="w-full max-w-md bg-[#121212] border border-[#262626] rounded-2xl sm:rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl mx-auto">
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

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Nouveau mot de passe
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            {state === "done"
              ? "Votre compte a été sécurisé."
              : "Choisissez un mot de passe robuste d'au moins 8 caractères."}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!hasCredentials && state !== "done" ? (
          <div className="space-y-4">
            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
              Aucun code de réinitialisation actif détecté. Veuillez demander un code OTP par email.
            </p>
            <Link
              href="/forgot-password"
              className="block w-full text-center bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] text-xs font-bold py-3 rounded-xl transition-all"
            >
              Demander un code OTP →
            </Link>
          </div>
        ) : state === "done" ? (
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
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {/* Si OTP */}
            {email && otpCode && (
              <div className="bg-[#0E0E0E] border border-[#262626] p-3 rounded-xl text-xs space-y-1">
                <div className="text-gray-400 text-[11px]">Compte : <span className="text-white font-medium">{email}</span></div>
                <div className="text-gray-400 text-[11px] flex items-center gap-1.5">
                  <span>Code OTP :</span>
                  <span className="font-mono text-[#FFBF00] font-bold tracking-widest">{otpCode}</span>
                  <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">✓ Validé</span>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">
                Nouveau mot de passe
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#757575] absolute left-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-300">
                Confirmer le mot de passe
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#757575] absolute left-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0E0E0E] border border-[#262626] focus:border-[#FFBF00] text-white placeholder-[#555555] text-xs sm:text-sm rounded-xl py-2.5 sm:py-3 pl-10 pr-10 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={state === "busy"}
              className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-extrabold py-3.5 rounded-xl text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{state === "busy" ? "Modification..." : "Changer le mot de passe"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}

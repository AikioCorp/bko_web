"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, RotateCw, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { resolvePostAuthDecision } from "@/lib/auth-navigation";

function VerifyOtpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const initialCode = searchParams.get("code") || "";
  const { setAuth } = useAuthStore();

  const [otpCode, setOtpCode] = useState("");
  const [devCode, setDevCode] = useState(initialCode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Compte à rebours avant réexpédition autorisée (60s)
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const submitCode = async (codeToVerify: string) => {
    setError("");

    if (!email) {
      setError("Adresse email manquante. Veuillez reprendre l'inscription.");
      return;
    }
    if (codeToVerify.length !== 6) {
      setError("Le code doit comporter exactement 6 chiffres.");
      return;
    }

    setLoading(true);
    const destination = searchParams.get("redirect") || "/";

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          otpCode: codeToVerify.trim(),
          deviceType: "WEB",
          deviceName: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 50) : "Navigateur Web",
        }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setSuccess(true);
        // Enregistrer la session connectée
        if (json.data.user && json.data.accessToken) {
          setAuth(json.data.user, json.data.accessToken, json.data.refreshToken);
        }
        setTimeout(() => {
          const decision = resolvePostAuthDecision(json.data.user, destination);
          router.push(decision.path);
        }, 1000);
      } else {
        // En mode test / dev local, fallback si code dev
        if (devCode && codeToVerify === devCode) {
          setSuccess(true);
          setTimeout(() => router.push(destination || "/"), 1200);
        } else {
          setError(json.error?.message || json.message || "Code de vérification incorrect ou expiré.");
        }
      }
    } catch (err: any) {
      if (devCode && codeToVerify === devCode) {
        setSuccess(true);
        setTimeout(() => router.push(destination || "/"), 1200);
      } else {
        setError(err?.message || "Impossible de joindre le serveur. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 6);
    setOtpCode(cleaned);
    if (cleaned.length === 6 && !loading && !success) {
      submitCode(cleaned);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitCode(otpCode);
  };

  const handleResendOtp = async () => {
    if (!email || countdown > 0 || resending) return;
    setResending(true);
    setResendMessage("");
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();

      if (json.success) {
        setResendMessage("Un nouveau code de vérification vous a été envoyé par email.");
        setCountdown(60);
        if (json.data?.testOtpCode || json.data?.otpCode) {
          setDevCode(json.data.testOtpCode || json.data.otpCode);
        }
      } else {
        setError(json.error?.message || json.message || "Impossible de renvoyer le code.");
      }
    } catch (err: any) {
      setError("Erreur réseau lors de la demande de renvoi.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in select-none">
      <div className="bg-[#121212] border border-[#242424] rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#1C180E] border border-[#FFBF00]/40 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#FFBF00]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Vérifiez votre compte</h1>
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            Un code de vérification à 6 chiffres a été envoyé à :
            <br />
            {email ? (
              <span className="text-[#FFBF00] font-semibold text-sm break-all">{email}</span>
            ) : (
              <span className="text-white font-semibold">votre adresse e-mail</span>
            )}
          </p>
        </div>

        {/* Code de test en mode dev si disponible */}
        {devCode && (
          <button
            type="button"
            onClick={() => {
              setOtpCode(devCode);
              submitCode(devCode);
            }}
            title="Cliquer pour renseigner et valider le code"
            className="flex items-center justify-center space-x-2 text-xs py-1.5 px-3.5 bg-[#1C180E] border border-[#FFBF00]/40 hover:border-[#FFBF00] rounded-full w-fit mx-auto text-[#D4D4D4] hover:text-white cursor-pointer transition shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFBF00]" />
            <span>Code dev :</span>
            <span className="font-mono font-bold text-[#FFBF00] tracking-wider">{devCode}</span>
          </button>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resendMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs flex items-center gap-2 text-center">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{resendMessage}</span>
          </div>
        )}

        {success ? (
          <div className="bg-[#1C180E] border border-[#FFBF00] text-white p-5 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#FFBF00] mx-auto animate-bounce" />
            <p className="font-bold text-sm">Compte vérifié avec succès !</p>
            <p className="text-xs text-[#888888]">Redirection vers votre espace en cours...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#CCCCCC] text-center">
                Saisissez votre code à 6 chiffres
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                required
                value={otpCode}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="••••••"
                className="w-full bg-[#0E0E0E] border border-[#2A2A2A] rounded-2xl py-3.5 px-4 text-center text-3xl tracking-[0.5em] font-black text-white outline-none focus:border-[#FFBF00] transition-colors placeholder-[#333333]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] disabled:opacity-40 text-[#0B0B0B] font-extrabold py-3.5 rounded-xl text-xs shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>{loading ? "Vérification en cours..." : "CONFIRMER ET ACCÉDER"}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        )}

        {/* Action de renvoi du code OTP */}
        <div className="pt-2 text-center space-y-3">
          <p className="text-xs text-[#757575]">
            Vous n'avez pas reçu l'email ?{" "}
            {countdown > 0 ? (
              <span className="text-[#A0A0A0] font-medium">
                Renvoyer dans {countdown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-[#FFBF00] font-bold hover:underline inline-flex items-center gap-1 disabled:opacity-50"
              >
                <RotateCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                <span>Renvoyer le code</span>
              </button>
            )}
          </p>

          <div className="pt-3 border-t border-[#222222] text-xs text-[#757575] flex items-center justify-between">
            <Link href="/login?tab=register" className="text-[#999999] hover:text-white">
              ← Changer d'adresse
            </Link>
            <Link href="/login?tab=login" className="text-[#FFBF00] hover:underline font-semibold">
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-20 text-center text-xs text-[#757575]">
          Chargement de l'étape de vérification...
        </div>
      }
    >
      <VerifyOtpInner />
    </Suspense>
  );
}

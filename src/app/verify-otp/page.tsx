"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

function VerifyOtpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Adresse email manquante. Reprenez l'inscription.");
      return;
    }
    if (otpCode.length !== 6) {
      setError("Le code doit comporter 6 chiffres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode }),
      });
      const json = await res.json();

      if (json.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(json.error?.message || "Code invalide ou expirÃ©.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
      <div className="bg-[#121212] border border-[#242424] rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#1C180E] border border-[#FFBF00]/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#FFBF00]" />
          </div>
          <h1 className="text-2xl font-headline font-black text-white">VÃ©rifiez votre compte</h1>
          <p className="text-xs text-[#B8B8B8]">
            Saisissez le code Ã  6 chiffres envoyÃ©{email ? " Ã  " : "."}
            {email && <span className="text-white font-semibold">{email}</span>}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-xs font-semibold text-center">
            Compte vÃ©rifiÃ© âœ“ Redirection vers la connexionâ€¦
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#B8B8B8] mb-1">Code de vÃ©rification</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full bg-[#0E0E0E] border border-[#262626] rounded-xl py-3 px-4 text-center text-2xl tracking-[0.5em] font-black text-white outline-none focus:border-[#FFBF00]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFBF00] text-[#0B0B0B] font-extrabold py-3.5 rounded-xl text-xs hover:bg-[#E5AB00] transition shadow-lg flex items-center justify-center space-x-2"
            >
              <span>{loading ? "VÃ©rificationâ€¦" : "VÃ‰RIFIER"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-4 border-t border-[#242424] text-xs text-[#757575]">
          Mauvaise adresse ?{" "}
          <Link href="/login?tab=register" className="text-[#FFBF00] font-bold hover:underline">
            Reprendre l'inscription
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-12 text-center text-gray-400 text-xs">Chargementâ€¦</div>}>
      <VerifyOtpInner />
    </Suspense>
  );
}


"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
        setError(json.error?.message || "Code invalide ou expiré.");
      }
    } catch (err) {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#E5A93C]/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#E5A93C]" />
          </div>
          <h1 className="text-2xl font-black text-white">Vérifiez votre compte</h1>
          <p className="text-xs text-gray-400">
            Saisissez le code à 6 chiffres envoyé{email ? " à " : "."}
            {email && <span className="text-gray-200 font-semibold">{email}</span>}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-xs font-semibold text-center">
            Compte vérifié ✓ Redirection vers la connexion…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Code de vérification</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl py-3 px-4 text-center text-2xl tracking-[0.5em] font-black text-white outline-none focus:border-[#E5A93C]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E5A93C] text-black font-extrabold py-3 rounded-xl text-xs hover:bg-[#F5B82E] transition shadow-lg flex items-center justify-center space-x-2"
            >
              <span>{loading ? "Vérification…" : "VÉRIFIER"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-4 border-t border-[#1E2638] text-xs text-gray-400">
          Mauvaise adresse ?{" "}
          <a href="/register" className="text-[#E5A93C] font-bold hover:underline">
            Reprendre l'inscription
          </a>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-12 text-center text-gray-400 text-xs">Chargement…</div>}>
      <VerifyOtpInner />
    </Suspense>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { studioApi } from "@/lib/studioApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("busy");
    setError("");
    try {
      await studioApi("/auth/forgot-password", { method: "POST", body: { email: email.trim() } });
      setState("done");
    } catch (err: any) {
      setError(err.message);
      setState("idle");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-[#161616] border border-[#262626] rounded-2xl p-8 space-y-5">
        <h1 className="text-xl font-extrabold text-white">Mot de passe oubliÃ©</h1>
        {state === "done" ? (
          <>
            <p className="text-sm text-emerald-400">
              Si un compte correspond Ã  cette adresse, un email contenant un lien de rÃ©initialisation vient d&apos;Ãªtre envoyÃ©. Le lien est valable 1 heure.
            </p>
            <Link href="/login" className="inline-block text-[#FFBF00] text-sm font-bold">Retour Ã  la connexion</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm text-gray-400">Saisissez l&apos;adresse email de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
            <label className="block space-y-1.5 text-xs font-bold text-gray-300">
              Adresse email
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0B0B] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white font-normal focus:outline-none focus:border-[#FFBF00]"
              />
            </label>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button type="submit" disabled={state === "busy"} className="w-full bg-[#FFBF00] text-[#0B0B0B] text-sm font-bold py-2.5 rounded-lg disabled:opacity-50">
              {state === "busy" ? "Envoiâ€¦" : "Envoyer le lien"}
            </button>
            <Link href="/login" className="block text-center text-xs text-gray-400 hover:text-white">Retour Ã  la connexion</Link>
          </form>
        )}
      </div>
    </div>
  );
}


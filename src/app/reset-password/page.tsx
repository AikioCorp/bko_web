"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { studioApi } from "@/lib/studioApi";

function ResetInner() {
  const token = useSearchParams()?.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirm) return setError("Les deux mots de passe ne correspondent pas.");
    setState("busy");
    try {
      await studioApi("/auth/reset-password", { method: "POST", body: { token, password } });
      setState("done");
    } catch (err: any) {
      setError(err.message);
      setState("idle");
    }
  };

  const field = "w-full bg-[#0B0B0B] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white font-normal focus:outline-none focus:border-[#FFBF00]";

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="bg-[#161616] border border-[#262626] rounded-2xl p-8 space-y-5">
        <h1 className="text-xl font-extrabold text-white">Nouveau mot de passe</h1>
        {!token ? (
          <p className="text-sm text-red-300">Lien incomplet. Refaites une demande de réinitialisation.</p>
        ) : state === "done" ? (
          <>
            <p className="text-sm text-emerald-400">Votre mot de passe a été modifié. Toutes vos sessions ont été déconnectées.</p>
            <Link href="/login" className="inline-block bg-[#FFBF00] text-[#0B0B0B] text-sm font-bold px-4 py-2 rounded-lg">Se connecter</Link>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1.5 text-xs font-bold text-gray-300">
              Nouveau mot de passe
              <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
            </label>
            <label className="block space-y-1.5 text-xs font-bold text-gray-300">
              Confirmer le mot de passe
              <input type="password" required minLength={8} maxLength={72} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} />
            </label>
            {error && (
              <p className="text-xs text-red-400">
                {error}{" "}
                {/invalide|expiré/i.test(error) && (
                  <Link href="/forgot-password" className="underline">
                    Demander un nouveau lien
                  </Link>
                )}
              </p>
            )}
            <button type="submit" disabled={state === "busy"} className="w-full bg-[#FFBF00] text-[#0B0B0B] text-sm font-bold py-2.5 rounded-lg disabled:opacity-50">
              {state === "busy" ? "…" : "Changer le mot de passe"}
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

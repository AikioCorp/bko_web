"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { studioApi } from "@/lib/studioApi";
import { useAuthStore } from "@/store/authStore";

const REASONS: [string, string][] = [
  ["COPYRIGHT", "Droits d'auteur"],
  ["INAPPROPRIATE", "Contenu inapproprié"],
  ["SPAM", "Spam"],
  ["IMPERSONATION", "Usurpation d'identité"],
  ["MISINFORMATION", "Désinformation"],
  ["OTHER", "Autre"],
];

/** Signaler un podcast ou un épisode à la modération (connexion requise). */
export function ReportButton({ targetType, targetId }: { targetType: "PODCAST" | "EPISODE" | "COMMENT"; targetId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("INAPPROPRIATE");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async () => {
    setState("busy");
    setError("");
    try {
      await studioApi("/reports", {
        method: "POST",
        body: { targetType, targetId, reason, description: description.trim() || undefined },
      });
      setState("done");
    } catch (e: any) {
      setError(e.message);
      setState("idle");
    }
  };

  return (
    <>
      <button
        onClick={() => (isAuthenticated ? setOpen(true) : router.push(`/login?redirect=${encodeURIComponent(pathname || "/")}`))}
        className="inline-flex items-center gap-1.5 text-xs text-[#B8B8B8] hover:text-white"
      >
        <Flag className="w-3.5 h-3.5" /> Signaler
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Signaler un contenu">
          <div className="w-full max-w-md bg-[#161616] border border-[#262626] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Signaler ce contenu</h2>
            {state === "done" ? (
              <>
                <p className="text-sm text-emerald-400">Merci : votre signalement a été transmis à la modération.</p>
                <button onClick={() => { setOpen(false); setState("idle"); setDescription(""); }} className="bg-[#FFBF00] text-[#0B0B0B] text-sm font-bold px-4 py-2 rounded-lg">
                  Fermer
                </button>
              </>
            ) : (
              <>
                <label className="block space-y-1.5 text-xs font-bold text-gray-300">
                  Motif
                  <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full bg-[#0B0B0B] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white font-normal">
                    {REASONS.map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1.5 text-xs font-bold text-gray-300">
                  Précisions (facultatif)
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000} className="w-full bg-[#0B0B0B] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white font-normal" />
                </label>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setOpen(false)} className="bg-[#262626] text-white text-xs font-bold px-3 py-2 rounded-lg">Annuler</button>
                  <button onClick={submit} disabled={state === "busy"} className="bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50">
                    {state === "busy" ? "…" : "Envoyer le signalement"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

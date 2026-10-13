"use client";

import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

const labels: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "En attente", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  UNDER_REVIEW: { label: "En cours de vérification", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  APPROVED: { label: "Approuvée", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  REJECTED: { label: "Refusée", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function StudioClaimsPage() {
  const [slug, setSlug] = useState("");
  const [proof, setProof] = useState("");
  const [claims, setClaims] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState("");

  const load = async () => {
    const res = await fetchApi("/me/claims");
    setClaims(res.data || []);
  };
  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const identifier = slug.trim().split("/").filter(Boolean).pop() || "";
      const podcast = await fetchApi(`/podcasts/${encodeURIComponent(identifier)}`);
      if (!podcast.data?.id) throw new Error("Émission introuvable.");
      await fetchApi(`/podcasts/${podcast.data.id}/claims`, {
        method: "POST",
        body: JSON.stringify({ proofDescription: proof.trim(), verificationMethod: "MANUAL" }),
      });
      setSuccess("Demande envoyée. Votre propriété sera vérifiée avant tout accès à l'émission.");
      setSlug("");
      setProof("");
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full bg-[#161616] border border-[#262626] rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-[#FFBF00]";

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="border-b border-[#222222] pb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-[#FFBF00]" />
          Revendiquer une émission
        </h1>
        <p className="text-sm text-[#888888] mt-1">
          Votre émission existe déjà dans le catalogue ? Demandez à la gérer sans créer de doublon.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form onSubmit={submit} className="bg-[#111111] border border-[#222222] rounded-2xl p-6 space-y-4 self-start">
          <div>
            <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">Lien Bamako Podcast ou identifiant de l'émission</label>
            <input required value={slug} onChange={(e) => setSlug(e.target.value)} className={input} />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#CCCCCC] mb-1.5">Comment vérifier que cette émission vous appartient ?</label>
            <textarea required minLength={10} rows={5} value={proof} onChange={(e) => setProof(e.target.value)} className={`${input} resize-none`} />
          </div>
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
          {success && <p role="status" className="text-xs text-emerald-400">{success}</p>}
          <button disabled={busy} className="px-5 py-2.5 bg-[#FFBF00] hover:bg-[#E5A800] text-black font-bold text-xs rounded-xl disabled:opacity-50 flex items-center gap-2">
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {busy ? "Envoi…" : "Envoyer ma demande"}
          </button>
        </form>

        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-6 space-y-3 self-start">
          <h2 className="text-base font-bold text-white">Mes demandes</h2>
          {claims.length === 0 ? (
            <p className="text-xs text-[#888888]">Aucune demande.</p>
          ) : (
            claims.map((claim) => {
              const st = labels[claim.status] || { label: claim.status, cls: "bg-[#262626] text-[#A3A3A3] border-[#333333]" };
              return (
                <div key={claim.id} className="border-t border-[#1E1E1E] pt-3 space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-white truncate">{claim.podcast?.name}</span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${st.cls}`}>{st.label}</span>
                  </div>
                  {claim.reviewNotes && <p className="text-[11px] text-[#888888]">{claim.reviewNotes}</p>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

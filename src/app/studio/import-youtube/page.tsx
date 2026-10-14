"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Youtube, Loader2, ChevronRight, Plus, Info } from "lucide-react";
import { fetchApi } from "@/lib/api";

export default function StudioImportYoutube() {
  const [podcasts, setPodcasts] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError("");
    fetchApi("/creator/podcasts")
      .then((res) => {
        const d: any = res.data;
        setPodcasts(Array.isArray(d) ? d : d?.items || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <div className="space-y-6 w-full pb-12">
      <div className="border-b border-[#222222] pb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Youtube className="w-6 h-6 text-[#FF0000]" />
          Connecter une chaîne YouTube
        </h1>
        <p className="text-sm text-[#888888] mt-1">
          Associez une chaîne YouTube à l'une de vos émissions pour importer et synchroniser automatiquement vos vidéos.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-[#111111] border border-[#222222] text-xs text-[#AAAAAA] flex items-start gap-3">
        <Info className="w-5 h-5 text-[#FFBF00] shrink-0 mt-0.5" />
        <p>
          <strong className="text-white">Note de conformité :</strong> La connexion d'une chaîne YouTube synchronise les métadonnées et permet la lecture native via le lecteur officiel YouTube intégré. Elle n'extrait pas d'audio MP3 et ne certifie pas automatiquement le créateur comme propriétaire exclusif.
        </p>
      </div>

      {loading && (
        <div className="h-40 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-[#FFBF00] animate-spin" />
        </div>
      )}
      {error && (
        <div role="alert" className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between">
          {error}
          <button onClick={load} className="font-bold text-[#FFBF00]">Réessayer</button>
        </div>
      )}
      {!loading && !error && podcasts.length === 0 && (
        <div className="bg-[#111111] border border-[#222222] rounded-2xl p-10 text-center space-y-3">
          <p className="text-sm text-white font-bold">Aucune émission disponible</p>
          <p className="text-xs text-[#888888]">Créez d'abord une émission : elle recevra les épisodes vidéo issus de YouTube.</p>
        </div>
      )}
      {podcasts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {podcasts.map((p) => (
            <Link
              key={p.id}
              href={`/studio/podcasts/${p.id}/youtube`}
              className="bg-[#111111] border border-[#222222] hover:border-[#FF0000] rounded-2xl p-5 flex items-center justify-between gap-3 transition-colors"
            >
              <span className="text-sm font-bold text-white truncate">{p.name}</span>
              <span className="text-xs text-[#FF0000] font-bold flex items-center gap-1 shrink-0">
                Connecter <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      )}
      <Link href="/studio/podcasts/new" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFBF00] hover:underline">
        <Plus className="w-3.5 h-3.5" /> Créer une nouvelle émission
      </Link>
    </div>
  );
}

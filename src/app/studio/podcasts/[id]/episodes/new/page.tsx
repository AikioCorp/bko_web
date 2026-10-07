"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { studioApi } from "@/lib/studioApi";
import { Badge, Btn, Card, ErrorBanner, Loading } from "@/components/admin/ui";
import { Field, inputCls, LANGUAGES } from "@/components/studio/bits";
import { MediaDropzone } from "@/components/media/MediaDropzone";

type Season = { id: string; number: number; title?: string | null };
type Preview = {
  provider: string;
  type: "AUDIO" | "VIDEO";
  playbackMode: string;
  externalUrl: string;
  meta: { title?: string; author?: string; thumbnail?: string };
};
type EpisodeState = { status: string; mediaSources: { id: string; mediaAsset?: { status: string } | null }[] };

const STEPS = ["Source", "Informations", "Publication"];
const PROVIDER_LABEL: Record<string, string> = {
  YOUTUBE: "YouTube",
  SPOTIFY: "Spotify",
  VIMEO: "Vimeo",
  SOUNDCLOUD: "SoundCloud",
  APPLE_PODCASTS: "Apple Podcasts",
  OTHER: "Lien externe / fichier distant",
};

export default function NewEpisodePage() {
  const { id: podcastId } = useParams<{ id: string }>();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"LINK" | "FILE">("LINK");
  const [fileType, setFileType] = useState<"AUDIO" | "VIDEO">("AUDIO");
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [analysing, setAnalysing] = useState(false);

  const [form, setForm] = useState({ title: "", description: "", cover: "", seasonId: "", episodeNumber: "", languageCode: "fr" });
  const [seasons, setSeasons] = useState<Season[]>([]);

  const [episodeId, setEpisodeId] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [state, setState] = useState<EpisodeState | null>(null);

  const [publishMode, setPublishMode] = useState<"DRAFT" | "NOW" | "SCHEDULE">("DRAFT");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const creating = useRef(false);

  useEffect(() => {
    studioApi<Season[]>(`/creator/podcasts/${podcastId}/seasons`).then(setSeasons).catch(() => {});
  }, [podcastId]);

  const analyse = async () => {
    setError("");
    setAnalysing(true);
    setPreview(null);
    try {
      const p = await studioApi<Preview>("/creator/media/preview", { method: "POST", body: { url: url.trim() } });
      setPreview(p);
      // Pré-remplissage (sans écraser ce que la personne a déjà saisi)
      setForm((f) => ({ ...f, title: f.title || p.meta.title || "", cover: f.cover || p.meta.thumbnail || "" }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAnalysing(false);
    }
  };

  const [sourceAttached, setSourceAttached] = useState(false);

  // Étape 2 → crée ou met à jour le brouillon et rattache la source lien si besoin
  const saveDraftAndProceed = async () => {
    if (creating.current || busy) return;
    creating.current = true;
    setBusy(true);
    setError("");
    try {
      let currentEpId = episodeId;

      if (!currentEpId) {
        // 1. Créer le brouillon
        const ep = await studioApi<{ id: string }>(`/creator/podcasts/${podcastId}/episodes`, {
          method: "POST",
          body: {
            title: form.title.trim(),
            description: form.description.trim(),
            cover: form.cover.trim() || undefined,
            seasonId: form.seasonId || undefined,
            episodeNumber: form.episodeNumber ? Number(form.episodeNumber) : undefined,
            languageCode: form.languageCode,
          },
        });
        currentEpId = ep.id;
        setEpisodeId(ep.id);
      } else {
        // 2. Mettre à jour les informations en cas de modification
        await studioApi(`/creator/episodes/${currentEpId}`, {
          method: "PATCH",
          body: {
            title: form.title.trim(),
            description: form.description.trim(),
            cover: form.cover.trim() || undefined,
            seasonId: form.seasonId || null,
            episodeNumber: form.episodeNumber ? Number(form.episodeNumber) : null,
            languageCode: form.languageCode,
          },
        });
      }

      // 3. Rattacher la source lien si mode LINK et pas encore fait
      if (mode === "LINK" && !sourceAttached) {
        await studioApi(`/creator/episodes/${currentEpId}/media-sources`, {
          method: "POST",
          body: {
            rawUrl: url.trim(),
            mediaTypePreference: preview?.type,
            isPrimaryAudio: preview?.type !== "VIDEO",
            isPrimaryVideo: preview?.type === "VIDEO",
          },
        });
        setSourceAttached(true);
      }

      setStep(2);
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'enregistrement");
    } finally {
      creating.current = false;
      setBusy(false);
    }
  };

  // Suivi du traitement du fichier envoyé (analyse des métadonnées côté serveur).
  const refreshState = useCallback(async () => {
    if (!episodeId) return;
    try {
      setState(await studioApi<EpisodeState>(`/creator/episodes/${episodeId}`));
    } catch {}
  }, [episodeId]);

  useEffect(() => {
    if (step !== 2 || !episodeId) return;
    refreshState();
    const t = setInterval(refreshState, 3000);
    return () => clearInterval(t);
  }, [step, episodeId, refreshState]);

  const mediaReady =
    !!state && state.mediaSources.length > 0 && state.mediaSources.every((m) => !m.mediaAsset || m.mediaAsset.status === "READY");
  const fileProcessing = mode === "FILE" && uploaded && !mediaReady;

  const finish = async () => {
    if (!episodeId) return;
    setBusy(true);
    setError("");
    try {
      if (publishMode === "NOW") {
        await studioApi(`/creator/episodes/${episodeId}/publish`, { method: "POST" });
      } else if (publishMode === "SCHEDULE") {
        await studioApi(`/creator/episodes/${episodeId}/schedule`, { method: "POST", body: { publishAt: new Date(when).toISOString() } });
      }
      router.push(`/studio/episodes/${episodeId}/edit?created=1`);
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  const step0Ok = mode === "LINK" ? !!preview : true;
  const step1Ok = form.title.trim().length > 0 && form.description.trim().length > 0;
  const noSource = mode === "FILE" ? !uploaded : false;
  const needsMediaForPublish = publishMode !== "DRAFT" && (noSource || fileProcessing);
  const scheduleOk = publishMode !== "SCHEDULE" || (when && new Date(when) > new Date());

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link href={`/studio/podcasts/${podcastId}`} className="text-xs text-gray-400 hover:text-white">
        ← Retour au podcast
      </Link>
      <h1 className="text-2xl font-extrabold text-white">Nouvel épisode</h1>

      <ol className="flex gap-2" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex-1 text-center text-xs font-bold py-2 rounded-lg ${i === step ? "bg-[#FFBF00] text-[#0B0B0B]" : i < step ? "bg-emerald-500/20 text-emerald-300" : "bg-[#161616] text-gray-500"}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>

      {error && <ErrorBanner message={error} />}

      {step === 0 && (
        <Card className="p-6 space-y-5">
          <h2 className="font-bold">D&apos;où vient votre épisode ?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ["LINK", "J'ai un lien", "YouTube, Spotify, Vimeo, SoundCloud, Apple Podcasts ou un fichier audio/vidéo hébergé ailleurs."],
              ["FILE", "J'ai un fichier", "Envoyez un fichier audio (MP3, M4A, WAV) ou vidéo (MP4, MOV) hébergé par Bamako Podcast."],
            ].map(([k, t, d]) => (
              <button
                key={k}
                onClick={() => setMode(k as "LINK" | "FILE")}
                className={`text-left p-4 rounded-xl border ${mode === k ? "border-[#FFBF00] bg-[#FFBF00]/5" : "border-[#262626] bg-[#0B0B0B]"}`}
              >
                <p className="font-bold">{t}</p>
                <p className="text-xs text-gray-400 mt-1">{d}</p>
              </button>
            ))}
          </div>

          {mode === "LINK" ? (
            <div className="space-y-3">
              <Field label="Lien de l'épisode">
                <div className="flex gap-2">
                  <input className={inputCls} value={url} onChange={(e) => { setUrl(e.target.value); setPreview(null); }} placeholder="https://www.youtube.com/watch?v=…" />
                  <Btn variant="primary" disabled={analysing || url.trim().length < 8} onClick={analyse}>
                    {analysing ? "Analyse…" : "Analyser"}
                  </Btn>
                </div>
              </Field>
              {preview && (
                <div className="flex gap-3 bg-[#0B0B0B] border border-[#262626] rounded-xl p-3">
                  {preview.meta.thumbnail && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview.meta.thumbnail} alt="" className="w-24 h-16 rounded object-cover" />
                  )}
                  <div className="min-w-0 space-y-1">
                    <div className="flex gap-1.5">
                      <Badge tone="green">{PROVIDER_LABEL[preview.provider] ?? preview.provider}</Badge>
                      <Badge>{preview.type === "VIDEO" ? "Vidéo" : "Audio"}</Badge>
                      <Badge>{preview.playbackMode === "EMBED" ? "Lecture intégrée" : preview.playbackMode === "NATIVE" ? "Lecture directe" : "Lien externe"}</Badge>
                    </div>
                    <p className="text-sm font-bold truncate">{preview.meta.title ?? "Titre non disponible"}</p>
                    {preview.meta.author && <p className="text-xs text-gray-400">{preview.meta.author}</p>}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-gray-500">
                Les auditeurs seront dirigés vers la plateforme d&apos;origine pour écouter ; le titre et l&apos;image sont repris automatiquement quand c&apos;est possible.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="Type de fichier">
                <div className="flex gap-2">
                  {(["AUDIO", "VIDEO"] as const).map((t) => (
                    <button key={t} onClick={() => setFileType(t)} className={`px-4 py-2 rounded-lg text-sm font-bold ${fileType === t ? "bg-[#FFBF00] text-[#0B0B0B]" : "bg-[#0B0B0B] border border-[#262626]"}`}>
                      {t === "AUDIO" ? "Audio (250 Mo max)" : "Vidéo (2 Go max)"}
                    </button>
                  ))}
                </div>
              </Field>
              <p className="text-[11px] text-gray-500">Vous enverrez le fichier à l&apos;étape suivante, une fois les informations de l&apos;épisode enregistrées.</p>
            </div>
          )}

          <div className="flex justify-end">
            <Btn variant="primary" disabled={!step0Ok} onClick={() => setStep(1)}>
              Continuer
            </Btn>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="p-6 space-y-4">
          <Field label="Titre *">
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} />
          </Field>
          <Field label="Description *" hint="Décrivez l'épisode : sujet, invités, liens utiles.">
            <textarea className={inputCls} rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Langue">
              <select className={inputCls} value={form.languageCode} onChange={(e) => setForm({ ...form, languageCode: e.target.value })}>
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Saison">
              <select className={inputCls} value={form.seasonId} onChange={(e) => setForm({ ...form, seasonId: e.target.value })}>
                <option value="">Aucune</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    Saison {s.number}{s.title ? ` — ${s.title}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="N° d'épisode">
              <input className={inputCls} type="number" min={0} value={form.episodeNumber} onChange={(e) => setForm({ ...form, episodeNumber: e.target.value })} />
            </Field>
          </div>
          <Field label="Image de l'épisode (URL)" hint="Facultatif : par défaut, la couverture du podcast est utilisée.">
            <input className={inputCls} value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} placeholder="https://" />
          </Field>
          <div className="flex justify-between">
            <Btn onClick={() => setStep(0)} disabled={busy}>Retour</Btn>
            <Btn variant="primary" disabled={!step1Ok || busy} onClick={saveDraftAndProceed}>
              {busy ? "Enregistrement…" : "Enregistrer et continuer"}
            </Btn>
          </div>
        </Card>
      )}

      {step === 2 && episodeId && (
        <Card className="p-6 space-y-5">
          {mode === "FILE" && (
            <div className="space-y-3">
              <h2 className="font-bold">Envoi du fichier</h2>
              {!uploaded ? (
                <MediaDropzone mediaType={fileType} episodeId={episodeId} onUploadSuccess={() => { setUploaded(true); refreshState(); }} />
              ) : (
                <div className={`text-sm rounded-xl p-3 border ${mediaReady ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-[#FFBF00]/30 bg-[#FFBF00]/10 text-[#FFBF00]"}`}>
                  {mediaReady ? "Fichier prêt." : "Fichier reçu — traitement en cours (analyse de la durée et du format). Cela peut prendre quelques minutes ; vous pouvez enregistrer en brouillon sans attendre."}
                </div>
              )}
            </div>
          )}
          {mode === "LINK" && <div className="text-sm rounded-xl p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Lien enregistré comme source de l&apos;épisode.</div>}

          <div className="space-y-3">
            <h2 className="font-bold">Publication</h2>
            {[
              ["DRAFT", "Enregistrer en brouillon", "Rien n'est visible ; vous pourrez publier plus tard."],
              ["NOW", "Publier maintenant", "L'épisode devient visible immédiatement (ou part en validation selon votre statut)."],
              ["SCHEDULE", "Programmer", "Choisissez la date et l'heure de mise en ligne."],
            ].map(([k, t, d]) => (
              <label key={k} className={`flex gap-3 p-3 rounded-xl border cursor-pointer ${publishMode === k ? "border-[#FFBF00] bg-[#FFBF00]/5" : "border-[#262626]"}`}>
                <input type="radio" name="pm" checked={publishMode === k} onChange={() => setPublishMode(k as any)} className="mt-1 accent-[#FFBF00]" />
                <span>
                  <span className="block text-sm font-bold">{t}</span>
                  <span className="block text-xs text-gray-400">{d}</span>
                </span>
              </label>
            ))}
            {publishMode === "SCHEDULE" && (
              <input type="datetime-local" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Date de publication" />
            )}
            {needsMediaForPublish && (
              <p className="text-xs text-[#FFBF00]">
                {noSource ? "Envoyez d'abord le fichier pour pouvoir publier." : "Attendez la fin du traitement du fichier pour publier, ou enregistrez en brouillon."}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Btn variant="primary" disabled={busy || needsMediaForPublish || !scheduleOk} onClick={finish}>
              {busy ? "…" : publishMode === "DRAFT" ? "Enregistrer le brouillon" : publishMode === "NOW" ? "Publier" : "Programmer"}
            </Btn>
          </div>
        </Card>
      )}
      {step === 2 && !episodeId && <Loading />}
    </div>
  );
}

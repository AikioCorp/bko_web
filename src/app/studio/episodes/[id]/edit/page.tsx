"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { studioApi, formatBytes } from "@/lib/studioApi";
import { Badge, Btn, Card, ErrorBanner, Loading, ReasonDialog } from "@/components/admin/ui";
import { Field, inputCls, LANGUAGES, ReviewNotice, StatusBadge } from "@/components/studio/bits";
import { MediaDropzone } from "@/components/media/MediaDropzone";

type Source = {
  id: string;
  type: "AUDIO" | "VIDEO";
  sourceType: string;
  provider?: string | null;
  playbackMode: string;
  externalUrl?: string | null;
  isPrimaryAudio: boolean;
  isPrimaryVideo: boolean;
  durationSeconds?: number | null;
  mediaAsset?: { status: string; sizeBytes: number } | null;
};
type Episode = {
  id: string;
  podcastId: string;
  title: string;
  description: string;
  cover?: string | null;
  seasonId?: string | null;
  episodeNumber?: number | null;
  languageCode?: string | null;
  durationSeconds: number;
  status: string;
  publishedAt?: string | null;
  reviewNote?: string | null;
  podcast: { id: string; name: string; slug: string };
  mediaSources: Source[];
  _count: { transcripts: number; chapters: number };
};
type Season = { id: string; number: number; title?: string | null };
type Preview = { provider: string; type: "AUDIO" | "VIDEO"; meta: { title?: string } };

export default function EditEpisodePage() {
  const { id } = useParams<{ id: string }>();
  const created = useSearchParams()?.get("created");

  const [ep, setEp] = useState<Episode | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [form, setForm] = useState({ title: "", description: "", cover: "", seasonId: "", episodeNumber: "", languageCode: "fr" });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [linkUrl, setLinkUrl] = useState("");
  const [linkPreview, setLinkPreview] = useState<Preview | null>(null);
  const [uploadType, setUploadType] = useState<"AUDIO" | "VIDEO">("AUDIO");
  const [showUpload, setShowUpload] = useState(false);

  const [when, setWhen] = useState("");
  const [dialog, setDialog] = useState<null | "schedule" | "archive">(null);

  const load = useCallback(async () => {
    try {
      const e = await studioApi<Episode>(`/creator/episodes/${id}`);
      setEp(e);
      setForm({
        title: e.title,
        description: e.description,
        cover: e.cover ?? "",
        seasonId: e.seasonId ?? "",
        episodeNumber: e.episodeNumber?.toString() ?? "",
        languageCode: e.languageCode ?? "fr",
      });
      studioApi<Season[]>(`/creator/podcasts/${e.podcastId}/seasons`).then(setSeasons).catch(() => {});
    } catch (err: any) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Tant qu'un fichier est en traitement, on rafraîchit automatiquement.
  const processing = ep?.mediaSources.some((m) => m.mediaAsset && m.mediaAsset.status !== "READY" && m.mediaAsset.status !== "FAILED");
  useEffect(() => {
    if (!processing) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [processing, load]);

  const act = async (fn: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      await fn();
      if (done) setMsg(done);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    act(
      () =>
        studioApi(`/creator/episodes/${id}`, {
          method: "PATCH",
          body: {
            title: form.title.trim(),
            description: form.description.trim(),
            cover: form.cover.trim() || null,
            seasonId: form.seasonId || null,
            episodeNumber: form.episodeNumber ? Number(form.episodeNumber) : null,
            languageCode: form.languageCode,
          },
        }),
      "Modifications enregistrées."
    );

  const analyse = () =>
    act(async () => {
      setLinkPreview(await studioApi<Preview>("/creator/media/preview", { method: "POST", body: { url: linkUrl.trim() } }));
    });

  const addLink = () =>
    act(async () => {
      await studioApi(`/creator/episodes/${id}/media-sources`, {
        method: "POST",
        body: { rawUrl: linkUrl.trim(), mediaTypePreference: linkPreview?.type, isPrimaryAudio: linkPreview?.type !== "VIDEO", isPrimaryVideo: linkPreview?.type === "VIDEO" },
      });
      setLinkUrl("");
      setLinkPreview(null);
    }, "Source ajoutée.");

  if (error && !ep) return <div className="max-w-4xl mx-auto px-4 py-8"><ErrorBanner message={error} onRetry={load} /></div>;
  if (!ep) return <Loading />;

  const status = ep.status;
  const readOnly = status === "ARCHIVED";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link href={`/studio/podcasts/${ep.podcastId}`} className="text-xs text-gray-400 hover:text-white">
        ← {ep.podcast.name}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold text-white flex-1 min-w-[200px]">{ep.title}</h1>
        <StatusBadge status={status} />
      </div>

      {created && <div className="text-sm text-emerald-400">Épisode créé.</div>}
      {error && <ErrorBanner message={error} />}
      {msg && <div className="text-sm text-emerald-400">{msg}</div>}
      <ReviewNotice status={status} />
      {status === "DRAFT" && ep.reviewNote && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-4">
          <p className="font-bold">Renvoyé par la modération</p>
          <p>{ep.reviewNote}</p>
          <p className="text-xs mt-1 text-red-400">Corrigez puis publiez à nouveau.</p>
        </div>
      )}

      {/* Publication */}
      <Card className="p-5 space-y-3">
        <h2 className="font-bold">Publication</h2>
        <p className="text-xs text-gray-400">
          {status === "DRAFT" && "Cet épisode n'est pas visible. Publiez-le maintenant ou programmez sa mise en ligne."}
          {status === "SCHEDULED" && `Mise en ligne programmée le ${ep.publishedAt ? new Date(ep.publishedAt).toLocaleString("fr-FR") : "—"}.`}
          {status === "PENDING_REVIEW" && "En attente de validation. Vous pouvez le retirer de la file pour le modifier."}
          {status === "PUBLISHED" && `Publié${ep.publishedAt ? ` le ${new Date(ep.publishedAt).toLocaleString("fr-FR")}` : ""}.`}
          {status === "ARCHIVED" && "Archivé : l'épisode n'est plus visible."}
        </p>
        <div className="flex flex-wrap gap-2">
          {status === "DRAFT" && (
            <>
              <Btn variant="primary" disabled={busy} onClick={() => act(() => studioApi(`/creator/episodes/${id}/publish`, { method: "POST" }), "Action effectuée.")}>
                Publier maintenant
              </Btn>
              <Btn disabled={busy} onClick={() => setDialog("schedule")}>
                Programmer…
              </Btn>
            </>
          )}
          {status === "SCHEDULED" && (
            <Btn disabled={busy} onClick={() => act(() => studioApi(`/creator/episodes/${id}/unschedule`, { method: "POST" }), "Programmation annulée.")}>
              Annuler la programmation
            </Btn>
          )}
          {(status === "PUBLISHED" || status === "PENDING_REVIEW" || status === "UNLISTED") && (
            <Btn disabled={busy} onClick={() => act(() => studioApi(`/creator/episodes/${id}/unpublish`, { method: "POST" }), "Épisode repassé en brouillon.")}>
              {status === "PENDING_REVIEW" ? "Retirer de la validation" : "Dépublier"}
            </Btn>
          )}
          {status === "ARCHIVED" && (
            <Btn variant="primary" disabled={busy} onClick={() => act(() => studioApi(`/creator/episodes/${id}/restore`, { method: "POST" }), "Épisode restauré en brouillon.")}>
              Restaurer
            </Btn>
          )}
          {!readOnly && (
            <Btn variant="danger" disabled={busy} onClick={() => setDialog("archive")}>
              Archiver
            </Btn>
          )}
        </div>
      </Card>

      {/* Informations */}
      <Card className="p-5 space-y-4">
        <h2 className="font-bold">Informations</h2>
        <Field label="Titre">
          <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={readOnly} maxLength={200} />
        </Field>
        <Field label="Description">
          <textarea className={inputCls} rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} disabled={readOnly} />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Langue">
            <select className={inputCls} value={form.languageCode} onChange={(e) => setForm({ ...form, languageCode: e.target.value })} disabled={readOnly}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Saison">
            <select className={inputCls} value={form.seasonId} onChange={(e) => setForm({ ...form, seasonId: e.target.value })} disabled={readOnly}>
              <option value="">Aucune</option>
              {seasons.map((s) => (
                <option key={s.id} value={s.id}>Saison {s.number}{s.title ? ` — ${s.title}` : ""}</option>
              ))}
            </select>
          </Field>
          <Field label="N° d'épisode">
            <input className={inputCls} type="number" min={0} value={form.episodeNumber} onChange={(e) => setForm({ ...form, episodeNumber: e.target.value })} disabled={readOnly} />
          </Field>
        </div>
        <Field label="Image (URL)">
          <input className={inputCls} value={form.cover} onChange={(e) => setForm({ ...form, cover: e.target.value })} disabled={readOnly} placeholder="https://" />
        </Field>
        {!readOnly && (
          <Btn variant="primary" disabled={busy || !form.title.trim() || !form.description.trim()} onClick={save}>
            Enregistrer les modifications
          </Btn>
        )}
      </Card>

      {/* Sources média */}
      <Card className="p-5 space-y-4">
        <h2 className="font-bold">Sources audio / vidéo</h2>
        {ep.mediaSources.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune source. Ajoutez un lien ou envoyez un fichier pour pouvoir publier.</p>
        ) : (
          <div className="divide-y divide-[#262626]">
            {ep.mediaSources.map((m) => {
              const primary = m.type === "AUDIO" ? m.isPrimaryAudio : m.isPrimaryVideo;
              const st = m.mediaAsset?.status;
              return (
                <div key={m.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="blue">{m.sourceType === "UPLOAD" ? "Fichier hébergé" : m.provider && m.provider !== "OTHER" ? m.provider : "Lien"}</Badge>
                      <Badge>{m.type === "VIDEO" ? "Vidéo" : "Audio"}</Badge>
                      {primary && <Badge tone="green">Principale</Badge>}
                      {st === "PROCESSING" && <Badge tone="amber">Traitement…</Badge>}
                      {st === "FAILED" && <Badge tone="red">Échec du traitement</Badge>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {m.externalUrl && m.sourceType !== "UPLOAD" ? m.externalUrl : m.mediaAsset ? formatBytes(m.mediaAsset.sizeBytes) : ""}
                      {m.durationSeconds ? ` • ${Math.round(m.durationSeconds / 60)} min` : ""}
                    </p>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-2">
                      {!primary && st !== "FAILED" && (
                        <Btn disabled={busy} onClick={() => act(() => studioApi(`/creator/episodes/${id}/media-sources/${m.id}/primary`, { method: "POST" }))}>
                          Définir comme principale
                        </Btn>
                      )}
                      <Btn
                        variant="danger"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("Retirer cette source ?")) act(() => studioApi(`/creator/episodes/${id}/media-sources/${m.id}`, { method: "DELETE" }));
                        }}
                      >
                        Retirer
                      </Btn>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!readOnly && (
          <div className="space-y-4 border-t border-[#262626] pt-4">
            <Field label="Ajouter un lien">
              <div className="flex gap-2">
                <input className={inputCls} value={linkUrl} onChange={(e) => { setLinkUrl(e.target.value); setLinkPreview(null); }} placeholder="https://…" />
                <Btn disabled={busy || linkUrl.trim().length < 8} onClick={analyse}>Analyser</Btn>
                <Btn variant="primary" disabled={busy || !linkPreview} onClick={addLink}>Ajouter</Btn>
              </div>
            </Field>
            {linkPreview && <p className="text-xs text-emerald-400">Détecté : {linkPreview.provider} ({linkPreview.type === "VIDEO" ? "vidéo" : "audio"}){linkPreview.meta.title ? ` — ${linkPreview.meta.title}` : ""}</p>}

            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-300">Ou envoyer un fichier</p>
              {!showUpload ? (
                <div className="flex gap-2">
                  <Btn onClick={() => { setUploadType("AUDIO"); setShowUpload(true); }}>Fichier audio</Btn>
                  <Btn onClick={() => { setUploadType("VIDEO"); setShowUpload(true); }}>Fichier vidéo</Btn>
                </div>
              ) : (
                <MediaDropzone mediaType={uploadType} episodeId={id} onUploadSuccess={() => { setShowUpload(false); load(); }} />
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold">Transcription & chapitres</h2>
          <p className="text-xs text-gray-400">{ep._count.transcripts} transcription(s) • {ep._count.chapters} chapitre(s)</p>
        </div>
        <Link href={`/studio/episodes/${id}/transcript`}>
          <Btn>Gérer la transcription</Btn>
        </Link>
      </Card>

      {dialog === "schedule" && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <Card className="w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold">Programmer la publication</h2>
            <input type="datetime-local" className={inputCls} value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Date de publication" />
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setDialog(null)}>Annuler</Btn>
              <Btn
                variant="primary"
                disabled={!when || new Date(when) <= new Date() || busy}
                onClick={async () => {
                  setDialog(null);
                  await act(() => studioApi(`/creator/episodes/${id}/schedule`, { method: "POST", body: { publishAt: new Date(when).toISOString() } }), "Action effectuée.");
                }}
              >
                Programmer
              </Btn>
            </div>
          </Card>
        </div>
      )}
      {dialog === "archive" && (
        <ReasonDialog
          title="Archiver cet épisode ?"
          description="Il ne sera plus visible. Vous pourrez le restaurer en brouillon."
          confirmLabel="Archiver"
          danger
          required={false}
          onConfirm={async () => {
            await studioApi(`/creator/episodes/${id}/archive`, { method: "POST" });
            setDialog(null);
            await load();
          }}
          onCancel={() => setDialog(null)}
        />
      )}
    </div>
  );
}

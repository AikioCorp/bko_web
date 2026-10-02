"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { studioApi, timeAgo } from "@/lib/studioApi";
import { Badge, Btn, Card, Empty, ErrorBanner, Loading, PageHeader, StatCard } from "@/components/admin/ui";
import { Field, inputCls, LANGUAGES, ReviewNotice, ROLE_LABELS, StatusBadge, Tabs } from "@/components/studio/bits";

type Podcast = {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string | null;
  cover: string;
  website?: string | null;
  primaryLanguageCode: string;
  status: string;
  reviewNote?: string | null;
  userRole: string;
  _count: { episodes: number; followers: number };
};
type Episode = {
  id: string;
  title: string;
  status: string;
  publishedAt?: string | null;
  updatedAt: string;
  episodeNumber?: number | null;
  season?: { number: number } | null;
  mediaSources: { type: string; provider?: string | null }[];
};
type Season = { id: string; number: number; title?: string | null; _count: { episodes: number } };
type Member = { userId: string; role: string; user: { id: string; fullName: string; email: string } };
type Invitation = { id: string; email: string; role: string; expiresAt: string };
type Analytics = {
  totals: { plays: number; qualifiedPlays: number; completedPlays: number; listeningMinutes: number; followers: number; newFollowers: number };
  series: { date: string; plays: number }[];
  topEpisodes: { episodeId: string; title: string; plays: number }[];
};

const TABS = [
  { key: "episodes", label: "Épisodes" },
  { key: "seasons", label: "Saisons" },
  { key: "team", label: "Équipe" },
  { key: "stats", label: "Statistiques" },
  { key: "settings", label: "Paramètres" },
];

export default function StudioPodcastPage() {
  const { id } = useParams<{ id: string }>();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("episodes");

  const load = useCallback(async () => {
    setError("");
    try {
      setPodcast(await studioApi<Podcast>(`/creator/podcasts/${id}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <div className="max-w-5xl mx-auto px-4 py-8"><ErrorBanner message={error} onRetry={load} /></div>;
  if (!podcast) return <Loading />;

  const canWrite = ["OWNER", "ADMIN", "EDITOR"].includes(podcast.userRole);
  const canManage = ["OWNER", "ADMIN"].includes(podcast.userRole);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link href="/studio" className="text-xs text-gray-400 hover:text-white">
        ← Studio
      </Link>
      <div className="flex flex-wrap items-start gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={podcast.cover} alt="" className="w-24 h-24 rounded-xl object-cover bg-[#262626]" />
        <div className="flex-1 min-w-[220px] space-y-2">
          <h1 className="text-2xl font-extrabold text-white">{podcast.name}</h1>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={podcast.status} kind="podcast" />
            <Badge>{ROLE_LABELS[podcast.userRole] ?? podcast.userRole}</Badge>
            <Badge>{podcast._count.episodes} épisodes</Badge>
            <Badge>{podcast._count.followers} abonnés</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite && (
            <Link href={`/studio/podcasts/${podcast.id}/episodes/new`}>
              <Btn variant="primary">Ajouter un épisode</Btn>
            </Link>
          )}
          {canWrite && (
            <Link href={`/studio/podcasts/${podcast.id}/rss`}>
              <Btn>Importer un flux RSS</Btn>
            </Link>
          )}
        </div>
      </div>

      <ReviewNotice status={podcast.status} />
      {podcast.status === "DRAFT" && podcast.reviewNote && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-4">
          Votre podcast a été renvoyé par la modération : {podcast.reviewNote}
        </div>
      )}
      {podcast.status === "SUSPENDED" && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-4">
          Ce podcast est suspendu par l&apos;équipe Bamako Podcast. Contactez le support pour en savoir plus.
        </div>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "episodes" && <EpisodesTab podcastId={podcast.id} canWrite={canWrite} />}
      {tab === "seasons" && <SeasonsTab podcastId={podcast.id} canWrite={canWrite} canManage={canManage} />}
      {tab === "team" && <TeamTab podcastId={podcast.id} role={podcast.userRole} />}
      {tab === "stats" && <StatsTab podcastId={podcast.id} />}
      {tab === "settings" && <SettingsTab podcast={podcast} canWrite={canWrite} canManage={canManage} onSaved={load} />}
    </div>
  );
}

/* ───────────── Épisodes ───────────── */
function EpisodesTab({ podcastId, canWrite }: { podcastId: string; canWrite: boolean }) {
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setEpisodes(null);
    studioApi<Episode[]>(`/creator/podcasts/${podcastId}/episodes${filter ? `?status=${filter}` : ""}`)
      .then(setEpisodes)
      .catch((e) => setError(e.message));
  }, [podcastId, filter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 flex-wrap">
        {[["", "Tous"], ["DRAFT", "Brouillons"], ["PENDING_REVIEW", "En validation"], ["SCHEDULED", "Programmés"], ["PUBLISHED", "Publiés"], ["ARCHIVED", "Archivés"]].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === v ? "bg-[#FFBF00] text-[#0B0B0B]" : "bg-[#161616] text-gray-300 border border-[#262626]"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {error && <ErrorBanner message={error} />}
      {!episodes && !error && <Loading />}
      {episodes && (
        <Card className="divide-y divide-[#262626]">
          {episodes.length === 0 ? (
            <Empty>
              Aucun épisode ici.{" "}
              {canWrite && (
                <Link href={`/studio/podcasts/${podcastId}/episodes/new`} className="text-[#FFBF00] font-bold">
                  Ajouter un épisode
                </Link>
              )}
            </Empty>
          ) : (
            episodes.map((e) => (
              <Link key={e.id} href={`/studio/episodes/${e.id}/edit`} className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[#1c1c1c]">
                <div className="min-w-0">
                  <p className="font-bold truncate">
                    {e.season ? `S${e.season.number} ` : ""}
                    {e.episodeNumber ? `E${e.episodeNumber} • ` : ""}
                    {e.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {e.mediaSources.length === 0
                      ? "Aucune source média"
                      : e.mediaSources.map((m) => (m.provider && m.provider !== "OTHER" ? m.provider : m.type === "VIDEO" ? "Vidéo" : "Audio")).join(" + ")}
                    {" • "}
                    {e.status === "SCHEDULED" && e.publishedAt
                      ? `prévu le ${new Date(e.publishedAt).toLocaleString("fr-FR")}`
                      : `modifié ${timeAgo(e.updatedAt)}`}
                  </p>
                </div>
                <StatusBadge status={e.status} />
              </Link>
            ))
          )}
        </Card>
      )}
    </div>
  );
}

/* ───────────── Saisons ───────────── */
function SeasonsTab({ podcastId, canWrite, canManage }: { podcastId: string; canWrite: boolean; canManage: boolean }) {
  const [seasons, setSeasons] = useState<Season[] | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    studioApi<Season[]>(`/creator/podcasts/${podcastId}/seasons`).then(setSeasons).catch((e) => setError(e.message));
  }, [podcastId]);
  useEffect(load, [load]);

  const add = async () => {
    setError("");
    try {
      await studioApi(`/creator/podcasts/${podcastId}/seasons`, { method: "POST", body: { title: title.trim() || undefined } });
      setTitle("");
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };
  const remove = async (s: Season) => {
    if (!window.confirm(`Supprimer la saison ${s.number} ? Ses épisodes sont conservés (sans saison).`)) return;
    try {
      await studioApi(`/creator/seasons/${s.id}`, { method: "DELETE" });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}
      {canWrite && (
        <div className="flex gap-2">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la nouvelle saison (facultatif)" maxLength={200} />
          <Btn variant="primary" onClick={add}>
            Ajouter une saison
          </Btn>
        </div>
      )}
      {!seasons && !error && <Loading />}
      {seasons && (
        <Card className="divide-y divide-[#262626]">
          {seasons.length === 0 ? (
            <Empty>Aucune saison. Les épisodes peuvent aussi exister sans saison.</Empty>
          ) : (
            seasons.map((s) => (
              <div key={s.id} className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold">
                    Saison {s.number}
                    {s.title ? ` — ${s.title}` : ""}
                  </p>
                  <p className="text-xs text-gray-400">{s._count.episodes} épisode(s)</p>
                </div>
                {canManage && (
                  <Btn variant="danger" onClick={() => remove(s)}>
                    Supprimer
                  </Btn>
                )}
              </div>
            ))
          )}
        </Card>
      )}
    </div>
  );
}

/* ───────────── Équipe ───────────── */
function TeamTab({ podcastId, role }: { podcastId: string; role: string }) {
  const canManage = ["OWNER", "ADMIN"].includes(role);
  const isOwner = role === "OWNER";
  const [members, setMembers] = useState<Member[] | null>(null);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EDITOR");
  const [link, setLink] = useState("");
  const [sent, setSent] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setMembers(await studioApi<Member[]>(`/creator/podcasts/${podcastId}/members`));
      if (canManage) setInvites(await studioApi<Invitation[]>(`/creator/podcasts/${podcastId}/invitations`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [podcastId, canManage]);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const invite = () =>
    act(async () => {
      const r = await studioApi<{ invitationToken: string; emailSent: boolean }>(`/creator/podcasts/${podcastId}/invitations`, {
        method: "POST",
        body: { email, role: inviteRole },
      });
      setSent(r.emailSent);
      setLink(`${window.location.origin}/invitations/accept?token=${r.invitationToken}`);
      setEmail("");
    });

  // Rôles que l'on peut attribuer : seul le propriétaire accorde Propriétaire/Administrateur.
  const roleOptions = isOwner ? ["OWNER", "ADMIN", "EDITOR", "ANALYST"] : ["EDITOR", "ANALYST"];

  return (
    <div className="space-y-6">
      {error && <ErrorBanner message={error} />}
      <Card className="divide-y divide-[#262626]">
        {!members ? (
          <Loading />
        ) : (
          members.map((m) => (
            <div key={m.userId} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold">{m.user.fullName}</p>
                <p className="text-xs text-gray-400">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {canManage && !(m.role === "OWNER" && !isOwner) && !(m.role === "ADMIN" && !isOwner) ? (
                  <select
                    value={m.role}
                    onChange={(e) => act(() => studioApi(`/creator/podcasts/${podcastId}/members/${m.userId}`, { method: "PATCH", body: { role: e.target.value } }))}
                    className="bg-[#0B0B0B] border border-[#262626] rounded-lg px-2 py-1.5 text-xs text-white"
                    aria-label={`Rôle de ${m.user.fullName}`}
                  >
                    {roleOptions.concat(roleOptions.includes(m.role) ? [] : [m.role]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge>{ROLE_LABELS[m.role]}</Badge>
                )}
                {canManage && !(m.role !== "EDITOR" && m.role !== "ANALYST" && !isOwner) && (
                  <Btn
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`Retirer ${m.user.fullName} de l'équipe ?`))
                        act(() => studioApi(`/creator/podcasts/${podcastId}/members/${m.userId}`, { method: "DELETE" }));
                    }}
                  >
                    Retirer
                  </Btn>
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      {canManage && (
        <>
          <Card className="p-5 space-y-3">
            <h3 className="font-bold">Inviter un collaborateur</h3>
            <div className="flex flex-wrap gap-2">
              <input type="email" className={`${inputCls} flex-1 min-w-[220px]`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="bg-[#0B0B0B] border border-[#262626] rounded-lg px-3 text-sm text-white" aria-label="Rôle">
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              <Btn variant="primary" disabled={!email.includes("@")} onClick={invite}>
                Inviter
              </Btn>
            </div>
            <p className="text-[11px] text-gray-500">
              La personne reçoit un email avec le lien d&apos;invitation. Elle devra se connecter (ou créer un compte) avec cette adresse email.
            </p>
            {sent === true && <p className="text-xs text-emerald-400">Email d&apos;invitation envoyé.</p>}
            {sent === false && <p className="text-xs text-[#FFBF00]">L&apos;email n&apos;a pas pu être envoyé : transmettez-lui le lien ci-dessous.</p>}
            {link && (
              <div className="bg-[#0B0B0B] border border-[#262626] rounded-lg p-3 text-xs break-all flex items-center justify-between gap-3">
                <span className="text-gray-300">{link}</span>
                <Btn onClick={() => navigator.clipboard?.writeText(link)}>Copier</Btn>
              </div>
            )}
          </Card>

          {invites.length > 0 && (
            <Card className="divide-y divide-[#262626]">
              <p className="p-4 text-xs font-bold uppercase tracking-wide text-gray-400">Invitations en attente</p>
              {invites.map((i) => (
                <div key={i.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{i.email}</p>
                    <p className="text-xs text-gray-400">
                      {ROLE_LABELS[i.role]} • expire le {new Date(i.expiresAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Btn onClick={() => act(() => studioApi(`/creator/podcasts/${podcastId}/invitations/${i.id}`, { method: "DELETE" }))}>Révoquer</Btn>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ───────────── Statistiques ───────────── */
function StatsTab({ podcastId }: { podcastId: string }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    studioApi<Analytics>(`/creator/podcasts/${podcastId}/analytics?days=${days}`).then(setData).catch((e) => setError(e.message));
  }, [podcastId, days]);

  if (error) return <ErrorBanner message={error} />;
  if (!data) return <Loading />;
  const max = Math.max(1, ...data.series.map((d) => d.plays));

  return (
    <div className="space-y-6">
      <div className="flex gap-1.5">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${days === d ? "bg-[#FFBF00] text-[#0B0B0B]" : "bg-[#161616] text-gray-300 border border-[#262626]"}`}>
            {d} jours
          </button>
        ))}
      </div>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Écoutes" value={data.totals.plays.toLocaleString("fr-FR")} />
        <StatCard label="Écoutes qualifiées" value={data.totals.qualifiedPlays.toLocaleString("fr-FR")} hint="30 secondes ou plus" />
        <StatCard label="Temps d'écoute" value={`${data.totals.listeningMinutes.toLocaleString("fr-FR")} min`} />
        <StatCard label="Abonnés" value={data.totals.followers.toLocaleString("fr-FR")} hint={`+${data.totals.newFollowers} sur la période`} />
      </section>
      <Card className="p-5 space-y-3">
        <h3 className="font-bold">Écoutes par jour</h3>
        {data.series.length === 0 ? (
          <p className="text-sm text-gray-500">Pas encore d&apos;écoutes sur cette période.</p>
        ) : (
          <div className="flex items-end gap-1 h-36" role="img" aria-label="Histogramme des écoutes par jour">
            {data.series.map((d) => (
              <div key={d.date} className="flex-1 bg-[#FFBF00] rounded-t min-h-[2px]" style={{ height: `${(d.plays / max) * 100}%` }} title={`${d.date} : ${d.plays} écoute(s)`} />
            ))}
          </div>
        )}
      </Card>
      <Card className="divide-y divide-[#262626]">
        <p className="p-4 text-xs font-bold uppercase tracking-wide text-gray-400">Épisodes les plus écoutés</p>
        {data.topEpisodes.length === 0 ? (
          <Empty>Aucune donnée.</Empty>
        ) : (
          data.topEpisodes.map((e) => (
            <div key={e.episodeId} className="p-4 flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{e.title}</span>
              <span className="font-bold">{e.plays.toLocaleString("fr-FR")}</span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

/* ───────────── Paramètres ───────────── */
function SettingsTab({ podcast, canWrite, canManage, onSaved }: { podcast: Podcast; canWrite: boolean; canManage: boolean; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: podcast.name,
    description: podcast.description,
    shortDescription: podcast.shortDescription ?? "",
    cover: podcast.cover,
    website: podcast.website ?? "",
    primaryLanguageCode: podcast.primaryLanguageCode,
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (patch?: object) => {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      await studioApi(`/creator/podcasts/${podcast.id}`, {
        method: "PATCH",
        body: patch ?? { ...form, shortDescription: form.shortDescription || undefined, website: form.website || undefined },
      });
      setMsg("Modifications enregistrées.");
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const archive = async () => {
    if (!window.confirm("Archiver ce podcast ? Il disparaîtra du catalogue public.")) return;
    setBusy(true);
    try {
      await studioApi(`/creator/podcasts/${podcast.id}`, { method: "DELETE" });
      onSaved();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<any>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-6 max-w-2xl">
      {error && <ErrorBanner message={error} />}
      {msg && <div className="text-sm text-emerald-400">{msg}</div>}
      <Card className="p-5 space-y-4">
        <Field label="Nom du podcast">
          <input className={inputCls} value={form.name} onChange={set("name")} disabled={!canWrite} maxLength={200} />
        </Field>
        <Field label="Description courte" hint="Affichée dans les listes (160 caractères conseillés)">
          <input className={inputCls} value={form.shortDescription} onChange={set("shortDescription")} disabled={!canWrite} maxLength={300} />
        </Field>
        <Field label="Description">
          <textarea className={inputCls} rows={5} value={form.description} onChange={set("description")} disabled={!canWrite} />
        </Field>
        <Field label="Image de couverture (URL)">
          <input className={inputCls} value={form.cover} onChange={set("cover")} disabled={!canWrite} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Langue principale">
            <select className={inputCls} value={form.primaryLanguageCode} onChange={set("primaryLanguageCode")} disabled={!canWrite}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Site web">
            <input className={inputCls} value={form.website} onChange={set("website")} disabled={!canWrite} placeholder="https://" />
          </Field>
        </div>
        {canWrite && (
          <Btn variant="primary" disabled={busy || !form.name.trim() || !form.description.trim()} onClick={() => save()}>
            Enregistrer
          </Btn>
        )}
      </Card>

      {canWrite && podcast.status !== "SUSPENDED" && (
        <Card className="p-5 space-y-3">
          <h3 className="font-bold">Visibilité</h3>
          <p className="text-xs text-gray-400">
            {podcast.status === "PUBLISHED" && "Votre podcast est visible dans le catalogue."}
            {podcast.status === "UNLISTED" && "Votre podcast n'apparaît pas dans le catalogue, mais reste accessible par son lien."}
            {podcast.status === "DRAFT" && "Votre podcast n'est pas encore visible."}
            {podcast.status === "ARCHIVED" && "Votre podcast est archivé."}
            {podcast.status === "PENDING_REVIEW" && "En attente de validation par l'équipe."}
          </p>
          <div className="flex flex-wrap gap-2">
            {podcast.status !== "PUBLISHED" && podcast.status !== "PENDING_REVIEW" && (
              <Btn variant="primary" disabled={busy} onClick={() => save({ status: "PUBLISHED" })}>
                Publier le podcast
              </Btn>
            )}
            {podcast.status === "PUBLISHED" && (
              <Btn disabled={busy} onClick={() => save({ status: "UNLISTED" })}>
                Retirer du catalogue (lien privé)
              </Btn>
            )}
            {podcast.status !== "DRAFT" && podcast.status !== "PENDING_REVIEW" && (
              <Btn disabled={busy} onClick={() => save({ status: "DRAFT" })}>
                Repasser en brouillon
              </Btn>
            )}
          </div>
        </Card>
      )}

      {podcast.userRole === "OWNER" && podcast.status !== "ARCHIVED" && (
        <Card className="p-5 space-y-3 border-red-500/30">
          <h3 className="font-bold text-red-300">Zone sensible</h3>
          <Btn variant="danger" disabled={busy} onClick={archive}>
            Archiver ce podcast
          </Btn>
        </Card>
      )}
      {!canManage && <p className="text-xs text-gray-500">Votre rôle ne permet pas de gérer l&apos;équipe de ce podcast.</p>}
    </div>
  );
}

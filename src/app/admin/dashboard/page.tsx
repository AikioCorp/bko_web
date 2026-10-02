"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, formatBytes, timeAgo, AUDIT_LABELS, REASON_LABELS } from "@/lib/adminApi";
import { useAccess } from "@/components/admin/access";
import { Badge, Btn, Card, Empty, ErrorBanner, Loading, PageHeader, ReasonDialog, StatCard } from "@/components/admin/ui";

type Overview = {
  generatedAt: string;
  kpis: {
    activeListeners24h: number;
    episodesPublished: number;
    episodesThisWeek: number;
    plays7d: number;
    pendingCreatorAccess: number;
    openReports: number;
    storageBytes: number;
    failedJobs: number;
  };
  pendingReview: { episodes: number; podcasts: number };
  reportsByReason: { reason: string; count: number }[];
  recentAudit: { id: string; action: string; entityType: string; createdAt: string; actor?: { fullName: string } | null }[];
};

type Queue = {
  episodes: { id: string; title: string; cover?: string | null; durationSeconds: number; languageCode?: string | null; updatedAt: string; podcast: { name: string; cover: string }; mediaSources: { type: string; provider?: string }[] }[];
  podcasts: { id: string; name: string; cover: string; primaryLanguageCode: string; updatedAt: string; members: { user: { fullName: string } }[] }[];
};

type Pending = { kind: "episodes" | "podcasts"; id: string; label: string; decision: "APPROVE" | "REJECT" };

export default function AdminDashboardPage() {
  const { can } = useAccess();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [queue, setQueue] = useState<Queue | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const [o, q] = await Promise.all([
        adminApi<Overview>("/admin/overview"),
        can("reviews.view") ? adminApi<Queue>("/admin/reviews") : Promise.resolve(null),
      ]);
      setOverview(o);
      setQueue(q);
    } catch (e: any) {
      setError(e.message);
    }
  }, [can]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (reason: string) => {
    if (!pending) return;
    await adminApi(`/admin/reviews/${pending.kind}/${pending.id}`, {
      method: "POST",
      body: { decision: pending.decision, note: reason || undefined },
    });
    setPending(null);
    await load();
  };

  if (!overview && !error) return <Loading label="Chargement de la supervision…" />;

  const k = overview?.kpis;
  const totalPending = (overview?.pendingReview.episodes ?? 0) + (overview?.pendingReview.podcasts ?? 0);

  return (
    <>
      <PageHeader
        title="Supervision Générale de la Plateforme"
        subtitle="Suivi des contenus, de la modération et de l'infrastructure."
        actions={
          <Btn onClick={load} variant="ghost">
            Actualiser les données
          </Btn>
        }
      />
      {error && <ErrorBanner message={error} onRetry={load} />}

      {k && (
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Auditeurs actifs (24 h)" value={k.activeListeners24h.toLocaleString("fr-FR")} hint={`${k.plays7d.toLocaleString("fr-FR")} écoutes sur 7 jours`} />
          <StatCard label="Catalogue audio" value={k.episodesPublished.toLocaleString("fr-FR")} hint={`+${k.episodesThisWeek} cette semaine`} />
          <StatCard label="Créateurs en attente" value={k.pendingCreatorAccess} hint={k.pendingCreatorAccess ? "Action requise" : "Aucune demande"} />
          <StatCard label="Stockage utilisé" value={formatBytes(k.storageBytes)} hint={k.failedJobs ? `${k.failedJobs} tâche(s) en échec` : "Aucune tâche en échec"} />
          <StatCard label="Signalements ouverts" value={k.openReports} tone={k.openReports ? "alert" : undefined} hint={k.openReports ? "À traiter" : "Rien à traiter"} />
        </section>
      )}

      {can("reviews.view") && (
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold">Validation des nouveaux podcasts et épisodes</h2>
          <Badge tone={totalPending ? "amber" : "gray"}>{totalPending} en révision</Badge>
        </div>
        <Card className="overflow-hidden">
          {!queue || (queue.episodes.length === 0 && queue.podcasts.length === 0) ? (
            <Empty>Aucun contenu en attente de validation.</Empty>
          ) : (
            <ul className="divide-y divide-[#262626]">
              {queue.podcasts.map((p) => (
                <li key={p.id} className="p-4 flex flex-wrap items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.cover} alt="" className="w-14 h-14 rounded-lg object-cover bg-[#262626]" />
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      Nouveau podcast • {p.members[0]?.user.fullName ?? "Créateur inconnu"} • soumis {timeAgo(p.updatedAt)}
                    </p>
                  </div>
                  <Badge tone="blue">{p.primaryLanguageCode}</Badge>
                  <div className={`flex gap-2 ${can("reviews.edit") ? "" : "hidden"}`}>
                    <Btn onClick={() => setPending({ kind: "podcasts", id: p.id, label: p.name, decision: "REJECT" })}>Revoir avec le créateur</Btn>
                    <Btn variant="primary" onClick={() => setPending({ kind: "podcasts", id: p.id, label: p.name, decision: "APPROVE" })}>
                      Valider la publication
                    </Btn>
                  </div>
                </li>
              ))}
              {queue.episodes.map((e) => (
                <li key={e.id} className="p-4 flex flex-wrap items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={e.cover || e.podcast.cover} alt="" className="w-14 h-14 rounded-lg object-cover bg-[#262626]" />
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-bold">{e.title}</p>
                    <p className="text-xs text-gray-400">
                      {e.podcast.name} • {Math.round(e.durationSeconds / 60)} min • soumis {timeAgo(e.updatedAt)}
                    </p>
                  </div>
                  <Badge tone="blue">{e.languageCode ?? "—"}</Badge>
                  <Badge>{e.mediaSources[0]?.type ?? "SANS MÉDIA"}</Badge>
                  <div className={`flex gap-2 ${can("reviews.edit") ? "" : "hidden"}`}>
                    <Btn onClick={() => setPending({ kind: "episodes", id: e.id, label: e.title, decision: "REJECT" })}>Revoir avec le créateur</Btn>
                    <Btn variant="primary" onClick={() => setPending({ kind: "episodes", id: e.id, label: e.title, decision: "APPROVE" })}>
                      Valider la publication
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {totalPending === 0 && (
          <p className="text-xs text-gray-500">
            La file se remplit lorsque la validation préalable est activée (variable serveur REQUIRE_CONTENT_REVIEW=true).
          </p>
        )}
      </section>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {can("moderation.view") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold">Signalements ouverts</h2>
            <Link href="/admin/moderation" className="text-xs font-bold text-[#FFBF00]">
              Ouvrir la modération →
            </Link>
          </div>
          <Card className="p-5 space-y-3">
            {overview?.reportsByReason.length ? (
              overview.reportsByReason.map((r) => (
                <div key={r.reason} className="flex items-center justify-between text-sm">
                  <span>{REASON_LABELS[r.reason] ?? r.reason}</span>
                  <Badge tone="amber">{r.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Aucun signalement ouvert.</p>
            )}
          </Card>
        </section>
        )}

        {can("audit.view") && (
        <section className="space-y-4">
          <h2 className="text-xl font-extrabold">Historique des actions récentes</h2>
          <Card className="divide-y divide-[#262626]">
            {overview?.recentAudit.length ? (
              overview.recentAudit.map((a) => (
                <div key={a.id} className="p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">{AUDIT_LABELS[a.action] ?? a.action}</p>
                    <p className="text-xs text-gray-400">
                      Par {a.actor?.fullName ?? "Système"} • {a.entityType}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-500 shrink-0">{timeAgo(a.createdAt)}</span>
                </div>
              ))
            ) : (
              <Empty>Aucune action enregistrée.</Empty>
            )}
          </Card>
        </section>
        )}
      </div>

      {pending && (
        <ReasonDialog
          title={pending.decision === "APPROVE" ? `Valider « ${pending.label} » ?` : `Renvoyer « ${pending.label} » au créateur ?`}
          description={
            pending.decision === "APPROVE"
              ? "Le contenu sera publié immédiatement."
              : "Le contenu repasse en brouillon ; le motif sera visible par le créateur."
          }
          confirmLabel={pending.decision === "APPROVE" ? "Valider" : "Renvoyer"}
          danger={pending.decision === "REJECT"}
          required={pending.decision === "REJECT"}
          onConfirm={decide}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}

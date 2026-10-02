"use client";

import React, { useCallback, useEffect, useState } from "react";
import { adminApi, timeAgo, REASON_LABELS } from "@/lib/adminApi";
import { useAccess } from "@/components/admin/access";
import { Badge, Btn, Card, Empty, ErrorBanner, Loading, PageHeader, ReasonDialog } from "@/components/admin/ui";

type Report = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string | null;
  status: string;
  createdAt: string;
  resolutionNote?: string | null;
  reporter?: { fullName: string } | null;
  target?: { label: string; subLabel?: string; status?: string } | null;
};
type Page = { items: Report[]; total: number; page: number; limit: number };

const STATUS_TABS = [
  { v: "", l: "À traiter" },
  { v: "RESOLVED", l: "Résolus" },
  { v: "REJECTED", l: "Rejetés" },
  { v: "DISMISSED", l: "Classés" },
];
const TARGET_LABELS: Record<string, string> = {
  PODCAST: "Podcast",
  EPISODE: "Épisode",
  PERSON: "Personne",
  COMMENT: "Commentaire",
  CREATOR_PROFILE: "Profil créateur",
};

type Action = { report: Report; kind: "SUSPEND" | "RESOLVE" | "DISMISS" };

export default function ModerationPage() {
  const canEdit = useAccess().can("moderation.edit");
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [error, setError] = useState("");
  const [action, setAction] = useState<Action | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) qs.set("status", status);
      if (reason) qs.set("reason", reason);
      setData(await adminApi<Page>(`/admin/reports?${qs}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [status, reason, page]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, body: object) => {
    await adminApi(`/admin/reports/${id}`, { method: "PATCH", body });
    await load();
  };

  const confirm = async (note: string) => {
    if (!action) return;
    const { report, kind } = action;
    if (kind === "SUSPEND") await patch(report.id, { status: "RESOLVED", action: "SUSPEND_TARGET", note });
    if (kind === "RESOLVE") await patch(report.id, { status: "RESOLVED", note: note || undefined });
    if (kind === "DISMISS") await patch(report.id, { status: "DISMISSED", note: note || undefined });
    setAction(null);
  };

  const canSuspend = (r: Report) => r.targetType === "PODCAST" || r.targetType === "EPISODE";
  const open = (r: Report) => r.status === "OPEN" || r.status === "IN_REVIEW";
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <>
      <PageHeader title="Modération & Signalements" subtitle="Examinez les contenus signalés par la communauté et sanctionnez si nécessaire." />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-[#161616] border border-[#262626] rounded-xl p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.v}
              onClick={() => {
                setStatus(t.v);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${status === t.v ? "bg-[#FFBF00] text-[#0B0B0B]" : "text-gray-300"}`}
            >
              {t.l}
            </button>
          ))}
        </div>
        <select
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setPage(1);
          }}
          className="bg-[#161616] border border-[#262626] rounded-xl px-3 py-2 text-xs text-white"
          aria-label="Filtrer par motif"
        >
          <option value="">Tous les motifs</option>
          {Object.entries(REASON_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {!data && !error && <Loading />}

      {data && (
        <div className="space-y-3">
          {data.items.length === 0 && (
            <Card>
              <Empty>Aucun signalement dans cette vue.</Empty>
            </Card>
          )}
          {data.items.map((r) => (
            <Card key={r.id} className="p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="red">{REASON_LABELS[r.reason] ?? r.reason}</Badge>
                <Badge>{TARGET_LABELS[r.targetType] ?? r.targetType}</Badge>
                {r.target?.status && <Badge tone={r.target.status === "PUBLISHED" ? "green" : "amber"}>{r.target.status}</Badge>}
                {!open(r) && <Badge tone="blue">{r.status}</Badge>}
                <span className="ml-auto text-xs text-gray-500">{timeAgo(r.createdAt)}</span>
              </div>
              <div>
                <p className="font-bold">{r.target ? r.target.label : `Cible supprimée (${r.targetId})`}</p>
                {r.target?.subLabel && <p className="text-xs text-gray-400">{r.target.subLabel}</p>}
              </div>
              {r.description && <p className="text-sm text-gray-300 whitespace-pre-wrap">{r.description}</p>}
              <p className="text-xs text-gray-500">Signalé par {r.reporter?.fullName ?? "un utilisateur supprimé"}</p>
              {r.resolutionNote && <p className="text-xs text-gray-400 border-l-2 border-[#FFBF00] pl-3">Note : {r.resolutionNote}</p>}
              {open(r) && canEdit && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {r.status === "OPEN" && <Btn onClick={() => patch(r.id, { status: "IN_REVIEW" })}>Prendre en charge</Btn>}
                  <Btn onClick={() => setAction({ report: r, kind: "DISMISS" })}>Classer sans suite</Btn>
                  <Btn onClick={() => setAction({ report: r, kind: "RESOLVE" })}>Marquer résolu</Btn>
                  {canSuspend(r) && (
                    <Btn variant="danger" onClick={() => setAction({ report: r, kind: "SUSPEND" })}>
                      Retirer le contenu
                    </Btn>
                  )}
                </div>
              )}
            </Card>
          ))}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 text-xs">
              <Btn disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Précédent
              </Btn>
              <span className="text-gray-400">
                Page {page} / {pages}
              </span>
              <Btn disabled={page >= pages} onClick={() => setPage(page + 1)}>
                Suivant
              </Btn>
            </div>
          )}
        </div>
      )}

      {action && (
        <ReasonDialog
          title={
            action.kind === "SUSPEND"
              ? "Retirer ce contenu du catalogue ?"
              : action.kind === "RESOLVE"
              ? "Marquer ce signalement comme résolu ?"
              : "Classer ce signalement sans suite ?"
          }
          description={
            action.kind === "SUSPEND"
              ? "Le podcast sera suspendu / l'épisode archivé, et le signalement résolu. L'action est journalisée."
              : undefined
          }
          confirmLabel={action.kind === "SUSPEND" ? "Retirer" : "Confirmer"}
          danger={action.kind === "SUSPEND"}
          required={action.kind === "SUSPEND"}
          onConfirm={confirm}
          onCancel={() => setAction(null)}
        />
      )}
    </>
  );
}

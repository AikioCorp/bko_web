"use client";

import React, { useCallback, useEffect, useState } from "react";
import { adminApi, formatBytes, timeAgo } from "@/lib/adminApi";
import { Badge, Btn, Card, Empty, ErrorBanner, Loading, PageHeader, StatCard } from "@/components/admin/ui";
import { useAccess } from "@/components/admin/access";

type Storage = {
  totalBytes: number;
  totalAssets: number;
  byStatus: { status: string; count: number; bytes: number }[];
  topOwners: { owner: { fullName: string; email: string } | null; bytes: number; assets: number }[];
  failedAssets: { id: string; key: string; mimeType: string; sizeBytes: number; createdAt: string; owner: { fullName: string } }[];
  jobsByStatus: { status: string; count: number }[];
  failedJobs: { id: string; queueName: string; jobType: string; attempts: number; lastError?: string | null; updatedAt: string }[];
};

export default function StoragePage() {
  const canRetry = useAccess().can("storage.edit");

  const [data, setData] = useState<Storage | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await adminApi<Storage>("/admin/storage"));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = async (id: string) => {
    setBusyId(id);
    try {
      await adminApi(`/admin/jobs/${id}/retry`, { method: "POST" });
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const count = (status: string) => data?.jobsByStatus.find((j) => j.status === status)?.count ?? 0;

  return (
    <>
      <PageHeader
        title="Stockage & Tâches"
        subtitle="Occupation du stockage média et état de la file de traitement."
        actions={<Btn onClick={load}>Actualiser</Btn>}
      />
      {error && <ErrorBanner message={error} onRetry={load} />}
      {!data && !error && <Loading />}

      {data && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Stockage utilisé" value={formatBytes(data.totalBytes)} hint={`${data.totalAssets} fichiers`} />
            <StatCard label="Tâches en attente" value={count("PENDING") + count("PROCESSING")} />
            <StatCard label="Tâches terminées" value={count("COMPLETED")} />
            <StatCard label="Tâches en échec" value={count("FAILED")} tone={count("FAILED") ? "alert" : undefined} />
          </section>

          <div className="grid lg:grid-cols-2 gap-8">
            <section className="space-y-3">
              <h2 className="text-lg font-extrabold">Plus gros consommateurs</h2>
              <Card className="divide-y divide-[#262626]">
                {data.topOwners.length === 0 ? (
                  <Empty>Aucun fichier stocké.</Empty>
                ) : (
                  data.topOwners.map((o, i) => (
                    <div key={i} className="p-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold">{o.owner?.fullName ?? "Compte supprimé"}</p>
                        <p className="text-xs text-gray-400">{o.owner?.email}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-bold">{formatBytes(o.bytes)}</p>
                        <p className="text-xs text-gray-500">{o.assets} fichiers</p>
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-extrabold">Fichiers par statut</h2>
              <Card className="divide-y divide-[#262626]">
                {data.byStatus.map((s) => (
                  <div key={s.status} className="p-4 flex items-center justify-between">
                    <Badge tone={s.status === "FAILED" ? "red" : s.status === "READY" ? "green" : "gray"}>{s.status}</Badge>
                    <span className="text-sm">
                      {s.count} • {formatBytes(s.bytes)}
                    </span>
                  </div>
                ))}
              </Card>
            </section>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold">Tâches en échec</h2>
            <Card className="divide-y divide-[#262626]">
              {data.failedJobs.length === 0 ? (
                <Empty>Aucune tâche en échec.</Empty>
              ) : (
                data.failedJobs.map((j) => (
                  <div key={j.id} className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">
                        {j.queueName} • {j.jobType}
                      </p>
                      <p className="text-xs text-red-300 truncate" title={j.lastError ?? ""}>
                        {j.lastError ?? "Erreur inconnue"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {j.attempts} tentative(s) • {timeAgo(j.updatedAt)}
                      </p>
                    </div>
                    {canRetry && (
                      <Btn variant="primary" disabled={busyId === j.id} onClick={() => retry(j.id)}>
                        {busyId === j.id ? "…" : "Relancer"}
                      </Btn>
                    )}
                  </div>
                ))
              )}
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-extrabold">Fichiers médias en échec</h2>
            <Card className="divide-y divide-[#262626]">
              {data.failedAssets.length === 0 ? (
                <Empty>Aucun fichier en échec.</Empty>
              ) : (
                data.failedAssets.map((a) => (
                  <div key={a.id} className="p-4 flex items-center justify-between gap-4 text-sm">
                    <div className="min-w-0">
                      <p className="font-bold truncate">{a.key}</p>
                      <p className="text-xs text-gray-400">
                        {a.owner.fullName} • {a.mimeType} • {formatBytes(a.sizeBytes)}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-500 shrink-0">{timeAgo(a.createdAt)}</span>
                  </div>
                ))
              )}
            </Card>
          </section>
        </>
      )}
    </>
  );
}

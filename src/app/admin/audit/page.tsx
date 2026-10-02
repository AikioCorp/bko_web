"use client";

import React, { useCallback, useEffect, useState } from "react";
import { adminApi, timeAgo, AUDIT_LABELS } from "@/lib/adminApi";
import { Btn, Card, Empty, ErrorBanner, Loading, PageHeader } from "@/components/admin/ui";

type Log = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress?: string | null;
  createdAt: string;
  actor?: { fullName: string; email: string } | null;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setLogs(await adminApi<Log[]>("/admin/audit"));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Journal d'audit" subtitle="Les 50 dernières actions d'administration." actions={<Btn onClick={load}>Actualiser</Btn>} />
      {error && <ErrorBanner message={error} onRetry={load} />}
      {!logs && !error && <Loading />}
      {logs && (
        <Card className="divide-y divide-[#262626]">
          {logs.length === 0 ? (
            <Empty>Aucune action enregistrée.</Empty>
          ) : (
            logs.map((l) => (
              <div key={l.id} className="p-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">{AUDIT_LABELS[l.action] ?? l.action}</p>
                  <p className="text-xs text-gray-400">
                    Par {l.actor?.fullName ?? "Système"} • {l.entityType} <span className="font-mono">{l.entityId.slice(0, 10)}</span>
                    {l.ipAddress ? ` • ${l.ipAddress}` : ""}
                  </p>
                </div>
                <span className="text-[11px] text-gray-500">{timeAgo(l.createdAt)}</span>
              </div>
            ))
          )}
        </Card>
      )}
    </>
  );
}

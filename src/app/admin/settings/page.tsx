"use client";

import React, { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { Badge, Card, ErrorBanner, Loading, PageHeader } from "@/components/admin/ui";

type Settings = {
  featureFlags: Record<string, boolean>;
  storage: { provider: string; configured: boolean };
  transcription: { provider: string; configured: boolean };
  environment: string;
};

const FLAG_LABELS: Record<string, [string, string]> = {
  uploads: ["Upload natif", "ENABLE_UPLOADS"],
  rss: ["Import RSS", "ENABLE_RSS"],
  transcription: ["Transcription automatique", "ENABLE_TRANSCRIPTION"],
  requireVerifiedLogin: ["Vérification OTP obligatoire à la connexion", "REQUIRE_VERIFIED_LOGIN"],
  requireContentReview: ["Validation préalable des contenus créateurs", "REQUIRE_CONTENT_REVIEW"],
};

export default function SettingsPage() {
  const [data, setData] = useState<Settings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi<Settings>("/admin/settings").then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <PageHeader
        title="Configuration"
        subtitle="État des fonctionnalités et des services. Lecture seule : les clés et secrets ne transitent jamais par la console, ils se gèrent dans l'environnement du serveur."
      />
      {error && <ErrorBanner message={error} />}
      {!data && !error && <Loading />}
      {data && (
        <>
          <Card className="divide-y divide-[#262626]">
            {Object.entries(data.featureFlags).map(([k, v]) => (
              <div key={k} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold">{FLAG_LABELS[k]?.[0] ?? k}</p>
                  <p className="text-[11px] text-gray-500 font-mono">{FLAG_LABELS[k]?.[1]}</p>
                </div>
                <Badge tone={v ? "green" : "gray"}>{v ? "Activé" : "Désactivé"}</Badge>
              </div>
            ))}
          </Card>
          <Card className="divide-y divide-[#262626]">
            <Row label="Environnement" value={<Badge tone={data.environment === "production" ? "green" : "amber"}>{data.environment}</Badge>} />
            <Row
              label={`Stockage (${data.storage.provider})`}
              value={<Badge tone={data.storage.configured ? "green" : "red"}>{data.storage.configured ? "Configuré" : "Non configuré"}</Badge>}
            />
            <Row
              label={`Transcription (${data.transcription.provider})`}
              value={<Badge tone={data.transcription.configured ? "green" : "red"}>{data.transcription.configured ? "Clé présente" : "Clé absente"}</Badge>}
            />
          </Card>
        </>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <p className="text-sm font-bold">{label}</p>
      {value}
    </div>
  );
}

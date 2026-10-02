"use client";

import React from "react";
import { Badge } from "@/components/admin/ui";

export const EPISODE_STATUS: Record<string, { label: string; tone: "gray" | "amber" | "red" | "green" | "blue" }> = {
  DRAFT: { label: "Brouillon", tone: "gray" },
  PENDING_REVIEW: { label: "En validation", tone: "amber" },
  SCHEDULED: { label: "Programmé", tone: "blue" },
  PUBLISHED: { label: "Publié", tone: "green" },
  UNLISTED: { label: "Non répertorié", tone: "gray" },
  ARCHIVED: { label: "Archivé", tone: "gray" },
  PROCESSING: { label: "Traitement", tone: "amber" },
  FAILED: { label: "Échec", tone: "red" },
};

export const PODCAST_STATUS: Record<string, { label: string; tone: "gray" | "amber" | "red" | "green" | "blue" }> = {
  DRAFT: { label: "Brouillon", tone: "gray" },
  PENDING_REVIEW: { label: "En validation", tone: "amber" },
  PUBLISHED: { label: "Publié", tone: "green" },
  UNLISTED: { label: "Non répertorié", tone: "gray" },
  ARCHIVED: { label: "Archivé", tone: "gray" },
  SUSPENDED: { label: "Suspendu", tone: "red" },
};

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
  ANALYST: "Analyste",
};

export const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "bm", label: "Bamanankan" },
  { code: "en", label: "Anglais" },
];

export function StatusBadge({ status, kind = "episode" }: { status: string; kind?: "episode" | "podcast" }) {
  const map = kind === "episode" ? EPISODE_STATUS : PODCAST_STATUS;
  const s = map[status] ?? { label: status, tone: "gray" as const };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-bold text-gray-300">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-gray-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full bg-[#0B0B0B] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FFBF00]";

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-[#262626]" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 -mb-px ${
            active === t.key ? "border-[#FFBF00] text-[#FFBF00]" : "border-transparent text-gray-400 hover:text-white"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Message d'état de la validation, affiché quand la modération préalable est active. */
export function ReviewNotice({ status }: { status: string }) {
  if (status !== "PENDING_REVIEW") return null;
  return (
    <div className="bg-[#FFBF00]/10 border border-[#FFBF00]/30 text-[#FFBF00] text-sm rounded-xl p-4">
      Ce contenu est en cours de validation par l&apos;équipe Bamako Podcast. Il sera publié dès son approbation ; vous serez
      informé ici s&apos;il doit être corrigé.
    </div>
  );
}

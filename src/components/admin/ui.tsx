"use client";

import React, { useState } from "react";

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`bg-[#161616] border border-[#262626] rounded-2xl ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ tone = "gray", children }: { tone?: "gray" | "amber" | "red" | "green" | "blue"; children: React.ReactNode }) {
  const tones = {
    gray: "bg-[#262626] text-gray-300",
    amber: "bg-[#FFBF00]/15 text-[#FFBF00]",
    red: "bg-red-500/15 text-red-400",
    green: "bg-emerald-500/15 text-emerald-400",
    blue: "bg-sky-500/15 text-sky-400",
  };
  return <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${tones[tone]}`}>{children}</span>;
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" };
export function Btn({ variant = "ghost", className = "", ...p }: BtnProps) {
  const v = {
    primary: "bg-[#FFBF00] text-[#0B0B0B] hover:bg-[#ffd13d]",
    ghost: "bg-[#262626] text-white hover:bg-[#333]",
    danger: "bg-red-600 text-white hover:bg-red-500",
  }[variant];
  return (
    <button
      {...p}
      className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${v} ${className}`}
    />
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: "alert" }) {
  return (
    <Card className="p-5 space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-3xl font-extrabold ${tone === "alert" ? "text-red-400" : "text-white"}`}>{value}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </Card>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-4 flex items-center justify-between gap-4">
      <span>{message}</span>
      {onRetry && (
        <Btn onClick={onRetry} variant="ghost">
          Réessayer
        </Btn>
      )}
    </div>
  );
}

export function Loading({ label = "Chargement…" }: { label?: string }) {
  return <div className="p-10 text-center text-sm text-gray-500">{label}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="p-10 text-center text-sm text-gray-500">{children}</div>;
}

/** Fenêtre de confirmation avec saisie d'un motif (obligatoire ou non). */
export function ReasonDialog({
  title,
  description,
  confirmLabel,
  danger,
  required = true,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: string;
  confirmLabel: string;
  danger?: boolean;
  required?: boolean;
  onConfirm: (reason: string) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm(reason.trim());
    } catch (e: any) {
      setError(e?.message || "Action impossible.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <Card className="w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {description && <p className="text-sm text-gray-400">{description}</p>}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder={required ? "Motif (obligatoire)" : "Note (facultatif)"}
          className="w-full bg-[#0B0B0B] border border-[#262626] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#FFBF00]"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Btn onClick={onCancel} disabled={busy}>
            Annuler
          </Btn>
          <Btn variant={danger ? "danger" : "primary"} onClick={submit} disabled={busy || (required && !reason.trim())}>
            {busy ? "…" : confirmLabel}
          </Btn>
        </div>
      </Card>
    </div>
  );
}

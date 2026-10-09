"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { studioApi, timeAgo } from "@/lib/studioApi";
import { useAuthStore } from "@/store/authStore";

type Notif = { id: string; title: string; body?: string | null; link?: string | null; readAt?: string | null; createdAt: string };

export default function NotificationsPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authLoading = useAuthStore((s) => s.isLoading);
  const [items, setItems] = useState<Notif[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (before?: string) => {
    try {
      const r = await studioApi<{ items: Notif[]; unread: number }>(`/me/notifications?limit=30${before ? `&before=${encodeURIComponent(before)}` : ""}`);
      setItems((cur) => (before && cur ? [...cur, ...r.items] : r.items));
      setUnread(r.unread);
      setMore(r.items.length === 30);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const markAll = async () => {
    await studioApi("/me/notifications/read", { method: "POST", body: {} }).catch(() => {});
    setItems((l) => l?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? null);
    setUnread(0);
  };
  const markOne = (id: string) => {
    studioApi("/me/notifications/read", { method: "POST", body: { ids: [id] } }).catch(() => {});
    setItems((l) => l?.map((n) => (n.id === id ? { ...n, readAt: n.readAt ?? new Date().toISOString() } : n)) ?? null);
    setUnread((c) => Math.max(0, c - 1));
  };

  if (authLoading) return <div className="p-20 text-center text-sm text-gray-500">Chargement…</div>;
  if (!isAuthenticated)
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-3">
        <p className="text-sm text-gray-400">Connectez-vous pour voir vos notifications.</p>
        <Link href="/login?redirect=/notifications" className="inline-block bg-[#FFBF00] text-[#0B0B0B] text-sm font-bold px-4 py-2 rounded-lg">Se connecter</Link>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Notifications</h1>
        {unread > 0 && (
          <button onClick={markAll} className="text-xs text-[#FFBF00] font-bold hover:underline">
            Tout marquer comme lu ({unread})
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {!items && !error && <p className="text-sm text-gray-500">Chargement…</p>}
      {items && items.length === 0 && <p className="text-sm text-gray-500 bg-[#161616] border border-[#262626] rounded-xl p-8 text-center">Aucune notification.</p>}
      {items && items.length > 0 && (
        <ul className="border border-[#262626] rounded-2xl overflow-hidden divide-y divide-[#1c1c1c]">
          {items.map((n) => {
            const inner = (
              <div className={`px-4 py-3.5 flex gap-3 ${n.readAt ? "bg-[#121212]" : "bg-[#FFBF00]/5"}`}>
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.readAt ? "bg-transparent" : "bg-[#FFBF00]"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{n.title}</p>
                  {n.body && <p className="text-xs text-[#B8B8B8] mt-0.5">{n.body}</p>}
                  <p className="text-[11px] text-[#757575] mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link href={n.link} onClick={() => !n.readAt && markOne(n.id)} className="block hover:brightness-125">
                    {inner}
                  </Link>
                ) : (
                  <button onClick={() => !n.readAt && markOne(n.id)} className="block w-full text-left">
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {more && items && (
        <button onClick={() => load(items[items.length - 1].createdAt)} className="mx-auto block bg-[#262626] text-white text-xs font-bold px-4 py-2 rounded-lg">
          Voir plus
        </button>
      )}
    </div>
  );
}

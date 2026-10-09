"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { studioApi, timeAgo } from "@/lib/studioApi";
import { useAuthStore } from "@/store/authStore";

type Notif = { id: string; type: string; title: string; body?: string | null; link?: string | null; readAt?: string | null; createdAt: string };

/** Cloche de notifications : compteur de non-lues (interrogé toutes les 60 s) et liste déroulante. */
export function NotificationBell({ align = "right" }: { align?: "right" | "left" }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const refreshCount = useCallback(async () => {
    try {
      setUnread((await studioApi<{ unread: number }>("/me/notifications/unread-count")).unread);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshCount();
    // Pas d'interrogation quand l'onglet est caché.
    const t = setInterval(() => document.visibilityState === "visible" && refreshCount(), 60000);
    return () => clearInterval(t);
  }, [isAuthenticated, refreshCount]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!mounted || !isAuthenticated) return null;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        const r = await studioApi<{ items: Notif[]; unread: number }>("/me/notifications?limit=10");
        setItems(r.items);
        setUnread(r.unread);
      } catch {
        setItems([]);
      }
    }
  };

  const markAll = async () => {
    try {
      await studioApi("/me/notifications/read", { method: "POST", body: {} });
      setItems((list) => list?.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })) ?? null);
      setUnread(0);
    } catch {}
  };

  const openItem = async (n: Notif) => {
    setOpen(false);
    if (!n.readAt) {
      studioApi("/me/notifications/read", { method: "POST", body: { ids: [n.id] } }).catch(() => {});
      setUnread((c) => Math.max(0, c - 1));
    }
    if (n.link) router.push(n.link);
  };

  return (
    <div className="relative" ref={box}>
      <button
        onClick={toggle}
        aria-label={unread ? `${unread} notification(s) non lue(s)` : "Notifications"}
        aria-expanded={open}
        className="relative w-8 h-8 rounded-full bg-[#161616] border border-[#2A2A2A] text-[#B8B8B8] hover:text-white hover:border-[#FFBF00]/50 flex items-center justify-center"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FFBF00] text-[#0B0B0B] text-[10px] font-extrabold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-2 w-80 max-w-[90vw] bg-[#141414] border border-[#282828] rounded-2xl shadow-2xl z-[60] overflow-hidden`}>
          <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between">
            <p className="text-sm font-bold text-white">Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-[11px] text-[#FFBF00] font-bold hover:underline">
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!items ? (
              <p className="p-6 text-center text-xs text-gray-500">Chargement…</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-xs text-gray-500">Aucune notification pour le moment.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-[#1c1c1c] hover:bg-[#1A1A1A] flex gap-3 ${n.readAt ? "" : "bg-[#FFBF00]/5"}`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.readAt ? "bg-transparent" : "bg-[#FFBF00]"}`} />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-white">{n.title}</span>
                    {n.body && <span className="block text-[11px] text-[#B8B8B8] line-clamp-2">{n.body}</span>}
                    <span className="block text-[10px] text-[#757575] mt-0.5">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block text-center text-xs font-bold text-[#FFBF00] py-3 hover:bg-[#1A1A1A]">
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, timeAgo } from "@/lib/adminApi";
import { Badge, Btn, Card, Empty, ErrorBanner, Loading, PageHeader } from "@/components/admin/ui";

type Podcast = {
  id: string;
  slug: string;
  name: string;
  cover: string;
  status: string;
  ownershipStatus: string;
  creationSource: string;
  createdAt: string;
  country: { name: string };
  primaryLanguage: { name: string };
  rssFeed?: { syncStatus?: string } | null;
  _count: { episodes: number; followers: number; claims: number };
};
type Data = { items: Podcast[]; pagination: { page: number; total: number; totalPages: number } };

const STATUSES = ["", "PUBLISHED", "PENDING_REVIEW", "DRAFT", "UNLISTED", "SUSPENDED", "ARCHIVED"];
const STATUS_TONE: Record<string, "green" | "amber" | "red" | "gray"> = {
  PUBLISHED: "green",
  PENDING_REVIEW: "amber",
  SUSPENDED: "red",
};

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "20" });
      if (query) qs.set("search", query);
      if (status) qs.set("status", status);
      setData(await adminApi<Data>(`/admin/catalog?${qs}`));
    } catch (e: any) {
      setError(e.message);
    }
  }, [query, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader title="Podcasts & Séries" subtitle="Catalogue complet, quel que soit le statut de publication." />

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un podcast…"
          className="flex-1 min-w-[240px] bg-[#161616] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFBF00]"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="bg-[#161616] border border-[#262626] rounded-xl px-3 text-sm text-white"
          aria-label="Filtrer par statut"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s || "Tous les statuts"}
            </option>
          ))}
        </select>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}
      {!data && !error && <Loading />}

      {data && (
        <Card className="divide-y divide-[#262626]">
          {data.items.length === 0 ? (
            <Empty>Aucun podcast ne correspond.</Empty>
          ) : (
            data.items.map((p) => (
              <div key={p.id} className="p-4 flex flex-wrap items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.cover} alt="" className="w-14 h-14 rounded-lg object-cover bg-[#262626]" />
                <div className="flex-1 min-w-[200px]">
                  <Link href={`/podcasts/${p.slug}`} className="font-bold hover:text-[#FFBF00]">
                    {p.name}
                  </Link>
                  <p className="text-xs text-gray-400">
                    {p.country.name} • {p.primaryLanguage.name} • {p._count.episodes} épisodes • {p._count.followers} abonnés • créé {timeAgo(p.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone={STATUS_TONE[p.status] ?? "gray"}>{p.status}</Badge>
                  <Badge>{p.ownershipStatus}</Badge>
                  {p.rssFeed?.syncStatus === "ERROR" && <Badge tone="red">RSS en erreur</Badge>}
                  {p._count.claims > 0 && <Badge tone="blue">{p._count.claims} revendication(s)</Badge>}
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <Btn disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Précédent
          </Btn>
          <span className="text-gray-400">
            Page {page} / {data.pagination.totalPages} • {data.pagination.total} podcasts
          </span>
          <Btn disabled={page >= data.pagination.totalPages} onClick={() => setPage(page + 1)}>
            Suivant
          </Btn>
        </div>
      )}
    </>
  );
}

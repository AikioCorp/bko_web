"use client";
import { AdminAction } from "@/components/admin/AdminAccess";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  FileText,
  AtSign,
  Globe,
  Hash,
  Search,
  RefreshCw,
  Loader2,
  BadgeCheck,
  Podcast,
  User,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Check,
  X,
  FileUp,
  MessageSquare,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";

function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

interface ClaimItem {
  id: string;
  userId: string;
  podcastId: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  verificationMethod: "EMAIL_DOMAIN" | "WEBSITE" | "RSS_CHALLENGE" | "DOCUMENT" | "MANUAL";
  proofDescription: string;
  proofDocumentUrl?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatar?: string | null;
  };
  podcast: {
    id: string;
    name: string;
    slug: string;
    cover: string;
    ownershipStatus: string;
    country?: { name: string; flagEmoji?: string | null } | null;
  };
}

export default function AdminClaimsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);

  // Modale de traitement
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED" | "UNDER_REVIEW" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetcher = (url: string) => adminApi(url).then((res) => res.data);
  const { data: claims, mutate, isLoading, isValidating } = useSWR<ClaimItem[]>(
    `/admin/claims${statusFilter !== "ALL" ? `?status=${statusFilter}` : ""}`,
    fetcher
  );

  // Filtrage local par recherche
  const filteredClaims = useMemo(() => {
    if (!claims) return [];
    if (!searchTerm.trim()) return claims;
    const q = searchTerm.toLowerCase();
    return claims.filter(
      (c) =>
        c.podcast?.name?.toLowerCase().includes(q) ||
        c.user?.fullName?.toLowerCase().includes(q) ||
        c.user?.email?.toLowerCase().includes(q) ||
        c.proofDescription?.toLowerCase().includes(q)
    );
  }, [claims, searchTerm]);

  // KPIs
  const stats = useMemo(() => {
    if (!claims) return { pending: 0, underReview: 0, approved: 0, rejected: 0, total: 0 };
    return {
      pending: claims.filter((c) => c.status === "PENDING").length,
      underReview: claims.filter((c) => c.status === "UNDER_REVIEW").length,
      approved: claims.filter((c) => c.status === "APPROVED").length,
      rejected: claims.filter((c) => c.status === "REJECTED").length,
      total: claims.length,
    };
  }, [claims]);

  const handleOpenReview = (claim: ClaimItem, decision: "APPROVED" | "REJECTED" | "UNDER_REVIEW") => {
    setSelectedClaim(claim);
    setReviewDecision(decision);
    setReviewNotes(claim.reviewNotes || "");
  };

  const handleSubmitReview = async () => {
    if (!selectedClaim || !reviewDecision) return;
    if (reviewDecision === "REJECTED" && !reviewNotes.trim()) {
      alert("Veuillez renseigner le motif du rejet.");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi(`/admin/claims/${selectedClaim.id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          status: reviewDecision,
          reviewNotes: reviewNotes.trim(),
        }),
      });
      await mutate();
      showToast(
        reviewDecision === "APPROVED"
          ? `Revendication approuvée pour « ${selectedClaim.podcast.name} ». Propriété transférée !`
          : reviewDecision === "REJECTED"
          ? `Revendication rejetée.`
          : `Demande passée en cours d'examen.`
      );
      setSelectedClaim(null);
      setReviewDecision(null);
      setReviewNotes("");
    } catch (err: any) {
      alert("Erreur lors de la validation : " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "EMAIL_DOMAIN":
        return (
          <span className="px-2.5 py-1 rounded-md bg-[#0F223D] border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-semibold flex items-center gap-1.5">
            <AtSign className="w-3.5 h-3.5" />
            Email Domaine
          </span>
        );
      case "WEBSITE":
        return (
          <span className="px-2.5 py-1 rounded-md bg-[#251838] border border-[#9333EA]/30 text-[#C084FC] text-xs font-semibold flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Site Officiel
          </span>
        );
      case "DOCUMENT":
        return (
          <span className="px-2.5 py-1 rounded-md bg-[#0E2C2C] border border-[#14B8A6]/30 text-[#2DD4BF] text-xs font-semibold flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Pièce Justificative
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md bg-[#222222] border border-[#333333] text-[#CCCCCC] text-xs font-semibold flex items-center gap-1.5">
            <FileUp className="w-3.5 h-3.5" />
            Déclaration Manuelle
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            En attente
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-300 text-xs font-bold flex items-center gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin" />
            En examen
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Approuvée
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-bold flex items-center gap-1.5">
            <XCircle className="w-3 h-3" />
            Rejetée
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1A1A] border border-[#333333] text-white px-5 py-3 rounded-xl shadow-2xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#FFBF00]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#222222] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#888888] mb-1.5 uppercase tracking-wider font-semibold">
            <span>Administration</span>
            <span>/</span>
            <span className="text-[#FFBF00]">Modération</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Revendications de Podcasts
            {isValidating && <Loader2 className="w-5 h-5 text-[#FFBF00] animate-spin inline-block" />}
          </h1>
          <p className="text-sm text-[#888888] mt-1 max-w-2xl">
            Examinez et validez les demandes de propriété d&apos;auteurs et créateurs sur les émissions du catalogue. L&apos;approbation transfère la gestion complète au demandeur.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            className="border-[#2A2A2A] bg-[#141414] hover:bg-[#1C1C1C] text-[#CCCCCC] hover:text-white"
          >
            <RefreshCw className={classNames("w-4 h-4 mr-2", isValidating && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>En attente d&apos;examen</span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{stats.pending}</div>
          <div className="text-xs text-[#777777] mt-1">Nécessite une décision éditoriale</div>
        </div>

        <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>En cours d&apos;examen</span>
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-400">{stats.underReview}</div>
          <div className="text-xs text-[#777777] mt-1">Dossiers en cours d&apos;investigation</div>
        </div>

        <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Revendications Validées</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">{stats.approved}</div>
          <div className="text-xs text-[#777777] mt-1">Podcasts attribués avec succès</div>
        </div>

        <div className="bg-[#141414] border border-[#222222] rounded-2xl p-5">
          <div className="flex items-center justify-between text-[#888888] text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Demandes Rejetées</span>
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-red-400">{stats.rejected}</div>
          <div className="text-xs text-[#777777] mt-1">Preuves insuffisantes ou non conformes</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#141414] border border-[#222222] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Champ de recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par podcast, demandeur, email..."
            className="w-full h-10 pl-10 pr-4 bg-[#0E0E0E] border border-[#262626] rounded-xl text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#FFBF00] transition-colors"
          />
        </div>

        {/* Onglets Filtre Statut */}
        <div className="flex bg-[#0E0E0E] p-1 rounded-xl border border-[#262626] text-xs font-medium">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={classNames(
              "px-3 py-1.5 rounded-lg transition-colors",
              statusFilter === "ALL" ? "bg-[#222222] text-white" : "text-[#888888] hover:text-white"
            )}
          >
            Toutes
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={classNames(
              "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
              statusFilter === "PENDING" ? "bg-amber-950 text-amber-300" : "text-[#888888] hover:text-white"
            )}
          >
            En attente ({stats.pending})
          </button>
          <button
            onClick={() => setStatusFilter("APPROVED")}
            className={classNames(
              "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
              statusFilter === "APPROVED" ? "bg-emerald-950 text-emerald-300" : "text-[#888888] hover:text-white"
            )}
          >
            Approuvées
          </button>
          <button
            onClick={() => setStatusFilter("REJECTED")}
            className={classNames(
              "px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5",
              statusFilter === "REJECTED" ? "bg-red-950 text-red-300" : "text-[#888888] hover:text-white"
            )}
          >
            Rejetées
          </button>
        </div>
      </div>

      {/* Liste des revendications */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <Loader2 className="w-8 h-8 text-[#FFBF00] animate-spin" />
          <span className="text-sm text-[#888888]">Chargement des revendications...</span>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-[#141414] border border-[#222222] rounded-2xl p-12 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center mx-auto mb-4 text-[#888888]">
            <ShieldAlert className="w-8 h-8 text-[#FFBF00]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Aucune demande trouvée</h3>
          <p className="text-sm text-[#888888]">
            {searchTerm
              ? `Aucune revendication ne correspond à « ${searchTerm} ».`
              : "Aucune demande de revendication dans cette catégorie pour le moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <div
              key={claim.id}
              className="bg-[#141414] border border-[#222222] hover:border-[#333333] rounded-2xl p-6 transition-all space-y-5"
            >
              {/* Header de la carte */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Podcast ciblé */}
                <div className="flex items-start gap-4 min-w-0">
                  <img
                    src={claim.podcast?.cover || "/default-cover.jpg"}
                    alt={claim.podcast?.name}
                    className="w-16 h-16 rounded-xl object-cover bg-[#222222] border border-[#2A2A2A] shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#FFBF00]">Podcast Ciblé</span>
                      {getStatusBadge(claim.status)}
                    </div>
                    <h3 className="text-lg font-bold text-white truncate">
                      {claim.podcast?.name || "Podcast inconnu"}
                    </h3>
                    <div className="text-xs text-[#777777] flex items-center gap-2 mt-0.5">
                      <span>ID : {claim.podcast?.id}</span>
                      <span>•</span>
                      <Link
                        href={`/podcasts/${claim.podcast?.slug}`}
                        target="_blank"
                        className="text-[#FFBF00] hover:underline flex items-center gap-0.5"
                      >
                        Voir page publique
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Demandeur */}
                <div className="bg-[#101010] border border-[#222222] rounded-xl p-3.5 flex items-center gap-3 shrink-0 lg:min-w-[280px]">
                  <div className="w-10 h-10 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                    {claim.user?.avatar ? (
                      <img src={claim.user.avatar} alt={claim.user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      claim.user?.fullName?.charAt(0).toUpperCase() || "U"
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Demandeur</div>
                    <div className="text-sm font-bold text-white truncate">{claim.user?.fullName}</div>
                    <div className="text-xs text-[#777777] font-mono truncate">{claim.user?.email}</div>
                  </div>
                </div>
              </div>

              {/* Justification & Méthode */}
              <div className="bg-[#0D0D0D] border border-[#1E1E1E] rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C1C1C] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#888888]">Méthode de validation :</span>
                    {getMethodBadge(claim.verificationMethod)}
                  </div>

                  <span className="text-xs text-[#666666]">
                    Reçue le {new Date(claim.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>

                <div>
                  <div className="text-xs text-[#888888] font-medium mb-1">Motif et justification fournie :</div>
                  <p className="text-xs text-[#DDDDDD] leading-relaxed whitespace-pre-wrap">
                    {claim.proofDescription || "Aucune description renseignée."}
                  </p>
                </div>

                {claim.proofDocumentUrl && (
                  <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-xs">
                    <span className="text-[#888888]">Document justificatif :</span>
                    <a
                      href={claim.proofDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#FFBF00] hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>Consulter la pièce justificative</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {claim.reviewNotes && (
                  <div className="pt-2 border-t border-[#1C1C1C] bg-[#161616] p-3 rounded-lg text-xs">
                    <div className="text-[#888888] font-bold mb-0.5">Notes de l&apos;administration :</div>
                    <p className="text-[#CCCCCC]">{claim.reviewNotes}</p>
                  </div>
                )}
              </div>

              {/* Barre d'action */}
              {claim.status === "PENDING" || claim.status === "UNDER_REVIEW" ? (
                <div className="pt-2 flex flex-wrap items-center justify-end gap-3 border-t border-[#222222]">
                  {claim.status === "PENDING" && (
                    <AdminAction permission="claims.edit"><Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenReview(claim, "UNDER_REVIEW")}
                      className="border-[#333333] bg-[#1A1A1A] text-[#CCCCCC] hover:text-white text-xs"
                    >
                      Mettre en examen
                    </Button></AdminAction>
                  )}

                  <AdminAction permission="claims.edit"><Button
                    size="sm"
                    onClick={() => handleOpenReview(claim, "REJECTED")}
                    className="bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-bold"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    Rejeter la demande
                  </Button></AdminAction>

                  <AdminAction permission="claims.edit"><Button
                    size="sm"
                    onClick={() => handleOpenReview(claim, "APPROVED")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Approuver la propriété
                  </Button></AdminAction>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODALE DE DÉCISION (APPROUVER / REJETER)                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedClaim && reviewDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedClaim(null)} />
          <div className="relative w-full max-w-lg bg-[#141414] border border-[#2A2A2A] rounded-2xl shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {reviewDecision === "APPROVED"
                    ? "Approuver la revendication"
                    : reviewDecision === "REJECTED"
                    ? "Rejeter la revendication"
                    : "Passer en cours d'examen"}
                </h3>
                <p className="text-xs text-[#888888]">
                  Podcast : <strong className="text-white">{selectedClaim.podcast.name}</strong> • Demandeur :{" "}
                  <strong className="text-white">{selectedClaim.user.fullName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                className="w-7 h-7 rounded-lg bg-[#222222] text-[#888888] hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewDecision === "APPROVED" && (
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs rounded-xl space-y-1.5 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Conséquences de l&apos;approbation :
                </div>
                <ul className="list-disc list-inside space-y-1 text-emerald-200/90 pl-1">
                  <li>Le podcast passe au statut de propriété officiel <strong>CLAIMED</strong>.</li>
                  <li>L&apos;utilisateur devient <strong>OWNER</strong> dans l&apos;équipe du podcast.</li>
                  <li>Le rôle <strong>CREATOR</strong> et un profil créateur officiel lui sont automatiquement accordés.</li>
                  <li>Une notification de confirmation est envoyée dans son application.</li>
                </ul>
              </div>
            )}

            {reviewDecision === "REJECTED" && (
              <div className="p-3 bg-red-950/40 border border-red-800/40 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Un motif précis est requis pour informer l&apos;utilisateur des raisons du refus.</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#CCCCCC] uppercase tracking-wider mb-1.5">
                Notes d&apos;examen & Motif {reviewDecision === "REJECTED" && "*"}
              </label>
              <textarea
                rows={3}
                required={reviewDecision === "REJECTED"}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewDecision === "APPROVED"
                    ? "Notes optionnelles (ex: pièces d'identité et contrat conformes vérifiés le...)"
                    : "Indiquez les raisons du rejet pour le demandeur..."
                }
                className="w-full p-3 bg-[#0E0E0E] border border-[#2A2A2A] rounded-xl text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#FFBF00] resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#222222]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedClaim(null)}
                className="border-[#2A2A2A] bg-[#1C1C1C] text-[#CCCCCC]"
              >
                Annuler
              </Button>
              <AdminAction permission="claims.edit"><Button
                size="sm"
                disabled={isSubmitting}
                onClick={handleSubmitReview}
                className={classNames(
                  "font-bold text-xs",
                  reviewDecision === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : reviewDecision === "REJECTED"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-[#FFBF00] text-[#0B0B0B]"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Enregistrement...
                  </>
                ) : reviewDecision === "APPROVED" ? (
                  "Confirmer l'approbation"
                ) : reviewDecision === "REJECTED" ? (
                  "Confirmer le rejet"
                ) : (
                  "Mettre en examen"
                )}
              </Button></AdminAction>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

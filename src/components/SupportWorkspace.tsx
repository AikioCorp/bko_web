"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { hasPermission } from "@/lib/admin-permissions";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import {
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  User,
  Mail,
  FileText,
  Tag,
  MessageSquare,
  Send,
  RefreshCw,
  Clock,
  ChevronRight,
  CheckCircle2,
  Plus,
  ArrowLeft,
  Inbox,
  ChevronDown,
  LogOut,
  HelpCircle,
  Lock,
  BadgeCheck,
} from "lucide-react";

interface SupportWorkspaceProps {
  admin?: boolean;
}

interface SuspendedProfileDetails {
  userId?: string;
  email?: string;
  fullName?: string;
  avatar?: string | null;
  reason?: string;
  isPermanent?: boolean;
  suspendedAt?: string;
  supportToken?: string;
}

const CATEGORIES = [
  { value: "Compte suspendu", label: "Recours & Suspension de compte" },
  { value: "Général", label: "Question générale & Assistance" },
  { value: "Compte et connexion", label: "Sécurité & Problème de connexion" },
  { value: "Lecture et audio", label: "Lecture audio & Streaming" },
  { value: "Téléchargements", label: "Téléchargements hors-ligne" },
  { value: "Studio et publication", label: "Studio Créateur & Émissions" },
  { value: "Abonnement", label: "Abonnement & Facturation" },
];

export function SupportWorkspace({ admin = false }: SupportWorkspaceProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {access}=useAdminAccess();
  const canEdit=hasPermission(access,"support.edit");

  // Suspended account profile detection
  const [suspendedProfile, setSuspendedProfile] = useState<SuspendedProfileDetails | null>(null);
  const [isSuspendedMode, setIsSuspendedMode] = useState(false);

  // Tickets state
  const [items, setItems] = useState<any[]>([]);
  const [ticket, setTicket] = useState<any>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [body, setBody] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState("");
  const [key, setKey] = useState("");

  // Form states
  const [contactEmail, setContactEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Général");
  const [description, setDescription] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const prefix = admin ? "/admin/support-tickets" : "/support/tickets";

  // Close custom dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Detect suspended account profile from session/local storage or user object
  useEffect(() => {
    if (typeof window === "undefined" || admin) return;

    let profile: SuspendedProfileDetails | null = null;
    try {
      const storedSession = sessionStorage.getItem("bko_suspended_details");
      const storedLocal = localStorage.getItem("bko_suspended_profile");
      if (storedSession) {
        profile = JSON.parse(storedSession);
      } else if (storedLocal) {
        profile = JSON.parse(storedLocal);
      }
    } catch (_) {}

    // Check if user is suspended in authStore or query param ?context=suspension
    const searchParams = new URLSearchParams(window.location.search);
    const hasSuspensionQuery = searchParams.get("context") === "suspension";

    if (profile || user?.isSuspended || hasSuspensionQuery) {
      const email = profile?.email || user?.email || "";
      const fullName = profile?.fullName || user?.fullName || (email ? email.split("@")[0] : "Membre Bamako Podcast");
      const reason = profile?.reason || user?.suspendedReason || "Non-respect des conditions d'utilisation de la plateforme.";
      const suspendedAt = profile?.suspendedAt || user?.suspendedAt || undefined;
      const userId = profile?.userId || user?.id || undefined;
      const avatar = profile?.avatar || user?.avatar || null;

      const merged: SuspendedProfileDetails = {
        email,
        fullName,
        reason,
        suspendedAt,
        userId,
        avatar,
        isPermanent: profile?.isPermanent ?? true,
      };

      setSuspendedProfile(merged);
      setIsSuspendedMode(true);
      setCategory("Compte suspendu");
      setSubject("Demande de révision de la suspension de mon compte");
      if (email) setContactEmail(email);
    } else if (user?.email) {
      setContactEmail(user.email);
    }
  }, [user, admin]);

  async function loadList() {
    setError("");
    try {
      const r = await fetchApi(admin ? `${prefix}?page=${page}&status=${filter}` : "/me/support-tickets");
      if (r && r.data) {
        const ticketList = Array.isArray(r.data.items) ? r.data.items : [];
        setItems(ticketList);
        setTotal(r.data.total || ticketList.length);

        // If in suspended mode and no ticket currently selected, auto-open existing appeal ticket
        if (!ticket && isSuspendedMode && ticketList.length > 0) {
          const appealTicket = ticketList.find(
            (t: any) =>
              t.category === "Compte suspendu" ||
              t.subject?.toLowerCase().includes("suspension") ||
              t.subject?.toLowerCase().includes("bloqu")
          ) || ticketList[0];
          if (appealTicket?.id) {
            void open(appealTicket.id, "");
          }
        }
      }
    } catch (e: any) {
      if (admin || e.status !== 401) {
        setError(e.message || "Impossible de charger la liste des tickets.");
      }
    }
  }

  async function open(id: string, k = key) {
    setError("");
    try {
      const stored = k || localStorage.getItem(`bko-support-${id}`) || "";
      setKey(stored);
      const r = await fetchApi(`${prefix}/${encodeURIComponent(id)}`, {
        headers: { "X-Support-Key": stored },
      });
      if (r && r.data) {
        setTicket(r.data);
      }
    } catch (e: any) {
      setError(e.message || "Impossible d'ouvrir ce ticket.");
    }
  }

  useEffect(() => {
    void loadList();
  }, [page, filter, isSuspendedMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("ticket");
    const k = new URLSearchParams(window.location.hash.slice(1)).get("key") || "";
    if (id) {
      if (k) {
        localStorage.setItem(`bko-support-${id}`, k);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      void open(id, k);
    }
  }, []);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccessMsg("");

    const payload = {
      email: contactEmail.trim(),
      subject: subject.trim(),
      category: category,
      description: description.trim(),
      origin: "WEB",
    };

    try {
      const r = await fetchApi("/support/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (r && r.data) {
        const newId = r.data.id;
        const newKey = r.data.accessToken;
        localStorage.setItem(`bko-support-${newId}`, newKey);
        setKey(newKey);
        setSuccessMsg(
          isSuspendedMode
            ? "Votre demande de révision a été transmise à l'équipe de modération."
            : "Votre demande d'assistance a été enregistrée avec succès."
        );
        setDescription("");
        await open(newId, newKey);
        await loadList();
      }
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'envoi de la demande.");
    } finally {
      setBusy(false);
    }
  }

  async function update(newStatus?: string) {
    if (!ticket) return;
    setBusy(true);
    setError("");
    try {
      await fetchApi(`${prefix}/${ticket.id}/messages`, {
        method: "POST",
        headers: { "X-Support-Key": key },
        body: JSON.stringify(newStatus ? { status: newStatus } : { body: body.trim() }),
      });
      setBody("");
      await open(ticket.id);
      await loadList();
    } catch (e: any) {
      setError(e.message || "Impossible d'envoyer la réponse.");
    } finally {
      setBusy(false);
    }
  }

  function handleLogoutSuspended() {
    try {
      sessionStorage.removeItem("bko_suspended_details");
      localStorage.removeItem("bko_suspended_profile");
      localStorage.removeItem("bko_support_token");
    } catch (_) {}
    router.push("/login");
  }

  const selectedCategoryLabel =
    CATEGORIES.find((c) => c.value === category)?.label || category;

  return (
    <main className="mx-auto max-w-6xl p-4 sm:p-6 md:p-8 text-white min-h-[calc(100vh-80px)]">
      {/* ========================================================================= */}
      {/* BANNIÈRE COMPTE BLOQUÉ : PROFIL RÉEL DU DEMANDEUR */}
      {/* ========================================================================= */}
      {isSuspendedMode && !admin && (
        <div className="mb-8 bg-[#141416] border border-[#262626] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
            {/* Profil utilisateur réel */}
            <div className="flex items-center gap-3.5">
              <div className="relative w-13 h-13 rounded-full bg-[#1E1A11] border border-[#FFBF00]/40 flex items-center justify-center text-white font-bold text-base overflow-hidden shrink-0">
                {suspendedProfile?.avatar ? (
                  <img
                    src={suspendedProfile.avatar}
                    alt={suspendedProfile.fullName || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {(suspendedProfile?.fullName || "BKO")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
                <div
                  className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#EF4444] border-2 border-[#141416]"
                  title="Compte suspendu"
                />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    {suspendedProfile?.fullName || "Compte utilisateur"}
                  </h2>
                  <span className="inline-flex items-center gap-1 bg-[#2A1215] text-[#F87171] border border-[#7F1D1D] text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider">
                    <ShieldAlert className="w-3 h-3 text-[#EF4444]" />
                    Compte suspendu
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#888888] mt-0.5">
                  <span className="flex items-center gap-1 font-mono text-[#CCCCCC]">
                    <Mail className="w-3 h-3 text-[#666666]" />
                    {suspendedProfile?.email}
                  </span>
                  {suspendedProfile?.userId && (
                    <span className="text-[11px] text-[#555555]">
                      • Réf : {suspendedProfile.userId.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions de déconnexion / changement de compte */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLogoutSuspended}
                className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-[#333333] text-xs font-semibold text-[#AAAAAA] hover:text-white transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Changer de compte
              </button>
            </div>
          </div>

          {/* Motif officiel et explication du recours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#FFBF00]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Motif notifié par la modération</span>
              </div>
              <p className="text-xs text-white leading-relaxed">
                {suspendedProfile?.reason || "Non-respect des conditions d'utilisation de la plateforme."}
              </p>
              {suspendedProfile?.suspendedAt && (
                <p className="text-[11px] text-[#666666]">
                  Prise d&apos;effet :{" "}
                  {new Date(suspendedProfile.suspendedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#38BDF8]">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Procédure de révision et recours</span>
              </div>
              <p className="text-xs text-[#AAAAAA] leading-relaxed">
                Cet espace vous permet d&apos;expliquer votre situation ou de fournir des justificatifs. L&apos;équipe examinera votre demande sous 24 à 48 heures.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EN-TÊTE PRINCIPAL */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222222]">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            {isSuspendedMode ? (
              <>
                <ShieldAlert className="w-6 h-6 text-[#FFBF00]" />
                Recours & Révision de compte
              </>
            ) : admin ? (
              <>
                <ShieldCheck className="w-6 h-6 text-[#FFBF00]" />
                Console d&apos;assistance · Tickets
              </>
            ) : (
              <>
                <MessageSquare className="w-6 h-6 text-[#FFBF00]" />
                Aide et assistance
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-1">
            {isSuspendedMode
              ? "Suivez ici vos échanges avec la modération. Chaque message et décision fait l'objet d'une notification par email."
              : "Suivez vos échanges avec notre équipe. Chaque réponse et changement de statut fait l'objet d'un email."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void loadList();
              if (ticket) void open(ticket.id);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141416] hover:bg-[#1C1C1E] border border-[#262626] text-xs font-semibold text-[#CCCCCC] hover:text-white transition-colors disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin text-[#FFBF00]" : "text-[#888888]"}`} />
            Actualiser
          </button>

          {!admin && isSuspendedMode && (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141416] hover:bg-[#1C1C1E] border border-[#262626] text-xs font-semibold text-[#888888] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Accueil public
            </Link>
          )}
        </div>
      </div>

      {/* Messages d'alerte / feedback */}
      {error && (
        <div
          role="alert"
          className="my-4 p-4 rounded-xl bg-[#2A1215] border border-[#7F1D1D] text-xs font-bold text-[#F87171] flex items-center gap-2.5 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="my-4 p-4 rounded-xl bg-[#112418] border border-[#1F5131] text-xs font-bold text-[#4ADE80] flex items-center gap-2.5 animate-fadeIn"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STRUCTURE EN 2 COLONNES (HISTORIQUE ET CONTENU DU TICKET / FORMULAIRE) */}
      {/* ========================================================================= */}
      <div className="mt-8 grid gap-8 md:grid-cols-[310px_1fr] items-start">
        {/* COLONNE GAUCHE : LISTE DES DEMANDES & RECOURS */}
        <aside className="bg-[#121214] border border-[#262626] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#FFBF00]" />
              {isSuspendedMode ? "Mes recours" : "Mes demandes"} ({items.length})
            </h3>
            {!admin && (
              <button
                type="button"
                onClick={() => {
                  setTicket(null);
                  setError("");
                  setSuccessMsg("");
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FFBF00] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                {isSuspendedMode ? "Nouveau recours" : "Nouveau ticket"}
              </button>
            )}
          </div>

          {/* Filtre Admin par statut */}
          {admin && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#AAAAAA]">
                Filtrer par statut
              </label>
              <select
                className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-[#FFBF00] transition-colors"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Tous les statuts</option>
                <option value="OPEN">Ouverts uniquement</option>
                <option value="CLOSED">Fermés uniquement</option>
              </select>
            </div>
          )}

          {/* Liste des cartes tickets */}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {items.map((t) => {
              const isSelected = ticket?.id === t.id;
              const isClosed = t.status === "CLOSED";
              return (
                <button
                  key={t.id}
                  onClick={() => void open(t.id, "")}
                  type="button"
                  className={`w-full p-3.5 rounded-xl text-left border transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-[#1E1A11] border-[#FFBF00]/50 text-white"
                      : "bg-[#161618] hover:bg-[#1A1A1D] border-[#242426] text-[#CCCCCC]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isClosed
                          ? "bg-[#222222] text-[#888888] border border-[#333333]"
                          : "bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30"
                      }`}
                    >
                      {isClosed ? "Fermé" : "Ouvert"}
                    </span>
                    <span className="text-[11px] text-[#666666]">
                      {new Date(t.updatedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  <strong className="text-xs font-bold text-white line-clamp-1">
                    {t.subject}
                  </strong>

                  {t.category && (
                    <span className="text-[10px] text-[#888888] truncate flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5 shrink-0" />
                      {t.category}
                    </span>
                  )}
                </button>
              );
            })}

            {items.length === 0 && (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#181818] border border-[#262626] mx-auto flex items-center justify-center text-[#666666]">
                  <Inbox className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#777777]">
                  {isSuspendedMode
                    ? "Aucun recours actif enregistré."
                    : "Aucune demande enregistrée."}
                </p>
                {!admin && !ticket && (
                  <p className="text-[11px] text-[#555555]">
                    Remplissez le formulaire ci-contre pour transmettre votre dossier.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pagination Admin */}
          {admin && (
            <div className="flex items-center justify-between pt-2 border-t border-[#222222] text-xs">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2.5 py-1 rounded bg-[#181818] border border-[#262626] disabled:opacity-30"
              >
                Précédent
              </button>
              <span className="text-[#888888]">Page {page}</span>
              <button
                type="button"
                disabled={page * 25 >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded bg-[#181818] border border-[#262626] disabled:opacity-30"
              >
                Suivant
              </button>
            </div>
          )}
        </aside>

        {/* COLONNE DROITE : AFFICHAGE D'UN TICKET OU DU FORMULAIRE */}
        <section className="bg-[#121214] border border-[#262626] rounded-2xl p-5 sm:p-7">
          {ticket ? (
            /* ================================================================= */
            /* VUE DU TICKET EN COURS (DISCUSSION ET STATUT) */
            /* ================================================================= */
            <div className="space-y-6">
              {/* En-tête du ticket */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#222222] pb-5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                        ticket.status === "CLOSED"
                          ? "bg-[#222222] text-[#888888] border border-[#333333]"
                          : "bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30"
                      }`}
                    >
                      {ticket.status === "CLOSED" ? "Dossier Fermé" : "Dossier en cours"}
                    </span>
                    {ticket.category && (
                      <span className="text-[10px] bg-[#1E1E22] text-[#A0A0A0] border border-[#2C2C30] px-2.5 py-0.5 rounded-md font-semibold">
                        {ticket.category}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {ticket.subject}
                  </h2>
                  <p className="text-xs text-[#777777]">
                    Réf : <span className="font-mono text-[#AAAAAA]">{ticket.id}</span> • Créé le{" "}
                    {new Date(ticket.createdAt || ticket.updatedAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {admin && ticket.email ? ` • Contact : ${ticket.email}` : ""}
                  </p>
                </div>

                {/* Actions sur le ticket */}
                <div className="flex items-center gap-2 shrink-0">
                  {admin && canEdit && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void update(ticket.status === "CLOSED" ? "OPEN" : "CLOSED")}
                      className="px-3.5 py-2 rounded-xl border border-[#333333] hover:bg-[#1A1A1A] text-xs font-bold text-white transition-colors"
                    >
                      {ticket.status === "CLOSED" ? "Rouvrir le dossier" : "Clôturer le dossier"}
                    </button>
                  )}
                  {!admin && (
                    <button
                      type="button"
                      onClick={() => {
                        setTicket(null);
                        setError("");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-[#333333] text-xs font-semibold text-[#CCCCCC] transition-colors"
                    >
                      Nouvelle demande
                    </button>
                  )}
                </div>
              </div>

              {/* Fil des messages échangés */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {ticket.messages?.map((m: any) => {
                  const isStaff = m.kind === "STAFF";
                  const isSystem = m.kind === "SYSTEM";

                  if (isSystem) {
                    return (
                      <div
                        key={m.id}
                        className="p-3 bg-[#161616] border border-[#222222] rounded-xl text-center text-xs text-[#888888]"
                      >
                        <span className="font-bold text-[#AAAAAA]">Mise à jour :</span> {m.body} •{" "}
                        {new Date(m.createdAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    );
                  }

                  return (
                    <article
                      key={m.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isStaff
                          ? "bg-[#1E1A11] border-[#FFBF00]/30 mr-4 sm:mr-10"
                          : "bg-[#18181A] border-[#2A2A2E] ml-4 sm:ml-10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 mb-2.5 text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isStaff ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-[#FFBF00]" />
                              <span className="text-[#FFBF00]">Équipe de modération & assistance</span>
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5 text-[#38BDF8]" />
                              <span className="text-white">Vous (Demandeur)</span>
                            </>
                          )}
                        </div>
                        <span className="text-[11px] text-[#666666]">
                          {new Date(m.createdAt).toLocaleString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-xs sm:text-sm text-[#DDDDDD] leading-relaxed">
                        {m.body}
                      </p>
                    </article>
                  );
                })}
              </div>

              {/* Zone de réponse */}
              {ticket.status !== "CLOSED" && (!admin || canEdit) ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void update();
                  }}
                  className="space-y-3 pt-3 border-t border-[#222222]"
                >
                  <label htmlFor="reply" className="block text-xs font-bold text-[#CCCCCC]">
                    Ajouter une réponse ou un complément d&apos;information
                  </label>
                  <div className="relative">
                    <textarea
                      id="reply"
                      required
                      maxLength={10000}
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={
                        isSuspendedMode
                          ? "Apportez une précision ou répondez aux remarques de l'équipe de modération..."
                          : "Écrivez votre message à l'attention de l'assistance..."
                      }
                      className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-[#666666] outline-none focus:border-[#FFBF00] transition-colors"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#666666]">
                      {body.length} / 10 000 caractères
                    </span>
                    <button
                      type="submit"
                      disabled={busy || !body.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFBF00] hover:bg-[#E5A800] text-black font-bold text-xs sm:text-sm transition-colors disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {busy ? "Envoi en cours..." : "Envoyer mon message"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-xl bg-[#181818] border border-[#242426] text-center text-xs text-[#888888]">
                  Ce dossier est actuellement fermé. Vous pouvez ouvrir un nouveau recours si nécessaire.
                </div>
              )}
            </div>
          ) : !admin ? (
            /* ================================================================= */
            /* FORMULAIRE DE CRÉATION DE TICKET / RECOURS */
            /* ================================================================= */
            <form onSubmit={create} className="space-y-5">
              <div className="border-b border-[#222222] pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {isSuspendedMode ? (
                    <>
                      <ShieldAlert className="w-5 h-5 text-[#FFBF00]" />
                      Déposer un recours suite à la suspension
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5 text-[#FFBF00]" />
                      Comment pouvons-nous vous aider ?
                    </>
                  )}
                </h2>
                <p className="text-xs text-[#888888] mt-1">
                  {isSuspendedMode
                    ? "Renseignez vos explications et tout élément justifiant la réévaluation de votre compte par nos modérateurs."
                    : "Renseignez votre demande ci-dessous. Nous vous répondrons dans les plus brefs délais."}
                </p>
              </div>

              {/* Champ 1 : Email de contact */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#CCCCCC] flex items-center justify-between">
                  <span>Email de contact</span>
                  {isSuspendedMode && (
                    <span className="text-[10px] text-[#34D399] font-bold flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> Compte certifié
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    required
                    maxLength={254}
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    readOnly={isSuspendedMode}
                    placeholder="votre-email@exemple.com"
                    className={`w-full bg-[#181818] border border-[#2A2A2A] rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white outline-none transition-colors ${
                      isSuspendedMode
                        ? "cursor-not-allowed opacity-90 select-none text-[#AAAAAA]"
                        : "focus:border-[#FFBF00]"
                    }`}
                  />
                </div>
                {isSuspendedMode && (
                  <p className="text-[11px] text-[#666666]">
                    Le recours est obligatoirement rattaché à l&apos;adresse de votre compte suspendu.
                  </p>
                )}
              </div>

              {/* Champ 2 : Catégorie avec Sélecteur Custom Dark (Zéro boîte blanche !) */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="block text-xs font-bold text-[#CCCCCC]">
                  Catégorie de la demande
                </label>
                <div className="relative">
                  <button
                    type="button"
                    disabled={isSuspendedMode}
                    onClick={() => setIsCategoryOpen((prev) => !prev)}
                    className={`w-full bg-[#181818] border border-[#2A2A2A] rounded-xl py-3 px-4 text-xs sm:text-sm text-white flex items-center justify-between transition-colors ${
                      isSuspendedMode
                        ? "cursor-not-allowed opacity-90"
                        : "hover:border-[#383838] focus:border-[#FFBF00]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Tag className="w-4 h-4 text-[#FFBF00] shrink-0" />
                      <span className="font-medium text-white truncate">
                        {selectedCategoryLabel}
                      </span>
                    </div>
                    {!isSuspendedMode && (
                      <ChevronDown
                        className={`w-4 h-4 text-[#888888] transition-transform ${
                          isCategoryOpen ? "rotate-180 text-[#FFBF00]" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* Menu déroulant custom sombre sans boîte native */}
                  {isCategoryOpen && !isSuspendedMode && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#18181A] border border-[#333333] rounded-xl overflow-hidden z-50 shadow-2xl py-1 animate-fadeIn">
                      {CATEGORIES.map((cat) => {
                        const isCatSelected = cat.value === category;
                        return (
                          <div
                            key={cat.value}
                            onClick={() => {
                              setCategory(cat.value);
                              setIsCategoryOpen(false);
                            }}
                            className={`px-4 py-2.5 text-xs font-medium cursor-pointer flex items-center justify-between transition-colors ${
                              isCatSelected
                                ? "bg-[#1E1A11] text-[#FFBF00] font-bold"
                                : "text-[#CCCCCC] hover:bg-[#222225] hover:text-white"
                            }`}
                          >
                            <span>{cat.label}</span>
                            {isCatSelected && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#FFBF00]" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Champ 3 : Sujet */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#CCCCCC]">
                  Sujet de la demande
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-[#666666] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    name="subject"
                    required
                    minLength={3}
                    maxLength={180}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={
                      isSuspendedMode
                        ? "Demande de révision de la suspension de mon compte"
                        : "Ex : Problème de lecture d'épisode, question sur le studio..."
                    }
                    className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl py-3 pl-10 pr-4 text-xs sm:text-sm text-white outline-none focus:border-[#FFBF00] transition-colors"
                  />
                </div>
              </div>

              {/* Champ 4 : Explications & Justificatifs */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#CCCCCC] flex items-center justify-between">
                  <span>
                    {isSuspendedMode
                      ? "Vos explications et justificatifs pour la révision"
                      : "Détail de votre demande"}
                  </span>
                  <span className="text-[11px] text-[#666666]">
                    Min. 10 caractères
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    name="description"
                    required
                    minLength={10}
                    maxLength={10000}
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      isSuspendedMode
                        ? "Expliquez les circonstances, apportez les clarifications nécessaires ou tout élément permettant à notre équipe d'examiner et de lever la suspension de votre compte..."
                        : "Décrivez précisément votre problème ou votre question..."
                    }
                    className="w-full bg-[#181818] border border-[#2A2A2A] rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-[#666666] outline-none focus:border-[#FFBF00] transition-colors"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#666666]">
                  <span>
                    {isSuspendedMode
                      ? "Soyez le plus précis possible pour accélérer le traitement de votre dossier."
                      : "Vous recevrez un accusé de réception automatique par email."}
                  </span>
                  <span>{description.length} / 10 000</span>
                </div>
              </div>

              {/* Bouton de soumission solide et bien visible */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={busy || description.trim().length < 10}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#FFBF00] hover:bg-[#E5A800] text-black font-extrabold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-black" />
                  {busy
                    ? "Transmission en cours..."
                    : isSuspendedMode
                    ? "Transmettre mon recours à la modération"
                    : "Envoyer ma demande d'assistance"}
                </button>
              </div>
            </form>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] mx-auto flex items-center justify-center text-[#888888]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Sélectionnez un ticket</h3>
              <p className="text-xs text-[#777777] max-w-sm mx-auto">
                Choisissez un dossier dans la liste à gauche pour consulter les échanges et y répondre.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Send, Sparkles, Headphones } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

interface ChatMessage {
  id: string;
  sender: "user" | "ali";
  text: string;
  timestamp: Date;
}

const INACTIVITY_DELAY_MS = 3 * 60 * 1000; // 3 minutes d'inactivité

export function AliChatBubble() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAudioPlaying = usePlayerStore((s) => s.isPlaying);
  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "";

  // État d'ouverture et pastille
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Position glissable (Draggable)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const hasMovedRef = useRef(false);

  // Session ID persistant
  const sessionIdRef = useRef<string>("");

  // Inactivité
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasSentInactivityRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suivi de l'état de l'application (onglet actif / inactif)
  const isDocumentVisibleRef = useRef(true);
  useEffect(() => {
    const handleVisibilityChange = () => {
      isDocumentVisibleRef.current = !document.hidden;
      // Si l'utilisateur quitte l'onglet, annuler la relance
      if (document.hidden && inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Initialisation session et position par défaut
  useEffect(() => {
    let savedSession = sessionStorage.getItem("bko_ali_chat_session");
    if (!savedSession) {
      savedSession = "session_" + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("bko_ali_chat_session", savedSession);
    }
    sessionIdRef.current = savedSession;

    // Position initiale en bas à droite
    if (typeof window !== "undefined") {
      const savedPos = localStorage.getItem("bko_ali_bubble_pos");
      if (savedPos) {
        try {
          const saved = JSON.parse(savedPos);
          if (!Number.isFinite(saved.x) || !Number.isFinite(saved.y)) throw new Error('Invalid position');
          setPosition({
            x: Math.min(Math.max(10, saved.x), Math.max(10, window.innerWidth - 70)),
            y: Math.min(Math.max(10, saved.y), Math.max(10, window.innerHeight - 150)),
          });
        } catch {
          setPosition({ x: window.innerWidth - 80, y: Math.max(10, window.innerHeight - 150) });
        }
      } else {
        setPosition({ x: window.innerWidth - 80, y: Math.max(10, window.innerHeight - 150) });
      }
    }

    // Message d'accueil initial
    setMessages([
      {
        id: "msg_welcome",
        sender: "ali",
        text: firstName
          ? `Salut ${firstName} ! Moi c'est Ali, ton conseiller d’écoute sur Bamako Podcast. Qu'est-ce qui te ferait plaisir d'écouter aujourd'hui ?`
          : "Salut ! Moi c'est Ali, ton conseiller d’écoute sur Bamako Podcast. Qu'est-ce qui te ferait plaisir d'écouter aujourd'hui ?",
        timestamp: new Date(),
      },
    ]);
  }, [firstName]);

  // Scroll automatique en bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  /**
   * 4. RELANCE APRÈS INACTIVITÉ (3 MINUTES)
   * Affiche la relance DIRECTEMENT en local sans appel au modèle pour économiser l'API et supprimer toute latence.
   * Conditions strictes :
   * - Annulée si audio en cours de lecture
   * - Annulée si chat fermé ou app en arrière-plan
   * - Annulée si saisie ou requête en cours
   * - 1 seule relance max
   */
  const triggerInactivityFollowUp = useCallback(() => {
    // Verrous stricts d'annulation
    if (
      hasSentInactivityRef.current ||
      isLoading ||
      !isOpen || // Annulé si chat fermé
      !isDocumentVisibleRef.current || // Annulé si onglet en arrière-plan
      isAudioPlaying // Annulé si lecture audio en cours !
    ) {
      return;
    }

    hasSentInactivityRef.current = true;

    const followUpText = firstName
      ? `Hey ${firstName}, tu es toujours là ? 🙂`
      : "Hey, tu es toujours là ? 🙂";

    setMessages((prev) => [
      ...prev,
      {
        id: "msg_idle_" + Date.now(),
        sender: "ali",
        text: followUpText,
        timestamp: new Date(),
      },
    ]);
  }, [firstName, isLoading, isOpen, isAudioPlaying]);

  // Réarmement du chronomètre d'inactivité (3 minutes)
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    hasSentInactivityRef.current = false;

    // Ne pas armer si chat fermé, audio en cours ou onglet caché
    if (!isOpen || isAudioPlaying || !isDocumentVisibleRef.current) {
      return;
    }

    inactivityTimerRef.current = setTimeout(() => {
      triggerInactivityFollowUp();
    }, INACTIVITY_DELAY_MS);
  }, [isOpen, isAudioPlaying, triggerInactivityFollowUp]);

  // Pause / report du chronomètre quand l'utilisateur tape
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Toute saisie annule et reporte le timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (isOpen && !isAudioPlaying) {
      inactivityTimerRef.current = setTimeout(() => {
        triggerInactivityFollowUp();
      }, INACTIVITY_DELAY_MS);
    }
  };

  /**
   * 3. TRANSMISSION SÉCURISÉE VIA LE BACKEND (ZERO TRUST)
   * Le client passe par /api/v1/advisor/chat avec le JWT Session Bearer.
   * L'identité est résolue et vérifiée côté serveur.
   */
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue("");
    const userMsg: ChatMessage = {
      id: "msg_user_" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    try {
      // Appel via le backend sécurisé
      const res = await fetchApi("/advisor/chat", {
        method: "POST",
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          chatInput: text,
        }),
      });

      if (res.success && res.data) {
        const aliReply = res.data.output || "Je regarde ça pour toi !";
        const botMsg: ChatMessage = {
          id: "msg_ali_" + Date.now(),
          sender: "ali",
          text: aliReply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);

        // Démarre le chronomètre d'inactivité de 3 minutes
        resetInactivityTimer();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: "msg_err_" + Date.now(),
            sender: "ali",
            text: res.message || "Désolé, j'ai eu un contretemps pour accéder au catalogue. Réessaie dans un instant !",
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "msg_err_" + Date.now(),
          sender: "ali",
          text: "Connexion interrompue. Vérifie ta connexion internet.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Capture pointer events without reinstalling listeners on every frame.
  const positionRef = useRef(position);
  useEffect(() => {
    const clampToViewport = () => {
      const latest = positionRef.current;
      const next = { x: Math.min(Math.max(10, latest.x), Math.max(10, window.innerWidth - 70)),
        y: Math.min(Math.max(10, latest.y), Math.max(10, window.innerHeight - 150)) };
      dragStartRef.current = null;
      setIsDragging(false);
      positionRef.current = next;
      setPosition(next);
    };
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, []);
  useEffect(() => {
    if (!dragStartRef.current) positionRef.current = position;
  }, [position]);
  const dragFrameRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (dragFrameRef.current !== null) cancelAnimationFrame(dragFrameRef.current);
  }, []);
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    hasMovedRef.current = false;
    dragStartRef.current = { startX: e.clientX, startY: e.clientY,
      initialX: positionRef.current.x, initialY: positionRef.current.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    const dx = e.clientX - start.startX, dy = e.clientY - start.startY;
    if (!hasMovedRef.current && Math.hypot(dx, dy) <= 6) return;
    hasMovedRef.current = true;
    setIsDragging(true);
    positionRef.current = {
      x: Math.min(Math.max(10, start.initialX + dx), Math.max(10, window.innerWidth - 70)),
      y: Math.min(Math.max(10, start.initialY + dy), Math.max(10, window.innerHeight - 150)),
    };
    if (dragFrameRef.current === null) {
      dragFrameRef.current = requestAnimationFrame(() => {
        dragFrameRef.current = null;
        setPosition(positionRef.current);
      });
    }
  };
  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    if (dragFrameRef.current !== null) {
      cancelAnimationFrame(dragFrameRef.current); dragFrameRef.current = null;
    }
    if (hasMovedRef.current) {
      const latest = positionRef.current;
      const snap = { x: latest.x < window.innerWidth / 2 ? 16 : Math.max(16, window.innerWidth - 76), y: latest.y };
      positionRef.current = snap; setPosition(snap);
      try { localStorage.setItem('bko_ali_bubble_pos', JSON.stringify(snap)); } catch {}
    }
    dragStartRef.current = null;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const toggleChat = () => {
    if (hasMovedRef.current) { hasMovedRef.current = false; return; }
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setUnreadCount(0);
      resetInactivityTimer();
    } else {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    }
  };

  /**
   * NORMALISATION DES DOMAINES D'ALI
   * Réécrit toute URL vers le domaine actif (ex: http://x0jn9ljzszcjjvzmiltdx0qd.194.31.52.77.sslip.io)
   */
  const normalizeAliText = (text: string): string => {
    if (!text) return text;
    const currentOrigin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "http://x0jn9ljzszcjjvzmiltdx0qd.194.31.52.77.sslip.io";

    const domainPattern = /https?:\/\/(?:www\.)?(?:bamakopodcast\.(?:com|studio|ml)|c0mq60vovgz6xkdvi8hkyejk\.194\.31\.52\.77\.sslip\.io)/gi;
    let cleaned = text.replace(domainPattern, currentOrigin);

    // Nettoyage de fuite technique de tool calling (ex: Calling Execute_a_SQL_query...)
    if (/Calling\s+[\w_]+/i.test(cleaned) || /Execute_a_SQL_query/i.test(cleaned)) {
      cleaned = cleaned
        .replace(/Calling\s+[\w_]+(?:\s+with\s+input:[^}]*}?)?/gi, "")
        .replace(/Execute_a_SQL_query[^\n]*/gi, "")
        .replace(/\{\s*['"]?term['"]?\s*:[^}]*\}/gi, "")
        .trim();
      if (!cleaned) {
        cleaned = "Je consulte le catalogue pour toi... Que souhaites-tu découvrir aujourd'hui ?";
      }
    }

    return cleaned;
  };

  /**
   * INTERCEPTION DES LIENS & NAVIGATION INTERNE NEXT.JS
   * Prend en charge les liens Markdown [Titre](URL), les URLs directes et le texte en gras.
   */
  const renderMessageContent = (content: string) => {
    const normalized = normalizeAliText(content);
    const parts = normalized.split(/(\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<>"{}|\\^`]+|\*\*[^*]+\*\*)/g);

    return parts.map((part, idx) => {
      // 1. Lien Markdown [Titre](URL)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const linkText = normalizeAliText(linkMatch[1]);
        const rawUrl = normalizeAliText(linkMatch[2]);

        let internalPath: string | null = null;
        try {
          if (rawUrl.startsWith("/")) {
            internalPath = rawUrl;
          } else if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
            const parsed = new URL(rawUrl);
            internalPath = parsed.pathname + parsed.search;
          }
        } catch {
          internalPath = rawUrl;
        }

        return (
          <a
            key={idx}
            href={internalPath || rawUrl}
            onClick={(e) => {
              if (internalPath) {
                e.preventDefault();
                router.push(internalPath);
              }
            }}
            className="text-[#FFBF00] font-semibold underline underline-offset-2 hover:text-[#FFD700] transition-colors"
            target={internalPath ? "_self" : "_blank"}
            rel="noopener noreferrer"
          >
            {linkText}
          </a>
        );
      }

      // 2. URL directe (https?://...)
      const rawUrlMatch = part.match(/^https?:\/\/[^\s<>"{}|\\^`]+$/);
      if (rawUrlMatch) {
        const rawUrl = normalizeAliText(rawUrlMatch[0]);
        let internalPath: string | null = null;
        try {
          const parsed = new URL(rawUrl);
          internalPath = parsed.pathname + parsed.search;
        } catch {
          internalPath = null;
        }

        return (
          <a
            key={idx}
            href={internalPath || rawUrl}
            onClick={(e) => {
              if (internalPath) {
                e.preventDefault();
                router.push(internalPath);
              }
            }}
            className="text-[#FFBF00] font-semibold underline underline-offset-2 hover:text-[#FFD700] transition-colors break-all"
            target={internalPath ? "_self" : "_blank"}
            rel="noopener noreferrer"
          >
            {rawUrl}
          </a>
        );
      }

      // 3. Texte en gras **Gras**
      const boldMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (boldMatch) {
        return (
          <strong key={idx} className="font-semibold text-white">
            {boldMatch[1]}
          </strong>
        );
      }

      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <>
      {/* BULLE FLOTTANTE GLISSABLE (DRAGGABLE) AVEC BORDURE SOLIDE SANS OMBRE */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          touchAction: "none",
          zIndex: 9999,
          transition: isDragging ? "none" : "transform 0.2s ease-out",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={toggleChat}
        className="select-none"
      >
        <button
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') hasMovedRef.current = false;
          }}
          className="relative w-14 h-14 rounded-full bg-[#141416] border-2 border-[#FFBF00] flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-transform"
          aria-label="Discuter avec Ali"
        >
          <Headphones className="w-6 h-6 text-[#FFBF00]" />

          {/* Pastille de notification dorée */}
          {unreadCount > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 bg-[#FFBF00] text-[#0E0E10] font-extrabold text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#141416] animate-bounce">
              {unreadCount}
            </span>
          )}

          {/* Indicateur En Ligne */}
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#141416]" />
        </button>
      </div>

      {/* FENÊTRE DE CHAT (QUAND OUVERT) */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 md:right-8 w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[80vh] bg-[#121214] border border-[#27272A] rounded-2xl shadow-2xl flex flex-col z-[10000] overflow-hidden"
          style={{ animation: "fadeInUp 0.2s ease-out" }}
        >
          {/* Header */}
          <div className="bg-[#18181B] px-4 py-3 border-b border-[#27272A] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-[#27272A] border border-[#FFBF00] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#FFBF00]" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#18181B]" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Ali <span className="text-[10px] font-medium text-[#FFBF00] bg-[#27272A] px-1.5 py-0.5 rounded">Conseiller</span>
                </h3>
                <p className="text-[11px] text-[#A1A1AA]">Bamako Podcast • Toujours là</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Zone des messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-[#27272A]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#27272A] text-white rounded-br-sm"
                      : "bg-[#1C1C20] text-[#E4E4E7] border border-[#2E2E34] rounded-bl-sm"
                  }`}
                >
                  {renderMessageContent(msg.text)}
                </div>
                <span className="text-[10px] text-[#71717A] mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-[#1C1C20] border border-[#2E2E34] rounded-2xl rounded-bl-sm px-4 py-2 text-xs text-[#A1A1AA] flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#FFBF00] animate-pulse" />
                  Ali réfléchit...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#18181B] border-t border-[#27272A] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Demande un podcast, un thème, tes favoris..."
              className="flex-1 bg-[#121214] border border-[#2E2E34] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#FFBF00] transition-colors"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-[#FFBF00] text-[#0E0E10] flex items-center justify-center font-bold hover:bg-[#FFD700] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

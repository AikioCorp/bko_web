"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, X, Send, Sparkles, Headphones, Minus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: string;
  sender: "user" | "ali";
  text: string;
  timestamp: Date;
}

const N8N_CHAT_WEBHOOK = "https://bko-n8n.salika.tech/webhook/9881143d-a47b-4638-a326-8679506ff3f0/chat";
const INACTIVITY_DELAY_MS = 2 * 60 * 1000; // 2 minutes

export function AliChatBubble() {
  const router = useRouter();
  const { user } = useAuthStore();
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
          setPosition(JSON.parse(savedPos));
        } catch {
          setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 100 });
        }
      } else {
        setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 100 });
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

  // Envoi du signal d'inactivité
  const triggerInactivityFollowUp = useCallback(async () => {
    if (hasSentInactivityRef.current || isLoading) return;
    hasSentInactivityRef.current = true;

    try {
      const payload = {
        action: "sendMessage",
        sessionId: sessionIdRef.current,
        chatInput: firstName ? `[INACTIVITE_DETECTEE] Prénom: ${firstName}` : "[INACTIVITE_DETECTEE]",
      };

      const res = await fetch(N8N_CHAT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.output || data.text || "Hey, tu es toujours là ? 🙂";

        setMessages((prev) => [
          ...prev,
          {
            id: "msg_" + Date.now(),
            sender: "ali",
            text: replyText,
            timestamp: new Date(),
          },
        ]);

        // Si le chat est fermé, incrémenter la pastille dorée
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
      }
    } catch {
      // Échec silencieux
    }
  }, [firstName, isLoading, isOpen]);

  // Réarmement du chronomètre d'inactivité
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    hasSentInactivityRef.current = false;
    inactivityTimerRef.current = setTimeout(() => {
      triggerInactivityFollowUp();
    }, INACTIVITY_DELAY_MS);
  }, [triggerInactivityFollowUp]);

  // Pause du chronomètre quand l'utilisateur tape
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Quand l'utilisateur tape activement, on repousse le timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        triggerInactivityFollowUp();
      }, INACTIVITY_DELAY_MS);
    }
  };

  // Envoi d'un message utilisateur
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    // Reset du champ et ajout immédiat
    setInputValue("");
    const userMsg: ChatMessage = {
      id: "msg_user_" + Date.now(),
      sender: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Annule le timer d'inactivité pendant qu'Ali réfléchit
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    try {
      const res = await fetch(N8N_CHAT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendMessage",
          sessionId: sessionIdRef.current,
          chatInput: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aliReply = data.output || data.text || "Je regarde ça pour toi !";
        const botMsg: ChatMessage = {
          id: "msg_ali_" + Date.now(),
          sender: "ali",
          text: aliReply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);

        // Démarre le chronomètre d'inactivité après la réponse d'Ali
        resetInactivityTimer();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: "msg_err_" + Date.now(),
            sender: "ali",
            text: "Désolé, j'ai eu un petit contretemps pour accéder au catalogue. Réessaie dans un instant !",
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

  // GESTION DU DRAG (GLISSER-DÉPOSER)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Si on clique sur le bouton alors qu'on glisse
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    hasMovedRef.current = false;
    const touch = e.touches[0];
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.startX;
      const dy = e.clientY - dragStartRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMovedRef.current = true;
      }

      const nextX = Math.min(Math.max(10, dragStartRef.current.initialX + dx), window.innerWidth - 70);
      const nextY = Math.min(Math.max(10, dragStartRef.current.initialY + dy), window.innerHeight - 70);

      setPosition({ x: nextX, y: nextY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStartRef.current) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.startX;
      const dy = touch.clientY - dragStartRef.current.startY;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMovedRef.current = true;
      }

      const nextX = Math.min(Math.max(10, dragStartRef.current.initialX + dx), window.innerWidth - 70);
      const nextY = Math.min(Math.max(10, dragStartRef.current.initialY + dy), window.innerHeight - 70);

      setPosition({ x: nextX, y: nextY });
    };

    const handleDragEnd = () => {
      if (dragStartRef.current && hasMovedRef.current) {
        localStorage.setItem("bko_ali_bubble_pos", JSON.stringify(position));
      }
      dragStartRef.current = null;
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, position]);

  const toggleChat = () => {
    // Si on a déplacé la bulle, on n'ouvre pas le chat
    if (hasMovedRef.current) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  // Convertisseur de texte Markdown (Gras & Liens)
  const renderMessageContent = (content: string) => {
    // Regex pour détecter [Texte](URL) et **Gras**
    const parts = content.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);

    return parts.map((part, idx) => {
      // Détection [Titre](URL)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        const isInternal = linkUrl.startsWith("/") || linkUrl.includes("bamakopodcast.studio");

        return (
          <a
            key={idx}
            href={linkUrl}
            onClick={(e) => {
              if (isInternal) {
                e.preventDefault();
                try {
                  const path = new URL(linkUrl, "https://www.bamakopodcast.studio").pathname;
                  router.push(path);
                } catch {
                  router.push(linkUrl);
                }
              }
            }}
            className="text-[#FFBF00] font-semibold underline underline-offset-2 hover:text-[#FFD700] transition-colors"
            target={isInternal ? "_self" : "_blank"}
            rel="noopener noreferrer"
          >
            {linkText}
          </a>
        );
      }

      // Détection **Gras**
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
      {/* BULLE FLOTTANTE GLISSABLE (DRAGGABLE) */}
      <div
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 9999,
          touchAction: "none",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="select-none"
      >
        <button
          onClick={toggleChat}
          className="relative w-14 h-14 rounded-full bg-[#141416] border-2 border-[#FFBF00] shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
          aria-label="Discuter avec Ali"
        >
          <Headphones className="w-6 h-6 text-[#FFBF00]" />

          {/* Pastille de notification (Badge doré) */}
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

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
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
              placeholder="Demande un podcast, un thème..."
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

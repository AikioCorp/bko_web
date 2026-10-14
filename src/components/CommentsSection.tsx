"use client";

import React, { useState, useRef, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import {
  Send,
  Trash2,
  Heart,
  Smile,
  Reply,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  CornerDownRight,
} from "lucide-react";
import { ReportButton } from "@/components/public/ReportButton";

export type Comment = {
  id: string;
  text: string;
  createdAt: string;
  parentId?: string | null;
  likesCount?: number;
  userLiked?: boolean;
  reactions?: Record<string, number>;
  userReaction?: string | null;
  repliesCount?: number;
  replies?: Comment[];
  user: {
    id: string;
    fullName: string;
    username: string | null;
    avatar: string | null;
  };
};

type Props = {
  episodeId: string;
  allowComments: boolean;
};

type ReplyingState = {
  id: string;
  rootId: string;
  authorName: string;
  text?: string;
};

const LIMIT = 20;
// Emojis de réaction rapide WhatsApp officiels + émojis étendus
const WHATSAPP_PRIMARY_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
const WHATSAPP_EXTENDED_EMOJIS = ["🔥", "👏", "💡", "🎙️", "💯", "🤝", "🚀", "🎉"];

export function CommentsSection({ episodeId, allowComments }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const login = () => router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  const { isAuthenticated, user } = useAuthStore();

  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  // État de réponse style TikTok / Facebook / WhatsApp
  const [replyingTo, setReplyingTo] = useState<ReplyingState | null>(null);

  // État des fils de réponses dépliés (clé = root commentId, valeur = boolean)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  // Dock de réactions émotions flottant style WhatsApp
  const [activeReactionCommentId, setActiveReactionCommentId] = useState<string | null>(null);
  const [showExtendedPicker, setShowExtendedPicker] = useState(false);

  // Burst animation au double-clic (cœur rouge flottant)
  const [burstHeartCommentId, setBurstHeartCommentId] = useState<string | null>(null);

  // État optimiste pour likes
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountsMap, setLikeCountsMap] = useState<Record<string, number>>({});

  // État optimiste pour réactions WhatsApp
  const [reactionsMap, setReactionsMap] = useState<Record<string, Record<string, number>>>({});
  const [userReactionMap, setUserReactionMap] = useState<Record<string, string | null>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);

  // Fermer le dock de réaction lors d'un clic extérieur
  useEffect(() => {
    if (!activeReactionCommentId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setActiveReactionCommentId(null);
        setShowExtendedPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeReactionCommentId]);

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.length) return null;
    return `/episodes/${episodeId}/comments?limit=${LIMIT}&offset=${pageIndex * LIMIT}`;
  };

  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<Comment[]>(
    getKey,
    async (url) => (await fetchApi<Comment[]>(url)).data ?? []
  );

  // Aplatir et dédupliquer les commentaires racines
  const comments = Array.from(
    new Map((data ? data.flat() : []).map((comment) => [comment.id, comment])).values()
  );
  const isLoadingInitialData = !data && isValidating;
  const isLoadingMore =
    isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < LIMIT);

  const getCommentAuthor = (c: { user: { fullName?: string | null; username?: string | null } }) =>
    c.user.fullName || c.user.username || "Auditeur";

  const getIsLiked = (c: Comment) => likedMap[c.id] ?? !!c.userLiked;
  const getLikeCount = (c: Comment) => likeCountsMap[c.id] ?? c.likesCount ?? 0;
  const getReactions = (c: Comment) => reactionsMap[c.id] ?? c.reactions ?? {};
  const getUserReaction = (c: Comment) => userReactionMap[c.id] ?? c.userReaction ?? null;

  const toggleRepliesExpansion = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Répondre à un commentaire ou une sous-réponse (TikTok / Facebook style)
  const handleReplyTo = (target: Comment, rootId?: string) => {
    if (!isAuthenticated) return login();
    const effectiveRootId = rootId || target.parentId || target.id;
    const authorName = getCommentAuthor(target);

    setReplyingTo({
      id: target.id,
      rootId: effectiveRootId,
      authorName,
      text: target.text,
    });
    setActiveReactionCommentId(null);
    setShowExtendedPicker(false);

    // Déplier automatiquement le fil de réponses
    setExpandedReplies((prev) => ({ ...prev, [effectiveRootId]: true }));

    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  const handleToggleLike = async (comment: Comment) => {
    if (!isAuthenticated) return login();

    const currentLiked = getIsLiked(comment);
    const currentCount = getLikeCount(comment);
    const nextLiked = !currentLiked;
    const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

    // Optimiste
    setLikedMap((prev) => ({ ...prev, [comment.id]: nextLiked }));
    setLikeCountsMap((prev) => ({ ...prev, [comment.id]: nextCount }));

    try {
      await fetchApi(`/comments/${comment.id}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });
    } catch {
      // Rollback
      setLikedMap((prev) => ({ ...prev, [comment.id]: currentLiked }));
      setLikeCountsMap((prev) => ({ ...prev, [comment.id]: currentCount }));
    }
  };

  const handleDoubleClickComment = (comment: Comment) => {
    if (!isAuthenticated) return login();

    setBurstHeartCommentId(comment.id);
    setTimeout(() => setBurstHeartCommentId(null), 800);

    if (!getIsLiked(comment)) {
      handleToggleLike(comment);
    }
  };

  const handleToggleReaction = async (comment: Comment, emoji: string) => {
    if (!isAuthenticated) return login();

    const currentReaction = getUserReaction(comment);
    const prevReactions = { ...getReactions(comment) };
    const nextReactions = { ...prevReactions };

    let nextUserReaction: string | null = emoji;

    if (currentReaction === emoji) {
      // Toggle off WhatsApp style
      nextUserReaction = null;
      const count = (nextReactions[emoji] || 1) - 1;
      if (count <= 0) {
        delete nextReactions[emoji];
      } else {
        nextReactions[emoji] = count;
      }
    } else {
      // Décrémenter l'ancienne réaction si l'utilisateur en avait une
      if (currentReaction) {
        const count = (nextReactions[currentReaction] || 1) - 1;
        if (count <= 0) {
          delete nextReactions[currentReaction];
        } else {
          nextReactions[currentReaction] = count;
        }
      }
      // Ajouter la nouvelle réaction
      nextReactions[emoji] = (nextReactions[emoji] || 0) + 1;
    }

    // Optimiste
    setUserReactionMap((prev) => ({ ...prev, [comment.id]: nextUserReaction }));
    setReactionsMap((prev) => ({ ...prev, [comment.id]: nextReactions }));
    setActiveReactionCommentId(null);
    setShowExtendedPicker(false);

    try {
      if (currentReaction === emoji) {
        await fetchApi(`/comments/${comment.id}/reactions`, { method: "DELETE" });
      } else {
        await fetchApi(`/comments/${comment.id}/reactions`, {
          method: "POST",
          body: JSON.stringify({ emoji }),
        });
      }
    } catch {
      // Rollback
      setUserReactionMap((prev) => ({ ...prev, [comment.id]: currentReaction }));
      setReactionsMap((prev) => ({ ...prev, [comment.id]: prevReactions }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return login();
    if (submitting || !allowComments) return;
    setActionError("");

    const text = draft.trim();
    if (!text) return;
    if (text.length > 2000) {
      alert("Le commentaire est trop long (max 2000 caractères).");
      return;
    }

    setSubmitting(true);
    try {
      const payload: { text: string; parentId?: string } = { text };
      if (replyingTo) {
        payload.parentId = replyingTo.rootId;
        // Mentionner l'auteur de la sous-réponse si différente du commentaire racine
        if (replyingTo.id !== replyingTo.rootId) {
          const mention = `@${replyingTo.authorName} `;
          if (!text.startsWith(mention)) {
            payload.text = `${mention}${text}`;
          }
        }
      }

      await fetchApi(`/episodes/${episodeId}/comments`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (replyingTo) {
        setExpandedReplies((prev) => ({ ...prev, [replyingTo.rootId]: true }));
      }

      setDraft("");
      setReplyingTo(null);
      mutate();
    } catch (err: any) {
      setActionError(err.message || "Erreur lors de l'envoi du commentaire");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;
    try {
      await fetchApi(`/comments/${commentId}`, { method: "DELETE" });
      mutate();
    } catch (err: any) {
      setActionError(err.message || "Erreur lors de la suppression");
    }
  };

  // Helper pour afficher le texte avec mentions @highlightées
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(@[\w\u00C0-\u017F.-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span key={i} className="font-semibold text-[#FFBF00]">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Rendu d'une bulle de commentaire (racine ou sous-réponse)
  const renderCommentCard = (comment: Comment, isReply = false, rootId?: string) => {
    const author = getCommentAuthor(comment);
    const isLiked = getIsLiked(comment);
    const likeCount = getLikeCount(comment);
    const reactions = getReactions(comment);
    const userReaction = getUserReaction(comment);
    const isAuthorOrAdmin =
      user && (user.id === comment.user.id || (user as any).roles?.includes("ADMIN"));
    const isDockOpen = activeReactionCommentId === comment.id;

    return (
      <div
        key={comment.id}
        onDoubleClick={() => handleDoubleClickComment(comment)}
        className={`relative group rounded-2xl border transition-all flex gap-3 select-text ${
          isReply
            ? "p-3 bg-[#18181C] border-[#222228] hover:border-[#2C2C34]"
            : "p-4 bg-[#141416] border-[#24242A] hover:border-[#303038]"
        }`}
      >
        {/* Animation Burst Cœur au double-clic */}
        {burstHeartCommentId === comment.id && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <span className="text-5xl animate-ping select-none">❤️</span>
          </div>
        )}

        {/* Avatar */}
        {comment.user.avatar ? (
          <img
            src={comment.user.avatar}
            alt={author}
            className={`rounded-full object-cover bg-[#262626] shrink-0 border border-[#2A2A30] ${
              isReply ? "w-8 h-8" : "w-10 h-10"
            }`}
          />
        ) : (
          <div
            className={`rounded-full bg-[#24242A] text-[#FFBF00] flex items-center justify-center font-bold shrink-0 border border-[#33333C] ${
              isReply ? "w-8 h-8 text-[11px]" : "w-10 h-10 text-xs"
            }`}
          >
            {author
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        )}

        {/* Contenu principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className={`font-bold text-white ${isReply ? "text-xs" : "text-sm"}`}>{author}</p>
              <span className="text-[11px] text-neutral-500">
                {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {isAuthorOrAdmin && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="text-neutral-500 hover:text-red-400 p-1 rounded-lg hover:bg-[#222228] transition-colors"
                  title="Supprimer"
                  aria-label="Supprimer le message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <ReportButton targetType="COMMENT" targetId={comment.id} />
            </div>
          </div>

          {/* Texte */}
          <p
            className={`text-[#E2E2E2] whitespace-pre-wrap leading-relaxed break-words ${
              isReply ? "text-xs" : "text-sm"
            }`}
          >
            {renderFormattedText(comment.text)}
          </p>

          {/* Badges de réactions WhatsApp au bas de la bulle */}
          {Object.keys(reactions).length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {Object.entries(reactions).map(([emoji, count]) => {
                if (count <= 0) return null;
                const isSelected = userReaction === emoji;
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleToggleReaction(comment, emoji)}
                    title={isSelected ? "Retirer votre réaction" : `Réagir avec ${emoji}`}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                      isSelected
                        ? "bg-[#FFBF00]/15 text-[#FFBF00] border border-[#FFBF00]/50 font-bold"
                        : "bg-[#1E1E24] text-neutral-300 border border-[#2C2C34] hover:border-[#3E3E48]"
                    }`}
                  >
                    <span className="text-xs">{emoji}</span>
                    <span className="text-[11px]">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Barre d'actions (J'aime, Répondre, Réagir) */}
          <div className="relative flex items-center gap-2 mt-2.5 pt-1.5 border-t border-[#1E1E24]">
            {/* Bouton Like avec compteur */}
            <button
              type="button"
              onClick={() => handleToggleLike(comment)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-all ${
                isLiked
                  ? "text-red-400 bg-red-500/10 font-bold"
                  : "text-neutral-400 hover:text-white hover:bg-[#1E1E24]"
              }`}
              aria-label={isLiked ? "Je n'aime plus" : "J'aime"}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  isLiked ? "fill-red-400 text-red-400 scale-110" : ""
                }`}
              />
              <span>{likeCount > 0 ? likeCount : "J'aime"}</span>
            </button>

            {/* Bouton Réagir (ouvre le dock flottant WhatsApp) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (isDockOpen) {
                    setActiveReactionCommentId(null);
                    setShowExtendedPicker(false);
                  } else {
                    setActiveReactionCommentId(comment.id);
                    setShowExtendedPicker(false);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                  userReaction
                    ? "text-[#FFBF00] bg-[#FFBF00]/10 font-bold"
                    : "text-neutral-400 hover:text-white hover:bg-[#1E1E24]"
                }`}
                aria-label="Réagir au message"
              >
                <Smile className="w-3.5 h-3.5" />
                <span>{userReaction ?? "Réagir"}</span>
              </button>

              {/* Dock flottant d'émotions style WhatsApp */}
              {isDockOpen && (
                <div
                  ref={dockRef}
                  className="absolute bottom-full mb-2 left-0 z-40 flex items-center gap-1 p-1.5 bg-[#1E1E24] border border-[#2E2E36] rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                >
                  {WHATSAPP_PRIMARY_EMOJIS.map((emoji) => {
                    const isSelected = userReaction === emoji;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => handleToggleReaction(comment, emoji)}
                        className={`p-1.5 hover:scale-130 active:scale-95 transition-transform duration-150 rounded-full text-base ${
                          isSelected ? "bg-[#FFBF00]/20 scale-110" : "hover:bg-[#2A2A32]"
                        }`}
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    );
                  })}

                  {/* Bouton + pour étendre la sélection comme WhatsApp */}
                  <button
                    type="button"
                    onClick={() => setShowExtendedPicker((prev) => !prev)}
                    className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#2A2A32] rounded-full transition-colors"
                    title="Plus de réactions"
                    aria-label="Plus d'émotions"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* Tiroir d'émotions supplémentaires WhatsApp */}
                  {showExtendedPicker && (
                    <div className="absolute left-0 bottom-full mb-2 p-2 bg-[#18181C] border border-[#2E2E36] rounded-2xl shadow-2xl flex flex-wrap gap-1 w-48 z-50">
                      {WHATSAPP_EXTENDED_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(comment, emoji)}
                          className="p-1.5 hover:scale-125 transition-transform rounded-lg hover:bg-[#26262E] text-base"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bouton Répondre */}
            <button
              type="button"
              onClick={() => handleReplyTo(comment, rootId)}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#1E1E24] px-2 py-1 rounded-lg transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              <span>Répondre</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 mt-12 border-t border-[#1F1F1F] pt-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-extrabold text-white">Commentaires</h2>
          {comments.length > 0 && (
            <span className="text-xs font-bold text-[#FFBF00] bg-[#FFBF00]/10 border border-[#FFBF00]/20 px-2 py-0.5 rounded-full">
              {comments.reduce(
                (acc, c) => acc + 1 + (c.replies?.length ?? c.repliesCount ?? 0),
                0
              )}
            </span>
          )}
        </div>

        {(error || actionError) && (
          <div role="alert" className="text-sm text-red-400 mb-2">
            {actionError || "Impossible de charger les commentaires."}
            {error && (
              <button
                type="button"
                onClick={() => mutate()}
                className="ml-3 underline hover:text-red-300"
              >
                Réessayer
              </button>
            )}
          </div>
        )}

        {!allowComments && (
          <p className="text-sm text-[#FFBF00] bg-[#FFBF00]/10 p-3 rounded-xl border border-[#FFBF00]/20">
            Les commentaires sont fermés pour cet épisode.
          </p>
        )}
      </div>

      {allowComments && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Bandeau de réponse style TikTok / Facebook */}
          {replyingTo && (
            <div className="flex items-center justify-between gap-3 p-3 bg-[#1A1A1E] border-l-4 border-[#FFBF00] rounded-r-xl border-t border-r border-b border-[#28282E] text-xs transition-all">
              <div className="min-w-0">
                <p className="font-bold text-[#FFBF00] flex items-center gap-1.5">
                  <Reply className="w-3.5 h-3.5 shrink-0" />
                  Réponse à @{replyingTo.authorName}
                </p>
                {replyingTo.text && (
                  <p className="text-neutral-400 truncate mt-0.5">{replyingTo.text}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-[#28282E] transition-colors shrink-0"
                aria-label="Annuler la réponse"
                title="Annuler la réponse"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            aria-label="Votre commentaire public"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={submitting || !isAuthenticated}
            placeholder={
              !isAuthenticated
                ? "Connectez-vous pour commenter"
                : replyingTo
                ? `Répondre à @${replyingTo.authorName}...`
                : "Ajouter un commentaire public..."
            }
            className="w-full bg-[#141416] border border-[#2E2E34] rounded-xl p-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFBF00] resize-none min-h-[95px] transition-colors"
            maxLength={2000}
          />

          <div className="flex justify-end gap-3">
            {replyingTo && (
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="bg-[#222226] hover:bg-[#2A2A30] text-neutral-300 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                Annuler
              </button>
            )}
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={login}
                className="bg-[#262626] hover:bg-[#333333] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
              >
                Se connecter
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !draft.trim()}
                className="bg-[#FFBF00] hover:bg-[#E5AC00] active:scale-95 text-[#0B0B0B] text-sm font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 transition-all"
              >
                {submitting ? "Envoi..." : "Publier"}
                {!submitting && <Send className="w-4 h-4" />}
              </button>
            )}
          </div>
        </form>
      )}

      {/* Liste des commentaires avec structure arborescente TikTok / Facebook */}
      <div className="space-y-6">
        {comments.map((rootComment) => {
          const replies = rootComment.replies || [];
          const repliesCount = replies.length > 0 ? replies.length : rootComment.repliesCount ?? 0;
          const isExpanded = !!expandedReplies[rootComment.id];

          return (
            <div key={rootComment.id} className="space-y-3">
              {/* Commentaire racine */}
              {renderCommentCard(rootComment, false)}

              {/* Bouton déplier/replier les réponses style TikTok / Facebook */}
              {repliesCount > 0 && (
                <div className="pl-6 sm:pl-10">
                  <button
                    type="button"
                    onClick={() => toggleRepliesExpansion(rootComment.id)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#FFBF00] hover:text-[#E5AC00] transition-colors py-1 group"
                  >
                    <span className="w-6 h-px bg-[#FFBF00]/40 group-hover:bg-[#FFBF00]" />
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Masquer les réponses</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>
                          Voir les {repliesCount} {repliesCount > 1 ? "réponses" : "réponse"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Arborescence des réponses imbriquées TikTok / Facebook */}
              {isExpanded && replies.length > 0 && (
                <div className="relative pl-6 sm:pl-10 space-y-3">
                  {/* Ligne verticale de liaison d'arbre TikTok */}
                  <div className="absolute left-3 sm:left-5 top-0 bottom-4 w-0.5 bg-[#282830] rounded-full" />

                  {replies.map((reply) => (
                    <div key={reply.id} className="relative flex items-start gap-2">
                      {/* Connecteur coudé vers la sous-réponse */}
                      <div className="text-[#383842] shrink-0 mt-3 -ml-3 sm:-ml-5">
                        <CornerDownRight className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {renderCommentCard(reply, true, rootComment.id)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {isLoadingInitialData && (
          <p className="text-sm text-neutral-500 text-center py-4">
            Chargement des commentaires...
          </p>
        )}

        {!isLoadingInitialData && isEmpty && (
          <p className="text-sm text-neutral-500 text-center py-8">
            Aucun commentaire pour l&apos;instant. Soyez le premier !
          </p>
        )}

        {!isReachingEnd && (
          <div className="text-center pt-4">
            <button
              onClick={() => setSize(size + 1)}
              disabled={isLoadingMore}
              className="text-sm font-bold text-[#FFBF00] hover:text-[#FFBF00]/80 disabled:opacity-50 transition-colors"
            >
              {isLoadingMore ? "Chargement..." : "Voir plus de commentaires"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

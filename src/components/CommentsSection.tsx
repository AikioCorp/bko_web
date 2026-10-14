"use client";

import React, { useState, useRef, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { Send, Trash2, Heart, Smile, Reply, X } from "lucide-react";
import { ReportButton } from "@/components/public/ReportButton";

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  likesCount?: number;
  userLiked?: boolean;
  reactions?: Record<string, number>;
  userReaction?: string | null;
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

const LIMIT = 20;
const REACTION_EMOJIS = ["❤️", "🔥", "😂", "👏", "💡", "🎙️"];

export function CommentsSection({ episodeId, allowComments }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const login = () => router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  const { isAuthenticated, user } = useAuthStore();

  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  // État de réponse style WhatsApp / fil de discussion
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  // Dock de réactions émotions
  const [activeReactionCommentId, setActiveReactionCommentId] = useState<string | null>(null);

  // Burst animation au double-clic (cœur flottant)
  const [burstHeartCommentId, setBurstHeartCommentId] = useState<string | null>(null);

  // État optimiste pour likes
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [likeCountsMap, setLikeCountsMap] = useState<Record<string, number>>({});

  // État optimiste pour réactions
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

  const comments = Array.from(new Map((data ? data.flat() : []).map(comment => [comment.id, comment])).values());
  const isLoadingInitialData = !data && isValidating;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < LIMIT);

  const getCommentAuthor = (c: Comment) => c.user.fullName || c.user.username || "Auditeur";

  const getIsLiked = (c: Comment) => likedMap[c.id] ?? !!c.userLiked;
  const getLikeCount = (c: Comment) => likeCountsMap[c.id] ?? (c.likesCount || 0);
  const getReactions = (c: Comment) => reactionsMap[c.id] ?? (c.reactions || {});
  const getUserReaction = (c: Comment) => userReactionMap[c.id] ?? c.userReaction ?? null;

  const handleReply = (comment: Comment) => {
    if (!isAuthenticated) return login();
    setReplyingTo(comment);
    setActiveReactionCommentId(null);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const handleToggleLike = async (commentId: string) => {
    if (!isAuthenticated) return login();

    const targetComment = comments.find(c => c.id === commentId);
    if (!targetComment) return;

    const currentLiked = getIsLiked(targetComment);
    const currentCount = getLikeCount(targetComment);
    const nextLiked = !currentLiked;
    const nextCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

    // Optimiste
    setLikedMap(prev => ({ ...prev, [commentId]: nextLiked }));
    setLikeCountsMap(prev => ({ ...prev, [commentId]: nextCount }));

    try {
      await fetchApi(`/comments/${commentId}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });
    } catch {
      // Rollback en cas d'erreur
      setLikedMap(prev => ({ ...prev, [commentId]: currentLiked }));
      setLikeCountsMap(prev => ({ ...prev, [commentId]: currentCount }));
    }
  };

  const handleDoubleClickComment = (comment: Comment) => {
    if (!isAuthenticated) return login();

    // Micro-animation burst
    setBurstHeartCommentId(comment.id);
    setTimeout(() => setBurstHeartCommentId(null), 800);

    if (!getIsLiked(comment)) {
      handleToggleLike(comment.id);
    }
  };

  const handleToggleReaction = async (commentId: string, emoji: string) => {
    if (!isAuthenticated) return login();

    const targetComment = comments.find(c => c.id === commentId);
    if (!targetComment) return;

    const currentReaction = getUserReaction(targetComment);
    const prevReactions = { ...getReactions(targetComment) };
    const nextReactions = { ...prevReactions };

    let nextUserReaction: string | null = emoji;

    if (currentReaction === emoji) {
      // Toggle off
      nextUserReaction = null;
      const count = (nextReactions[emoji] || 1) - 1;
      if (count <= 0) {
        delete nextReactions[emoji];
      } else {
        nextReactions[emoji] = count;
      }
    } else {
      // Décrémenter l'ancienne réaction si existante
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
    setUserReactionMap(prev => ({ ...prev, [commentId]: nextUserReaction }));
    setReactionsMap(prev => ({ ...prev, [commentId]: nextReactions }));
    setActiveReactionCommentId(null);

    try {
      if (currentReaction === emoji) {
        await fetchApi(`/comments/${commentId}/reactions`, { method: "DELETE" });
      } else {
        await fetchApi(`/comments/${commentId}/reactions`, {
          method: "POST",
          body: JSON.stringify({ emoji }),
        });
      }
    } catch {
      // Rollback
      setUserReactionMap(prev => ({ ...prev, [commentId]: currentReaction }));
      setReactionsMap(prev => ({ ...prev, [commentId]: prevReactions }));
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

    // Préfixe de citation si en réponse
    let finalText = text;
    if (replyingTo) {
      const author = getCommentAuthor(replyingTo);
      const prefix = `@${author} `;
      if (!finalText.startsWith(prefix)) {
        finalText = `${prefix}${finalText}`;
      }
    }

    setSubmitting(true);
    try {
      await fetchApi(`/episodes/${episodeId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: finalText }),
      });
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
    if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
    try {
      await fetchApi(`/comments/${commentId}`, { method: "DELETE" });
      mutate();
    } catch (err: any) {
      setActionError(err.message || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-8 mt-12 border-t border-[#1F1F1F] pt-8">
      <div>
        <h2 className="text-xl font-extrabold text-white mb-2">Commentaires</h2>
        {(error || actionError) && (
          <div role="alert" className="text-sm text-red-400 mb-2">
            {actionError || "Impossible de charger les commentaires."}
            {error && (
              <button type="button" onClick={() => mutate()} className="ml-3 underline hover:text-red-300">
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
          {/* Bandeau citation style WhatsApp / fil de discussion */}
          {replyingTo && (
            <div className="flex items-center justify-between gap-3 p-3 bg-[#1A1A1E] border-l-4 border-[#FFBF00] rounded-r-xl border-t border-r border-b border-[#28282E] text-xs transition-all">
              <div className="min-w-0">
                <p className="font-bold text-[#FFBF00] flex items-center gap-1.5">
                  <Reply className="w-3.5 h-3.5 shrink-0" />
                  Réponse à @{getCommentAuthor(replyingTo)}
                </p>
                <p className="text-neutral-400 truncate mt-0.5">{replyingTo.text}</p>
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
                ? `Répondre à @${getCommentAuthor(replyingTo)}...`
                : "Ajouter un commentaire public..."
            }
            className="w-full bg-[#141416] border border-[#2E2E34] rounded-xl p-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#FFBF00] resize-none min-h-[100px] transition-colors"
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

      <div className="space-y-6">
        {comments.map((comment) => {
          const author = getCommentAuthor(comment);
          const isLiked = getIsLiked(comment);
          const likeCount = getLikeCount(comment);
          const reactions = getReactions(comment);
          const userReaction = getUserReaction(comment);
          const isAuthorOrAdmin =
            user && (user.id === comment.user.id || (user as any).roles?.includes("ADMIN"));

          return (
            <div
              key={comment.id}
              onDoubleClick={() => handleDoubleClickComment(comment)}
              className="relative group p-4 rounded-2xl bg-[#141416] border border-[#24242A] hover:border-[#303038] transition-all flex gap-4 select-text"
            >
              {/* Animation Cœur au double-clic */}
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
                  className="w-10 h-10 rounded-full object-cover bg-[#262626] shrink-0 border border-[#2A2A30]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#24242A] text-[#FFBF00] flex items-center justify-center font-bold text-xs shrink-0 border border-[#33333C]">
                  {author.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
              )}

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-sm font-bold text-white">{author}</p>
                    <span className="text-xs text-neutral-500">
                      {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAuthorOrAdmin && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-neutral-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-[#222228] transition-colors"
                        title="Supprimer le commentaire"
                        aria-label="Supprimer le commentaire"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ReportButton targetType="COMMENT" targetId={comment.id} />
                  </div>
                </div>

                {/* Texte du commentaire */}
                <p className="text-sm text-[#DFDFDF] whitespace-pre-wrap leading-relaxed break-words">
                  {comment.text}
                </p>

                {/* Reaction Chips affichées sous le commentaire */}
                {Object.keys(reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {Object.entries(reactions).map(([emoji, count]) => {
                      if (count <= 0) return null;
                      const isSelected = userReaction === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(comment.id, emoji)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                            isSelected
                              ? "bg-[#FFBF00]/15 text-[#FFBF00] border border-[#FFBF00]/40"
                              : "bg-[#1E1E22] text-neutral-300 border border-[#2B2B32] hover:border-[#3E3E48]"
                          }`}
                        >
                          <span className="text-xs">{emoji}</span>
                          <span className="text-[11px] font-bold">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Barre d'actions (Like, Réagir, Répondre) */}
                <div className="relative flex items-center gap-2 mt-3 pt-2 border-t border-[#1E1E24]">
                  {/* Bouton Like avec rebond */}
                  <button
                    type="button"
                    onClick={() => handleToggleLike(comment.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all ${
                      isLiked
                        ? "text-red-400 bg-red-500/10"
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

                  {/* Bouton Réagir (ouvre le dock d'émotions) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReactionCommentId(
                          activeReactionCommentId === comment.id ? null : comment.id
                        )
                      }
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${
                        userReaction
                          ? "text-[#FFBF00] bg-[#FFBF00]/10"
                          : "text-neutral-400 hover:text-white hover:bg-[#1E1E24]"
                      }`}
                      aria-label="Réagir avec une émotion"
                    >
                      <Smile className="w-3.5 h-3.5" />
                      <span>{userReaction ?? "Réagir"}</span>
                    </button>

                    {/* Dock d'émotions flottant style WhatsApp / Telegram */}
                    {activeReactionCommentId === comment.id && (
                      <div
                        ref={dockRef}
                        className="absolute bottom-full mb-2 left-0 z-30 flex items-center gap-1 p-1.5 bg-[#1E1E24] border border-[#2E2E36] rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                      >
                        {REACTION_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(comment.id, emoji)}
                            className="p-1.5 hover:scale-130 active:scale-95 transition-transform duration-150 rounded-full hover:bg-[#2A2A32] text-base"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bouton Répondre */}
                  <button
                    type="button"
                    onClick={() => handleReply(comment)}
                    className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#1E1E24] px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Répondre</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {isLoadingInitialData && (
          <p className="text-sm text-neutral-500 text-center py-4">Chargement des commentaires...</p>
        )}

        {!isLoadingInitialData && isEmpty && (
          <p className="text-sm text-neutral-500 text-center py-8">
            Aucun commentaire pour l'instant. Soyez le premier !
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

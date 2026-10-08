"use client";
import React, { useState } from "react";
import useSWRInfinite from "swr/infinite";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import { Send, Trash2 } from "lucide-react";
import { ReportButton } from "@/components/public/ReportButton";

type Comment = {
  id: string;
  text: string;
  createdAt: string;
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

export function CommentsSection({ episodeId, allowComments }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const login = () => router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
  const { isAuthenticated, user } = useAuthStore();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.length) return null; // reached the end
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return login();
    if (submitting || !allowComments) return;
    setActionError("");
    const text = draft.trim();
    if (!text) return;
    if (text.length > 2000) return alert("Le commentaire est trop long (max 2000 caractères).");

    setSubmitting(true);
    try {
      await fetchApi(`/episodes/${episodeId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text })
      });
      setDraft("");
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
        {(error || actionError) && <div role="alert" className="text-sm text-red-300">
          {actionError || "Impossible de charger les commentaires."}
          {error && <button type="button" onClick={() => mutate()} className="ml-3 underline">Réessayer</button>}
        </div>}
        {!allowComments && (
          <p className="text-sm text-[#FFBF00] bg-[#FFBF00]/10 p-3 rounded-lg border border-[#FFBF00]/20">
            Les commentaires sont fermés pour cet épisode.
          </p>
        )}
      </div>

      {allowComments && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            aria-label="Votre commentaire public"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={submitting || !isAuthenticated}
            placeholder={isAuthenticated ? "Ajouter un commentaire public..." : "Connectez-vous pour commenter"}
            className="w-full bg-[#141414] border border-[#2E2E2E] rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FFBF00] resize-none min-h-[100px]"
            maxLength={2000}
          />
          <div className="flex justify-end">
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={login}
                className="bg-[#262626] text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Se connecter
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !draft.trim()}
                className="bg-[#FFBF00] text-black text-sm font-bold px-6 py-2.5 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? "Envoi..." : "Publier"}
                {!submitting && <Send className="w-4 h-4" />}
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            {comment.user.avatar ? (
              <img
                src={comment.user.avatar}
                alt={comment.user.fullName}
                className="w-10 h-10 rounded-full object-cover bg-[#262626] shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#2A2A2A] text-[#B8B8B8] flex items-center justify-center font-bold text-sm shrink-0 border border-[#333]">
                {(comment.user.fullName || comment.user.username || "?").split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-bold text-white">
                  {comment.user.fullName}
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    {new Date(comment.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric"
                    })}
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  {user && (user.id === comment.user.id || (user as any).roles?.includes("ADMIN")) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="text-gray-500 hover:text-red-400 p-1"
                      title="Supprimer"
                      aria-label="Supprimer le commentaire"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ReportButton targetType="COMMENT" targetId={comment.id} />
                </div>
              </div>
              <p className="text-sm text-[#CFCFCF] whitespace-pre-wrap leading-relaxed break-words">
                {comment.text}
              </p>
            </div>
          </div>
        ))}

        {isLoadingInitialData && <p className="text-sm text-gray-500 text-center">Chargement des commentaires...</p>}
        
        {!isLoadingInitialData && isEmpty && (
          <p className="text-sm text-gray-500 text-center py-8">Aucun commentaire pour l'instant. Soyez le premier !</p>
        )}

        {!isReachingEnd && (
          <div className="text-center pt-4">
            <button
              onClick={() => setSize(size + 1)}
              disabled={isLoadingMore}
              className="text-sm font-bold text-[#FFBF00] hover:text-[#FFBF00]/80 disabled:opacity-50"
            >
              {isLoadingMore ? "Chargement..." : "Voir plus de commentaires"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

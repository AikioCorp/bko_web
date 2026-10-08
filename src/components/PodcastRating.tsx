"use client";
import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";

type Props = {
  podcastId: string;
};

export function PodcastRating({ podcastId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const userId = useAuthStore(s => s.user?.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const { data, error, mutate } = useSWR<{ average: number | null, count: number, userRating: number | null }>(
    [`/podcasts/${podcastId}/ratings`, userId ?? "guest"],
    async ([url]) => (await fetchApi(url)).data
  );

  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const currentRating = data?.userRating || 0;
  const avg = data?.average;
  const count = data?.count || 0;

  const handleRate = async (score: number) => {
    if (!isAuthenticated) return router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    if (submitting) return;
    
    setSubmitting(true);
    setActionError("");
    // Optimistic UI
    const prev = data;
    const removing = score === currentRating;
    const nextCount = count + (removing ? -1 : currentRating ? 0 : 1);
    mutate({
      average: data?.average ?? null,
      count: Math.max(0, nextCount),
      userRating: removing ? null : score
    }, false);

    try {
      if (score === currentRating) {
        // Remove rating if clicking the same score
        await fetchApi(`/podcasts/${podcastId}/ratings`, { method: "DELETE" });
      } else {
        await fetchApi(`/podcasts/${podcastId}/ratings`, {
          method: "POST",
          body: JSON.stringify({ score })
        });
      }
      mutate(); // Revalidate with real data
    } catch (e) {
      mutate(prev, false);
      setActionError("Impossible d'enregistrer votre note. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {(error || actionError) && <p role="alert" className="text-sm text-red-300">{actionError || "Impossible de charger les notes."}</p>}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = hoverRating ? star <= hoverRating : star <= currentRating;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onClick={() => handleRate(star)}
                disabled={submitting}
                className="focus:outline-none focus:ring-2 focus:ring-[#FFBF00] rounded-sm p-0.5"
                aria-label={`Noter ${star} étoile${star > 1 ? 's' : ''}`}
                aria-pressed={currentRating === star}
                title={currentRating === star ? "Retirer ma note" : `Noter ${star}`}
              >
                <Star className={`w-6 h-6 transition-colors ${isFilled ? "fill-[#FFBF00] text-[#FFBF00]" : "text-[#2E2E2E]"}`} />
              </button>
            );
          })}
        </div>
        <div className="text-sm font-medium text-[#8A8A8A]">
          {avg !== null && avg !== undefined ? (
            <span>
              <strong className="text-white">{avg.toFixed(1)}</strong> sur 5 ({count} avis)
            </span>
          ) : (
            <span>Pas encore de note</span>
          )}
        </div>
      </div>
      {currentRating > 0 && (
        <p className="text-xs text-[#FFBF00]">
          Vous avez noté ce podcast {currentRating}/5. Cliquez sur votre note pour la retirer.
        </p>
      )}
    </div>
  );
}

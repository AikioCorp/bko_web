import { create } from "zustand";
import { fetchApi } from "@/lib/api";

interface LikesState {
  likedEpisodeIds: Set<string>;
  isLoaded: boolean;
  loadLikes: () => Promise<void>;
  toggleLike: (episodeId: string) => Promise<boolean>;
  isLiked: (episodeId: string) => boolean;
}

export const useLikesStore = create<LikesState>((set, get) => ({
  likedEpisodeIds: new Set<string>(),
  isLoaded: false,

  loadLikes: async () => {
    try {
      const res = await fetchApi<string[]>("/me/liked-ids");
      if (res?.data && Array.isArray(res.data)) {
        set({ likedEpisodeIds: new Set(res.data), isLoaded: true });
      }
    } catch {
      // Ignored if user not logged in
    }
  },

  toggleLike: async (episodeId: string) => {
    const { likedEpisodeIds } = get();
    const currentlyLiked = likedEpisodeIds.has(episodeId);
    const updated = new Set(likedEpisodeIds);

    // Optimistic update
    if (currentlyLiked) {
      updated.delete(episodeId);
    } else {
      updated.add(episodeId);
    }
    set({ likedEpisodeIds: updated });

    try {
      if (currentlyLiked) {
        await fetchApi(`/episodes/${episodeId}/likes`, { method: "DELETE" });
      } else {
        await fetchApi(`/episodes/${episodeId}/likes`, { method: "POST" });
      }
      return !currentlyLiked;
    } catch (err) {
      // Revert optimistic update
      set({ likedEpisodeIds });
      throw err;
    }
  },

  isLiked: (episodeId: string) => {
    return get().likedEpisodeIds.has(episodeId);
  },
}));

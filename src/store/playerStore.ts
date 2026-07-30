import { create } from "zustand";

export interface PlayerMediaSource {
  id: string;
  type: "AUDIO" | "VIDEO";
  sourceType: "UPLOAD" | "EXTERNAL" | "RSS_FEED";
  provider?: string | null;
  playbackMode: "NATIVE" | "EMBED" | "EXTERNAL_REDIRECT";
  externalUrl?: string | null;
  embedUrl?: string | null;
  durationSeconds?: number | null;
  isPrimaryAudio?: boolean;
  isPrimaryVideo?: boolean;
}

export interface PlayerEpisode {
  id: string;
  slug: string;
  title: string;
  cover?: string | null;
  durationSeconds: number;
  podcast: {
    slug: string;
    name: string;
    cover: string;
  };
  mediaSources: PlayerMediaSource[];
}

interface PlayerState {
  currentEpisode: PlayerEpisode | null;
  activeSource: PlayerMediaSource | null;
  mode: "AUDIO" | "VIDEO";
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isExpanded: boolean;

  playEpisode: (episode: PlayerEpisode, mode?: "AUDIO" | "VIDEO") => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setMode: (mode: "AUDIO" | "VIDEO") => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (vol: number) => void;
  toggleExpanded: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentEpisode: null,
  activeSource: null,
  mode: "AUDIO",
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1.0,
  volume: 1.0,
  isExpanded: false,

  playEpisode: (episode, mode = "AUDIO") => {
    const primaryAudio = episode.mediaSources.find((s) => s.isPrimaryAudio) || episode.mediaSources.find((s) => s.type === "AUDIO");
    const primaryVideo = episode.mediaSources.find((s) => s.isPrimaryVideo) || episode.mediaSources.find((s) => s.type === "VIDEO");

    const selectedSource = mode === "VIDEO" ? (primaryVideo || primaryAudio) : (primaryAudio || primaryVideo);

    set({
      currentEpisode: episode,
      activeSource: selectedSource || null,
      mode: selectedSource?.type || mode,
      isPlaying: true,
      currentTime: 0,
      duration: episode.durationSeconds || selectedSource?.durationSeconds || 0,
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  seek: (time) => set({ currentTime: time }),

  setMode: (mode) => {
    const { currentEpisode } = get();
    if (!currentEpisode) return;

    const primaryAudio = currentEpisode.mediaSources.find((s) => s.isPrimaryAudio) || currentEpisode.mediaSources.find((s) => s.type === "AUDIO");
    const primaryVideo = currentEpisode.mediaSources.find((s) => s.isPrimaryVideo) || currentEpisode.mediaSources.find((s) => s.type === "VIDEO");

    const selectedSource = mode === "VIDEO" ? (primaryVideo || primaryAudio) : (primaryAudio || primaryVideo);

    set({
      mode,
      activeSource: selectedSource || null,
    });
  },

  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setVolume: (vol) => set({ volume: vol }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
}));

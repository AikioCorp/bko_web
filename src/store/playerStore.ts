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
  ecoDataMode: boolean;
  showRightPanel: boolean;
  /** Position de reprise appliquée au chargement du média (secondes). */
  startAt: number;
  /** Demande de déplacement explicite (barre de progression, chapitres, transcription). */
  seekRequest: { time: number; n: number } | null;

  queue: PlayerEpisode[];
  playEpisode: (episode: PlayerEpisode, mode?: "AUDIO" | "VIDEO", startAt?: number) => void;
  addToQueue: (episode: PlayerEpisode) => void;
  removeFromQueue: (index: number) => void;
  playNext: () => void;
  
  togglePlay: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setProgress: (time: number, duration?: number) => void;
  setMode: (mode: "AUDIO" | "VIDEO") => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (vol: number) => void;
  toggleExpanded: () => void;
  toggleEcoDataMode: () => void;
  toggleRightPanel: () => void;
}

function pickSource(episode: PlayerEpisode, mode: "AUDIO" | "VIDEO") {
  const audio = episode.mediaSources.find((s) => s.isPrimaryAudio) || episode.mediaSources.find((s) => s.type === "AUDIO");
  const video = episode.mediaSources.find((s) => s.isPrimaryVideo) || episode.mediaSources.find((s) => s.type === "VIDEO");
  return mode === "VIDEO" ? video || audio : audio || video;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  // Aucun épisode au départ : le lecteur n'apparaît qu'après un premier choix de l'utilisateur.
  currentEpisode: null,
  activeSource: null,
  mode: "AUDIO",
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1.0,
  volume: 0.8,
  isExpanded: false,
  ecoDataMode: false,
  showRightPanel: false,
  startAt: 0,
  seekRequest: null,
  queue: [],

  playEpisode: (episode, mode = "AUDIO", startAt = 0) => {
    const selectedSource = pickSource(episode, mode);
    set({
      currentEpisode: episode,
      activeSource: selectedSource || null,
      mode: selectedSource?.type || mode,
      isPlaying: !!selectedSource,
      currentTime: startAt,
      startAt,
      seekRequest: null,
      duration: episode.durationSeconds || selectedSource?.durationSeconds || 0,
    });
  },

  addToQueue: (episode) => set((state) => {
    if (!state.currentEpisode) {
      return {
        currentEpisode: episode,
        activeSource: episode.mediaSources?.[0] || null,
        isPlaying: false,
        currentTime: 0,
        duration: episode.durationSeconds || 0,
        queue: []
      };
    }
    return { queue: [...state.queue, episode] };
  }),
  
  removeFromQueue: (index) => set((state) => ({ 
    queue: state.queue.filter((_, i) => i !== index) 
  })),

  playNext: () => {
    const state = get();
    if (state.queue.length > 0) {
      const nextEp = state.queue[0];
      state.removeFromQueue(0);
      state.playEpisode(nextEp);
    } else {
      set({ isPlaying: false, currentTime: 0 });
    }
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  pause: () => set({ isPlaying: false }),

  seek: (time) => set((state) => ({ currentTime: time, seekRequest: { time, n: (state.seekRequest?.n ?? 0) + 1 } })),

  setProgress: (time, duration) => set((state) => ({ currentTime: time, duration: duration && duration > 0 ? duration : state.duration })),

  setMode: (mode) => {
    const { currentEpisode } = get();
    if (!currentEpisode) return;
    const selectedSource = pickSource(currentEpisode, mode);
    set({ mode, activeSource: selectedSource || null });
  },

  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setVolume: (vol) => set({ volume: vol }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
  toggleEcoDataMode: () => set((state) => ({ ecoDataMode: !state.ecoDataMode })),
  toggleRightPanel: () => set((state) => ({ showRightPanel: !state.showRightPanel })),
}));

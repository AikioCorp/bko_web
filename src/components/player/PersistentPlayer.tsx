"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Play, Maximize2, Minimize2, MoreHorizontal, RotateCw, Rabbit, Turtle, 
  Share, Code, Pause, Volume2, VolumeX, ListMusic, RotateCcw, X, ExternalLink,
  Check, Copy, Radio, ChevronDown, Sparkles, SkipForward
} from "lucide-react";
import { usePlayerStore } from "../../store/playerStore";
import { useAuthStore } from "../../store/authStore";
import { ListenTracker } from "@/lib/playTracking";
import { decodeHtmlEntities } from "@/lib/utils";
import { ScrollingTitle } from "./ScrollingTitle";

// ReactPlayer est chargÃ© cÃ´tÃ© client uniquement (pas de rendu serveur).
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

// Seuls ces hÃ´tes peuvent Ãªtre affichÃ©s dans un iframe (dÃ©fense en profondeur cÃ´tÃ© lecteur).
const EMBED_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "open.spotify.com",
  "embed.podcasts.apple.com",
  "www.deezer.com",
  "widget.deezer.com",
  "w.soundcloud.com",
  "player.vimeo.com",
];

const safeHttp = (u?: string | null) => {
  try {
    const x = new URL(u ?? "");
    return x.protocol === "https:" || x.protocol === "http:" ? x.href : null;
  } catch {
    return null;
  }
};
const safeEmbed = (u?: string | null) => {
  try {
    const x = new URL(u ?? "");
    return x.protocol === "https:" && EMBED_HOSTS.includes(x.hostname) ? x.href : null;
  } catch {
    return null;
  }
};

type Kind = "audio" | "video" | "embed" | "redirect" | "none";

export const PersistentPlayer = () => {
  const {
    currentEpisode,
    activeSource,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    startAt,
    seekRequest,
    togglePlay,
    pause,
    seek,
    setProgress,
    setPlaybackRate,
    setVolume,
    toggleRightPanel,
    showRightPanel,
    queue,
    removeFromQueue,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<any>(null);
  const tracker = useRef<ListenTracker | null>(null);
  const trackerStarted = useRef(false);
  const handledSeek = useRef(0);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [hoverCover, setHoverCover] = useState(false);
  const [scrubHoverTime, setScrubHoverTime] = useState<number | null>(null);
  const [scrubHoverPct, setScrubHoverPct] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [artworkTapEffect, setArtworkTapEffect] = useState(false);

  useEffect(() => setMounted(true), []);

  // Raccourcis clavier physiques inspirés d'Apple Podcasts quand le lecteur est étendu
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

      if (e.code === "Space") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        seek(Math.max(0, currentTime - 15));
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        seek(Math.min(duration || 0, currentTime + 30));
      } else if (e.code === "Escape") {
        e.preventDefault();
        setIsExpanded(false);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setVolume(volume === 0 ? 0.8 : 0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, currentTime, duration, volume, isPlaying]);

  const kind: Kind = useMemo(() => {
    const s = activeSource;
    if (!s) return "none";
    if (s.playbackMode === "EXTERNAL_REDIRECT") return safeHttp(s.externalUrl) ? "redirect" : "none";
    if (s.type === "AUDIO" && s.playbackMode === "NATIVE" && safeHttp(s.externalUrl)) return "audio";
    if (s.type === "VIDEO" && (s.playbackMode === "NATIVE" || s.provider === "YOUTUBE" || s.provider === "VIMEO") && safeHttp(s.externalUrl)) return "video";
    if (s.playbackMode === "EMBED" && safeEmbed(s.embedUrl)) return "embed";
    return safeHttp(s.externalUrl) ? "redirect" : "none";
  }, [activeSource]);

  // Nouveau suivi d'écoute à chaque épisode ; flush de l'ancien à la sortie.
  useEffect(() => {
    if (!currentEpisode) return;
    const t = new ListenTracker(
      currentEpisode.id,
      () => useAuthStore.getState().isAuthenticated,
      (currentEpisode as any).attribution
    );
    t.setPlaybackRate(playbackRate);
    tracker.current = t;
    trackerStarted.current = false;
    handledSeek.current = 0;
    // Lecteurs tiers : on ne peut pas mesurer l'écoute, seul le démarrage est compté.
    if (kind === "embed") {
      t.start(0, playbackRate);
      trackerStarted.current = true;
    }
    return () => {
      const s = usePlayerStore.getState();
      t.pause(s.currentTime, s.duration);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisode?.id]);

  // Démarrage (première lecture réelle) et pause.
  useEffect(() => {
    const t = tracker.current;
    if (!t) return;
    t.setPlaybackRate(playbackRate);
    if (isPlaying && (kind === "audio" || kind === "video") && !trackerStarted.current) {
      trackerStarted.current = true;
      t.start(usePlayerStore.getState().currentTime, playbackRate);
    }
    if (!isPlaying && trackerStarted.current && (kind === "audio" || kind === "video")) {
      t.pause(usePlayerStore.getState().currentTime, usePlayerStore.getState().duration);
    }
  }, [isPlaying, kind, playbackRate]);

  // Lecture / pause de l'élément audio (un refus d'autoplay du navigateur remet l'interface en pause).
  useEffect(() => {
    const a = audioRef.current;
    if (!a || kind !== "audio") return;
    if (isPlaying) {
      a.play().catch((e) => {
        if (e.name !== "AbortError") {
          console.error("Playback error:", e);
          pause();
        }
      });
    } else {
      a.pause();
    }
  }, [isPlaying, kind, activeSource, pause]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
    tracker.current?.setPlaybackRate(playbackRate);
  }, [playbackRate, activeSource]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, activeSource]);

  // Déplacements demandés (barre, chapitres, transcription).
  useEffect(() => {
    if (!seekRequest || seekRequest.n === handledSeek.current) return;
    handledSeek.current = seekRequest.n;
    tracker.current?.seek(seekRequest.time);
    if (kind === "audio" && audioRef.current) audioRef.current.currentTime = seekRequest.time;
    if (kind === "video" && videoRef.current) videoRef.current.currentTime = seekRequest.time;
  }, [seekRequest, kind]);

  const total = duration || currentEpisode?.durationSeconds || 0;
  const progressPercent = total ? Math.min(100, Math.max(0, (currentTime / total) * 100)) : 0;
  const controllable = kind === "audio" || kind === "video";
  const episodeHref = currentEpisode ? `/podcasts/${currentEpisode.podcast.slug}/episodes/${currentEpisode.slug}` : "";

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0 ? `${h}:${m < 10 ? "0" : ""}${m}:${sec < 10 ? "0" : ""}${sec}` : `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const cycleRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const newRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(newRate);
    tracker.current?.setPlaybackRate(newRate);
  };

  const onMediaProgress = (t: number, d: number) => {
    setProgress(t, d);
    tracker.current?.tick(t, d || total, playbackRate);
  };
  const onMediaEnded = () => {
    tracker.current?.end(total);
    usePlayerStore.getState().playNext();
  };

  const close = () => {
    usePlayerStore.setState({ currentEpisode: null, activeSource: null, isPlaying: false, currentTime: 0, seekRequest: null });
  };

  
  const handleTogglePlay = () => {
    if (!isPlaying) {
      if (kind === "audio" && audioRef.current) {
        audioRef.current.play().catch(e => console.error("Playback error:", e));
      }
    } else {
      if (kind === "audio" && audioRef.current) {
        audioRef.current.pause();
      }
    }
    togglePlay();
  };

  const embedUrl = kind === "embed" ? safeEmbed(activeSource?.embedUrl) : null;
  const externalHref = safeHttp(activeSource?.externalUrl);



  // Apple Podcasts Style Player UI
  return (
    <>
      <div className="hidden">
        {mounted && kind === "video" && (
          <ReactPlayer
            src={safeHttp(activeSource?.externalUrl) ?? ""}
            playing={isPlaying}
            playbackRate={playbackRate}
            volume={volume}
            width="100%"
            height="100%"
            onLoadedMetadata={(e: any) => {
              const v = e.currentTarget;
              videoRef.current = v;
              if (startAt > 0 && handledSeek.current === 0 && v) v.currentTime = startAt;
            }}
            onDurationChange={(e: any) => {
              const d = e.currentTarget?.duration;
              if (isFinite(d)) setProgress(usePlayerStore.getState().currentTime, d);
            }}
            onTimeUpdate={(e: any) => onMediaProgress(e.currentTarget?.currentTime ?? 0, usePlayerStore.getState().duration)}
            onPlay={() => !usePlayerStore.getState().isPlaying && usePlayerStore.setState({ isPlaying: true })}
            onPause={() => usePlayerStore.getState().isPlaying && pause()}
            onEnded={onMediaEnded}
            onError={() => pause()}
          />
        )}
        {kind === "embed" && embedUrl && (
          <iframe src={embedUrl} title={currentEpisode?.title ?? "Lecteur"} width="100%" height={152} allow="autoplay; encrypted-media" />
        )}
        {kind === "audio" && (
          <audio ref={audioRef} src={safeHttp(activeSource?.externalUrl) ?? undefined} preload="metadata" onLoadedMetadata={(e: any) => { const a = e.currentTarget; if (startAt > 0 && handledSeek.current === 0 && a.currentTime === 0) a.currentTime = startAt; if (isFinite(a.duration)) setProgress(a.currentTime, a.duration); }} onTimeUpdate={(e: any) => onMediaProgress(e.currentTarget.currentTime, isFinite(e.currentTarget.duration) ? e.currentTarget.duration : total)} onEnded={onMediaEnded} onError={() => pause()} />
        )}
      </div>

      {currentEpisode && (
      <>
      {isExpanded && (
        <div className="fixed inset-0 z-[60] bg-[#0B0B0B] flex flex-col animate-in slide-in-from-bottom-6 duration-300 overflow-hidden select-none">
          <div className="flex-1 flex flex-col items-center justify-between p-6 sm:p-8 md:p-10 max-w-xl mx-auto w-full relative h-full">
            
            {/* Header supérieur avec retour haptique & statut */}
            <div className="w-full flex items-center justify-between z-10 pt-2">
              <button
                onClick={() => setIsExpanded(false)}
                className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white transition-all rounded-full hover:bg-[#1A1A1A] active:scale-95 border border-transparent hover:border-[#262626]"
                title="Réduire le lecteur (Échap)"
                aria-label="Réduire"
              >
                <Minimize2 className="w-5 h-5" />
              </button>

              {/* Statut sonore dynamique Apple */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#242424] shadow-sm">
                {isPlaying ? (
                  <div className="flex items-end gap-[2px] h-3">
                    <div className="w-0.5 bg-[#FFBF00] rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-full" />
                    <div className="w-0.5 bg-[#FFBF00] rounded-full animate-[pulse_1.2s_ease-in-out_infinite_0.2s] h-2/3" />
                    <div className="w-0.5 bg-[#FFBF00] rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.4s] h-full" />
                    <div className="w-0.5 bg-[#FFBF00] rounded-full animate-[pulse_1.4s_ease-in-out_infinite_0.1s] h-1/2" />
                  </div>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#666666]" />
                )}
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest font-mono">
                  {isPlaying ? "En lecture" : "En pause"}
                </span>
              </div>

              {/* Contrôle du volume discret */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-[#1A1A1A] transition-colors active:scale-90"
                  title={volume === 0 ? "Activer le son (M)" : "Couper le son (M)"}
                >
                  {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 sm:w-20 h-1 bg-[#242424] accent-[#FFBF00] rounded-full cursor-pointer"
                  title={`Volume: ${Math.round(volume * 100)}%`}
                />
              </div>
            </div>

            {/* Pochette avec comportement physique Apple tactile */}
            <div className="my-auto py-4 flex flex-col items-center w-full">
              <div
                onClick={handleTogglePlay}
                className={`w-full aspect-square max-w-[280px] sm:max-w-[340px] md:max-w-[370px] bg-[#141414] rounded-3xl overflow-hidden border border-[#262626] transition-all duration-700 cursor-pointer relative group ${
                  isPlaying
                    ? "shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] scale-[1.02]"
                    : "shadow-2xl scale-[0.98] opacity-90"
                }`}
                title={isPlaying ? "Mettre en pause (Espace)" : "Lancer la lecture (Espace)"}
              >
                <img
                  src={currentEpisode.cover || currentEpisode.podcast.cover}
                  alt={currentEpisode.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                  <div className="w-16 h-16 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center shadow-xl transform transition-transform group-hover:scale-110">
                    {isPlaying ? (
                      <Pause className="w-7 h-7 fill-current stroke-none" />
                    ) : (
                      <Play className="w-7 h-7 fill-current stroke-none ml-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Informations Épisode & Émission (Clickable vers la page podcast) */}
            <div className="w-full mb-6 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/podcasts/${currentEpisode.podcast.slug}`}
                  onClick={() => setIsExpanded(false)}
                  className="text-xs sm:text-sm font-bold text-[#FFBF00] hover:underline uppercase tracking-wider mb-1 truncate block transition-colors cursor-pointer"
                  title={`Voir la page de l'émission ${currentEpisode.podcast.name}`}
                >
                  {currentEpisode.podcast.name}
                </Link>
                <h2 className="text-xl sm:text-2xl font-black text-white truncate leading-tight tracking-tight">
                  {decodeHtmlEntities(currentEpisode.title)}
                </h2>
              </div>

              {/* Menu d'options Apple popover */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                  className="w-10 h-10 rounded-full bg-[#161616] border border-[#262626] flex items-center justify-center text-white hover:bg-[#222222] hover:border-[#FFBF00]/40 transition-colors active:scale-95"
                  aria-label="Options de l'épisode"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {showOptionsMenu && (
                  <div className="absolute bottom-full right-0 mb-3 w-56 bg-[#161616] rounded-2xl shadow-2xl border border-[#282828] overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#222222] transition-colors"
                      onClick={() => {
                        router.push(`/podcasts/${currentEpisode.podcast.slug}`);
                        setIsExpanded(false);
                        setShowOptionsMenu(false);
                      }}
                    >
                      <span>Voir l'émission</span>
                      <Radio className="w-4 h-4 text-[#FFBF00]" />
                    </button>
                    <button
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#222222] transition-colors"
                      onClick={() => {
                        router.push(`/podcasts/${currentEpisode.podcast.slug}/episodes/${currentEpisode.slug}`);
                        setIsExpanded(false);
                        setShowOptionsMenu(false);
                      }}
                    >
                      <span>Fiche de l'épisode</span>
                      <ExternalLink className="w-4 h-4 text-[#888888]" />
                    </button>
                    <div className="h-px bg-[#262626] my-1" />
                    <button
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#222222] transition-colors"
                      onClick={async () => {
                        const url = `${window.location.origin}/podcasts/${currentEpisode.podcast.slug}/episodes/${currentEpisode.slug}`;
                        try {
                          await navigator.clipboard.writeText(url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        } catch (_) {}
                        setShowOptionsMenu(false);
                      }}
                    >
                      <span>{copiedLink ? "Lien copié !" : "Copier le lien"}</span>
                      {copiedLink ? <Check className="w-4 h-4 text-[#FFBF00]" /> : <Copy className="w-4 h-4 text-[#888888]" />}
                    </button>
                    <button
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#222222] transition-colors"
                      onClick={async () => {
                        const url = `${window.location.origin}/podcasts/${currentEpisode.podcast.slug}/episodes/${currentEpisode.slug}`;
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: currentEpisode.title,
                              text: `Écoutez cet épisode sur Bamako Podcast`,
                              url,
                            });
                          } catch (_) {}
                        } else {
                          await navigator.clipboard.writeText(url);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }
                        setShowOptionsMenu(false);
                      }}
                    >
                      <span>Partager</span>
                      <Share className="w-4 h-4 text-[#888888]" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Barre de progression avec prévisualisation tactile */}
            <div className="w-full mb-6">
              <div
                className="relative group py-2 cursor-pointer"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setScrubHoverPct(pct * 100);
                  setScrubHoverTime(pct * total);
                }}
                onMouseLeave={() => setScrubHoverTime(null)}
              >
                {/* Bulle de prévisualisation au survol */}
                {scrubHoverTime !== null && (
                  <div
                    className="absolute -top-7 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#181818] text-[#FFBF00] border border-[#2E2E2E] text-[10px] font-mono font-bold pointer-events-none shadow-xl z-20"
                    style={{ left: `${scrubHoverPct}%` }}
                  >
                    {fmt(scrubHoverTime)}
                  </div>
                )}

                <input
                  type="range"
                  min={0}
                  max={total}
                  value={Math.min(currentTime, total)}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full h-1.5 sm:h-2 bg-[#222222] accent-[#FFBF00] rounded-full cursor-pointer appearance-none transition-all group-hover:h-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-[#FFBF00] [&::-webkit-slider-thumb]:rounded-full group-hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                />
              </div>

              <div className="flex justify-between mt-1 text-xs text-[#808080] font-mono font-medium">
                <span>{fmt(currentTime)}</span>
                <span>-{fmt(total - currentTime)}</span>
              </div>
            </div>

            {/* Barre de contrôle physique Apple */}
            <div className="w-full flex items-center justify-between max-w-md mx-auto mb-2 px-2">
              {/* Sélecteur de vitesse popover / cycle */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-3 py-1.5 rounded-full bg-[#161616] hover:bg-[#222222] border border-[#262626] text-xs font-bold text-white hover:text-[#FFBF00] transition-colors active:scale-95 flex items-center gap-1"
                  title="Vitesse de lecture"
                >
                  <span>x{playbackRate}</span>
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full left-0 mb-3 bg-[#181818] rounded-2xl shadow-2xl border border-[#2A2A2A] py-1.5 w-36 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                    {[0.8, 1, 1.25, 1.5, 2].map((r) => (
                      <button
                        key={r}
                        onClick={() => {
                          setPlaybackRate(r);
                          setShowSpeedMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#242424] text-xs font-medium flex items-center justify-between text-white transition-colors"
                      >
                        <span>x{r}</span>
                        {playbackRate === r && <Check className="w-3.5 h-3.5 text-[#FFBF00]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Recul 15s */}
              <button
                onClick={() => seek(Math.max(0, currentTime - 15))}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white/80 hover:text-[#FFBF00] hover:bg-[#181818] transition-all relative active:scale-90"
                aria-label="Reculer de 15s"
                title="Reculer de 15s (Flèche Gauche)"
              >
                <RotateCcw className="w-7 h-7" />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold mt-0.5">15</span>
              </button>

              {/* Bouton Central Lecture / Pause */}
              <button
                onClick={handleTogglePlay}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_10px_25px_rgba(255,191,0,0.3)] shrink-0"
                aria-label={isPlaying ? "Pause" : "Lecture"}
                title={isPlaying ? "Pause (Espace)" : "Lecture (Espace)"}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 sm:w-9 sm:h-9 fill-current stroke-none" />
                ) : (
                  <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-current stroke-none ml-1" />
                )}
              </button>

              {/* Avance 30s */}
              <button
                onClick={() => seek(Math.min(total, currentTime + 30))}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white/80 hover:text-[#FFBF00] hover:bg-[#181818] transition-all relative active:scale-90"
                aria-label="Avancer de 30s"
                title="Avancer de 30s (Flèche Droite)"
              >
                <RotateCw className="w-7 h-7" />
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold mt-0.5">30</span>
              </button>

              {/* File d'attente Drawer */}
              <button
                onClick={toggleRightPanel}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative active:scale-95 ${
                  showRightPanel
                    ? "bg-[#FFBF00] text-[#0B0B0B]"
                    : "bg-[#161616] hover:bg-[#222222] border border-[#262626] text-white/80 hover:text-[#FFBF00]"
                }`}
                aria-label="File d'attente"
                title="Afficher la file d'attente"
              >
                <ListMusic className="w-5 h-5" />
                {queue.length > 0 && !showRightPanel && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FFBF00] text-[#0B0B0B] text-[10px] font-black flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Mini Player Pill */}
      <div className={`fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-2xl transition-all duration-300 ${isExpanded ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
        <div className="flex items-center gap-2 sm:gap-4 bg-[#141414]/95 backdrop-blur-xl border border-[#262626] rounded-full pl-3 sm:pl-5 pr-3 py-2 shadow-2xl text-white">
          {/* Controls: Speed + 15s + Play/Pause + 30s */}
          <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
            <div className="relative hidden sm:block">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="text-xs font-bold w-6 text-center hover:text-[#FFBF00] transition-colors">x{playbackRate}</button>
              {showSpeedMenu && (
                <div className="absolute bottom-full left-0 mb-4 bg-[#1C1C1C] rounded-xl shadow-2xl border border-[#2C2C2E] py-1.5 w-36 overflow-hidden z-50">
                  {[0.8, 1, 1.25, 1.5, 2].map(r => (<button key={r} onClick={() => { setPlaybackRate(r); setShowSpeedMenu(false); }} className="w-full text-left px-3.5 py-1.5 hover:bg-[#282828] text-xs font-medium flex justify-between">x{r} {playbackRate === r && <span className="text-[#FFBF00]">✓</span>}</button>))}
                </div>
              )}
            </div>
            <button onClick={() => seek(Math.max(0, currentTime - 15))} className="hover:text-[#FFBF00] transition-colors relative" aria-label="Reculer de 15s">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold mt-0.5">15</span>
            </button>
            <button onClick={() => { if (!isPlaying && kind === 'audio' && audioRef.current) { audioRef.current.play().catch(e => console.log(e)); } togglePlay(); }} className="w-8 h-8 rounded-full bg-[#FFBF00] text-[#0B0B0B] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform" aria-label={isPlaying ? "Pause" : "Lecture"}>
              {isPlaying ? <Pause className="w-4 h-4 fill-current stroke-none" /> : <Play className="w-4 h-4 fill-current stroke-none ml-0.5" />}
            </button>
            <button onClick={() => seek(Math.min(total, currentTime + 30))} className="hover:text-[#FFBF00] transition-colors relative" aria-label="Avancer de 30s">
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold mt-0.5">30</span>
            </button>
          </div>

          {/* Episode Info & Scrub bar */}
          <div className="flex flex-col flex-1 min-w-0 mx-1 sm:mx-3 cursor-pointer group" onMouseEnter={() => setHoverCover(true)} onMouseLeave={() => setHoverCover(false)} onClick={() => setIsExpanded(true)}>
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-lg shrink-0 overflow-hidden bg-[#242424] border border-[#333]">
                <img src={currentEpisode.cover || currentEpisode.podcast.cover} alt="" className={`w-full h-full object-cover transition-opacity ${hoverCover ? 'opacity-30' : 'opacity-100'}`} />
                {hoverCover && <Maximize2 className="absolute inset-0 m-auto w-3.5 h-3.5 text-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <ScrollingTitle title={decodeHtmlEntities(currentEpisode.title)} className="text-xs font-bold text-white group-hover:text-[#FFBF00] transition-colors" />
                <Link
                  href={`/podcasts/${currentEpisode.podcast.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-[#888888] hover:text-[#FFBF00] hover:underline truncate block transition-colors cursor-pointer"
                  title={`Voir la page de l'émission ${currentEpisode.podcast.name}`}
                >
                  {currentEpisode.podcast.name}
                </Link>
              </div>
            </div>
            <div className="mt-1 h-1 bg-[#242424] rounded-full w-full relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 bg-[#FFBF00] rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          {/* Secondary Actions: Queue + Volume + Close */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 border-l border-[#242424] pl-2 sm:pl-3 shrink-0">
            <button onClick={toggleRightPanel} className="p-1.5 rounded-full text-[#888] hover:text-[#FFBF00] hover:bg-[#202020] transition-colors relative" title="File d'attente">
              <ListMusic className="w-4 h-4" />
              {queue.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFBF00] rounded-full"></span>}
            </button>
            <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)} className="hidden sm:inline-flex p-1.5 rounded-full text-[#888] hover:text-white hover:bg-[#202020] transition-colors" title="Volume">
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button onClick={close} className="p-1.5 rounded-full text-[#888] hover:text-white hover:bg-[#242424] transition-colors" title="Fermer le lecteur">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Panel: File d'attente */}
        {showRightPanel && (
          <div className={`absolute bottom-full right-0 mb-3 w-80 max-h-96 bg-[#141414]/95 backdrop-blur-xl border border-[#242424] rounded-2xl shadow-2xl flex flex-col overflow-hidden ${isExpanded ? 'z-[70]' : 'z-50'}`}>
            <div className="p-3 border-b border-[#242424] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">File d'attente</h3>
              <button onClick={toggleRightPanel} className="text-[#888] hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
              <div>
                <p className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider mb-2">En cours de lecture</p>
                <div className="flex items-center gap-3 bg-[#1E1E1E] p-2 rounded-xl border border-[#282828]">
                  <img src={currentEpisode.cover || currentEpisode.podcast.cover} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{decodeHtmlEntities(currentEpisode.title)}</p>
                    <Link
                      href={`/podcasts/${currentEpisode.podcast.slug}`}
                      onClick={() => {
                        setIsExpanded(false);
                        if (showRightPanel) toggleRightPanel();
                      }}
                      className="text-[10px] text-[#888] hover:text-[#FFBF00] hover:underline truncate block"
                    >
                      {currentEpisode.podcast.name}
                    </Link>
                  </div>
                </div>
              </div>
              {queue.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2 mt-4">À suivre</p>
                  <div className="space-y-2">
                    {queue.map((ep, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 hover:bg-[#1E1E1E] rounded-xl border border-transparent hover:border-[#282828] group transition-colors">
                        <img src={ep.cover || ep.podcast.cover} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{decodeHtmlEntities(ep.title)}</p>
                          <Link
                            href={`/podcasts/${ep.podcast.slug}`}
                            onClick={() => {
                              setIsExpanded(false);
                              if (showRightPanel) toggleRightPanel();
                            }}
                            className="text-[10px] text-[#888] hover:text-[#FFBF00] hover:underline truncate block"
                          >
                            {ep.podcast.name}
                          </Link>
                        </div>
                        <button onClick={() => removeFromQueue(i)} className="opacity-0 group-hover:opacity-100 p-1 text-[#888] hover:text-white transition-opacity">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </>
  );
};

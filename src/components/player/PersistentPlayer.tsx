"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Play, Maximize2, Minimize2, MoreHorizontal, RotateCw, Rabbit, Turtle, Share, Code, Pause, Volume2, VolumeX, ListMusic, RotateCcw, X, ExternalLink } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore";
import { useAuthStore } from "../../store/authStore";
import { ListenTracker } from "@/lib/playTracking";

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
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [hoverCover, setHoverCover] = useState(false);


  useEffect(() => setMounted(true), []);

  const kind: Kind = useMemo(() => {
    const s = activeSource;
    if (!s) return "none";
    if (s.playbackMode === "EXTERNAL_REDIRECT") return safeHttp(s.externalUrl) ? "redirect" : "none";
    if (s.type === "AUDIO" && s.playbackMode === "NATIVE" && safeHttp(s.externalUrl)) return "audio";
    if (s.type === "VIDEO" && (s.playbackMode === "NATIVE" || s.provider === "YOUTUBE" || s.provider === "VIMEO") && safeHttp(s.externalUrl)) return "video";
    if (s.playbackMode === "EMBED" && safeEmbed(s.embedUrl)) return "embed";
    return safeHttp(s.externalUrl) ? "redirect" : "none";
  }, [activeSource]);

  // Nouveau suivi d'Ã©coute Ã  chaque Ã©pisode ; flush de l'ancien Ã  la sortie.
  useEffect(() => {
    if (!currentEpisode) return;
    const t = new ListenTracker(currentEpisode.id, () => useAuthStore.getState().isAuthenticated);
    tracker.current = t;
    trackerStarted.current = false;
    handledSeek.current = 0;
    // Lecteurs tiers : on ne peut pas mesurer l'Ã©coute, seul le dÃ©marrage est comptÃ©.
    if (kind === "embed") {
      t.start();
      trackerStarted.current = true;
    }
    return () => {
      const s = usePlayerStore.getState();
      t.pause(s.currentTime, s.duration);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEpisode?.id]);

  // DÃ©marrage (premiÃ¨re lecture rÃ©elle) et pause.
  useEffect(() => {
    const t = tracker.current;
    if (!t) return;
    if (isPlaying && (kind === "audio" || kind === "video") && !trackerStarted.current) {
      trackerStarted.current = true;
      t.start(usePlayerStore.getState().currentTime);
    }
    if (!isPlaying && trackerStarted.current && (kind === "audio" || kind === "video")) {
      t.pause(usePlayerStore.getState().currentTime, usePlayerStore.getState().duration);
    }
  }, [isPlaying, kind]);

  // Lecture / pause de l'Ã©lÃ©ment audio (un refus d'autoplay du navigateur remet l'interface en pause).
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
  }, [playbackRate, activeSource]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, activeSource]);

  // DÃ©placements demandÃ©s (barre, chapitres, transcription).
  useEffect(() => {
    if (!seekRequest || seekRequest.n === handledSeek.current) return;
    handledSeek.current = seekRequest.n;
    if (kind === "audio" && audioRef.current) audioRef.current.currentTime = seekRequest.time;
    if (kind === "video" && videoRef.current) videoRef.current.currentTime = seekRequest.time;
  }, [seekRequest, kind]);

  if (!currentEpisode) return null;

  const total = duration || currentEpisode.durationSeconds || 0;
  const progressPercent = total ? Math.min(100, Math.max(0, (currentTime / total) * 100)) : 0;
  const controllable = kind === "audio" || kind === "video";
  const episodeHref = `/podcasts/${currentEpisode.podcast.slug}/episodes/${currentEpisode.slug}`;

  const fmt = (s: number) => {
    if (!isFinite(s) || s < 0) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0 ? `${h}:${m < 10 ? "0" : ""}${m}:${sec < 10 ? "0" : ""}${sec}` : `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const cycleRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    setPlaybackRate(rates[(rates.indexOf(playbackRate) + 1) % rates.length]);
  };

  const onMediaProgress = (t: number, d: number) => {
    setProgress(t, d);
    tracker.current?.tick(t, d || total);
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
          <iframe src={embedUrl} title={currentEpisode.title} width="100%" height={152} allow="autoplay; encrypted-media" />
        )}
        {kind === "audio" && (
          <audio key={activeSource?.id} ref={audioRef} src={safeHttp(activeSource?.externalUrl) ?? undefined} preload="metadata" onLoadedMetadata={(e: any) => { const a = e.currentTarget; if (startAt > 0 && handledSeek.current === 0 && a.currentTime === 0) a.currentTime = startAt; if (isFinite(a.duration)) setProgress(a.currentTime, a.duration); if (isPlaying) a.play().catch(() => pause()); }} onTimeUpdate={(e: any) => onMediaProgress(e.currentTarget.currentTime, isFinite(e.currentTarget.duration) ? e.currentTarget.duration : total)} onEnded={onMediaEnded} onError={() => pause()} />
        )}
      </div>

      {isExpanded && (
        <div className="fixed inset-0 z-[60] bg-[#0B0B0B] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
          <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto w-full relative">
            <button onClick={() => setIsExpanded(false)} className="absolute top-8 left-0 text-white/70 hover:text-white transition-colors p-2">
              <Minimize2 className="w-6 h-6" />
            </button>
            <div className="absolute top-8 right-0 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-white/70" />
              <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-24 h-1 bg-[#282828] accent-white rounded-full cursor-pointer" />
            </div>
            <div className="w-full aspect-square bg-[#1C1C1E] rounded-3xl shadow-2xl overflow-hidden mt-8 mb-12">
              <img src={currentEpisode.cover || currentEpisode.podcast.cover} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-full mb-8 flex items-center justify-between">
              <div className="min-w-0 flex-1 pr-4">
                <p className="text-xs text-white/50 mb-1">{currentEpisode.podcast.name} • {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                <h2 className="text-2xl font-bold text-white truncate">{currentEpisode.title}</h2>
              </div>
              <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shrink-0 relative">
                <MoreHorizontal className="w-4 h-4" />
                {showOptionsMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#2C2C2E] rounded-xl shadow-2xl border border-white/10 overflow-hidden py-1 z-50">
                    <button className="w-full flex items-center justify-between px-4 py-3 text-sm text-white hover:bg-white/10" onClick={() => { navigator.clipboard.writeText(window.location.href); setShowOptionsMenu(false); }}>Copier le lien <Share className="w-4 h-4" /></button>
                    <button className="w-full flex items-center justify-between px-4 py-3 text-sm text-white hover:bg-white/10 border-t border-white/10" onClick={() => setShowOptionsMenu(false)}>Intégrer - Épisode... <Code className="w-4 h-4" /></button>
                  </div>
                )}
              </button>
            </div>
            <div className="w-full mb-10">
              <input type="range" min={0} max={total} value={Math.min(currentTime, total)} onChange={(e) => seek(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" />
              <div className="flex justify-between mt-2 text-xs text-white/50 font-mono"><span>{fmt(currentTime)}</span><span>-{fmt(total - currentTime)}</span></div>
            </div>
            <div className="w-full flex items-center justify-center gap-8">
              <button onClick={cycleRate} className="text-lg font-bold text-white w-12 text-center" title="Vitesse">x{playbackRate}</button>
              <button onClick={() => seek(Math.max(0, currentTime - 15))} className="text-white hover:scale-110 transition-transform relative" aria-label="Reculer de 15s">
                <RotateCcw className="w-8 h-8" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold mt-0.5">15</span>
              </button>
              <button onClick={() => { if (!isPlaying && kind === 'audio' && audioRef.current) { audioRef.current.play().catch(e => console.log(e)); } togglePlay(); }} className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform" aria-label={isPlaying ? "Pause" : "Lecture"}>
                {isPlaying ? <Pause className="w-8 h-8 fill-current stroke-none" /> : <Play className="w-8 h-8 fill-current stroke-none ml-1" />}
              </button>
              <button onClick={() => seek(Math.min(total, currentTime + 30))} className="text-white hover:scale-110 transition-transform relative" aria-label="Avancer de 30s">
                <RotateCw className="w-8 h-8" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold mt-0.5">30</span>
              </button>
              <button onClick={toggleRightPanel} className="text-white w-12 flex justify-center" aria-label="File d\'attente">
                <ListMusic className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isExpanded ? 'opacity-0 pointer-events-none translate-y-10' : 'opacity-100 translate-y-0'}`}>
        <div className="flex items-center gap-4 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 rounded-full pl-6 pr-4 py-2.5 shadow-2xl text-white min-w-[500px]">
          <div className="flex items-center gap-5">
            <div className="relative">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="text-sm font-bold w-6 text-center hover:text-[#FFBF00] transition-colors">x{playbackRate}</button>
              {showSpeedMenu && (
                <div className="absolute bottom-full left-0 mb-4 bg-[#2C2C2E] rounded-xl shadow-2xl border border-white/10 py-2 w-36 overflow-hidden">
                  {[0.8, 1, 1.3, 1.5, 1.8, 2].map(r => (<button key={r} onClick={() => { setPlaybackRate(r); setShowSpeedMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm font-medium flex justify-between">x{r} {playbackRate === r && <span className="text-white">✓</span>}</button>))}
                  <div className="h-px bg-white/10 my-1"></div>
                  <button onClick={() => { setPlaybackRate(2); setShowSpeedMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm flex items-center gap-2"><Rabbit className="w-4 h-4" /> Plus rapide</button>
                  <button onClick={() => { setPlaybackRate(0.8); setShowSpeedMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-white/10 text-sm flex items-center gap-2"><Turtle className="w-4 h-4" /> Plus lent</button>
                </div>
              )}
            </div>
            <button onClick={() => seek(Math.max(0, currentTime - 15))} className="hover:text-[#FFBF00] transition-colors relative" aria-label="Reculer de 15s">
              <RotateCcw className="w-5 h-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold mt-0.5">15</span>
            </button>
            <button onClick={() => { if (!isPlaying && kind === 'audio' && audioRef.current) { audioRef.current.play().catch(e => console.log(e)); } togglePlay(); }} className="hover:scale-110 transition-transform" aria-label={isPlaying ? "Pause" : "Lecture"}>
              {isPlaying ? <Pause className="w-6 h-6 fill-current stroke-none" /> : <Play className="w-6 h-6 fill-current stroke-none" />}
            </button>
            <button onClick={() => seek(Math.min(total, currentTime + 30))} className="hover:text-[#FFBF00] transition-colors relative" aria-label="Avancer de 30s">
              <RotateCw className="w-5 h-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold mt-0.5">30</span>
            </button>
          </div>
          <div className="flex flex-col flex-1 mx-4 min-w-[200px] max-w-[250px] cursor-pointer group" onMouseEnter={() => setHoverCover(true)} onMouseLeave={() => setHoverCover(false)} onClick={() => setIsExpanded(true)}>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded shrink-0 overflow-hidden bg-[#2C2C2E]">
                <img src={currentEpisode.cover || currentEpisode.podcast.cover} alt="" className={`w-full h-full object-cover transition-opacity ${hoverCover ? 'opacity-30' : 'opacity-100'}`} />
                {hoverCover && <Maximize2 className="absolute inset-0 m-auto w-4 h-4 text-white" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate group-hover:underline">{currentEpisode.title}</p>
                <p className="text-[10px] text-white/50 truncate">6 octobre</p>
              </div>
            </div>
            <div className="mt-1 h-0.5 bg-white/20 rounded-full w-full relative">
              <div className="absolute left-0 top-0 bottom-0 bg-white rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
          <div className="flex items-center gap-3 border-l border-white/10 pl-4 relative">
            <button onClick={() => setShowOptionsMenu(!showOptionsMenu)} className="hover:text-[#FFBF00] transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showOptionsMenu && (
              <div className="absolute bottom-full right-0 mb-4 w-48 bg-[#2C2C2E] rounded-xl shadow-2xl border border-white/10 overflow-hidden py-1 z-50">
                <button className="w-full flex items-center justify-between px-4 py-3 text-sm text-white hover:bg-white/10" onClick={() => { navigator.clipboard.writeText(window.location.href); setShowOptionsMenu(false); }}>Copier le lien <Share className="w-4 h-4" /></button>
                <button className="w-full flex items-center justify-between px-4 py-3 text-sm text-white hover:bg-white/10 border-t border-white/10" onClick={() => setShowOptionsMenu(false)}>Intégrer - Épisode... <Code className="w-4 h-4" /></button>
              </div>
            )}
            <button className="w-5 h-5 rounded-full border border-white flex items-center justify-center text-[10px] font-bold hover:bg-white hover:text-black transition-colors">i</button>
            <button onClick={toggleRightPanel} className="hover:text-[#FFBF00] transition-colors relative">
              <ListMusic className="w-5 h-5" />
              {queue.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FFBF00] rounded-full"></span>}
            </button>
            <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)} className="hover:text-[#FFBF00] transition-colors">
              {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {showRightPanel && (
          <div className="absolute bottom-full right-0 mb-4 w-80 max-h-96 bg-[#1A1A1A]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden z-50">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">File d\'attente</h3>
              <button onClick={toggleRightPanel} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">En cours de lecture</p>
                <div className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                  <img src={currentEpisode.cover || currentEpisode.podcast.cover} alt="" className="w-10 h-10 rounded object-cover" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{currentEpisode.title}</p>
                    <p className="text-[10px] text-white/50 truncate">{currentEpisode.podcast.name}</p>
                  </div>
                </div>
              </div>
              {queue.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 mt-4">À suivre</p>
                  <div className="space-y-2">
                    {queue.map((ep, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg group">
                        <img src={ep.cover || ep.podcast.cover} alt="" className="w-10 h-10 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{ep.title}</p>
                          <p className="text-[10px] text-white/50 truncate">{ep.podcast.name}</p>
                        </div>
                        <button onClick={() => removeFromQueue(i)} className="opacity-0 group-hover:opacity-100 p-1 text-white/50 hover:text-white">
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
  );
};

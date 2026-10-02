"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Play, Pause, Volume2, VolumeX, ListMusic, RotateCcw, X, ExternalLink } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore";
import { useAuthStore } from "../../store/authStore";
import { ListenTracker } from "@/lib/playTracking";

// ReactPlayer est chargé côté client uniquement (pas de rendu serveur).
const DynamicReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

// Seuls ces hôtes peuvent être affichés dans un iframe (défense en profondeur côté lecteur).
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
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<any>(null);
  const tracker = useRef<ListenTracker | null>(null);
  const trackerStarted = useRef(false);
  const handledSeek = useRef(0);
  const [mounted, setMounted] = useState(false);

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

  // Nouveau suivi d'écoute à chaque épisode ; flush de l'ancien à la sortie.
  useEffect(() => {
    if (!currentEpisode) return;
    const t = new ListenTracker(currentEpisode.id, () => useAuthStore.getState().isAuthenticated);
    tracker.current = t;
    trackerStarted.current = false;
    handledSeek.current = 0;
    // Lecteurs tiers : on ne peut pas mesurer l'écoute, seul le démarrage est compté.
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

  // Démarrage (première lecture réelle) et pause.
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

  // Lecture / pause de l'élément audio (un refus d'autoplay du navigateur remet l'interface en pause).
  useEffect(() => {
    const a = audioRef.current;
    if (!a || kind !== "audio") return;
    if (isPlaying) a.play().catch(() => pause());
    else a.pause();
  }, [isPlaying, kind, activeSource, pause]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate, activeSource]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume, activeSource]);

  // Déplacements demandés (barre, chapitres, transcription).
  useEffect(() => {
    if (!seekRequest || seekRequest.n === handledSeek.current) return;
    handledSeek.current = seekRequest.n;
    if (kind === "audio" && audioRef.current) audioRef.current.currentTime = seekRequest.time;
    if (kind === "video" && videoRef.current) videoRef.current.seekTo(seekRequest.time, "seconds");
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
    pause();
  };

  const close = () => {
    usePlayerStore.setState({ currentEpisode: null, activeSource: null, isPlaying: false, currentTime: 0, seekRequest: null });
  };

  const embedUrl = kind === "embed" ? safeEmbed(activeSource?.embedUrl) : null;
  const externalHref = safeHttp(activeSource?.externalUrl);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121212] border-t border-[#222222] select-none text-white">
      {/* Barre de progression */}
      <div className="relative w-full h-1 bg-[#262626]">
        <div className="absolute left-0 top-0 bottom-0 bg-[#FFBF00]" style={{ width: `${progressPercent}%` }} />
        {controllable && total > 0 && (
          <input
            type="range"
            min={0}
            max={total}
            value={Math.min(currentTime, total)}
            onChange={(e) => seek(parseFloat(e.target.value))}
            aria-label="Position de lecture"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}
      </div>

      {/* Vidéo (YouTube, Vimeo ou fichier vidéo) */}
      {mounted && kind === "video" && (
        <div className="max-w-3xl mx-auto my-3 aspect-video rounded-xl overflow-hidden border border-[#262626] bg-black">
          <DynamicReactPlayer
            ref={videoRef}
            url={safeHttp(activeSource?.externalUrl) ?? ""}
            playing={isPlaying}
            playbackRate={playbackRate}
            volume={volume}
            width="100%"
            height="100%"
            controls
            progressInterval={1000}
            onReady={() => {
              if (startAt > 0 && handledSeek.current === 0) videoRef.current?.seekTo(startAt, "seconds");
            }}
            onDuration={(d: number) => setProgress(usePlayerStore.getState().currentTime, d)}
            onProgress={(st: { playedSeconds: number }) => onMediaProgress(st.playedSeconds, usePlayerStore.getState().duration)}
            onPlay={() => !usePlayerStore.getState().isPlaying && usePlayerStore.setState({ isPlaying: true })}
            onPause={() => usePlayerStore.getState().isPlaying && pause()}
            onEnded={onMediaEnded}
          />
        </div>
      )}

      {/* Lecteur tiers (Spotify, Apple Podcasts, SoundCloud, Deezer) */}
      {kind === "embed" && embedUrl && (
        <div className="max-w-3xl mx-auto my-3">
          <iframe
            src={embedUrl}
            title={currentEpisode.title}
            width="100%"
            height={activeSource?.provider === "SPOTIFY" ? 152 : 175}
            loading="lazy"
            allow="autoplay; encrypted-media; fullscreen; clipboard-write"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
            className="rounded-xl border border-[#262626] bg-black"
          />
        </div>
      )}

      {/* Fichier audio */}
      {kind === "audio" && (
        <audio
          key={activeSource?.id}
          ref={audioRef}
          src={safeHttp(activeSource?.externalUrl) ?? undefined}
          preload="metadata"
          onLoadedMetadata={(e) => {
            const a = e.currentTarget;
            if (startAt > 0 && handledSeek.current === 0 && a.currentTime === 0) a.currentTime = startAt;
            if (isFinite(a.duration)) setProgress(a.currentTime, a.duration);
            if (isPlaying) a.play().catch(() => pause());
          }}
          onTimeUpdate={(e) => onMediaProgress(e.currentTarget.currentTime, isFinite(e.currentTarget.duration) ? e.currentTarget.duration : total)}
          onEnded={onMediaEnded}
          onError={() => pause()}
        />
      )}

      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Titre */}
        <div className="flex items-center gap-3 min-w-0 md:w-1/3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentEpisode.cover || currentEpisode.podcast.cover} alt="" className="w-9 h-9 rounded-lg object-cover bg-[#1C1C1C] shrink-0" />
          <div className="truncate">
            <Link href={episodeHref} className="block text-xs font-bold text-white truncate hover:underline">
              {currentEpisode.title}
            </Link>
            <p className="text-[11px] text-[#B8B8B8] truncate">{currentEpisode.podcast.name}</p>
          </div>
        </div>

        {/* Commandes */}
        <div className="flex items-center justify-center gap-4 flex-1">
          {controllable ? (
            <>
              <button onClick={toggleRightPanel} className="text-[#B8B8B8] hover:text-white p-1" title="File d'attente / Chapitres" aria-label="File d'attente">
                <ListMusic className="w-4 h-4" />
              </button>
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-[#FFBF00] text-[#0B0B0B] hover:bg-[#E5AB00] hover:scale-105 active:scale-95 flex items-center justify-center shadow-md transition-all"
                aria-label={isPlaying ? "Pause" : "Lecture"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current stroke-none" /> : <Play className="w-4 h-4 fill-current stroke-none ml-0.5" />}
              </button>
              <button onClick={() => seek(0)} className="text-[#B8B8B8] hover:text-white p-1" title="Recommencer" aria-label="Recommencer">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="text-[11px] font-mono text-[#B8B8B8] tabular-nums whitespace-nowrap">
                <span className="text-white font-medium">{fmt(currentTime)}</span>
                <span className="mx-1 text-[#555555]">/</span>
                <span>{fmt(total)}</span>
              </div>
            </>
          ) : kind === "embed" ? (
            <p className="text-xs text-[#B8B8B8]">Lecture assurée par le lecteur de la plateforme d&apos;origine ci-dessus.</p>
          ) : kind === "redirect" && externalHref ? (
            <a
              href={externalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FFBF00] text-[#0B0B0B] text-xs font-bold px-4 py-2 rounded-full"
              onClick={() => {
                if (tracker.current && !trackerStarted.current) {
                  trackerStarted.current = true;
                  tracker.current.start();
                }
              }}
            >
              Écouter sur le site d&apos;origine <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <p className="text-xs text-red-300">Aucune source de lecture disponible pour cet épisode.</p>
          )}
        </div>

        {/* Vitesse, volume, fermeture */}
        <div className="flex items-center justify-end gap-3 min-w-0 md:w-1/3">
          {controllable && (
            <>
              <button
                onClick={cycleRate}
                className="px-2 py-0.5 rounded bg-[#1C1C1C] border border-[#2E2E2E] text-[11px] font-mono text-[#B8B8B8] hover:text-white hover:border-[#FFBF00]/50"
                title="Vitesse de lecture"
              >
                {playbackRate}x
              </button>
              <div className="hidden lg:flex items-center gap-2">
                <button onClick={() => setVolume(volume === 0 ? 0.8 : 0)} className="text-[#B8B8B8] hover:text-white p-1" aria-label={volume === 0 ? "Activer le son" : "Couper le son"}>
                  {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  aria-label="Volume"
                  className="w-16 h-1 bg-[#282828] accent-[#FFBF00] rounded-full cursor-pointer"
                />
              </div>
            </>
          )}
          <button onClick={close} className="text-[#B8B8B8] hover:text-white p-1" aria-label="Fermer le lecteur" title="Fermer le lecteur">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

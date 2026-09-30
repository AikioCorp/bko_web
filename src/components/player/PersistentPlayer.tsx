"use client";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useRef } from "react";
import { usePlayerStore } from "../../store/playerStore";
import { Play, Pause, Volume2, Video, Headphones } from "lucide-react";
import ReactPlayer from "react-player";

export const PersistentPlayer = () => {
  const {
    currentEpisode,
    activeSource,
    mode,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    togglePlay,
    seek,
    setMode,
    setPlaybackRate,
  } = usePlayerStore();

  const playerRef = useRef<ReactPlayer>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fix SSR hydration mismatch for react-player
  const [isMounted, setIsMounted] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync playback rates
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Sync Native Audio Play/Pause
  useEffect(() => {
    if (audioRef.current && activeSource?.type === "AUDIO") {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, activeSource]);

  // Sync History
  useEffect(() => {
    if (!currentEpisode || !isPlaying || currentTime <= 0) return;
    const interval = setInterval(() => {
      const token = localStorage.getItem("bko_access_token");
      if (token) {
        fetch(`${API_BASE_URL}/me/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            episodeId: currentEpisode.id,
            positionSeconds: Math.floor(currentTime),
            durationSeconds: currentEpisode.durationSeconds,
          }),
        }).catch(() => {});
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [currentEpisode, isPlaying, currentTime]);

  if (!currentEpisode || !activeSource) {
    return null;
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const hasVideo = currentEpisode.mediaSources.some((s) => s.type === "VIDEO");
  const hasAudio = currentEpisode.mediaSources.some((s) => s.type === "AUDIO");

  const getYoutubeUrl = () => {
    const src = activeSource.type === "VIDEO" ? activeSource : currentEpisode.mediaSources.find((s) => s.type === "VIDEO");
    if (src?.externalUrl && (src.externalUrl.includes("youtube.com") || src.externalUrl.includes("youtu.be"))) {
      return src.externalUrl;
    }
    // Fallback for mock data that might only have externalId or embedUrl
    if (src?.externalId && src.provider === "YOUTUBE") {
      return `https://www.youtube.com/watch?v=${src.externalId}`;
    }
    return null;
  };

  const ytUrl = getYoutubeUrl();

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seek(newTime);
    if (activeSource.type === "AUDIO" && audioRef.current) {
      audioRef.current.currentTime = newTime;
    } else if (mode === "VIDEO" && playerRef.current) {
      playerRef.current.seekTo(newTime, "seconds");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0D14] border-t border-[#1E2638] text-white p-3 shadow-2xl transition-all duration-300">
      
      {/* ReactPlayer Container Vidéo (seulement si YouTube) */}
      {isMounted && mode === "VIDEO" && ytUrl && (
        <div className="max-w-4xl mx-auto mb-3 aspect-video rounded-xl overflow-hidden shadow-2xl border border-[#1E2638] bg-black relative">
          
          <ReactPlayer
            ref={playerRef}
            url={ytUrl}
            playing={isPlaying}
            playbackRate={playbackRate}
            width="100%"
            height="100%"
            onProgress={({ playedSeconds }) => {
              if (isPlaying) {
                seek(playedSeconds);
              }
            }}
            onEnded={() => {
              if (isPlaying) togglePlay();
            }}
          />
        </div>
      )}

      {/* Audio Element pour NATIVE AUDIO */}
      {activeSource.type === "AUDIO" && activeSource.externalUrl && (
        <audio
          ref={audioRef}
          src={activeSource.externalUrl}
          onTimeUpdate={(e) => seek(e.currentTarget.currentTime)}
          onEnded={() => { if (isPlaying) togglePlay(); }}
        />
      )}

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Infos de l'Épisode */}
        <div className="flex items-center space-x-3 w-full md:w-1/4">
          <img
            src={currentEpisode.cover || currentEpisode.podcast.cover}
            alt={currentEpisode.title}
            className="w-12 h-12 rounded-lg object-cover border border-[#E5A93C]/30"
          />
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm truncate text-white">{currentEpisode.title}</h4>
            <p className="text-xs text-[#E5A93C] truncate">{currentEpisode.podcast.name}</p>
          </div>
        </div>

        {/* Contrôles Principaux */}
        <div className="flex flex-col items-center w-full md:w-2/4 space-y-2">
          <div className="flex items-center space-x-4">
            {/* Bascule Mode Audio / Vidéo */}
            {hasVideo && (
              <div className="flex items-center bg-[#121722] rounded-full p-1 border border-[#1E2638]">
                {hasAudio && (
                  <button
                    onClick={() => setMode("AUDIO")}
                    className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition ${
                      mode === "AUDIO" ? "bg-[#E5A93C] text-black font-bold" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Headphones className="w-3 h-3" />
                    <span>ÉCOUTER</span>
                  </button>
                )}
                <button
                  onClick={() => setMode("VIDEO")}
                  className={`px-3 py-1 text-xs rounded-full flex items-center space-x-1 transition ${
                    mode === "VIDEO" ? "bg-[#E5A93C] text-black font-bold" : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>REGARDER</span>
                </button>
              </div>
            )}

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              className="p-3 bg-[#E5A93C] text-black rounded-full hover:scale-105 transition shadow-lg"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Vitesse de lecture */}
            <button
              onClick={() => {
                const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
                const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                setPlaybackRate(nextRate);
              }}
              className="text-xs font-mono text-gray-400 hover:text-[#E5A93C] px-2 py-1 bg-[#121722] rounded border border-[#1E2638]"
            >
              {playbackRate}x
            </button>
          </div>

          {/* Barre de Progression */}
          <div className="w-full flex items-center space-x-3 text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1 bg-[#1E2638] rounded-lg appearance-none cursor-pointer accent-[#E5A93C]"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center justify-end space-x-3 w-1/4">
          <Volume2 className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

"use client";

import { useEffect, useRef } from "react";
import { 
  Play, Pause, X, RotateCw, RotateCcw, 
  SkipBack, SkipForward, Maximize2, Share, FileText
} from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PlayerModal({ isOpen, onClose }: PlayerModalProps) {
  const {
    currentEpisode, isPlaying, currentTime, duration: totalTime,
    togglePlay, seek
  } = usePlayerStore();
  const progressPercent = totalTime > 0 ? Math.min(100, (currentTime / totalTime) * 100) : 0;
  
  const scrubberRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !currentEpisode) return null;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || !totalTime) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(percent * totalTime);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0B0B0B] animate-in slide-in-from-bottom-full duration-300">
      
      {/* Background blurred cover */}
      <div 
        className="absolute inset-0 opacity-40 blur-3xl scale-110 pointer-events-none"
        style={{ 
          backgroundImage: `url(${currentEpisode.cover || currentEpisode.podcast?.cover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-[#0B0B0B]/80 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">En lecture</span>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors">
          <Share className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 md:p-12 max-w-2xl mx-auto w-full gap-8">
        
        {/* Cover Art (Giant) */}
        <div className="w-full max-w-[300px] md:max-w-[400px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-[#1A1A1A]">
          <img 
            src={currentEpisode.cover || currentEpisode.podcast?.cover} 
            alt={currentEpisode.title} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="w-full text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-white line-clamp-2 leading-tight">
            {currentEpisode.title}
          </h2>
          <p className="text-lg text-[#FFBF00] font-medium">
            {currentEpisode.podcast?.name}
          </p>
        </div>

        {/* Scrubber */}
        <div className="w-full space-y-2">
          <div 
            ref={scrubberRef}
            onClick={handleScrub}
            className="w-full h-3 bg-white/20 rounded-full cursor-pointer relative group overflow-hidden"
          >
            <div 
              className="absolute left-0 top-0 bottom-0 bg-white group-hover:bg-[#FFBF00] transition-colors" 
              style={{ width: `${progressPercent}%` }} 
            />
          </div>
          <div className="flex items-center justify-between text-xs text-white/50 font-mono font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(totalTime - currentTime)}</span>
          </div>
        </div>

        {/* Controls (Giant) */}
        <div className="w-full flex items-center justify-center gap-6 md:gap-10">
          <button onClick={() => seek(Math.max(0, currentTime - 15))} className="text-white/70 hover:text-white transition-colors relative" aria-label="Reculer">
            <RotateCcw className="w-8 h-8 md:w-10 md:h-10" />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold mt-1">15</span>
          </button>
          
          <button 
            onClick={togglePlay} 
            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-xl" 
          >
            {isPlaying ? <Pause className="w-10 h-10 md:w-12 md:h-12 fill-current stroke-none" /> : <Play className="w-10 h-10 md:w-12 md:h-12 fill-current stroke-none ml-2" />}
          </button>

          <button onClick={() => seek(Math.min(totalTime || Infinity, currentTime + 30))} className="text-white/70 hover:text-white transition-colors relative" aria-label="Avancer">
            <RotateCw className="w-8 h-8 md:w-10 md:h-10" />
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold mt-1">30</span>
          </button>
        </div>

      </div>
    </div>
  );
}




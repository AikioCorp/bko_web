"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Play, Pause, Volume2, VolumeX, ListMusic, MoreHorizontal, 
  Share, Code, RotateCw, RotateCcw, X, Maximize2, Gauge
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { PlayerModal } from "./PlayerModal";

export function PersistentPlayer() {
  const {
    currentEpisode, isPlaying, progressPercent, currentTime, totalTime, volume, queue,
    togglePlay, seek, setVolume, removeFromQueue, isReady
  } = usePlayerStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [hoverCover, setHoverCover] = useState(false);

  const toggleRightPanel = () => setShowRightPanel(!showRightPanel);

  // Close menus on click outside is ignored for brevity, 
  // but let's implement basic toggles.

  if (!currentEpisode) return null;

  return (
    <>
      <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${isExpanded ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
        <div className="bg-[#1A1A1A]/70 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-full h-16 flex items-center px-4 md:px-6 w-[95vw] md:w-[700px] lg:w-[800px] mx-auto gap-4 md:gap-6 relative group">
          
          {/* Cover & Title (Click to expand) */}
          <div 
            className="flex items-center gap-3 cursor-pointer shrink-0 min-w-0 flex-1 relative overflow-hidden rounded-full p-1 -ml-2 hover:bg-white/5 transition-colors"
            onMouseEnter={() => setHoverCover(true)} 
            onMouseLeave={() => setHoverCover(false)} 
            onClick={() => setIsExpanded(true)}
          >
            <div className="relative w-10 h-10 rounded-full shrink-0 overflow-hidden bg-[#2C2C2E] shadow-sm">
              <img src={currentEpisode.cover || currentEpisode.podcast?.cover} alt="" className={`w-full h-full object-cover transition-opacity ${hoverCover ? 'opacity-30' : 'opacity-100'}`} />
              {hoverCover && <Maximize2 className="absolute inset-0 m-auto w-4 h-4 text-white" />}
            </div>
            <div className="min-w-0 pr-4">
              <p className="text-sm font-bold truncate text-white drop-shadow-sm">{currentEpisode.title}</p>
              <p className="text-[11px] text-white/60 truncate font-medium">{currentEpisode.podcast?.name}</p>
            </div>
          </div>

          {/* Central Controls */}
          <div className="flex items-center justify-center gap-3 md:gap-5 shrink-0">
            <button 
              onClick={() => seek(Math.max(0, currentTime - 15))} 
              className="hover:text-white text-white/70 transition-colors relative hidden md:block" 
              aria-label="Reculer de 15s"
            >
              <RotateCcw className="w-5 h-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-0.5">15</span>
            </button>
            <button 
              onClick={togglePlay} 
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg" 
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current stroke-none" /> : <Play className="w-6 h-6 fill-current stroke-none ml-1" />}
            </button>
            <button 
              onClick={() => seek(Math.min(totalTime || Infinity, currentTime + 30))} 
              className="hover:text-white text-white/70 transition-colors relative hidden md:block" 
              aria-label="Avancer de 30s"
            >
              <RotateCw className="w-5 h-5" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-0.5">30</span>
            </button>
          </div>

          {/* Actions & Queue */}
          <div className="flex items-center gap-3 shrink-0 justify-end flex-1">
            
            {/* Speed Menu (Desktop) */}
            <div className="relative hidden md:block">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)} className="hover:text-white text-white/70 transition-colors" title="Vitesse de lecture">
                <Gauge className="w-5 h-5" />
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-4 w-32 bg-[#2C2C2E]/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden py-1 z-50">
                  <div className="px-3 py-2 text-xs font-bold text-white/50 uppercase tracking-wider border-b border-white/10">Vitesse</div>
                  {[0.8, 1, 1.2, 1.5, 2].map(speed => (
                    <button 
                      key={speed} 
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center justify-between"
                      onClick={() => {
                        const audio = document.getElementById('bko-audio-player') as HTMLAudioElement;
                        if (audio) audio.playbackRate = speed;
                        setShowSpeedMenu(false);
                      }}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Queue Toggle */}
            <button onClick={toggleRightPanel} className="hover:text-white text-white/70 transition-colors relative" title="File d'attente">
              <ListMusic className="w-5 h-5" />
              {queue.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FFBF00] rounded-full border-2 border-[#1A1A1A]"></span>}
            </button>
            
            {/* Volume Toggle */}
            <div className="relative hidden md:flex items-center" onMouseEnter={() => setShowVolumeMenu(true)} onMouseLeave={() => setShowVolumeMenu(false)}>
              <button className="hover:text-white text-white/70 transition-colors" title="Volume">
                {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              {showVolumeMenu && (
                <div className="absolute bottom-full right-1/2 translate-x-1/2 pb-4 z-50">
                  <div className="w-12 h-32 bg-[#2C2C2E]/90 backdrop-blur-xl rounded-full shadow-2xl border border-white/10 flex items-center justify-center py-4">
                    <input 
                      type="range" 
                      min={0} max={1} step={0.01} 
                      value={volume} 
                      onChange={(e) => setVolume(parseFloat(e.target.value))} 
                      className="w-24 h-1.5 rounded-full cursor-pointer -rotate-90 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125 transition-all" 
                      style={{ background: `linear-gradient(to right, #FFBF00 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)` }}
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Scrubber Background (Floating below the pill? Or inside?) 
              Apple style: a thin line AT THE BOTTOM edge of the pill!
          */}
          <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-white/10 rounded-full overflow-hidden">
             <div className="h-full bg-white rounded-full" style={{ width: `${progressPercent}%` }} />
          </div>

        </div>

        {/* Queue Panel */}
        {showRightPanel && (
          <div className="absolute bottom-full right-0 mb-6 w-[90vw] md:w-80 max-h-[60vh] bg-[#1A1A1A]/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 ml-4 md:ml-0 translate-x-[-2vw] md:translate-x-0">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
              <h3 className="text-sm font-bold text-white">File d'attente</h3>
              <button onClick={toggleRightPanel} className="text-white/50 hover:text-white transition-colors bg-white/5 rounded-full p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 px-1">En lecture</p>
                <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/5 shadow-inner">
                  <img src={currentEpisode.cover || currentEpisode.podcast?.cover} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 shadow-sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#FFBF00] truncate">{currentEpisode.title}</p>
                    <p className="text-xs text-white/60 truncate">{currentEpisode.podcast?.name}</p>
                  </div>
                </div>
              </div>
              {queue.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 px-1">À suivre</p>
                  <div className="space-y-1">
                    {queue.map((ep, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl group transition-colors">
                        <img src={ep.cover || ep.podcast?.cover} alt="" className="w-10 h-10 rounded-md object-cover shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-white truncate">{ep.title}</p>
                          <p className="text-[10px] text-white/50 truncate">{ep.podcast?.name}</p>
                        </div>
                        <button onClick={() => removeFromQueue(i)} className="opacity-0 group-hover:opacity-100 p-2 text-white/50 hover:text-white transition-all bg-white/5 rounded-full">
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

      <PlayerModal isOpen={isExpanded} onClose={() => setIsExpanded(false)} />
    </>
  );
}

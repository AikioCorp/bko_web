"use client";
import { getAccessToken } from "@/lib/token";
import { API_BASE_URL } from "@/lib/api";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { FileText, Play, Pause, Upload, Star, Check, Edit2, Clock, User, AlertCircle } from "lucide-react";

export default function EpisodeTranscriptEditorPage() {
  const params = useParams();
  const episodeId = params.id as string;

  const [transcript, setTranscript] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editSpeaker, setEditSpeaker] = useState("");
  const [srtContent, setSrtContent] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [message, setMessage] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const fetchTranscript = () => {
    const token = getAccessToken();
    if (!token) return;

    fetch(`${API_BASE_URL}/episodes/${episodeId}/transcript`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setTranscript(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTranscript();
  }, [episodeId]);

  // Synchronisation temporelle du lecteur audio avec la transcription
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const ms = Math.round(audioRef.current.currentTime * 1000);
    setCurrentTimeMs(ms);

    if (transcript?.segments) {
      const currentSeg = transcript.segments.find(
        (s: any) => ms >= s.startTimeMs && ms <= s.endTimeMs
      );
      if (currentSeg && currentSeg.id !== activeSegmentId) {
        setActiveSegmentId(currentSeg.id);
      }
    }
  };

  const handleSeek = (startTimeMs: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTimeMs / 1000;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleImportSrt = async () => {
    const token = getAccessToken();
    if (!token || !srtContent) return;

    try {
      const res = await fetch(`${API_BASE_URL}/creator/episodes/${episodeId}/transcripts/import`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileContent: srtContent, languageCode: "fr" }),
      });
      const json = await res.json();
      if (json.success) {
        setShowImportModal(false);
        setSrtContent("");
        fetchTranscript();
      } else {
        setMessage(json.message);
      }
    } catch (e) {
      setMessage("Erreur de fichier");
    }
  };

  const handleGenerate = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/creator/episodes/${episodeId}/transcripts/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ languageCode: "fr" }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage("Génération automatique lancée en arrière-plan...");
        setTimeout(() => fetchTranscript(), 3000);
      }
    } catch (e) {}
  };

  const handleSaveSegment = async (segmentId: string) => {
    const token = getAccessToken();
    if (!token) return;

    try {
      await fetch(`${API_BASE_URL}/creator/transcripts/segments/${segmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: editText, speakerLabel: editSpeaker }),
      });
      setEditingSegmentId(null);
      fetchTranscript();
    } catch (e) {}
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Chargement de l'éditeur de transcription...</div>;

  return (
    <div className="w-full px-4 py-8 space-y-8">
      {/* En-tête Éditeur */}
      <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-8 space-y-2 flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[#E5A93C]">
            <FileText className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Moteur de Transcription & Sous-Titres</span>
          </div>
          <h1 className="text-3xl font-black text-white">Éditeur de Transcription Synchronisé</h1>
          <p className="text-xs text-gray-400">
            Corrigez le texte, attribuez les intervenants et vérifiez la synchronisation temporelle pour rendre l'épisode consultable par mot-clé.
          </p>
        </div>

        <div className="flex items-center space-x-3 pt-4 md:pt-0">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-[#1A2130] text-gray-200 border border-[#1E2638] hover:border-[#E5A93C]/50 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Importer SRT / VTT</span>
          </button>

          <button
            onClick={handleGenerate}
            className="bg-[#E5A93C] text-black hover:bg-[#F5B82E] px-5 py-2.5 rounded-xl text-xs font-black flex items-center space-x-2 transition shadow-lg"
          >
            <Star />
            <span>Générer IA</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-[#E5A93C]/10 border border-[#E5A93C]/30 rounded-xl text-[#E5A93C] text-xs font-bold">
          {message}
        </div>
      )}

      {/* Lecteur Audio Intégré & Liste Synchronisée */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lecteur Média */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-6 space-y-4 sticky top-6">
            <h3 className="font-extrabold text-white text-sm">Aperçu & Synchronisation</h3>
            <audio
              ref={audioRef}
              src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
              onTimeUpdate={handleTimeUpdate}
              controls
              className="w-full"
            />
            <div className="text-xs text-gray-400 font-mono text-center">
              Temps actuel : {formatTime(currentTimeMs)}
            </div>
          </div>
        </div>

        {/* Segments de la Transcription */}
        <div className="md:col-span-2 space-y-4">
          {!transcript || !transcript.segments || transcript.segments.length === 0 ? (
            <div className="bg-[#121722] border border-[#1E2638] rounded-2xl p-12 text-center text-gray-400 text-xs">
              Aucune transcription enregistrée. Importez un fichier SRT/VTT ou lancez une génération IA.
            </div>
          ) : (
            <div className="space-y-3">
              {transcript.segments.map((seg: any) => {
                const isActive = activeSegmentId === seg.id;
                const isEditing = editingSegmentId === seg.id;

                return (
                  <div
                    key={seg.id}
                    className={`bg-[#121722] border rounded-2xl p-4 space-y-2 transition ${
                      isActive ? "border-[#E5A93C] bg-[#1A2130]" : "border-[#1E2638] hover:border-[#1E2638]/80"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleSeek(seg.startTimeMs)}
                        className="flex items-center space-x-1.5 text-[#E5A93C] font-mono hover:underline font-bold"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(seg.startTimeMs)} - {formatTime(seg.endTimeMs)}</span>
                      </button>

                      <div className="flex items-center space-x-2">
                        {seg.speakerLabel && (
                          <span className="bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded text-[10px] font-bold flex items-center space-x-1">
                            <User className="w-3 h-3 text-[#E5A93C]" />
                            <span>{seg.speakerLabel}</span>
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setEditingSegmentId(seg.id);
                            setEditText(seg.text);
                            setEditSpeaker(seg.speakerLabel || "");
                          }}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 pt-2">
                        <input
                          type="text"
                          placeholder="Nom de l'intervenant (ex: Mohamed Traoré)"
                          value={editSpeaker}
                          onChange={(e) => setEditSpeaker(e.target.value)}
                          className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#E5A93C]"
                        />
                        <textarea
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#E5A93C]"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setEditingSegmentId(null)}
                            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                          >
                            Annuler
                          </button>
                          <button
                            onClick={() => handleSaveSegment(seg.id)}
                            className="bg-[#E5A93C] text-black px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Sauvegarder</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-200 leading-relaxed font-sans">{seg.text}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal d'import SRT/VTT */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121722] border border-[#1E2638] rounded-3xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-black text-white">Importer un fichier de sous-titres (SRT / VTT)</h3>
            <textarea
              rows={8}
              placeholder="Collez le contenu du fichier SRT ou WEBVTT..."
              value={srtContent}
              onChange={(e) => setSrtContent(e.target.value)}
              className="w-full bg-[#0A0D14] border border-[#1E2638] rounded-xl p-3 text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-[#E5A93C]"
            />
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-xs text-gray-400">
                Annuler
              </button>
              <button onClick={handleImportSrt} className="bg-[#E5A93C] text-black px-5 py-2 rounded-xl text-xs font-bold">
                Importer & Traiter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

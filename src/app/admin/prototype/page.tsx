"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Video,
  Sparkles,
  Play,
  Pause,
  Rss,
  CheckCircle,
  AlertCircle,
  Info,
  Radio,
  Building2,
  UserCheck,
  UploadCloud,
  Link2,
  Eye,
  Calendar,
  RotateCcw,
  ExternalLink,
  Copy,
  Clock,
  Layers,
  Search,
  Filter,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

// 12 Screens Definition
const SCREENS = [
  { id: 1, title: "Écran 1", name: "Liste des Émissions", category: "Catalogue" },
  { id: 2, title: "Écran 2", name: "Choix du parcours émission", category: "Création Émission" },
  { id: 3, title: "Écran 3", name: "Informations de l'émission", category: "Création Émission" },
  { id: 4, title: "Écran 4", name: "Format de l'épisode", category: "Création Épisode" },
  { id: 5, title: "Écran 5", name: "Source de l'épisode", category: "Création Épisode" },
  { id: 6, title: "Écran 6", name: "Infos épisode & Cross-média", category: "Création Épisode" },
  { id: 7, title: "Écran 7", name: "Aperçu & Publication", category: "Création Épisode" },
  { id: 8, title: "Écran 8", name: "Import RSS — 1. Adresse", category: "Import RSS" },
  { id: 9, title: "Écran 9", name: "Import RSS — 2. Aperçu", category: "Import RSS" },
  { id: 10, title: "Écran 10", name: "Import RSS — 3. Réglages", category: "Import RSS" },
  { id: 11, title: "Écran 11", name: "Import RSS — 4. Import", category: "Import RSS" },
  { id: 12, title: "Écran 12", name: "Gestion du flux RSS", category: "Administration" },
];

export default function PrototypeShowcasePage() {
  const [activeScreenId, setActiveScreenId] = useState<number>(1);
  const [viewportMode, setViewportMode] = useState<"DESKTOP" | "MOBILE">("DESKTOP");
  
  // Interactive prototype state
  const [demoFormat, setDemoFormat] = useState<"AUDIO" | "VIDEO" | "HYBRID">("AUDIO");
  const [sourceTab, setSourceTab] = useState<"FILE" | "LINK">("FILE");
  const [sourceState, setSourceState] = useState<"READY" | "UPLOADING" | "ERROR">("READY");
  const [hasSecondaryMedia, setHasSecondaryMedia] = useState<boolean>(false);
  const [activePlayer, setActivePlayer] = useState<"NONE" | "AUDIO" | "VIDEO">("NONE");
  const [simulateError, setSimulateError] = useState<boolean>(false);

  const currentScreen = SCREENS.find(s => s.id === activeScreenId) || SCREENS[0];

  const nextScreen = () => {
    setActiveScreenId(prev => Math.min(prev + 1, 12));
  };

  const prevScreen = () => {
    setActiveScreenId(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col font-sans selection:bg-[#FFBF00] selection:text-black">
      
      {/* Prototype Control Bar */}
      <header className="sticky top-0 z-50 bg-[#141414] border-b border-[#2A2A2A] px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Navigation & Context */}
        <div className="flex items-center gap-3">
          <Link href="/admin/podcasts" className="text-xs font-bold text-[#888888] hover:text-[#FFBF00] transition-colors flex items-center">
            <ChevronLeft className="w-4 h-4 mr-1" /> Sortir du prototype
          </Link>
          <span className="text-[#333333]">|</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF00] animate-pulse" />
            <h1 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Prototype Interactif Bamako Podcast
            </h1>
          </div>
        </div>

        {/* Screen Picker */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-xl no-scrollbar py-1">
          <select
            value={activeScreenId}
            onChange={(e) => setActiveScreenId(Number(e.target.value))}
            className="bg-[#0B0B0B] border border-[#2A2A2A] text-white text-xs h-9 px-3 rounded-xl focus:border-[#FFBF00] outline-none"
          >
            {SCREENS.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} : {s.name} ({s.category})
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="outline"
            disabled={activeScreenId <= 1}
            onClick={prevScreen}
            className="h-9 px-2 text-xs bg-[#1C1C1C] border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            disabled={activeScreenId >= 12}
            onClick={nextScreen}
            className="h-9 px-2 text-xs bg-[#1C1C1C] border-[#2A2A2A] text-white hover:bg-[#2A2A2A]"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1.5 bg-[#0B0B0B] p-1 rounded-xl border border-[#2A2A2A]">
          <button
            onClick={() => setViewportMode("DESKTOP")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewportMode === "DESKTOP"
                ? "bg-[#222222] text-[#FFBF00]"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> Ordinateur
          </button>
          <button
            onClick={() => setViewportMode("MOBILE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewportMode === "MOBILE"
                ? "bg-[#222222] text-[#FFBF00]"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </button>
        </div>

      </header>

      {/* Screen Sub-Banner & Scenario Hints */}
      <div className="bg-[#101010] border-b border-[#222222] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-[#FFBF00]">{currentScreen.title}</span>
          <span className="text-white font-semibold">{currentScreen.name}</span>
          <span className="bg-[#1C1C1C] text-[#888888] px-2 py-0.5 rounded text-[11px] border border-[#2A2A2A]">
            {currentScreen.category}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[#888888] text-[11px]">
          <span>Format test : <strong className="text-white">{demoFormat}</strong></span>
          <span>•</span>
          <button 
            onClick={() => setSimulateError(!simulateError)} 
            className={`px-2 py-0.5 rounded font-bold border text-[10px] ${
              simulateError ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-[#171717] text-[#888888] border-[#2A2A2A]"
            }`}
          >
            Simuler erreur : {simulateError ? "OUI" : "NON"}
          </button>
        </div>
      </div>

      {/* Main Prototype Viewport Canvas */}
      <main className="flex-1 p-4 md:p-8 flex justify-center items-start overflow-y-auto">
        
        <div className={`transition-all duration-300 ${
          viewportMode === "DESKTOP" 
            ? "w-full max-w-6xl" 
            : "w-full max-w-[420px] bg-[#000000] rounded-[44px] p-4 border-[8px] border-[#222222] shadow-2xl relative my-2"
        }`}>
          
          {/* Mobile Notch Bar */}
          {viewportMode === "MOBILE" && (
            <div className="w-full flex justify-between items-center px-4 pt-1 pb-3 text-[11px] font-bold text-white border-b border-[#1A1A1A] mb-4">
              <span>09:41</span>
              <div className="w-24 h-4 bg-[#141414] rounded-full mx-auto" />
              <span>5G 100%</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 1 — LISTE DES ÉMISSIONS                                            */}
          {/* ========================================================================= */}
          {activeScreenId === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <Radio className="w-6 h-6 text-[#FFBF00]" /> Émissions
                  </h2>
                  <p className="text-xs text-[#888888] mt-0.5">Toutes les séries disponibles sur la plateforme.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setActiveScreenId(8)} variant="outline" className="text-xs h-9 bg-[#171717] border-[#2A2A2A] text-white">
                    <Rss className="w-3.5 h-3.5 mr-1.5 text-[#FFBF00]" /> Importer via RSS
                  </Button>
                  <Button onClick={() => setActiveScreenId(2)} className="text-xs h-9 bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">
                    + Créer une émission
                  </Button>
                </div>
              </div>

              {/* Barre de filtres */}
              <div className="bg-[#171717] border border-[#2A2A2A] rounded-xl p-3 flex flex-wrap gap-2 text-xs">
                <input 
                  type="text" 
                  placeholder="Rechercher une émission..." 
                  className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg px-3 py-1.5 text-white flex-1 min-w-[140px]" 
                />
                <select className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg px-2.5 py-1.5 text-white">
                  <option>Tous les formats</option>
                  <option>Format Audio</option>
                  <option>Format Vidéo</option>
                  <option>Audio & Vidéo</option>
                </select>
                <select className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-lg px-2.5 py-1.5 text-white">
                  <option>Tous les statuts</option>
                  <option>Publié</option>
                  <option>Brouillon</option>
                </select>
              </div>

              {/* Tableau / Cartes */}
              <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl overflow-hidden divide-y divide-[#2A2A2A]">
                {[
                  { id: "1", name: "Les voix de Bamako", format: "HYBRID", resp: "Studio BKO", status: "PUBLISHED", epCount: 24, cover: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop" },
                  { id: "2", name: "Paroles d'Histoire", format: "AUDIO", resp: "Non revendiqué", status: "DRAFT", epCount: 8, cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop" },
                  { id: "3", name: "Mali Tech Vision", format: "VIDEO", resp: "MaliTech Hub", status: "PUBLISHED", epCount: 15, cover: "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=100&h=100&fit=crop" },
                ].map(item => (
                  <div key={item.id} className="p-4 flex items-center justify-between gap-3 hover:bg-[#1C1C1C] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={item.cover} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#2A2A2A]" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-[#888888]">{item.resp} • {item.epCount} épisodes</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        item.format === "HYBRID" ? "bg-[#262012] text-[#FFBF00] border-[#524115]" :
                        item.format === "VIDEO" ? "bg-[#1F172E] text-[#D8B4FE] border-[#3B2D54]" :
                        "bg-[#15232D] text-[#7DD3FC] border-[#1E3A4C]"
                      }`}>
                        {item.format === "HYBRID" ? "Audio & Vidéo" : item.format}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => setActiveScreenId(12)} className="h-8 text-xs text-[#B8B8B8] hover:text-white">
                        Ouvrir
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setActiveScreenId(4)} className="h-8 text-xs text-[#FFBF00] hover:bg-[#2A2A2A]">
                        + Épisode
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 2 — CHOIX DU PARCOURS DE CRÉATION                                   */}
          {/* ========================================================================= */}
          {activeScreenId === 2 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider">Création d'émission</span>
                <h2 className="text-xl font-black text-white mt-1">Quel format décrit le mieux votre émission ?</h2>
                <p className="text-xs text-[#888888] mt-1">
                  Ce choix configure le format par défaut de l'émission et de vos prochains épisodes.
                </p>
              </div>

              <div className="p-3 bg-[#171717] border border-[#2A2A2A] rounded-xl flex items-start gap-2.5 text-xs text-[#CCCCCC]">
                <Info className="w-4 h-4 text-[#FFBF00] shrink-0 mt-0.5" />
                <span>
                  <strong>Évolution possible :</strong> Le format choisi prépare le premier épisode. Il reste possible d'ajouter d'autres formats plus tard.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: "AUDIO", title: "Émission audio", icon: Headphones, desc: "Pour les podcasts vocaux, chroniques et récits sonores nomades." },
                  { id: "VIDEO", title: "Émission vidéo", icon: Video, desc: "Pour les talk-shows filmés, reportages vidéo et chroniques visuelles." },
                  { id: "HYBRID", title: "Émission audio et vidéo", icon: Sparkles, desc: "Chaque contenu peut offrir une écoute nomade et une version vidéo." },
                ].map(c => {
                  const Icon = c.icon;
                  const isSelected = demoFormat === c.id;
                  return (
                    <div 
                      key={c.id}
                      onClick={() => { setDemoFormat(c.id as any); setActiveScreenId(3); }}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected ? "bg-[#171717] border-[#FFBF00] ring-1 ring-[#FFBF00]" : "bg-[#141414] border-[#2A2A2A] hover:border-[#444444]"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#222222] text-[#FFBF00] flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-white">{c.title}</h3>
                        <p className="text-[11px] text-[#888888] leading-relaxed">{c.desc}</p>
                      </div>
                      <div className="pt-4 mt-4 border-t border-[#2A2A2A] text-xs font-bold text-[#FFBF00] flex items-center justify-between">
                        <span>Sélectionner</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Entrée RSS distincte */}
              <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Rss className="w-5 h-5 text-[#FFBF00]" />
                  <div>
                    <p className="text-xs font-bold text-white">J'ai déjà un flux RSS</p>
                    <p className="text-[10px] text-[#757575]">Importez une émission déjà existante en 4 étapes simples.</p>
                  </div>
                </div>
                <Button onClick={() => setActiveScreenId(8)} variant="outline" className="text-xs bg-[#1F1F1F] border-[#333333] text-white">
                  Importer RSS
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 3 — INFORMATIONS DE L’ÉMISSION                                      */}
          {/* ========================================================================= */}
          {activeScreenId === 3 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider">Émission ({demoFormat})</span>
                  <h2 className="text-xl font-black text-white">Informations de l'émission</h2>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setActiveScreenId(2)} className="text-xs text-[#888888]">
                  Changer de format
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Formulaire à gauche */}
                <div className="lg:col-span-2 space-y-5 bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 text-xs">
                  <div>
                    <label className="block font-bold text-[#888888] uppercase mb-1">Nom de l'émission *</label>
                    <input defaultValue="Les Voix du Mandé" className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-[#888888] uppercase mb-1">Résumé court</label>
                    <input defaultValue="Chroniques orales et récits traditionnels de Bamako." className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-[#888888] uppercase mb-1">Description complète *</label>
                    <textarea rows={3} defaultValue="Émission consacrée à la transmission orale et aux contes traditionnels mandingues..." className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-white resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#2A2A2A]">
                    <div>
                      <label className="block font-bold text-[#888888] uppercase mb-1">Langue principale</label>
                      <select className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-2.5 text-white">
                        <option>Français (FR)</option>
                        <option>Bamanankan (BM)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-[#888888] uppercase mb-1">Responsable</label>
                      <select className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-2.5 text-white">
                        <option>Studio BKO (Organisation)</option>
                        <option>Propriétaire non revendiqué</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-2">
                    <Button variant="ghost" className="text-xs text-[#888888]">
                      Enregistrer le brouillon
                    </Button>
                    <div className="flex gap-2">
                      <Button onClick={() => setActiveScreenId(1)} variant="outline" className="text-xs bg-[#1C1C1C] border-[#2A2A2A] text-white">
                        Terminer sans épisode
                      </Button>
                      <Button onClick={() => setActiveScreenId(4)} className="text-xs bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">
                        Continuer vers le 1er épisode →
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Live Preview à droite */}
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 space-y-3">
                  <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider block">Aperçu en direct</span>
                  <div className="w-20 h-20 rounded-xl bg-[#222222] overflow-hidden border border-[#2A2A2A]">
                    <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&h=200&fit=crop" alt="Pochette" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Les Voix du Mandé</h4>
                    <p className="text-[11px] text-[#888888] line-clamp-2 mt-0.5">Chroniques orales et récits traditionnels de Bamako.</p>
                  </div>
                  <div className="pt-2 border-t border-[#2A2A2A] text-[10px] text-[#757575] space-y-1">
                    <div className="flex justify-between"><span>Format</span><span className="text-white">{demoFormat}</span></div>
                    <div className="flex justify-between"><span>Langue</span><span className="text-white">FR</span></div>
                    <div className="flex justify-between"><span>Statut</span><span className="text-[#FFBF00]">Brouillon</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 4 — CHOIX DU FORMAT D'UN ÉPISODE                                    */}
          {/* ========================================================================= */}
          {activeScreenId === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="text-xs text-[#888888]">
                <span>Émissions</span> / <strong className="text-white">Les Voix du Mandé</strong> / <span>Nouvel épisode</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Format principal de cet épisode</h2>
                <p className="text-xs text-[#888888] mt-1">Pré-sélectionné selon le format habituel de l'émission.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => { setDemoFormat("AUDIO"); setActiveScreenId(5); }}
                  className={`p-6 rounded-2xl border cursor-pointer ${demoFormat === "AUDIO" ? "bg-[#171717] border-[#FFBF00]" : "bg-[#141414] border-[#2A2A2A]"}`}
                >
                  <Headphones className="w-8 h-8 text-[#7DD3FC] mb-3" />
                  <h3 className="text-sm font-bold text-white">Épisode audio</h3>
                  <p className="text-xs text-[#888888] mt-1">Fichier audio direct ou URL streamable.</p>
                </div>

                <div 
                  onClick={() => { setDemoFormat("VIDEO"); setActiveScreenId(5); }}
                  className={`p-6 rounded-2xl border cursor-pointer ${demoFormat === "VIDEO" ? "bg-[#171717] border-[#FFBF00]" : "bg-[#141414] border-[#2A2A2A]"}`}
                >
                  <Video className="w-8 h-8 text-[#D8B4FE] mb-3" />
                  <h3 className="text-sm font-bold text-white">Épisode vidéo</h3>
                  <p className="text-xs text-[#888888] mt-1">Fichier vidéo ou lien YouTube canonique.</p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 5 — SOURCE DE L'ÉPISODE                                             */}
          {/* ========================================================================= */}
          {activeScreenId === 5 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider">Source Média ({demoFormat})</span>
                  <h2 className="text-xl font-black text-white">Ajouter la source principale</h2>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setSourceTab("FILE")} className={`text-xs ${sourceTab === "FILE" ? "bg-[#FFBF00] text-black font-bold" : "bg-[#171717] text-white"}`}>
                    Importer fichier
                  </Button>
                  <Button size="sm" onClick={() => setSourceTab("LINK")} className={`text-xs ${sourceTab === "LINK" ? "bg-[#FFBF00] text-black font-bold" : "bg-[#171717] text-white"}`}>
                    Ajouter un lien
                  </Button>
                </div>
              </div>

              {/* Zone d'import ou lien */}
              <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
                {sourceTab === "FILE" ? (
                  <div className="border-2 border-dashed border-[#2A2A2A] rounded-xl p-8 text-center bg-[#0B0B0B]">
                    <UploadCloud className="w-8 h-8 text-[#FFBF00] mx-auto mb-2" />
                    <p className="text-xs font-bold text-white">Glissez le fichier {demoFormat === "AUDIO" ? "audio (MP3, WAV, max 250 Mo)" : "vidéo (MP4, max 2 Go)"}</p>
                    <p className="text-[11px] text-[#757575] mt-1">Upload direct vers Cloudflare R2</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-[#888888] uppercase">
                      {demoFormat === "AUDIO" ? "URL directe du fichier audio" : "Lien YouTube ou URL vidéo"}
                    </label>
                    <input defaultValue={demoFormat === "AUDIO" ? "https://stream.bamako.ml/ep1.mp3" : "https://www.youtube.com/watch?v=dQw4w9WgXcQ"} className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white" />
                    {demoFormat === "AUDIO" && (
                      <p className="text-[11px] text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                        Attention : Spotify et YouTube ne sont pas des adresses audio directes.
                      </p>
                    )}
                  </div>
                )}

                {/* État de la source */}
                <div className="bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="font-bold text-white">Média vérifié et prêt (18 min 45s)</span>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs text-[#888888]">Remplacer</Button>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setActiveScreenId(4)} className="text-xs text-[#888888]">
                  Retour
                </Button>
                <Button onClick={() => setActiveScreenId(6)} className="text-xs bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">
                  Continuer vers les informations →
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 6 — INFORMATIONS DE L'ÉPISODE & CROSS-MÉDIA                         */}
          {/* ========================================================================= */}
          {activeScreenId === 6 && (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider">Épisode</span>
                <h2 className="text-xl font-black text-white">Informations de l'épisode</h2>
              </div>

              <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#888888] uppercase mb-1">Titre de l'épisode *</label>
                  <input defaultValue="Épisode 1 : Les gardiens de la mémoire" className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-white" />
                </div>
                <div>
                  <label className="block font-bold text-[#888888] uppercase mb-1">Description complète *</label>
                  <textarea rows={3} defaultValue="Entretien avec les griots de Bamako sur la transmission orale." className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-white resize-none" />
                </div>

                <div className="pt-2 border-t border-[#2A2A2A] flex items-center justify-between">
                  <span className="text-[#888888]">Pochette héritée de l'émission</span>
                  <span className="text-[#FFBF00] font-semibold cursor-pointer">Personnaliser</span>
                </div>
              </div>

              {/* RÈGLE CLEF CROSS-MÉDIA : UN SEUL ÉPISODE, DOUBLE VERSION */}
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#FFBF00]" />
                      {demoFormat === "AUDIO" ? "Ajouter aussi une version vidéo" : "Ajouter aussi une version audio"}
                    </h3>
                    <p className="text-[11px] text-[#757575]">Les deux versions appartiennent au même épisode (aucun doublon).</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setHasSecondaryMedia(!hasSecondaryMedia)}
                    className="text-xs bg-[#222222] hover:bg-[#333333] text-white"
                  >
                    {hasSecondaryMedia ? "Retirer" : "+ Ajouter version complémentaire"}
                  </Button>
                </div>

                {hasSecondaryMedia && (
                  <div className="p-3 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl text-xs space-y-2 animate-in fade-in">
                    <span className="text-[#FFBF00] font-bold">Version {demoFormat === "AUDIO" ? "Vidéo" : "Audio"} rattachée :</span>
                    <input defaultValue={demoFormat === "AUDIO" ? "https://youtube.com/watch?v=sample" : "https://stream.bko/audio.mp3"} className="w-full bg-[#171717] border border-[#2A2A2A] rounded-lg p-2 text-white" />
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setActiveScreenId(5)} className="text-xs text-[#888888]">
                  Retour
                </Button>
                <Button onClick={() => setActiveScreenId(7)} className="text-xs bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold">
                  Aperçu et publication →
                </Button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 7 — APERÇU ET PUBLICATION                                           */}
          {/* ========================================================================= */}
          {activeScreenId === 7 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Carte publique avec lecteur exclusif */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 space-y-4">
                    <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider block">Carte publique de l'épisode</span>
                    <div className="flex gap-4 items-start">
                      <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop" alt="Cover" className="w-20 h-20 rounded-xl object-cover border border-[#2A2A2A] shrink-0" />
                      <div className="space-y-1">
                        <p className="text-[11px] text-[#757575]">Les Voix du Mandé • EP 1</p>
                        <h4 className="text-base font-bold text-white">Épisode 1 : Les gardiens de la mémoire</h4>
                        <p className="text-xs text-[#888888]">Entretien avec les griots de Bamako...</p>
                      </div>
                    </div>

                    {/* Actions de lecture synchronisées */}
                    <div className="pt-2 flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => setActivePlayer(activePlayer === "AUDIO" ? "NONE" : "AUDIO")}
                        className={`text-xs font-bold ${activePlayer === "AUDIO" ? "bg-white text-black" : "bg-[#FFBF00] text-black"}`}
                      >
                        {activePlayer === "AUDIO" ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                        {activePlayer === "AUDIO" ? "Pause Audio" : "Écouter (Audio)"}
                      </Button>

                      <Button 
                        size="sm" 
                        onClick={() => setActivePlayer(activePlayer === "VIDEO" ? "NONE" : "VIDEO")}
                        className={`text-xs font-bold ${activePlayer === "VIDEO" ? "bg-white text-black" : "bg-[#2A2A2A] text-white"}`}
                      >
                        {activePlayer === "VIDEO" ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                        {activePlayer === "VIDEO" ? "Pause Vidéo" : "Regarder (Vidéo)"}
                      </Button>
                    </div>

                    {/* Lecteur exclusif actif */}
                    {activePlayer !== "NONE" && (
                      <div className="p-3 bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl text-xs text-white flex items-center justify-between">
                        <span>Lecteur actif : <strong>{activePlayer}</strong> (l'autre média est mis en pause)</span>
                        <Button size="sm" variant="ghost" onClick={() => setActivePlayer("NONE")} className="text-xs text-[#888888]">Fermer</Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checklist de publication */}
                <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-5 space-y-4 text-xs">
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Checklist de publication</h4>
                  <div className="space-y-2">
                    {[
                      "Titre renseigné",
                      "Description renseignée",
                      "Émission sélectionnée",
                      "Langue renseignée",
                      "Au moins une source utilisable",
                      "Traitement média terminé",
                      "Émission autorisée à publier"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[#CCCCCC]">
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-[#2A2A2A] space-y-2">
                    <Button onClick={() => alert("Épisode publié avec succès !")} className="w-full bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs h-10">
                      Publier maintenant
                    </Button>
                    <Button variant="outline" className="w-full bg-[#0B0B0B] border-[#2A2A2A] text-white text-xs h-9">
                      Programmer (Fuseau GMT+0 Bamako)
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 8 — IMPORT RSS : ÉTAPE 1 (ADRESSE)                                   */}
          {/* ========================================================================= */}
          {activeScreenId === 8 && (
            <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 space-y-5 animate-in fade-in">
              <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider">Import RSS • Étape 1/4</span>
              <h2 className="text-xl font-black text-white">Adresse du flux RSS</h2>
              <input defaultValue="https://feeds.acast.com/public/shows/mali-culture" className="w-full bg-[#0B0B0B] border border-[#2A2A2A] rounded-xl p-3 text-xs text-white" />
              <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-xs text-[#888888]">
                Fournissez l'adresse brute XML/RSS, et non un lien d'application Spotify ou Apple Podcasts.
              </div>
              <Button onClick={() => setActiveScreenId(9)} className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs">
                Analyser le flux →
              </Button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 9 — IMPORT RSS : ÉTAPE 2 (PRÉVISUALISATION)                          */}
          {/* ========================================================================= */}
          {activeScreenId === 9 && (
            <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 space-y-5 animate-in fade-in">
              <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider">Import RSS • Étape 2/4</span>
              <h2 className="text-xl font-black text-white">Prévisualisation du flux</h2>
              <div className="flex gap-4 items-center p-3 bg-[#0B0B0B] rounded-xl border border-[#2A2A2A]">
                <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&h=100&fit=crop" className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <h4 className="text-sm font-bold text-white">Mali Culture Express</h4>
                  <p className="text-xs text-[#888888]">28 épisodes détectés • Langue : FR • Source audio prête</p>
                </div>
              </div>
              <p className="text-xs text-[#757575] italic">L'analyse seule ne crée ni ne publie aucun contenu sur Bamako Podcast.</p>
              <Button onClick={() => setActiveScreenId(10)} className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs">
                Vérifier les réglages →
              </Button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 10 — IMPORT RSS : ÉTAPE 3 (RÉGLAGES)                                 */}
          {/* ========================================================================= */}
          {activeScreenId === 10 && (
            <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 space-y-5 animate-in fade-in text-xs">
              <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider">Import RSS • Étape 3/4</span>
              <h2 className="text-xl font-black text-white">Réglages et droits de synchronisation</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-white">
                  <input type="checkbox" defaultChecked className="accent-[#FFBF00]" />
                  <span>Activer la récupération des nouveaux épisodes (Synchronisation continue)</span>
                </label>
                <label className="flex items-center gap-2 text-white">
                  <input type="checkbox" defaultChecked className="accent-[#FFBF00]" />
                  <span>Conserver les modifications manuelles lors des prochaines synchronisations</span>
                </label>
                <label className="flex items-center gap-2 text-white">
                  <input type="checkbox" defaultChecked className="accent-[#FFBF00]" />
                  <span>Signaler un épisode retiré du flux sans le supprimer automatiquement</span>
                </label>
              </div>
              <Button onClick={() => setActiveScreenId(11)} className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs">
                Passer à l'import →
              </Button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 11 — IMPORT RSS : ÉTAPE 4 (IMPORT EFFECTIF)                          */}
          {/* ========================================================================= */}
          {activeScreenId === 11 && (
            <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 space-y-5 animate-in fade-in text-center">
              <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider">Import RSS • Étape 4/4</span>
              <div className="w-12 h-12 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white">28 épisodes importés en brouillon</h2>
              <p className="text-xs text-[#888888] max-w-md mx-auto">
                Les épisodes utilisent les adresses distantes du flux RSS (streaming direct). Aucun fichier n'a encombré votre stockage local.
              </p>
              <Button onClick={() => setActiveScreenId(12)} className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs">
                Ouvrir la gestion du flux RSS (Écran 12)
              </Button>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ÉCRAN 12 — GESTION DU RSS DANS LA FICHE ÉMISSION                          */}
          {/* ========================================================================= */}
          {activeScreenId === 12 && (
            <div className="bg-[#171717] border border-[#2A2A2A] rounded-2xl p-6 space-y-5 animate-in fade-in text-xs">
              <div className="flex justify-between items-center border-b border-[#2A2A2A] pb-3">
                <div>
                  <span className="text-[10px] font-bold text-[#FFBF00] uppercase tracking-wider">Fiche Émission</span>
                  <h2 className="text-lg font-black text-white">Onglet : Source RSS</h2>
                </div>
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[11px] font-bold">
                  Connecté & Actif
                </span>
              </div>

              <div className="p-3 bg-[#0B0B0B] rounded-xl border border-[#2A2A2A] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Adresse du flux :</span>
                  <span className="font-mono text-white">https://feeds.acast.com/...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Dernière synchro :</span>
                  <span className="text-white">Aujourd'hui à 18:30 (Succès)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Épisodes synchronisés :</span>
                  <span className="text-[#FFBF00] font-bold">28 épisodes</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" className="bg-[#FFBF00] hover:bg-[#E5AB00] text-[#0B0B0B] font-bold text-xs">
                  Synchroniser maintenant
                </Button>
                <Button size="sm" variant="outline" className="bg-[#0B0B0B] border-[#2A2A2A] text-white text-xs">
                  Modifier les réglages
                </Button>
                <Button size="sm" variant="outline" className="bg-[#0B0B0B] border-red-500/20 text-red-400 text-xs">
                  Déconnecter le flux
                </Button>
              </div>

              <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-xl text-[#888888] text-[11px]">
                <strong>Rappel :</strong> Déconnecter le flux conserve tous les épisodes déjà importés, mais arrête leur mise à jour.
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Prototype Footer Navigation Bar */}
      <footer className="bg-[#141414] border-t border-[#2A2A2A] px-6 py-3 flex items-center justify-between text-xs text-[#888888]">
        <div>
          <span>Navigation : </span>
          <strong className="text-white">Écran {activeScreenId} sur 12</strong>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            disabled={activeScreenId <= 1}
            onClick={prevScreen}
            className="text-xs text-[#888888] hover:text-white"
          >
            ← Écran précédent
          </Button>

          <Button
            size="sm"
            disabled={activeScreenId >= 12}
            onClick={nextScreen}
            className="text-xs bg-[#222222] hover:bg-[#333333] text-[#FFBF00] font-bold px-4"
          >
            Écran suivant →
          </Button>
        </div>
      </footer>

    </div>
  );
}

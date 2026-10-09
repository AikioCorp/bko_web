"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Play, Pause, Bookmark, Share2, ChevronLeft, ChevronRight } from "lucide-react";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop";

function cleanText(input?: string | null, max = 220) {
  if (!input) return "";
  let t = input
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[-_=]{4,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length > max) {
    t = t.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }
  return t;
}

function titleSize(len: number) {
  if (len <= 30) return "text-4xl md:text-5xl lg:text-6xl";
  if (len <= 60) return "text-3xl md:text-4xl lg:text-5xl";
  return "text-2xl md:text-3xl lg:text-4xl";
}

export type HeroSlideData = {
  kind: string;
  label: string;
  reason?: string;
  episode: any;
};

export function HeroBanner({
  slides: rawSlides,
  onPlay,
  currentId,
  isPlaying,
}: {
  slides: HeroSlideData[];
  onPlay: (ep: any) => void;
  currentId?: string;
  isPlaying?: boolean;
}) {
  const slides = useMemo(() => (rawSlides || []).filter((s) => s && s.episode).slice(0, 6), [rawSlides]);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 8000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[index] || slides[0];
  const ep = slide.episode;
  const cover = ep.cover || ep.podcast?.cover || FALLBACK_IMG;
  const category = ep.podcast?.categories?.[0]?.category?.name || ep.category?.name;
  const lang = ep.podcast?.primaryLanguage?.name;
  const minutes = ep.durationSeconds ? Math.max(1, Math.round(ep.durationSeconds / 60)) : null;
  const desc = cleanText(ep.description);
  const title = cleanText(ep.title, 110);
  const active = currentId === ep.id && isPlaying;

  const go = (dir: number) => setIndex((i) => (i + dir + slides.length) % slides.length);

  const share = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/podcasts/${ep.podcast?.slug || ""}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section
      className="px-4 md:px-10 pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl border border-[#242424] bg-[#101010] min-h-[460px] lg:h-[480px]">
        {/* Backdrop: la pochette floutée, voile uni */}
        <img
          key={`bg-${ep.id}`}
          src={cover}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-40"
        />
        <div className="absolute inset-0 bg-[#0B0B0B]/60" />

        <div key={`c-${ep.id}`} className="relative z-10 h-full grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center px-6 md:px-20 py-10 pb-14 animate-fade-in">
          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FFBF00] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-black">
                {slide.label}
              </span>
              {lang && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                  {lang}
                </span>
              )}
              {category && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
                  {category}
                </span>
              )}
            </div>

            {ep.podcast?.name && (
              <Link
                href={`/podcasts/${ep.podcast.slug}`}
                className="block text-xs font-bold uppercase tracking-widest text-[#FFBF00] hover:underline truncate"
              >
                {ep.podcast.name}
              </Link>
            )}

            <h1
              className={`${titleSize(title.length)} font-black leading-[1.1] tracking-tight text-white line-clamp-3 font-headline`}
            >
              {title}
            </h1>

            {desc && (
              <p className="max-w-xl text-sm md:text-base leading-relaxed text-white/70 line-clamp-3">
                {desc}
              </p>
            )}

            {(slide.reason || minutes) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-white/60">
                {slide.reason && <span className="text-[#FFBF00]">{slide.reason}</span>}
                {slide.reason && minutes && <span>•</span>}
                {minutes && <span>{minutes} min</span>}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onPlay(ep)}
                className="inline-flex items-center gap-2 rounded-full bg-[#FFBF00] px-6 py-3 text-sm font-extrabold text-black transition hover:bg-[#E5AB00] active:scale-95"
              >
                {active ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                {active ? "En lecture" : "Écouter"}
              </button>
              <Link
                href={`/podcasts/${ep.podcast?.slug || ""}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                <Bookmark className="h-4 w-4" /> Voir le podcast
              </Link>
              <button
                onClick={share}
                title="Copier le lien"
                className="rounded-full border border-white/15 bg-white/10 p-3 text-white/80 transition hover:bg-white/20"
              >
                <Share2 className="h-4 w-4" />
              </button>
              {copied && <span className="text-xs font-semibold text-[#FFBF00]">Lien copié</span>}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
              <img key={`fg-${ep.id}`} src={cover} alt={title} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>

        {/* Contrôles du slider */}
        {slides.length > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Précédent"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white hover:bg-[#FFBF00] hover:text-black transition"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Suivant"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white hover:bg-[#FFBF00] hover:text-black transition"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

          </>
        )}
      </div>
    </section>
  );
}

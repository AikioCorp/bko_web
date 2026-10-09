import React from "react";
import Link from "next/link";
import Image from "next/image";

// --- PODCAST ITEM INTERFACE ---

export interface PodcastItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  cover: string;
  countryId?: string;
  primaryLanguageCode?: string;
  organization?: { name: string };
  isOfficial?: boolean;
}

// --- MINIMAL PODCAST CARDS (Apple-inspired Editorial Style) ---

export const PodcastCardCompact: React.FC<{ podcast: PodcastItem }> = ({ podcast }) => (
  <Link
    href={`/podcasts/${podcast.slug}`}
    className="group flex items-center gap-3 py-2 transition-opacity hover:opacity-90"
  >
    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#161B22]">
      <Image
        src={podcast.cover || "/brand/favicon.png"}
        alt={podcast.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div className="min-w-0 flex-1">
      <h4 className="text-sm font-semibold text-[#F0F6FC] truncate group-hover:text-[#E6B009] transition-colors">
        {podcast.name}
      </h4>
      <p className="text-xs text-[#8B949E] truncate">{podcast.organization?.name || "Bko Podcast"}</p>
    </div>
  </Link>
);

export const PodcastCardStandard: React.FC<{ podcast: PodcastItem }> = ({ podcast }) => (
  <Link href={`/podcasts/${podcast.slug}`} className="group flex flex-col space-y-2.5 transition-all">
    {/* Cover is the Card */}
    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#161B22] shadow-md">
      <Image
        src={podcast.cover || "/brand/favicon.png"}
        alt={podcast.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
      />
      <div className="absolute inset-0 bg-[#0B0F17]/10 group-hover:bg-transparent transition-colors" />
    </div>

    {/* Text Below Cover */}
    <div className="space-y-0.5 px-0.5">
      <h3 className="text-sm font-bold text-[#F0F6FC] group-hover:text-[#E6B009] transition-colors line-clamp-1">
        {podcast.name}
      </h3>
      <p className="text-xs text-[#8B949E] line-clamp-1">{podcast.organization?.name || "Bko Podcast"}</p>
    </div>
  </Link>
);

export const PodcastCardFeatured: React.FC<{ podcast: PodcastItem }> = ({ podcast }) => (
  <div className="group relative rounded-3xl bg-[#161B22] overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center border border-[#21262D]">
    <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden flex-shrink-0 bg-[#0B0F17] shadow-2xl">
      <Image
        src={podcast.cover || "/brand/favicon.png"}
        alt={podcast.name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
    <div className="flex-1 min-w-0 space-y-3">
      <span className="text-[10px] font-bold text-[#E6B009] uppercase tracking-widest">À LA UNE</span>
      <h2 className="text-2xl md:text-4xl font-black text-[#F0F6FC] line-clamp-2">{podcast.name}</h2>
      <p className="text-xs md:text-sm text-[#8B949E] line-clamp-3 leading-relaxed">{podcast.description}</p>
      <div className="pt-3">
        <Link
          href={`/podcasts/${podcast.slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E6B009] text-[#0B0F17] font-extrabold text-xs rounded-xl hover:bg-[#F5B82E] transition-colors shadow-lg"
        >
          <span>Découvrir le podcast</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  </div>
);

// --- EPISODE ITEM INTERFACE & EDITORIAL LIST CARD ---

export interface EpisodeItem {
  id: string;
  slug: string;
  title: string;
  podcast: { name: string; slug: string; cover?: string };
  cover?: string;
  durationSeconds?: number;
  publishedAt?: string;
}

export const EpisodeCardHorizontal: React.FC<{ episode: EpisodeItem; onPlay?: () => void }> = ({
  episode,
  onPlay,
}) => (
  <div className="group flex items-center justify-between p-3.5 rounded-2xl hover:bg-[#161B22] transition-colors border border-transparent hover:border-[#21262D]">
    <div className="flex items-center gap-4 min-w-0 pr-4">
      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-[#161B22]">
        <Image
          src={episode.cover || episode.podcast.cover || "/brand/favicon.png"}
          alt={episode.title}
          fill
          className="object-cover"
        />
        <button
          onClick={onPlay}
          className="absolute inset-0 bg-[#0B0F17]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Écouter"
        >
          <span className="w-6 h-6 rounded-full bg-[#E6B009] text-[#0B0F17] flex items-center justify-center font-bold text-[10px]">
            ▶
          </span>
        </button>
      </div>

      <div className="min-w-0 space-y-0.5">
        <Link
          href={`/podcasts/${episode.podcast.slug}/episodes/${episode.slug}`}
          className="text-xs font-bold text-[#F0F6FC] hover:text-[#E6B009] transition-colors line-clamp-1"
        >
          {episode.title}
        </Link>
        <p className="text-[11px] text-[#8B949E] truncate">{episode.podcast.name}</p>
      </div>
    </div>

    <div className="flex items-center gap-3 shrink-0">
      {episode.durationSeconds ? (
        <span className="text-[11px] font-mono text-[#8B949E]">
          {Math.floor(episode.durationSeconds / 60)} min
        </span>
      ) : null}
      <button
        onClick={onPlay}
        className="w-8 h-8 rounded-full bg-[#161B22] group-hover:bg-[#E6B009] text-[#8B949E] group-hover:text-[#0B0F17] flex items-center justify-center font-bold text-xs transition-colors"
      >
        ▶
      </button>
    </div>
  </div>
);

// --- CATEGORY TILES ---

export const CategoryChip: React.FC<{ label: string; active?: boolean; onClick?: () => void }> = ({
  label,
  active = false,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
      active
        ? "bg-[#E6B009] text-[#0B0F17]"
        : "bg-[#161B22] text-[#8B949E] border border-[#21262D] hover:text-[#F0F6FC] hover:border-[#30363D]"
    }`}
  >
    {label}
  </button>
);

export const CategoryCard: React.FC<{ name: string; slug: string; icon?: string; count?: number }> = ({
  name,
  slug,
  count,
}) => (
  <Link
    href={`/categories/${slug}`}
    className="group flex flex-col justify-between p-4 rounded-2xl bg-[#161B22] border border-[#21262D] hover:border-[#E6B009] transition-all min-h-[90px]"
  >
    <div>
      <h3 className="text-xs font-bold text-[#F0F6FC] group-hover:text-[#E6B009] transition-colors">{name}</h3>
      {count ? <p className="text-[10px] text-[#8B949E] mt-1">{count} émissions</p> : null}
    </div>
    <span className="text-[10px] text-[#E6B009] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
      Explorer →
    </span>
  </Link>
);

// --- HUMAN PORTRAITS ---

export const PersonAvatar: React.FC<{ name: string; photo?: string; role?: string }> = ({ name, photo, role }) => (
  <div className="flex flex-col items-center text-center group cursor-pointer space-y-2">
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-[#161B22] border border-[#21262D] group-hover:border-[#E6B009] transition-all shadow-md">
      <Image
        src={photo || "/brand/favicon.png"}
        alt={name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>
    <div>
      <h4 className="text-xs font-bold text-[#F0F6FC] group-hover:text-[#E6B009] transition-colors line-clamp-1">
        {name}
      </h4>
      {role ? <p className="text-[10px] text-[#8B949E] line-clamp-1">{role}</p> : null}
    </div>
  </div>
);

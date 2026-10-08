"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Headphones, Mic, Pause, Play, Radio, Sparkles, Video } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { formatDuration, toPlayerEpisode } from "@/lib/playback";
import { DownloadAppSection } from "@/components/ui/DownloadAppSection";

type Shelf = {id:string;slug:string;name:string;count:number;podcasts:any[]};
const list = (value:any):any[] => Array.isArray(value) ? value : [];
const episodePath = (episode:any) => `/podcasts/${episode.podcast.slug}/episodes/${episode.slug}`;
const sources = (episode:any) => list(episode.mediaSources);
function Cover({src,className="",eager=false}:{src?:string;className?:string;eager?:boolean}) {
  return <img src={src || "/placeholder.svg"} alt="" loading={eager ? "eager" : "lazy"} onError={event=>{event.currentTarget.onerror=null;event.currentTarget.src="/placeholder.svg";}} className={`object-cover ${className}`} />;
}
function PodcastShelf({title,subtitle,podcasts,href}:{title:string;subtitle?:string;podcasts:any[];href?:string}) {
  const scroll = useRef<HTMLDivElement>(null);
  if (!podcasts.length) return null;
  return <section className="space-y-5">
    <div className="flex items-end justify-between gap-4"><div><h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>{subtitle && <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>}</div>
      <div className="flex items-center gap-2">{href && <Link href={href} className="text-sm text-[#FFBF00] hidden sm:block mr-2 hover:underline">Explorer</Link>}
        {[-1,1].map(direction=><button key={direction} aria-label={`${direction<0 ? "Précédentes" : "Suivantes"} : ${title}`} onClick={()=>scroll.current?.scrollBy({left:direction*(scroll.current.clientWidth*.8),behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"})} className="h-11 w-11 rounded-full border border-neutral-700 grid place-items-center hover:border-[#FFBF00] focus-visible:ring-2 focus-visible:ring-[#FFBF00]">{direction<0 ? <ArrowLeft size={18}/> : <ArrowRight size={18}/>}</button>)}
      </div>
    </div>
    <div ref={scroll} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3">
      {podcasts.map(podcast=><Link key={podcast.id} href={`/podcasts/${podcast.slug}`} className="group w-40 sm:w-48 shrink-0 snap-start focus-visible:ring-2 focus-visible:ring-[#FFBF00] rounded-xl">
        <div className="aspect-square overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800"><Cover src={podcast.cover} className="w-full h-full transition-transform motion-reduce:transition-none group-hover:scale-105"/></div>
        <h3 className="font-semibold text-sm mt-3 line-clamp-2 group-hover:text-[#FFBF00]">{podcast.name}</h3>
        <p className="text-xs text-neutral-400 mt-1">{podcast.primaryLanguage?.name || podcast.country?.name || "Podcast"}{podcast._count?.episodes > 0 && ` · ${podcast._count.episodes} épisodes`}</p>
      </Link>)}
    </div>
  </section>;
}
function HomeSkeleton(){return <div className="max-w-7xl mx-auto p-5 space-y-8 animate-pulse motion-reduce:animate-none" aria-label="Chargement de la découverte"><div className="h-80 rounded-3xl bg-neutral-900"/><div className="grid grid-cols-2 md:grid-cols-6 gap-4">{Array.from({length:6},(_,i)=><div key={i} className="aspect-square rounded-2xl bg-neutral-900"/>)}</div></div>;}

export default function HomePage() {
  const {user,isAuthenticated,isLoading:authLoading}=useAuthStore();
  const connected=isAuthenticated && !authLoading;
  const {playEpisode,currentEpisode,isPlaying,togglePlay}=usePlayerStore();
  const [category,setCategory]=useState("all");
  const [format,setFormat]=useState("all");
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState<Set<string>>(new Set());
  const locks=useRef(new Set<string>());
  const {data,isLoading,error,mutate}=useSWR("/home?country=all",async url=>(await fetchApi(url)).data,{dedupingInterval:60000,revalidateOnFocus:false});
  const {data:savedData,mutate:mutateSaved}=useSWR(connected ? ["/me/saved",user?.id] : null,async ([url])=>list((await fetchApi(url)).data));
  const {data:resumeData}=useSWR(connected ? ["/me/continue-listening",user?.id] : null,async ([url])=>list((await fetchApi(url)).data));
  const saved=connected ? list(savedData) : [];
  const shelves:Shelf[]=list(data?.categoryShelves);
  const activeShelf=shelves.find(shelf=>shelf.id===category);
  const allEpisodes=list(data?.latestEpisodes);
  const matches=(ep:any)=> (category==="all" || list(ep.podcast?.categories).some(item=>item.categoryId===category || item.category?.id===category)) && (format==="all" || sources(ep).some(source=>source.type===format));
  const episodes=allEpisodes.filter(matches);
  const hero=category==="all" && format==="all" ? data?.heroEpisode : episodes[0];
  const listen=(ep:any,at=0)=> {
    if(!sources(ep).length){setMessage("La source de cet épisode est momentanément indisponible.");return;}
    if(currentEpisode?.id===ep.id){togglePlay();return;}
    playEpisode(toPlayerEpisode(ep,ep.podcast),format==="VIDEO" ? "VIDEO" : sources(ep).some(source=>source.type==="AUDIO") ? "AUDIO" : "VIDEO",at);
  };
  const save=async(ep:any)=> {
    if(!connected){setMessage("Connectez-vous pour enregistrer vos épisodes.");return;}
    if(locks.current.has(ep.id)) return;
    locks.current.add(ep.id);setSaving(previous=>new Set(previous).add(ep.id));
    const wasSaved=saved.some(item=>item.episodeId===ep.id);
    try {
      await fetchApi(`/episodes/${ep.id}/save`,{method:wasSaved ? "DELETE" : "POST"});
      await mutateSaved(previous=>wasSaved ? list(previous).filter(item=>item.episodeId!==ep.id) : [...list(previous),{episodeId:ep.id,episode:ep}],{revalidate:false});
      setMessage(wasSaved ? "Épisode retiré de vos favoris." : "Épisode enregistré dans votre bibliothèque.");
    }catch{setMessage("Impossible d’enregistrer cet épisode. Réessayez.");}
    finally{locks.current.delete(ep.id);setSaving(previous=>{const next=new Set(previous);next.delete(ep.id);return next;});}
  };
  const episodeRows=(items:any[])=> <div className="grid md:grid-cols-2 gap-3">{items.map(ep=><article key={ep.id} className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-600">
    <button onClick={()=>listen(ep)} disabled={!sources(ep).length} aria-label={`${currentEpisode?.id===ep.id && isPlaying ? "Pause" : "Lire"} : ${ep.title}`} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden group focus-visible:ring-2 focus-visible:ring-[#FFBF00]">
      <Cover src={ep.cover || ep.podcast?.cover} className="w-full h-full"/><span className="absolute inset-0 bg-black/35 grid place-items-center"><span className="w-9 h-9 rounded-full bg-[#FFBF00] text-black grid place-items-center">{currentEpisode?.id===ep.id && isPlaying ? <Pause size={16}/> : <Play size={16}/>}</span></span>
    </button><div className="min-w-0 flex-1"><Link href={`/podcasts/${ep.podcast.slug}`} className="text-xs text-[#FFBF00] line-clamp-1">{ep.podcast.name}</Link><Link href={episodePath(ep)} className="block font-semibold text-sm line-clamp-2 mt-1 hover:underline">{ep.title}</Link><p className="text-xs text-neutral-400 mt-2 flex items-center gap-2">{sources(ep).some(source=>source.type==="VIDEO") ? <Video size={13}/> : <Headphones size={13}/>} {formatDuration(ep.durationSeconds) || "Découvrir"}{ep.publishedAt && ` · ${new Date(ep.publishedAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}`}</p></div>
    <button aria-label={`${saved.some(item=>item.episodeId===ep.id) ? "Retirer des favoris" : "Enregistrer"} : ${ep.title}`} disabled={saving.has(ep.id)} onClick={()=>void save(ep)} className="h-11 w-11 shrink-0 grid place-items-center rounded-full text-neutral-400 hover:text-[#FFBF00] focus-visible:ring-2 focus-visible:ring-[#FFBF00] disabled:opacity-40">{saved.some(item=>item.episodeId===ep.id) ? <BookmarkCheck size={19}/> : <Bookmark size={19}/>}</button>
  </article>)}</div>;
  if(isLoading) return <HomeSkeleton/>;
  if(error || !data) return <div className="p-8 text-center space-y-4"><h1 className="text-xl font-bold">La découverte est momentanément indisponible</h1><button onClick={()=>void mutate()} className="rounded-full bg-[#FFBF00] text-black px-6 py-3">Réessayer</button></div>;
  return <main className="max-w-7xl mx-auto px-4 md:px-7 py-6 space-y-10 md:space-y-14 pb-28 text-white">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[#FFBF00] text-xs uppercase tracking-widest font-semibold mb-2">Bamako Podcast · Découverte</p><h1 className="text-3xl md:text-4xl font-bold tracking-tight">Des voix à découvrir. Des histoires à vivre.</h1><p className="text-neutral-400 mt-3 text-sm md:text-base">Explorez les émissions, écoutez les nouveautés et trouvez votre prochain rendez-vous.</p></div><Link href="/explore" className="flex items-center gap-2 text-sm border border-neutral-700 rounded-full px-5 py-3 hover:border-[#FFBF00]">Tout explorer <ArrowRight size={16}/></Link></header>
    {shelves.length>0 && <nav aria-label="Catégories" className="flex gap-2 overflow-x-auto pb-2"><button onClick={()=>setCategory("all")} aria-pressed={category==="all"} className={`shrink-0 px-5 py-3 rounded-full text-sm border ${category==="all" ? "bg-[#FFBF00] border-[#FFBF00] text-black font-bold" : "border-neutral-700 hover:border-neutral-400"}`}>Tout découvrir</button>{shelves.map(shelf=><button key={shelf.id} onClick={()=>setCategory(shelf.id)} aria-pressed={category===shelf.id} className={`shrink-0 px-5 py-3 rounded-full text-sm border ${category===shelf.id ? "bg-[#FFBF00] border-[#FFBF00] text-black font-bold" : "border-neutral-700 hover:border-neutral-400"}`}>{shelf.name} <span className="opacity-60 ml-1">{shelf.count}</span></button>)}</nav>}
    {hero && <section className="relative rounded-3xl overflow-hidden border border-neutral-800 min-h-[380px] md:min-h-[440px] bg-neutral-900 flex items-end">
      <Cover src={hero.cover || hero.podcast?.cover} eager className="absolute inset-0 w-full h-full opacity-40"/><div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"/>
      <div className="relative p-6 md:p-10 max-w-3xl"><span className="inline-flex gap-2 items-center text-[#FFBF00] text-xs uppercase tracking-widest font-bold"><Sparkles size={15}/> {activeShelf ? activeShelf.name : "À la une"}</span><p className="text-sm text-neutral-300 mt-4">{hero.podcast.name}</p><h2 className="text-2xl md:text-4xl font-bold leading-tight mt-2 line-clamp-3">{hero.title}</h2><p className="text-sm text-neutral-300 line-clamp-2 mt-4">{String(hero.description || "").replace(/<[^>]*>/g," ")}</p><div className="flex flex-wrap gap-3 mt-6"><button disabled={!sources(hero).length} onClick={()=>listen(hero)} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FFBF00] text-black font-bold disabled:opacity-50">{currentEpisode?.id===hero.id && isPlaying ? <Pause size={18}/> : <Play size={18}/>} {currentEpisode?.id===hero.id && isPlaying ? "Mettre en pause" : "Lancer la lecture"}</button><Link href={episodePath(hero)} className="px-6 py-3 rounded-full border border-neutral-600 hover:bg-white/10 text-sm">Voir l’épisode</Link></div></div>
    </section>}
    {connected && category==="all" && list(resumeData).length>0 && <section className="space-y-4"><h2 className="text-xl font-bold">Reprendre votre écoute</h2><div className="flex gap-3 overflow-x-auto pb-2">{list(resumeData).slice(0,4).map(item=>{const ep=item.episode || item;return ep.podcast && <button key={ep.id} onClick={()=>listen(ep,item.positionSeconds || item.lastPositionSeconds || 0)} className="text-left flex gap-3 items-center min-w-64 rounded-2xl bg-neutral-900 p-4 border border-neutral-800"><Cover src={ep.cover || ep.podcast.cover} className="w-12 h-12 rounded-lg"/><span className="min-w-0"><span className="block text-xs text-[#FFBF00]">Continuer l’écoute</span><span className="text-sm line-clamp-2">{ep.title}</span></span><Play size={18} className="shrink-0"/></button>;})}</div></section>}
    <section className="space-y-5"><div className="flex flex-wrap gap-4 items-center justify-between"><div><h2 className="text-xl md:text-2xl font-bold">{activeShelf ? `Nouveautés · ${activeShelf.name}` : "Fraîchement publiés"}</h2><p className="text-sm text-neutral-400 mt-1">Les derniers épisodes à écouter ou à regarder.</p></div><div className="flex gap-1 p-1 bg-neutral-900 rounded-full" role="group" aria-label="Format des épisodes">{[["all","Tous"],["AUDIO","Audio"],["VIDEO","Vidéo"]].map(([value,label])=><button key={value} onClick={()=>setFormat(value)} aria-pressed={format===value} className={`px-4 py-2.5 text-sm rounded-full ${format===value ? "bg-neutral-700 text-white" : "text-neutral-400"}`}>{label}</button>)}</div></div>{episodes.length ? episodeRows(episodes.slice(0,8)) : <div className="p-6 rounded-2xl border border-neutral-800 text-neutral-400">Aucune nouveauté dans ce format. Explorez les émissions ci-dessous ou choisissez un autre filtre.</div>}</section>
    {category==="all" && <PodcastShelf title="Tendances du moment" subtitle="Des émissions à découvrir dans le catalogue." podcasts={list(data.trending).slice(0,12)} href="/explore"/>}
    {category==="all" && list(data.sections).map(section=>{const podcasts=list(section.items).map(item=>item.podcast).filter(Boolean);const editorialEpisodes=list(section.items).map(item=>item.episode).filter(Boolean);return <div key={section.id} className="space-y-5">{podcasts.length>0 && <PodcastShelf title={section.title || section.name || "La sélection de la rédaction"} subtitle={section.subtitle} podcasts={podcasts}/>} {editorialEpisodes.length>0 && <section className="space-y-5">{!podcasts.length && <h2 className="text-xl font-bold">{section.title || section.name || "À découvrir"}</h2>}{episodeRows(editorialEpisodes.slice(0,6))}</section>}</div>;})}
    {(activeShelf ? [activeShelf] : shelves.slice(0,6)).map(shelf=><PodcastShelf key={shelf.id} title={shelf.name} subtitle={`${shelf.count} émission${shelf.count>1 ? "s" : ""} à explorer`} podcasts={shelf.podcasts} href={`/explore?category=${encodeURIComponent(shelf.slug)}`}/>)}
    {!hero && !shelves.length && !list(data.trending).length && <section className="rounded-3xl p-10 bg-neutral-900 text-center"><Radio className="mx-auto text-[#FFBF00] mb-4"/><h2 className="text-xl font-bold">Les prochaines voix arrivent bientôt</h2><p className="text-neutral-400 mt-3">Retrouvez ici les émissions dès leur publication.</p></section>}
    <section className="rounded-3xl border border-[#FFBF00]/20 bg-gradient-to-r from-[#FFBF00]/10 to-neutral-900 p-6 md:p-9 flex flex-wrap gap-6 justify-between items-center"><div className="flex gap-4 items-center"><Mic className="text-[#FFBF00] shrink-0" size={32}/><div><h2 className="text-xl font-bold">Votre voix a sa place ici.</h2><p className="text-sm text-neutral-400 mt-2">Créez votre émission et partagez vos épisodes.</p></div></div><Link href="/studio" className="rounded-full bg-[#FFBF00] text-black px-6 py-3 font-bold text-sm">Ouvrir mon studio</Link></section>
    <DownloadAppSection/>
    {message && <div role="status" className="fixed bottom-28 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 rounded-2xl border border-neutral-600 bg-neutral-900 shadow-xl p-4 flex items-center gap-4 text-sm">{message}<button onClick={()=>setMessage("")} aria-label="Fermer le message" className="ml-auto p-2">×</button></div>}
  </main>;
}

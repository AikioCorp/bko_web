"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWRInfinite from "swr/infinite";
import useSWR from "swr";
import { Search } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { PodcastCard } from "@/components/public/cards";

function ExploreContent(){
  const params=useSearchParams();
  const category=params.get("category") || "";
  const [input,setInput]=useState(params.get("q") || "");
  const [query,setQuery]=useState(params.get("q") || "");
  const {data:referential}=useSWR("/explore",async url=>(await fetchApi(url)).data,{revalidateOnFocus:false});
  const {data,error,isLoading,size,setSize,isValidating}=useSWRInfinite((page,previous)=>{
    if(previous && !previous.hasMore) return null;
    const search=new URLSearchParams({limit:"20"});
    if(category) search.set("category",category);
    if(query.trim()) search.set("q",query.trim());
    if(page && previous?.nextCursor) search.set("cursor",previous.nextCursor);
    return `/podcasts?${search}`;
  },async url=>{const result=(await fetchApi(url)).data;return {items:result?.data || [],...result?.pagination};},{revalidateOnFocus:false});
  const podcasts=Array.from(new Map((data || []).flatMap(page=>page?.items || page?.podcasts || []).map((item:any)=>[item.id,item])).values()) as any[];
  const categories=Array.isArray(referential?.categories) ? referential.categories : [];
  const name=categories.find((item:any)=>item.slug===category)?.name;
  return <main className="max-w-7xl mx-auto p-4 md:p-8 pb-28 space-y-8 text-white">
    <header><Link href="/" className="text-sm text-neutral-400 hover:text-white">← Retour à la découverte</Link><h1 className="text-3xl font-bold mt-5">{name || "Explorez les émissions"}</h1><p className="text-neutral-400 mt-2">Parcourez le catalogue et trouvez les voix qui vous parlent.</p></header>
    <form onSubmit={event=>{event.preventDefault();setQuery(input);void setSize(1);}} className="flex gap-2"><label htmlFor="catalog-search" className="sr-only">Rechercher une émission</label><input id="catalog-search" value={input} onChange={event=>setInput(event.target.value)} placeholder="Nom de l’émission ou mot-clé" className="min-w-0 flex-1 rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FFBF00]"/><button className="flex gap-2 items-center rounded-xl px-5 py-3 bg-[#FFBF00] text-black font-semibold"><Search size={18}/><span className="hidden sm:inline">Rechercher</span></button></form>
    <nav aria-label="Catégories du catalogue" className="flex flex-wrap gap-2"><Link href="/explore" className={`rounded-full border px-4 py-2 text-sm ${!category ? "border-[#FFBF00] text-[#FFBF00]" : "border-neutral-700"}`}>Toutes</Link>{categories.map((item:any)=><Link key={item.id} href={`/explore?category=${encodeURIComponent(item.slug)}`} className={`rounded-full border px-4 py-2 text-sm ${category===item.slug ? "border-[#FFBF00] text-[#FFBF00]" : "border-neutral-700 hover:border-neutral-400"}`}>{item.name}</Link>)}</nav>
    {error && <p role="alert">Le catalogue est indisponible. Réessayez dans quelques instants.</p>}
    {isLoading ? <p role="status">Chargement des émissions…</p> : <><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">{podcasts.map(p=><PodcastCard key={p.id} p={p}/>)}</div>{!podcasts.length && !error && <p className="p-8 rounded-2xl border border-neutral-800 text-neutral-400">Aucune émission pour ces critères. Essayez une autre catégorie ou un autre mot-clé.</p>}{data?.[data.length-1]?.hasMore && <button disabled={isValidating} onClick={()=>void setSize(size+1)} className="block mx-auto rounded-full px-6 py-3 border border-neutral-600 hover:border-[#FFBF00] disabled:opacity-50">{isValidating ? "Chargement…" : "Voir plus d’émissions"}</button>}</>}
  </main>;
}
export default function ExplorePage(){return <Suspense fallback={<p className="p-8">Chargement…</p>}><ExploreContent/></Suspense>;}

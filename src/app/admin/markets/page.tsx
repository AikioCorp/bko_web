"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import { AdminAction } from "@/components/admin/AdminAccess";
export default function MarketsPage(){
 const {data,error,mutate}=useSWR("/admin/markets",url=>fetchApi(url).then(r=>r.data));
 const [failure,setFailure]=useState(""),[busy,setBusy]=useState("");
 async function change(code:string,action:string){if(!confirm(action==="activate"?"Activer les inscriptions et la publication sur ce marché ?":"Suspendre la création et la publication sur ce marché ?"))return;setBusy(code);setFailure("");try{await fetchApi(`/admin/markets/${code}/${action}`,{method:"POST"});await mutate();}catch(e:any){setFailure(e.message);}finally{setBusy("");}}
 return <section className="max-w-5xl"><h1 className="text-2xl font-bold">Marchés</h1><p className="mt-2 text-sm text-white/60">Disponibilité du catalogue et de la publication par pays.</p>{(failure||error)&&<p role="alert" className="my-4 text-sm text-red-400">{failure||"Impossible de charger les marchés."}</p>}{!data&&!error&&<p className="py-8">Chargement…</p>}<div className="mt-6 divide-y divide-white/10">{data?.map((market:any)=><article key={market.countryId} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><h2 className="font-semibold">{market.country?.name||market.countryId}</h2><p className="mt-1 text-sm text-white/50">{market.status} · {market._count?.creatorAccesses||0} accès créateurs</p></div><AdminAction permission="markets.edit"><div className="flex gap-3">{market.status!=="ACTIVE"&&<button disabled={!!busy} onClick={()=>void change(market.countryId,"activate")} className="rounded-full bg-[#FFBF00] px-4 py-2 text-sm text-black">Activer</button>}{market.status!=="SUSPENDED"&&<button disabled={!!busy} onClick={()=>void change(market.countryId,"suspend")} className="rounded-full border border-white/15 px-4 py-2 text-sm">Suspendre</button>}</div></AdminAction></article>)}</div>{data?.length===0&&<p className="py-8 text-white/50">Aucun marché configuré.</p>}</section>;
}

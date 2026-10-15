"use client";
import { useMemo, useState } from "react";
import useSWR, { mutate } from "swr";
import { fetchApi } from "@/lib/api";
import { AdminAction, useAdminAccess } from "./AdminAccess";
import { hasPermission } from "@/lib/admin-permissions";
type Country={id:string;code:string;name:string};
const fetcher=(url:string)=>fetchApi<Country[]>(url).then(r=>r.data!);

export function CountryManager({onAdded}:{onAdded?:(country:Country)=>void}){
 const {access}=useAdminAccess();
 const {data:catalog,error}=useSWR(hasPermission(access,"markets.edit")?"/admin/countries/catalog":null,fetcher);
 const {data:existing}=useSWR("/countries",fetcher);
 const [search,setSearch]=useState(""),[code,setCode]=useState("BJ"),[busy,setBusy]=useState(false),[failure,setFailure]=useState(""),[success,setSuccess]=useState("");
 const options=useMemo(()=>{const query=search.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();return (catalog||[]).filter(c=>(c.name+" "+c.code).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(query));},[catalog,search]);
 async function add(){if(!code)return;setBusy(true);setFailure("");setSuccess("");try{const r=await fetchApi<Country>("/admin/countries",{method:"POST",body:JSON.stringify({code})});await mutate("/countries");await mutate("/admin/markets");setSuccess(r.data!.name+" est maintenant disponible dans les formulaires.");onAdded?.(r.data!);setFailure("");}catch(e:any){setFailure(e.message);}finally{setBusy(false);}}
 return <AdminAction permission="markets.edit"><div className="mt-4 space-y-3 rounded-xl border border-white/15 p-4"><p className="text-sm font-semibold">Ajouter un pays au catalogue</p><label className="block text-sm text-white/65">Rechercher un pays<input type="search" value={search} onChange={e=>{setSearch(e.target.value);setCode("");}} placeholder="Bénin, Togo, BJ…" className="mt-1 block w-full rounded-lg border border-white/15 bg-[#1A1A1A] px-3 py-2 text-white"/></label><label className="block text-sm text-white/65">Pays<select value={code} onChange={e=>setCode(e.target.value)} className="mt-1 block w-full rounded-lg border border-white/15 bg-[#1A1A1A] px-3 py-2 text-white"><option value="">Choisir un pays</option>{options.map(c=><option key={c.code} value={c.code}>{c.name} ({c.code}){existing?.some(e=>e.code===c.code)?" — déjà disponible":""}</option>)}</select></label>{error&&<p role="alert" className="text-sm text-red-400">Impossible de charger la liste des pays.</p>}{success&&<p role="status" className="text-sm text-[#FFBF00]">{success}</p>}{failure&&<p role="alert" className="text-sm text-red-400">{failure}</p>}<p className="text-xs text-white/50">Cet ajout rend le pays disponible dans les formulaires. L’ouverture du Studio dans ce pays se gère séparément.</p><button type="button" disabled={busy||!code||!catalog} onClick={()=>void add()} className="rounded-full bg-[#FFBF00] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{busy?"Ajout…":"Ajouter ce pays"}</button></div></AdminAction>;
}

export function AdminCountryPicker({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const {data:countries,error}=useSWR("/countries",fetcher);
 const [adding,setAdding]=useState(false);
 return <div className="space-y-2"><label className="block text-sm">Pays de l’émission<select value={value} onChange={e=>onChange(e.target.value)} className="ml-3 rounded-lg border border-white/15 bg-[#222] p-2"><option value="">Choisir un pays</option>{countries?.slice().sort((a,b)=>a.name.localeCompare(b.name,"fr")).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>{error&&<p role="alert" className="text-sm text-red-400">Impossible de charger les pays. Actualisez avant de continuer.</p>}<AdminAction permission="markets.edit"><button type="button" onClick={()=>setAdding(v=>!v)} className="text-sm text-[#FFBF00]">{adding?"Masquer":"Pays manquant ? Ajouter un pays"}</button></AdminAction>{adding&&<CountryManager onAdded={country=>{onChange(country.id);setAdding(false);}}/>}</div>;
}

"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { fetchApi } from "@/lib/api";

export function SupportWorkspace({admin=false}:{admin?:boolean}) {
  const user=useAuthStore(s=>s.user);
  const canEdit=!!user?.roles?.includes("SUPER_ADMIN") || !!user?.permissions?.includes("support.edit");
  const [items,setItems]=useState<any[]>([]),[ticket,setTicket]=useState<any>(null);
  const [error,setError]=useState(""),[busy,setBusy]=useState(false),[body,setBody]=useState("");
  const [page,setPage]=useState(1),[total,setTotal]=useState(0),[filter,setFilter]=useState("");
  const [key,setKey]=useState("");
  const prefix=admin?"/admin/support-tickets":"/support/tickets";
  async function loadList(){
    try {const r=await fetchApi(admin?`${prefix}?page=${page}&status=${filter}`:"/me/support-tickets");setItems(r.data.items);setTotal(r.data.total || r.data.items.length);}
    catch(e:any){if(admin || e.status!==401)setError(e.message);}
  }
  async function open(id:string,k=key){
    setError("");try {const stored=k || localStorage.getItem(`bko-support-${id}`)||"";setKey(stored);const r=await fetchApi(`${prefix}/${encodeURIComponent(id)}`,{headers:{"X-Support-Key":stored}});setTicket(r.data);}catch(e:any){setError(e.message);}
  }
  useEffect(()=>{void loadList();},[page,filter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{const id=new URLSearchParams(location.search).get("ticket");const k=new URLSearchParams(location.hash.slice(1)).get("key")||"";if(id){if(k){localStorage.setItem(`bko-support-${id}`,k);history.replaceState(null,"",location.pathname+location.search);}void open(id,k);}},[]); // eslint-disable-line react-hooks/exhaustive-deps
  async function create(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const form=new FormData(e.currentTarget);
    try{const r=await fetchApi("/support/tickets",{method:"POST",body:JSON.stringify(Object.fromEntries(form))});localStorage.setItem(`bko-support-${r.data.id}`,r.data.accessToken);setKey(r.data.accessToken);await open(r.data.id,r.data.accessToken);await loadList();}catch(e:any){setError(e.message);}finally{setBusy(false);}
  }
  async function update(status?:string){setBusy(true);setError("");try{await fetchApi(`${prefix}/${ticket.id}/messages`,{method:"POST",headers:{"X-Support-Key":key},body:JSON.stringify(status?{status}:{body})});setBody("");await open(ticket.id);await loadList();}catch(e:any){setError(e.message);}finally{setBusy(false);}}
  const input="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-white focus:outline-none focus:border-yellow-400";
  return <main className="mx-auto max-w-5xl p-5 text-white md:p-8"><h1 className="text-2xl font-bold">{admin?"Assistance · Tickets":"Aide et assistance"}</h1><p className="mt-2 text-sm text-white/60">Suivez les échanges ici. Chaque réponse et changement de statut fait l’objet d’un email.</p>
    {error&&<p role="alert" className="my-4 text-sm text-red-400">{error}</p>}
    <button type="button" disabled={busy} onClick={()=>{void loadList();if(ticket)void open(ticket.id);}} className="mt-4 text-sm text-yellow-400">Actualiser les échanges</button>
    <div className="mt-7 grid gap-8 md:grid-cols-[280px_1fr]"><aside>
      {!admin&&<button className="mb-4 rounded-full bg-yellow-400 px-5 py-3 font-semibold text-black" onClick={()=>{setTicket(null);setError("");}}>Nouvelle demande</button>}
      {admin&&<label className="block mb-4 text-sm">Statut<select className={input} value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}><option value="">Tous</option><option value="OPEN">Ouverts</option><option value="CLOSED">Fermés</option></select></label>}
      <div className="divide-y divide-white/10">{items.map(t=><button key={t.id} onClick={()=>void open(t.id,"")} className="w-full py-4 text-left"><strong className="block text-sm">{t.subject}</strong><span className="text-xs text-white/60">{t.status==="CLOSED"?"Fermé":"Ouvert"} · {new Date(t.updatedAt).toLocaleDateString("fr-FR")}</span></button>)}</div>
      {items.length===0&&<p className="py-4 text-sm text-white/50">Aucun ticket à afficher.</p>}
      {admin&&<div className="flex items-center gap-4 mt-4"><button disabled={page===1} onClick={()=>setPage(p=>p-1)}>Précédent</button><span>{page}</span><button disabled={page*25>=total} onClick={()=>setPage(p=>p+1)}>Suivant</button></div>}
    </aside><section>
      {ticket?<><div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-semibold">{ticket.subject}</h2><p className="text-xs text-white/50 mt-2">{ticket.id} · {ticket.status==="CLOSED"?"Fermé":"Ouvert"}{admin?` · ${ticket.email} · ${ticket.origin}`:""}</p>{admin&&!ticket.userId&&<p className="text-xs text-yellow-400 mt-2">Demande sans session : identité du compte à vérifier avant toute action sensible.</p>}</div>{admin&&canEdit&&<button disabled={busy} onClick={()=>void update(ticket.status==="CLOSED"?"OPEN":"CLOSED")} className="rounded-full border border-white/20 px-4 py-2 text-sm">{ticket.status==="CLOSED"?"Rouvrir":"Fermer le ticket"}</button>}</div>
        <div className="my-6 space-y-5">{ticket.messages?.map((m:any)=><article key={m.id} className={`rounded-xl p-4 ${m.kind==="STAFF"?"bg-yellow-400/10":"bg-white/5"}`}><p className="text-xs text-white/50 mb-2">{m.kind==="STAFF"?"Assistance":m.kind==="SYSTEM"?"Statut du ticket":"Demandeur"} · {new Date(m.createdAt).toLocaleString("fr-FR")}</p><p className="whitespace-pre-wrap break-words text-sm">{m.body}</p></article>)}</div>
        {ticket.status!=="CLOSED" && (!admin||canEdit)?<form onSubmit={e=>{e.preventDefault();void update();}}><label className="block text-sm mb-2" htmlFor="reply">Votre réponse</label><textarea id="reply" required maxLength={10000} className={input} value={body} onChange={e=>setBody(e.target.value)} rows={5}/><button disabled={busy||!body.trim()} className="mt-3 rounded-full bg-yellow-400 px-6 py-3 text-black font-semibold disabled:opacity-50">{busy?"Envoi…":"Envoyer la réponse"}</button></form>:<p className="text-sm text-white/60">Ce ticket est fermé. Vous pouvez ouvrir une nouvelle demande.</p>}
      </>:!admin?<form onSubmit={create} className="space-y-4"><h2 className="text-xl font-semibold">Comment pouvons-nous vous aider ?</h2><label className="block text-sm">Email de contact<input type="email" name="email" required maxLength={254} className={input} autoComplete="email"/></label><label className="block text-sm">Sujet<input name="subject" required minLength={3} maxLength={180} className={input}/></label><label className="block text-sm">Catégorie<select name="category" className={input}><option>Général</option><option>Compte suspendu</option><option>Lecture et téléchargements</option><option>Studio et publication</option><option>Abonnement</option></select></label><label className="block text-sm">Votre demande<textarea name="description" required minLength={10} maxLength={10000} rows={6} className={input}/></label><button disabled={busy} className="rounded-full bg-yellow-400 px-6 py-3 font-semibold text-black disabled:opacity-50">{busy?"Envoi…":"Envoyer ma demande"}</button></form>:<p className="text-white/60">Sélectionnez un ticket pour consulter les échanges.</p>}
    </section></div></main>;
}

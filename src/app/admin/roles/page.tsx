"use client";
import { useState } from "react";
import useSWR from "swr";
import { Plus, Pencil, Trash2, Shield, X } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAdminAccess, refreshAdminAccess } from "@/components/admin/AdminAccess";
import { hasPermission } from "@/lib/admin-permissions";

type Role={id:string;name:string;description:string;permissions:string[];isSystem:boolean;isSuperAdmin:boolean;usersCount:number};
type Feature={key:string;label:string;description:string;caps:string[]};
const labels:Record<string,string>={view:"Consulter",create:"Créer",edit:"Modifier / traiter",delete:"Supprimer"};
export default function AdminRolesPage(){
 const {access}=useAdminAccess();
 const can=(p:string)=>hasPermission(access,p);
 const fetcher=(url:string)=>adminApi(url).then(r=>r.data);
 const {data:roles,error,mutate}=useSWR<Role[]>("/admin/roles",fetcher);
 const {data:catalog,error:catalogError}=useSWR<{features:Feature[];templates:any[]}>("/admin/permissions",fetcher);
 const [editing,setEditing]=useState<Role|null|undefined>(undefined);
 const [name,setName]=useState(""),[description,setDescription]=useState(""),[permissions,setPermissions]=useState<string[]>([]);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[failure,setFailure]=useState("");
 const isNew=editing===null;
 const readOnly=!!editing?.isSuperAdmin || !can(isNew?"roles.create":"roles.edit");
 function open(role:Role|null){setEditing(role);setName(role?.name||"");setDescription(role?.description||"");setPermissions(role?.permissions||[]);setFailure("");}
 function toggle(feature:string,cap:string){
  const code=feature+"."+cap;
  setPermissions(prev=>{
   if(prev.includes(code)) return cap==="view"?prev.filter(p=>!p.startsWith(feature+".")):prev.filter(p=>p!==code);
   return Array.from(new Set([...prev,feature+".view",code]));
  });
 }
 async function save(e:React.FormEvent){e.preventDefault();if(readOnly)return;setBusy(true);setFailure("");try{
  await adminApi(isNew?"/admin/roles":"/admin/roles/"+editing!.id,{method:isNew?"POST":"PUT",body:JSON.stringify({name,description,permissions})});
  await mutate();await refreshAdminAccess();setEditing(undefined);setMessage("Les autorisations du rôle ont été enregistrées.");
 }catch(e:any){setFailure(e.message);}finally{setBusy(false);}}
 async function remove(role:Role){if(!confirm('Supprimer le rôle « '+role.name+' » ?'))return;setFailure("");try{await adminApi('/admin/roles/'+role.id,{method:'DELETE'});await mutate();}catch(e:any){setFailure(e.message);}}
 const input="w-full rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#FFBF00] disabled:opacity-60";
 return <div className="max-w-6xl pb-12"><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">Collaborateurs et rôles</h1><p className="mt-2 max-w-2xl text-sm text-white/60">Définissez les autorisations d’un rôle, puis attribuez-le à un collaborateur depuis sa fiche Utilisateur. Les menus et les actions suivent ces droits.</p></div>{can("roles.create")&&<button onClick={()=>open(null)} className="flex items-center gap-2 rounded-full bg-[#FFBF00] px-5 py-3 text-sm font-semibold text-black"><Plus size={16}/>Nouveau rôle</button>}</div>
 {(failure||error||catalogError)&&<p role="alert" className="mt-5 text-sm text-red-400">{failure||"Impossible de charger les rôles ou les autorisations."}</p>}
 {message&&<p role="status" className="mt-5 text-sm text-[#FFBF00]">{message}</p>}
 {!roles?<p className="py-12 text-white/50">Chargement…</p>:<div className="mt-8 divide-y divide-white/10">{roles.map(role=><div key={role.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><h2 className="flex items-center gap-2 font-semibold"><Shield size={17}/>{role.name}{role.isSystem&&<span className="text-xs font-normal text-white/40">Rôle système</span>}</h2><p className="mt-1 text-sm text-white/60">{role.description}</p><p className="mt-2 text-xs text-white/40">{role.isSuperAdmin?"Tous les droits":role.permissions.length+" autorisations"} · {role.usersCount} collaborateurs</p></div><div className="flex items-center gap-3"><button onClick={()=>open(role)} className="flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm"><Pencil size={14}/>{!role.isSuperAdmin&&can("roles.edit")?"Autorisations":"Consulter"}</button>{!role.isSystem&&can("roles.delete")&&<button aria-label={"Supprimer le rôle "+role.name} onClick={()=>void remove(role)} className="p-3 text-red-400"><Trash2 size={17}/></button>}</div></div>)}</div>}
 {editing!==undefined&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3"><section role="dialog" aria-modal="true" aria-labelledby="role-title" className="flex max-h-[90dvh] w-full max-w-4xl flex-col rounded-2xl bg-[#141414] p-5 md:p-7"><div className="flex items-start justify-between gap-4"><h2 id="role-title" className="text-xl font-bold">{isNew?"Créer un rôle":readOnly?"Consulter le rôle":"Modifier les autorisations"}</h2><button aria-label="Fermer" disabled={busy} onClick={()=>setEditing(undefined)} className="p-2"><X size={20}/></button></div>
 <form onSubmit={save} className="mt-5 overflow-y-auto"><div className="grid gap-4 md:grid-cols-2"><label className="text-sm">Nom du rôle<input required maxLength={40} disabled={readOnly||!isNew} className={input} value={name} onChange={e=>setName(e.target.value.toUpperCase().replace(/ /g,"_"))}/></label><label className="text-sm">Description<input maxLength={500} disabled={readOnly} className={input} value={description} onChange={e=>setDescription(e.target.value)}/></label></div>
 {isNew&&catalog?.templates?.length&&<label className="mt-4 block text-sm">Partir d’un modèle<select className={input} defaultValue="" onChange={e=>{const t=catalog.templates.find((t:any)=>t.key===e.target.value);if(t){setName(t.name);setDescription(t.description);setPermissions(t.permissions);}}}><option value="">Personnaliser les droits</option>{catalog.templates.map((t:any)=><option key={t.key} value={t.key}>{t.description}</option>)}</select></label>}
 {editing?.isSuperAdmin?<p className="my-8 text-sm text-[#FFBF00]">Le super administrateur possède tous les droits. Ce rôle est protégé.</p>:<div className="mt-6 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-white/15"><th className="py-3 pr-4">Module</th>{Object.entries(labels).map(([cap,label])=><th key={cap} className="min-w-24 px-2 py-3 text-center font-medium">{label}</th>)}</tr></thead><tbody>{catalog?.features.map(feature=><tr key={feature.key} className="border-b border-white/10"><th className="py-4 pr-4 font-medium"><span>{feature.label}</span><span className="mt-1 block max-w-xs text-xs font-normal text-white/45">{feature.description}</span></th>{Object.keys(labels).map(cap=><td key={cap} className="px-2 text-center">{feature.caps.includes(cap)?<input type="checkbox" aria-label={feature.label+" : "+labels[cap]} checked={permissions.includes(feature.key+"."+cap)} disabled={readOnly||(!access?.isSuperAdmin&&!access?.permissions.includes(feature.key+"."+cap))} onChange={()=>toggle(feature.key,cap)} className="h-5 w-5 accent-[#FFBF00] disabled:opacity-40"/>:<span className="text-white/20">—</span>}</td>)}</tr>)}</tbody></table></div>}
 {failure&&<p role="alert" className="mt-4 text-sm text-red-400">{failure}</p>}<div className="sticky bottom-0 mt-5 flex justify-end gap-3 bg-[#141414] py-4"><button type="button" disabled={busy} onClick={()=>setEditing(undefined)} className="rounded-full border border-white/15 px-5 py-3 text-sm">Fermer</button>{!readOnly&&<button type="submit" disabled={busy||!catalog} className="rounded-full bg-[#FFBF00] px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">{busy?"Enregistrement…":"Enregistrer les autorisations"}</button>}</div></form></section></div>}
 </div>;
}

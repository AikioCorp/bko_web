"use client";
import { createContext, useContext, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { AdminAccess, hasPermission, canVisitAdmin } from "@/lib/admin-permissions";

const AccessContext=createContext<{access?:AdminAccess;loading:boolean;error?:Error;refresh:()=>void}>({loading:true,refresh:()=>{}});
export function AdminAccessProvider({children}:{children:React.ReactNode}) {
  const id=useAuthStore(s=>s.user?.id);
  const authenticated=useAuthStore(s=>s.isAuthenticated);
  const {data,error,isLoading,mutate:refresh}=useSWR<AdminAccess>(authenticated&&id?["admin-access",id]:null,()=>fetchApi<AdminAccess>("/admin/access").then(r=>r.data!),{refreshInterval:30000,revalidateOnFocus:true,shouldRetryOnError:false});
  useEffect(()=>{
    const state=useAuthStore.getState();
    if(data&&state.user&&state.user.id===id&&(JSON.stringify(state.user.permissions)!==JSON.stringify(data.permissions)||JSON.stringify(state.user.roles)!==JSON.stringify(data.roles))) {
      state.updateUser({permissions:data.permissions,roles:data.roles});
    }
  },[data,id]);
  // On errors do not retain stale administrative capabilities.
  return <AccessContext.Provider value={{access:error?undefined:data,loading:isLoading||(!data&&!error),error,refresh:()=>void refresh()}}>{children}</AccessContext.Provider>;
}
export const useAdminAccess=()=>useContext(AccessContext);
export function AdminAction({permission,children}:{permission:string;children:React.ReactNode}) {
  const {access}=useAdminAccess();
  return hasPermission(access,permission)?<>{children}</>:null;
}
export function AdminPageAccess({href,children}:{href:string;children:React.ReactNode}) {
  const {access}=useAdminAccess();
  return canVisitAdmin(access,href.split("?")[0])?<>{children}</>:null;
}
export function refreshAdminAccess(){return mutate(key=>Array.isArray(key)&&key[0]==="admin-access");}

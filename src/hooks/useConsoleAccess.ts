"use client";
import useSWR from "swr";
import { fetchApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { AdminAccess, firstAdminPage } from "@/lib/admin-permissions";
export function useConsoleAccess(){
 const authenticated=useAuthStore(s=>s.isAuthenticated),id=useAuthStore(s=>s.user?.id);
 const {data,error}=useSWR<AdminAccess>(authenticated&&id?["admin-access",id]:null,()=>fetchApi<AdminAccess>("/admin/access").then(r=>r.data!),{refreshInterval:30000,revalidateOnFocus:true,shouldRetryOnError:false});
 const access=authenticated&&!error?data:undefined;
 return {hasConsole:!!access&&(access.isSuperAdmin||access.permissions.length>0),landing:firstAdminPage(access)};
}

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAccess } from "@/components/admin/AdminAccess";
import { firstAdminPage } from "@/lib/admin-permissions";

export default function AdminIndexPage() {
  const {access}=useAdminAccess();
  const router=useRouter();
  useEffect(()=>{if(access)router.replace(firstAdminPage(access));},[access,router]);
  return <p role="status">Ouverture de votre espace…</p>;
}

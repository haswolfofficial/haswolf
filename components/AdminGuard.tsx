"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { hasAdminAccess } from "../lib/admin-access";
import AdminNav from "./AdminNav";
export default function AdminGuard({title,subtitle,children}:{title:string;subtitle?:string;children:React.ReactNode}){
 const router=useRouter();const[ready,setReady]=useState(false);
 useEffect(()=>{void (async()=>{const{data}=await supabase.auth.getUser();if(!data.user){router.replace("/login");return}if(!(await hasAdminAccess(data.user))){router.replace("/");return}setReady(true)})()},[router]);
 if(!ready)return <main className="haswolf-admin-loading">Yönetim paneli hazırlanıyor…</main>;
 return <main className="haswolf-admin-v5"><AdminNav/><section className="haswolf-admin-v5__content"><header className="haswolf-admin-page-head"><div><small>HASWOLF V5.2</small><h1>{title}</h1><p>{subtitle}</p></div><a href="/">Siteye dön</a></header>{children}</section></main>;
}

"use client";
import { useEffect,useState } from "react";
import AdminGuard from "../../../components/AdminGuard";
import { supabase } from "../../../lib/supabase";
export default function Page(){
 const[rows,setRows]=useState<Record<string,unknown>[]>([]);const[error,setError]=useState("");
 useEffect(()=>{async function load(){const{data,error}=await supabase.from("profiles").select("id,nickname,last_seen_at,premium_until").limit(100);if(error)setError(error.message);else setRows((data||[]) as Record<string,unknown>[]);}void load();const c=supabase.channel("admin-online-live").on("postgres_changes",{event:"*",schema:"public",table:"profiles"},()=>void load()).subscribe();return()=>{void supabase.removeChannel(c)}},[]);
 return <AdminGuard title="Online Kullanıcılar" subtitle="Canlı ziyaretçi widget’ının ayrıntılı görünümü."><section className="haswolf-admin-card">{
 error&&<p className="haswolf-admin-error">{error}</p>}<div className="haswolf-admin-responsive-list">{rows.map((row,index)=><article key={String(row.id||index)}>{Object.entries(row).map(([key,value])=><div key={key}><span>{key.replaceAll("_"," ")}</span><b>{value==null?"—":String(value)}</b></div>)}</article>)}{!rows.length&&!error&&<p className="haswolf-admin-empty">Henüz kayıt bulunmuyor.</p>}</div></section></AdminGuard>;
}

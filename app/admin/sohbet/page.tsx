"use client";
import { useEffect,useState } from "react";
import AdminGuard from "../../../components/AdminGuard";
import { supabase } from "../../../lib/supabase";
export default function Page(){
 const[rows,setRows]=useState<Record<string,unknown>[]>([]);const[error,setError]=useState("");
 useEffect(()=>{async function load(){const{data,error}=await supabase.from("chat_rooms").select("id,name,slug,kind,category,slow_mode_seconds,is_active").limit(100);if(error)setError(error.message);else setRows((data||[]) as Record<string,unknown>[]);}void load();const c=supabase.channel("admin-sohbet-live").on("postgres_changes",{event:"*",schema:"public",table:"chat_rooms"},()=>void load()).subscribe();return()=>{void supabase.removeChannel(c)}},[]);
 return <AdminGuard title="Sohbet Yönetimi" subtitle="Odalar, slow mode, yazma/okuma/ses/ekran paylaşımı izinleri."><section className="haswolf-admin-card">{
 error&&<p className="haswolf-admin-error">{error}</p>}<div className="haswolf-admin-responsive-list">{rows.map((row,index)=><article key={String(row.id||index)}>{Object.entries(row).map(([key,value])=><div key={key}><span>{key.replaceAll("_"," ")}</span><b>{value==null?"—":String(value)}</b></div>)}</article>)}{!rows.length&&!error&&<p className="haswolf-admin-empty">Henüz kayıt bulunmuyor.</p>}</div></section></AdminGuard>;
}

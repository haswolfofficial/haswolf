"use client";
import { useEffect,useMemo,useState } from "react";
import { supabase } from "../lib/supabase";
type Row={id:number;query:string;normalized_query:string;result_count:number;created_at:string};
export default function AdminSearchAnalytics(){
 const [rows,setRows]=useState<Row[]>([]);
 useEffect(()=>{let alive=true;async function load(){const {data}=await supabase.from("search_analytics").select("*").order("created_at",{ascending:false}).limit(500);if(alive)setRows((data??[]) as Row[])}load();const c=supabase.channel("search-analytics-live").on("postgres_changes",{event:"INSERT",schema:"public",table:"search_analytics"},load).subscribe();return()=>{alive=false;supabase.removeChannel(c)}},[]);
 const stats=useMemo(()=>{const map=new Map<string,{query:string,count:number,missing:number}>();rows.forEach(r=>{const x=map.get(r.normalized_query)||{query:r.query,count:0,missing:0};x.count++;if(r.result_count===0)x.missing++;map.set(r.normalized_query,x)});return [...map.values()].sort((a,b)=>b.count-a.count)},[rows]);
 return <section className="haswolf-admin-analytics"><header><div><small>CANLI VERİ</small><h2>Arama ve Talep Analitiği</h2></div><span>{rows.length} arama</span></header>
 <div className="haswolf-admin-analytics__grid"><div><h3>En çok arananlar</h3>{stats.slice(0,10).map((x,i)=><p key={x.query}><b>{i+1}</b><span>{x.query}</span><em>{x.count}</em></p>)}</div>
 <div><h3>Bulunamayan ürünler</h3>{stats.filter(x=>x.missing>0).sort((a,b)=>b.missing-a.missing).slice(0,10).map(x=><p key={x.query}><b>!</b><span>{x.query}</span><em>{x.missing}</em></p>)}</div></div>
 </section>;
}

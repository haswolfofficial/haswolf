"use client";
import { useMemo,useState } from "react";
import { supabase } from "../lib/supabase";

type P={id:number;name:string;description:string|null;item_category:string|null;server:string;category:string;price:number};
const intents:Record<string,string[]>={
 "silah":["kılıç","yay","bıçak","silah","weapon"],
 "zırh":["zırh","armor","göğüslük"],
 "yang":["yang","para","milyon","milyar"],
 "dc":["dc","diamond","elmas"],
 "karakter":["hesap","karakter","account","şaman","savaşçı","ninja","sura"]
};
function normalize(s:string){return s.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();}
export default function SmartSearch({products,onPick}:{products:P[];onPick:(p:P)=>void}){
 const [q,setQ]=useState(""); const [open,setOpen]=useState(false);
 const results=useMemo(()=>{
  const n=normalize(q); if(n.length<2)return [];
  const expanded=new Set([n]);
  Object.entries(intents).forEach(([k,terms])=>{if(terms.some(t=>n.includes(normalize(t)))){expanded.add(k);terms.forEach(t=>expanded.add(normalize(t)));}});
  return products.map(p=>{
   const hay=normalize([p.name,p.description,p.item_category,p.server,p.category].filter(Boolean).join(" "));
   let score=0; expanded.forEach(term=>{if(hay.includes(term))score+=term===n?8:3;});
   if(normalize(p.name).startsWith(n))score+=10;
   return {p,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.p);
 },[q,products]);

 async function logSearch(){
  const n=normalize(q); if(n.length<2)return;
  const {data:{user}}=await supabase.auth.getUser();
  let guest=localStorage.getItem("haswolf_guest_key");
  if(!guest){guest=crypto.randomUUID();localStorage.setItem("haswolf_guest_key",guest);}
  await supabase.from("search_analytics").insert({
   query:q,normalized_query:n,result_count:results.length,user_id:user?.id??null,guest_key:user?null:guest
  });
 }
 return <div className="haswolf-smart-search">
  <div className="haswolf-smart-search__box">
   <span>⌕</span>
   <input value={q} onFocus={()=>setOpen(true)} onChange={e=>{setQ(e.target.value);setOpen(true)}} onKeyDown={e=>{if(e.key==="Enter")logSearch()}} placeholder="AI destekli ürün ara: 90 level savaşçı itemi…" />
   {q&&<button onClick={()=>setQ("")}>×</button>}
  </div>
  {open&&q.length>=2&&<div className="haswolf-smart-search__results">
   <header><strong>Akıllı sonuçlar</strong><small>{results.length} eşleşme</small></header>
   {results.map(p=><button key={p.id} onClick={()=>{onPick(p);logSearch();setOpen(false)}}>
    <span><strong>{p.name}</strong><small>{p.server} · {p.category}</small></span>
    <b>{p.price.toLocaleString("tr-TR")} {p.category==="dc"?"M":"TL"}</b>
   </button>)}
   {!results.length&&<div className="haswolf-search-empty"><b>Sonuç bulunamadı</b><span>Bu arama admin panelinde “bulunamayan ürünler” listesine kaydedildi.</span><button onClick={logSearch}>Aramayı Kaydet</button></div>}
  </div>}
 </div>;
}

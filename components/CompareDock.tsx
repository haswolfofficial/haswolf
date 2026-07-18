"use client";
import { useEffect,useState } from "react";
type P={id:number;name:string;price:number;server:string;category:string;stock:number;delivery_time?:string|null;image_url?:string|null};
const KEY="haswolf_compare_v1";
export default function CompareDock(){
 const [items,setItems]=useState<P[]>([]); const [open,setOpen]=useState(false);
 useEffect(()=>{
  const load=()=>setItems(JSON.parse(localStorage.getItem(KEY)||"[]"));
  load(); window.addEventListener("haswolf:compare",load); return()=>window.removeEventListener("haswolf:compare",load);
 },[]);
 function clear(){localStorage.removeItem(KEY);setItems([]);setOpen(false);window.dispatchEvent(new Event("haswolf:compare"))}
 if(!items.length)return null;
 return <><div className="haswolf-compare-dock"><span><b>{items.length}</b> ürün seçildi</span><button onClick={()=>setOpen(true)}>Hızlı Karşılaştır</button><button onClick={clear}>Temizle</button></div>
 {open&&<div className="haswolf-compare-modal" role="dialog" aria-modal="true"><div>
  <header><div><small>HASWOLF</small><h2>Ürün Karşılaştırma</h2></div><button onClick={()=>setOpen(false)}>×</button></header>
  <div className="haswolf-compare-grid">{items.map(p=><article key={p.id}><h3>{p.name}</h3><dl>
   <div><dt>Sunucu</dt><dd>{p.server}</dd></div><div><dt>Market</dt><dd>{p.category}</dd></div>
   <div><dt>Fiyat</dt><dd>{p.price.toLocaleString("tr-TR")} {p.category==="dc"?"M":"TL"}</dd></div>
   <div><dt>Teslimat</dt><dd>{p.delivery_time||"1 saat"}</dd></div><div><dt>Stok</dt><dd>{p.stock}</dd></div>
  </dl></article>)}</div>
 </div></div>}</>;
}

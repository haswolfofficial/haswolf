"use client";
import { useEffect, useMemo, useState } from "react";

type Deal = { id:number; name:string; price:number; old_price:number|null; server:string; category:"item"|"yang"|"dc"|"account" };
export default function FlashSaleNotification({ deals }:{ deals:Deal[] }) {
  const eligible = useMemo(()=>deals.filter(d=>d.old_price && d.old_price>d.price),[deals]);
  const [index,setIndex]=useState(0); const [visible,setVisible]=useState(false);
  useEffect(()=>{ if(!eligible.length)return; const first=setTimeout(()=>setVisible(true),2500); const cycle=setInterval(()=>{setVisible(false);setTimeout(()=>{setIndex(i=>(i+1)%eligible.length);setVisible(true)},500)},14000); return()=>{clearTimeout(first);clearInterval(cycle)}},[eligible.length]);
  if(!eligible.length) return null; const d=eligible[index%eligible.length]; const pct=Math.round(((d.old_price!-d.price)/d.old_price!)*100); const unit=d.category==="dc"?"M":"TL";
  return <aside className={`haswolf-sale-toast ${visible?"is-visible":""}`} aria-live="polite">
    <button onClick={()=>setVisible(false)} aria-label="Bildirimi kapat">×</button><span className="haswolf-sale-toast__eyebrow">İNDİRİMMM! 🔥</span>
    <strong>{d.name}</strong><small>{d.server}</small><div><del>{d.old_price!.toLocaleString("tr-TR")} {unit}</del><b>{d.price.toLocaleString("tr-TR")} {unit}</b><em>%{pct}</em></div>
  </aside>;
}

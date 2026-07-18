"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PremiumBenefits(){
 const [open,setOpen]=useState(false); const [tier,setTier]=useState("normal"); const [until,setUntil]=useState<string|null>(null); const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{let alive=true; async function load(){const {data:{user}}=await supabase.auth.getUser(); if(!user)return; const {data}=await supabase.from("profiles").select("premium_tier,premium_until").eq("id",user.id).maybeSingle(); if(alive){setTier(data?.premium_tier||"normal");setUntil(data?.premium_until||null)}} void load(); return()=>{alive=false}},[]);
 useEffect(()=>{const close=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false)};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[]);
 const premium=tier!=="normal"&&(!until||new Date(until)>new Date());
 return <div ref={root} className="haswolf-premium-root"><button type="button" onClick={()=>setOpen(v=>!v)} className={premium?"haswolf-premium-trigger is-premium":"haswolf-premium-trigger"}><span>🔥</span><b>Premium</b>{premium&&<em>{tier}</em>}</button>{open&&<aside className="haswolf-premium-panel"><header><div><small>HASWOLF ELITE</small><h2>Premium Üyelik</h2></div><button onClick={()=>setOpen(false)}>×</button></header><div className="haswolf-premium-hero"><span>🔥</span><div><strong>{premium?`${tier.toUpperCase()} AKTİF`:"Premium Dünyasına Katıl"}</strong><small>{until?`${new Date(until).toLocaleDateString("tr-TR")} tarihine kadar`:"Hesabına özel avantajlar"}</small></div></div><ul><li>Altın ve alevli profil çerçevesi</li><li>Özel sohbet ve lonca rozeti</li><li>Öncelikli destek ve kampanyalar</li><li>Daha fazla favori ve fiyat alarmı</li><li>Premium etkinlik ve çekilişleri</li></ul><a href="/hesabim">Üyeliğimi görüntüle</a></aside>}</div>
}

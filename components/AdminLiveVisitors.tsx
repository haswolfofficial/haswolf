"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type Presence = { userId?: string|null; anonymous?: boolean; device?: string };

export default function AdminLiveVisitors({ enabled }: { enabled: boolean }) {
  const [items,setItems]=useState<Presence[]>([]);
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    if(!enabled)return;
    const channel=supabase.channel("haswolf-site-visitors-view");
    const sync=()=>{
      const state=channel.presenceState<Presence>();
      setItems(Object.values(state).flat());
    };
    channel.on("presence",{event:"sync"},sync).on("presence",{event:"join"},sync).on("presence",{event:"leave"},sync).subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[enabled]);
  const stats=useMemo(()=>({
    total:items.length,
    guests:items.filter(x=>x.anonymous).length,
    members:items.filter(x=>!x.anonymous).length,
    mobile:items.filter(x=>x.device==="mobile").length,
  }),[items]);
  if(!enabled)return null;
  return <aside className={`haswolf-admin-live ${open?"is-open":""}`} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
    <button type="button" onClick={()=>setOpen(v=>!v)}><span className="haswolf-live-dot"/><b>{stats.total}</b><span>Online</span></button>
    <div><header><small>SADECE ADMIN</small><strong>Canlı Ziyaretçiler</strong></header>
      <p><span>Toplam</span><b>{stats.total}</b></p><p><span>Üye</span><b>{stats.members}</b></p>
      <p><span>Misafir</span><b>{stats.guests}</b></p><p><span>Mobil</span><b>{stats.mobile}</b></p>
      <a href="/admin/online">Detayları aç →</a>
    </div>
  </aside>;
}

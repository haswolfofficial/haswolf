"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

type Product = { id:number; name:string; server:"EPHESUS"|"PERGAMON"|"TEOS"; image_url:string|null; category:string; stock:number; is_active:boolean };
type Auction = { id:string; title:string; server:string; current_price:number; starts_at:string; ends_at:string; status:string; product_id:number };

export default function AdminMezatPage() {
  const [products,setProducts]=useState<Product[]>([]);
  const [auctions,setAuctions]=useState<Auction[]>([]);
  const [authorized,setAuthorized]=useState(false);
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({
    productId:"",
    title:"",
    description:"",
    server:"EPHESUS",
    startPrice:"5000",
    minIncrement:"250",
    startsAt:"",
    endsAt:"",
    extensionSeconds:"30",
    maxExtensionSeconds:"300",
  });

  useEffect(() => {
    (async()=>{
      const {data:{user}}=await supabase.auth.getUser();
      if (!user) return;
      const {data:admin}=await supabase.from("admin_members").select("user_id").eq("user_id",user.id).maybeSingle();
      setAuthorized(Boolean(admin) || user.email?.toLowerCase()==="haswolf666@gmail.com");
      const {data}=await supabase.from("products").select("id,name,server,image_url,category,stock,is_active").eq("is_active",true).order("created_at",{ascending:false}).limit(300);
      setProducts((data??[]) as Product[]);
      const {data:rows}=await supabase.from("auctions").select("id,title,server,current_price,starts_at,ends_at,status,product_id").order("created_at",{ascending:false}).limit(100);
      setAuctions((rows??[]) as Auction[]);
    })();
  }, []);

  async function createAuction(event:FormEvent) {
    event.preventDefault();
    setMessage("");
    const {data:{session}}=await supabase.auth.getSession();
    if (!session) { setMessage("Admin hesabıyla giriş yapmalısın."); return; }
    setSaving(true);
    const response=await fetch("/api/mezat/create",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},
      body:JSON.stringify({
        ...form,
        productId:Number(form.productId),
        startPrice:Number(form.startPrice),
        minIncrement:Number(form.minIncrement),
        extensionSeconds:Number(form.extensionSeconds),
        maxExtensionSeconds:Number(form.maxExtensionSeconds),
        startsAt:new Date(form.startsAt).toISOString(),
        endsAt:new Date(form.endsAt).toISOString(),
      }),
    });
    const result=await response.json();
    setSaving(false);
    setMessage(result.error || (response.ok ? "✅ Mezat oluşturuldu." : "Mezat oluşturulamadı."));
    if(response.ok){
      setForm((f)=>({...f,title:"",description:""}));
      const {data:rows}=await supabase.from("auctions").select("id,title,server,current_price,starts_at,ends_at,status,product_id").order("created_at",{ascending:false}).limit(100);
      setAuctions((rows??[]) as Auction[]);
    }
  }

  if (!authorized) {
    return <main className="min-h-screen bg-[#050707] p-8 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center"><h1 className="text-2xl font-black">Yetkisiz</h1><p className="mt-2 text-zinc-500">Bu sayfa yalnızca admin içindir.</p><Link href="/admin" className="mt-5 inline-block text-[#d9aa4a]">Admin paneline dön</Link></div></main>;
  }

  return <main className="min-h-screen bg-[#050707] text-white">
    <header className="border-b border-[#8c641e]/40 bg-black/95">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4">
        <div><Link href="/admin" className="text-sm text-zinc-500 hover:text-white">← Admin</Link><h1 className="mt-1 text-2xl font-black text-[#d9aa4a]">🏛️ MEZAT YÖNETİMİ</h1></div>
        <Link href="/mezat" target="_blank" className="rounded-lg border border-[#d9aa4a]/30 px-4 py-2 text-sm font-bold text-[#f0c66d]">Canlı salonu aç</Link>
      </div>
    </header>

    <section className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={createAuction} className="rounded-2xl border border-white/10 bg-[#0b0d0d] p-5">
        <h2 className="text-xl font-black">Yeni Mezat</h2>
        <p className="mt-1 text-xs text-zinc-500">Mevcut ürünlerden birini seçerek canlı mezat oluştur.</p>

        <div className="mt-5 space-y-3">
          <select required value={form.productId} onChange={e=>{const p=products.find(x=>x.id===Number(e.target.value));setForm(f=>({...f,productId:e.target.value,server:p?.server??f.server,title:f.title||p?.name||""}))}} className="w-full rounded-xl border border-white/10 bg-black px-3 py-3">
            <option value="">Ürün seç</option>
            {products.map(p=><option key={p.id} value={p.id}>{p.name} — {p.server}</option>)}
          </select>
          <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Mezat başlığı" className="w-full rounded-xl border border-white/10 bg-black px-3 py-3" />
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Açıklama" rows={3} className="w-full rounded-xl border border-white/10 bg-black px-3 py-3" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input required type="number" min="1" value={form.startPrice} onChange={e=>setForm(f=>({...f,startPrice:e.target.value}))} placeholder="Başlangıç fiyatı" className="w-full rounded-xl border border-white/10 bg-black px-3 py-3" />
            <input required type="number" min="1" value={form.minIncrement} onChange={e=>setForm(f=>({...f,minIncrement:e.target.value}))} placeholder="Minimum artış" className="w-full rounded-xl border border-white/10 bg-black px-3 py-3" />
            <input required type="datetime-local" value={form.startsAt} onChange={e=>setForm(f=>({...f,startsAt:e.target.value}))} className="w-full rounded-xl border border-white/10 bg-black px-3 py-3" />
            <input required type="datetime-local" value={form.endsAt} onChange={e=>setForm(f=>({...f,endsAt:e.target.value}))} className="w-full rounded-xl border border-white/10 bg-black px-3 py-3" />
            <input type="number" min="5" max="300" value={form.extensionSeconds} onChange={e=>setForm(f=>({...f,extensionSeconds:e.target.value}))} placeholder="Son saniye uzatma" className="w-full rounded-xl border border-white/10 bg-black px-3 py-3" />
            <input type="number" min="0" max="3600" value={form.maxExtensionSeconds} onChange={e=>setForm(f=>({...f,maxExtensionSeconds:e.target.value}))} placeholder="Maks. toplam uzatma" className="w-full rounded-xl border border-white/10 bg-black px-3 py-3" />
          </div>
          <button disabled={saving} className="w-full rounded-xl bg-gradient-to-b from-[#ffe083] to-[#b87514] py-3 font-black text-black disabled:opacity-50">{saving?"Oluşturuluyor...":"MEZATI OLUŞTUR"}</button>
          {message && <p className="text-sm text-[#f0c66d]">{message}</p>}
        </div>
      </form>

      <section className="rounded-2xl border border-white/10 bg-[#0b0d0d] p-5">
        <h2 className="text-xl font-black">Mezatlar</h2>
        <div className="mt-4 space-y-2">
          {auctions.map(a=><div key={a.id} className="rounded-xl border border-white/5 bg-black/40 p-4">
            <div className="flex items-start justify-between gap-3"><div><strong>{a.title}</strong><p className="mt-1 text-xs text-zinc-500">{a.server} · {new Date(a.starts_at).toLocaleString("tr-TR")} → {new Date(a.ends_at).toLocaleString("tr-TR")}</p></div><span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase text-zinc-400">{a.status}</span></div>
            <p className="mt-3 text-sm text-[#f0c66d]">Güncel: {new Intl.NumberFormat("tr-TR").format(Number(a.current_price))} TL</p>
          </div>)}
          {!auctions.length && <p className="text-sm text-zinc-500">Henüz mezat oluşturulmamış.</p>}
        </div>
      </section>
    </section>
  </main>;
}

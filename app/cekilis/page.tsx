"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Raffle = { id:string; title:string; description:string; prize:string; status:"draft"|"active"|"completed"|"cancelled"; starts_at:string; ends_at:string; winner_count:number; rules:string|null; banner_url:string|null; created_at:string };
type Winner = { id:string; raffle_id:string; display_name:string; position:number; created_at:string };
type Entry = { id:string; raffle_id:string; display_name:string; created_at:string };

const ADMIN_EMAIL = "haswolf666@gmail.com";

export default function CekilisPage() {
  const [raffles,setRaffles]=useState<Raffle[]>([]);
  const [winners,setWinners]=useState<Winner[]>([]);
  const [entries,setEntries]=useState<Entry[]>([]);
  const [userId,setUserId]=useState("");
  const [isManager,setIsManager]=useState(false);
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);
  const [tab,setTab]=useState<"active"|"upcoming"|"archive">("active");

  async function load() {
    const [{data:r},{data:w},{data:e},{data:s}] = await Promise.all([
      supabase.from("raffles").select("*").order("created_at",{ascending:false}),
      supabase.from("raffle_winners").select("id,raffle_id,display_name,position,created_at").order("created_at",{ascending:false}),
      supabase.from("raffle_entries").select("id,raffle_id,display_name,created_at").order("created_at",{ascending:false}),
      supabase.auth.getSession(),
    ]);
    setRaffles((r??[]) as Raffle[]); setWinners((w??[]) as Winner[]); setEntries((e??[]) as Entry[]);
    const user=s.session?.user; setUserId(user?.id??"");
    if(user?.id){ const{data:m}=await supabase.from("raffle_managers").select("user_id").eq("user_id",user.id).maybeSingle(); setIsManager(user.email===ADMIN_EMAIL||Boolean(m)); }
  }
  useEffect(()=>{load()},[]);

  const now=Date.now();
  const active=useMemo(()=>raffles.filter(r=>r.status==="active"&&new Date(r.starts_at).getTime()<=now&&new Date(r.ends_at).getTime()>now),[raffles,now]);
  const upcoming=useMemo(()=>raffles.filter(r=>r.status==="active"&&new Date(r.starts_at).getTime()>now),[raffles,now]);
  const archived=useMemo(()=>raffles.filter(r=>r.status==="completed"),[raffles]);
  const shown=tab==="active"?active:tab==="upcoming"?upcoming:archived;

  async function join(raffle:Raffle){
    setMessage(""); const{data:s}=await supabase.auth.getSession();
    if(!s.session?.user){location.href="/login";return}
    const{data:p}=await supabase.from("profiles").select("nickname,is_guest").eq("id",s.session.user.id).maybeSingle();
    if(s.session.user.is_anonymous || p?.is_guest){setMessage("Misafir hesaplar çekilişlere katılamaz. Google hesabınla giriş yapmalısın.");return}
    const displayName=p?.nickname||s.session.user.email?.split("@")[0]||"Katılımcı";
    const{error}=await supabase.from("raffle_entries").insert({raffle_id:raffle.id,user_id:s.session.user.id,display_name:displayName});
    setMessage(error?.code==="23505"?"Bu çekilişe zaten katıldın.":error?.message||"Katılımın başarıyla kaydedildi."); load();
  }

  async function createRaffle(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setMessage("");const f=new FormData(event.currentTarget);
    const{error}=await supabase.from("raffles").insert({title:String(f.get("title")),description:String(f.get("description")),prize:String(f.get("prize")),banner_url:String(f.get("banner_url")||"")||null,starts_at:String(f.get("starts_at")),ends_at:String(f.get("ends_at")),winner_count:Number(f.get("winner_count")||1),rules:String(f.get("rules")||""),status:"active",created_by:userId});
    setMessage(error?.message||"Çekiliş yayınlandı.");setSaving(false);if(!error){event.currentTarget.reset();load()}
  }

  async function draw(id:string){
    const{data:s}=await supabase.auth.getSession();const res=await fetch("/api/raffles/draw",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${s.session?.access_token??""}`},body:JSON.stringify({raffleId:id})});const result=await res.json();setMessage(res.ok?"Kazananlar güvenli rastgele seçimle belirlendi.":result.error);load();
  }

  const count=(id:string)=>entries.filter(e=>e.raffle_id===id).length;
  const raffleWinners=(id:string)=>winners.filter(w=>w.raffle_id===id).sort((a,b)=>a.position-b.position);

  return <main className="haswolf-legal-shell px-4 py-8 sm:py-14"><div className="mx-auto max-w-7xl">
    <header className="haswolf-raffle-hero haswolf-legal-card overflow-hidden p-7 sm:p-10">
      <a href="/" className="text-sm font-bold tracking-[.28em] text-[#d9aa4a] transition hover:text-white">HASWOLF ŞEFFAFLIK MERKEZİ</a>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center"><div><h1 className="text-4xl font-black sm:text-6xl">Çekiliş Merkezi</h1><p className="mt-5 max-w-3xl leading-7 text-zinc-400">Katılımlar hesap bazında kaydedilir, mükerrer katılım engellenir, kazananlar sunucu tarafında kriptografik rastgele seçimle belirlenir ve sonuçlar kalıcı arşivde yayımlanır.</p><div className="mt-6 flex flex-wrap gap-3"><a href="/" className="rounded-xl border border-[#8c641e] px-5 py-3 text-[#e8bd67]">Ana Sayfa</a><a href="/topluluk-kurallari" className="rounded-xl border border-white/10 px-5 py-3 text-zinc-300">Katılım Kuralları</a><a href="/login" className="rounded-xl bg-[#d9aa4a] px-5 py-3 font-bold text-black">Giriş Yap</a></div></div><div className="grid grid-cols-2 gap-3"><Stat label="Aktif" value={active.length}/><Stat label="Toplam Katılım" value={entries.length}/><Stat label="Tamamlanan" value={archived.length}/><Stat label="Kazanan" value={winners.length}/></div></div>
    </header>

    <section className="haswolf-raffle-steps mt-6 grid gap-4 md:grid-cols-3">{[["1","Giriş yap","Google hesabınla güvenli oturum aç. Misafir katılımı kapalıdır."],["2","Katıl","Aktif çekilişte tek dokunuşla kaydını oluştur."],["3","Şeffaf sonuç","Kazananlar arşivde sıra numarasıyla yayımlanır."]].map(([n,t,d])=><div key={n} className="haswolf-raffle-step haswolf-legal-card p-5"><span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d9aa4a] font-black text-black">{n}</span><h2 className="mt-4 text-lg font-bold">{t}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">{d}</p></div>)}</section>

    <div className="mt-7 flex flex-wrap gap-2">{([['active','Aktif Çekilişler'],['upcoming','Yaklaşanlar'],['archive','Kazananlar Arşivi']] as const).map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`rounded-xl px-5 py-3 font-bold ${tab===key?'bg-[#d9aa4a] text-black':'border border-white/10 text-zinc-400'}`}>{label}</button>)}</div>
    {message&&<div className="mt-5 rounded-xl border border-[#8c641e]/50 bg-[#151009] p-4 text-[#efc76b]">{message}</div>}

    <section className="mt-6 grid gap-5 lg:grid-cols-2">{shown.map(r=><article key={r.id} className="haswolf-raffle-card haswolf-legal-card overflow-hidden"><div className="h-44 bg-[radial-gradient(circle_at_top_right,rgba(217,170,74,.28),transparent_45%),linear-gradient(135deg,#181109,#080909)]" style={r.banner_url?{backgroundImage:`linear-gradient(rgba(0,0,0,.4),rgba(0,0,0,.75)),url(${r.banner_url})`,backgroundSize:'cover',backgroundPosition:'center'}:{}}/><div className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">{r.status==='completed'?'TAMAMLANDI':new Date(r.starts_at).getTime()>now?'YAKLAŞIYOR':'AKTİF'}</span><span className="text-xs text-zinc-500">{new Date(r.ends_at).toLocaleString('tr-TR')}</span></div><h2 className="mt-5 text-2xl font-black text-[#e8bd67]">{r.title}</h2><p className="mt-3 leading-7 text-zinc-400">{r.description}</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><Mini label="Ödül" value={r.prize}/><Mini label="Katılımcı" value={count(r.id)}/><Mini label="Kazanan" value={r.winner_count}/></div>{r.rules&&<details className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4"><summary className="cursor-pointer font-bold text-zinc-300">Detaylı katılım koşulları</summary><p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-500">{r.rules}</p></details>}<div className="mt-5 flex flex-wrap gap-3">{r.status==='active'&&new Date(r.starts_at).getTime()<=now&&<button onClick={()=>join(r)} className="rounded-xl bg-[#d9aa4a] px-5 py-3 font-bold text-black">Çekilişe Katıl</button>}{isManager&&r.status==='active'&&<button onClick={()=>draw(r.id)} className="rounded-xl border border-red-500/50 px-5 py-3 font-bold text-red-300">Çekilişi Yap</button>}</div>{raffleWinners(r.id).length>0&&<div className="mt-5 border-t border-white/10 pt-5"><h3 className="font-bold">Kazananlar</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{raffleWinners(r.id).map(w=><div key={w.id} className="rounded-lg border border-[#8c641e]/35 bg-black/25 p-3"><span className="text-xs text-[#d9aa4a]">#{w.position}</span><p className="font-bold">{w.display_name}</p></div>)}</div></div>}</div></article>)}{shown.length===0&&<div className="haswolf-legal-card col-span-full p-10 text-center text-zinc-400">Bu bölümde henüz kayıt bulunmuyor.</div>}</section>

    {isManager&&<section className="haswolf-raffle-admin haswolf-legal-card mt-8 p-6 sm:p-8"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold tracking-[.2em] text-[#d9aa4a]">YETKİLİ ALANI</p><h2 className="mt-2 text-2xl font-black">Yeni Çekiliş Oluştur</h2></div><p className="text-sm text-zinc-500">Ana admin veya yetkilendirilen çekiliş yöneticisi kullanabilir.</p></div><form onSubmit={createRaffle} className="mt-6 grid gap-4 md:grid-cols-2"><input name="title" required className="haswolf-form-input" placeholder="Çekiliş başlığı"/><input name="prize" required className="haswolf-form-input" placeholder="Ödül"/><input name="banner_url" className="haswolf-form-input md:col-span-2" placeholder="Kapak görseli URL (isteğe bağlı)"/><textarea name="description" required className="haswolf-form-input md:col-span-2" placeholder="Detaylı açıklama" rows={4}/><label className="text-sm text-zinc-400">Başlangıç<input name="starts_at" type="datetime-local" required className="haswolf-form-input mt-2"/></label><label className="text-sm text-zinc-400">Bitiş<input name="ends_at" type="datetime-local" required className="haswolf-form-input mt-2"/></label><input name="winner_count" type="number" min="1" max="100" defaultValue="1" className="haswolf-form-input"/><textarea name="rules" className="haswolf-form-input md:col-span-2" placeholder="Katılım koşulları, yasaklar ve teslimat açıklaması" rows={6}/><button disabled={saving} className="rounded-xl bg-[#d9aa4a] px-5 py-4 font-bold text-black md:col-span-2">{saving?'Kaydediliyor...':'Çekilişi Yayınla'}</button></form></section>}

    <section className="haswolf-raffle-info-grid mt-8 grid gap-4 lg:grid-cols-3"><Info title="Şeffaflık" text="Her hesap aynı çekilişe yalnızca bir kez katılabilir. Sonuçlar çekiliş kimliğiyle arşivlenir."/><Info title="Güvenlik" text="Kazanan seçimi tarayıcıda değil, sunucu tarafında güvenli rastgelelik kullanılarak yapılır."/><Info title="Teslimat" text="Kazananlarla yalnızca resmî HASWOLF kanallarından iletişim kurulur; ödeme talep edilmez."/></section>
  </div></main>;
}

function Stat({label,value}:{label:string;value:number}){return <div className="haswolf-raffle-stat rounded-2xl p-5"><p className="text-3xl font-black text-[#e8bd67]">{value}</p><p className="mt-1 text-xs uppercase tracking-[.15em] text-zinc-500">{label}</p></div>}
function Mini({label,value}:{label:string;value:string|number}){return <div className="haswolf-raffle-mini rounded-xl p-3"><p className="text-xs uppercase tracking-[.12em] text-zinc-600">{label}</p><p className="mt-1 font-bold text-zinc-200">{value}</p></div>}
function Info({title,text}:{title:string;text:string}){return <div className="haswolf-raffle-info haswolf-legal-card p-6"><h3 className="text-lg font-bold text-[#e8bd67]">{title}</h3><p className="mt-3 text-sm leading-6 text-zinc-500">{text}</p></div>}

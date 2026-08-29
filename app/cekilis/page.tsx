"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Raffle = { id:string; title:string; description:string; prize:string; status:"draft"|"active"|"completed"|"cancelled"; starts_at:string; ends_at:string; winner_count:number; rules:string|null; banner_url:string|null; created_at:string };
type Winner = { id:string; raffle_id:string; display_name:string; position:number; created_at:string };

const ADMIN_EMAIL = "haswolf666@gmail.com";
const WHATSAPP_COMMUNITY = "https://chat.whatsapp.com/K4Porjlqi5GLlsowoTG4WQ";

export default function CekilisPage() {
  const [raffles,setRaffles]=useState<Raffle[]>([]);
  const [winners,setWinners]=useState<Winner[]>([]);
  const [userId,setUserId]=useState("");
  const [isManager,setIsManager]=useState(false);
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);
  const [tab,setTab]=useState<"active"|"upcoming"|"archive">("active");

  async function load() {
    const [{data:r},{data:w},{data:s}] = await Promise.all([
      supabase.from("raffles").select("*").order("created_at",{ascending:false}),
      supabase.from("raffle_winners").select("id,raffle_id,display_name,position,created_at").order("created_at",{ascending:false}),
      supabase.auth.getSession(),
    ]);
    setRaffles((r??[]) as Raffle[]); setWinners((w??[]) as Winner[]);
    const user=s.session?.user; setUserId(user?.id??"");
    if(user?.id){ const{data:m}=await supabase.from("raffle_managers").select("user_id").eq("user_id",user.id).maybeSingle(); setIsManager(user.email===ADMIN_EMAIL||Boolean(m)); }
  }
  useEffect(()=>{load()},[]);

  const now=Date.now();
  const active=useMemo(()=>raffles.filter(r=>r.status==="active"&&new Date(r.starts_at).getTime()<=now&&new Date(r.ends_at).getTime()>now),[raffles,now]);
  const upcoming=useMemo(()=>raffles.filter(r=>r.status==="active"&&new Date(r.starts_at).getTime()>now),[raffles,now]);
  const archived=useMemo(()=>raffles.filter(r=>r.status==="completed"),[raffles]);
  const shown=tab==="active"?active:tab==="upcoming"?upcoming:archived;

  async function createRaffle(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setMessage("");const f=new FormData(event.currentTarget);
    const{error}=await supabase.from("raffles").insert({title:String(f.get("title")),description:String(f.get("description")),prize:String(f.get("prize")),banner_url:String(f.get("banner_url")||"")||null,starts_at:String(f.get("starts_at")),ends_at:String(f.get("ends_at")),winner_count:Number(f.get("winner_count")||1),rules:String(f.get("rules")||""),status:"active",created_by:userId});
    setMessage(error?.message||"Çekiliş yayınlandı.");setSaving(false);if(!error){event.currentTarget.reset();load()}
  }

  const raffleWinners=(id:string)=>winners.filter(w=>w.raffle_id===id).sort((a,b)=>a.position-b.position);
  const topPrize=active[0]?.prize || upcoming[0]?.prize || "Yeni ödüller yakında";

  return <main className="raffle-page">
    <style jsx global>{`
      .raffle-page{min-height:100vh;background:radial-gradient(circle at 50% -10%,rgba(185,128,28,.15),transparent 31%),linear-gradient(180deg,#050505 0%,#090806 45%,#050505 100%);color:#f5f1e8;padding:34px 16px 72px;position:relative;overflow:hidden}
      .raffle-page:before{content:"";position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,black,transparent 80%)}
      .raffle-wrap{max-width:1240px;margin:auto;position:relative;z-index:1}
      .raffle-shell{border:1px solid rgba(224,173,66,.24);background:linear-gradient(145deg,rgba(23,20,14,.94),rgba(8,9,9,.97));box-shadow:0 24px 80px rgba(0,0,0,.42),inset 0 1px rgba(255,255,255,.035);border-radius:26px}
      .raffle-hero{padding:34px;position:relative;overflow:hidden}
      .raffle-hero:after{content:"";position:absolute;width:420px;height:420px;border-radius:50%;right:-120px;top:-180px;background:radial-gradient(circle,rgba(225,171,53,.25),rgba(225,171,53,.03) 50%,transparent 70%);filter:blur(1px)}
      .raffle-kicker{display:inline-flex;gap:9px;align-items:center;font-size:11px;font-weight:900;letter-spacing:.23em;color:#e4b651;text-transform:uppercase}.raffle-kicker i{width:7px;height:7px;background:#46e68d;border-radius:50%;box-shadow:0 0 14px #46e68d}
      .raffle-title{font-size:clamp(38px,6vw,72px);line-height:.96;margin:18px 0 16px;font-weight:950;letter-spacing:-.04em;background:linear-gradient(180deg,#fff7db,#e6b752 63%,#a66b13);-webkit-background-clip:text;color:transparent;text-shadow:0 10px 35px rgba(223,171,61,.11)}
      .raffle-sub{max-width:690px;color:#aaa69d;font-size:15px;line-height:1.8}.raffle-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}.rbtn{min-height:46px;padding:0 17px;border-radius:12px;border:1px solid rgba(255,255,255,.1);display:inline-flex;align-items:center;justify-content:center;font-weight:850;font-size:13px;transition:.22s;text-decoration:none}.rbtn:hover{transform:translateY(-2px);border-color:rgba(226,177,76,.55)}.rbtn-primary{background:linear-gradient(135deg,#25d366,#128c4d);color:white;border-color:#3ad978;box-shadow:0 10px 28px rgba(37,211,102,.18)}
      .raffle-metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.metric{padding:18px;border:1px solid rgba(255,255,255,.075);border-radius:17px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012));position:relative;overflow:hidden}.metric strong{font-size:30px;color:#f0c865;display:block}.metric span{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#777}.metric:after{content:"";position:absolute;inset:auto 0 0;height:2px;background:linear-gradient(90deg,transparent,#cf941f,transparent)}
      .featured-strip{display:grid;grid-template-columns:1.15fr .85fr;gap:14px;margin-top:16px}.feature{padding:19px 21px}.feature-label{font-size:10px;color:#8f8b82;text-transform:uppercase;letter-spacing:.16em}.feature-value{margin-top:7px;font-size:17px;font-weight:900;color:#f4d477}.trust-row{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;color:#9c998f;font-size:12px}.trust-row b{color:#d9ad53}
      .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}.step{padding:20px;position:relative}.step-num{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#e2b34f;color:#070707;font-weight:950;box-shadow:0 0 0 5px rgba(226,179,79,.08)}.step h3{margin:14px 0 7px;font-size:16px}.step p{margin:0;color:#77746e;line-height:1.6;font-size:12px}
      .tabs{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0 16px;padding:7px;border-radius:15px;border:1px solid rgba(255,255,255,.07);background:#090a09;width:max-content;max-width:100%}.tab{padding:11px 16px;border-radius:10px;border:0;background:transparent;color:#888;font-weight:850}.tab.active{background:linear-gradient(135deg,#d9aa48,#9e6811);color:#080706;box-shadow:0 6px 18px rgba(189,127,20,.16)}
      .raffle-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.raffle-card{overflow:hidden;position:relative}.raffle-cover{height:190px;background:radial-gradient(circle at 82% 20%,rgba(230,176,60,.3),transparent 35%),linear-gradient(145deg,#211709,#080808);position:relative}.raffle-cover:after{content:"HASWOLF";position:absolute;right:22px;bottom:12px;font-size:42px;font-weight:950;color:rgba(255,255,255,.028);letter-spacing:.07em}.raffle-body{padding:22px}.status{padding:6px 10px;border-radius:999px;font-size:10px;font-weight:950;letter-spacing:.08em}.status-live{background:rgba(50,211,116,.1);color:#50e590;border:1px solid rgba(80,229,144,.22)}.status-soon{background:rgba(78,159,255,.1);color:#74b7ff;border:1px solid rgba(116,183,255,.22)}.status-done{background:rgba(255,255,255,.06);color:#aaa;border:1px solid rgba(255,255,255,.1)}.date{font-size:11px;color:#777}.raffle-card h2{font-size:24px;color:#f0c968;margin:16px 0 8px}.raffle-card .desc{color:#97938c;font-size:13px;line-height:1.7}.mini-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:16px}.mini{border:1px solid rgba(255,255,255,.07);background:#080909;border-radius:12px;padding:11px}.mini span{display:block;font-size:9px;color:#686761;text-transform:uppercase;letter-spacing:.11em}.mini strong{display:block;margin-top:5px;font-size:13px;color:#ddd8cb}.rules{margin-top:14px;border:1px solid rgba(255,255,255,.07);border-radius:12px;background:#080909;padding:13px}.rules summary{cursor:pointer;color:#bbb;font-weight:800;font-size:12px}.rules p{color:#777;font-size:12px;line-height:1.7}.join-btn{margin-top:16px;min-height:48px;width:100%;border-radius:12px;border:1px solid #37d979;background:linear-gradient(135deg,#25d366,#117d45);color:white;font-weight:950;box-shadow:0 9px 24px rgba(37,211,102,.17);display:flex;align-items:center;justify-content:center;text-decoration:none}.join-btn:hover{filter:brightness(1.06)}
      .winner-box{margin-top:16px;padding-top:15px;border-top:1px solid rgba(255,255,255,.07)}.winner-item{display:flex;align-items:center;gap:10px;border:1px solid rgba(218,168,65,.18);background:rgba(218,168,65,.035);padding:10px;border-radius:10px}.winner-rank{color:#e7bb61;font-size:11px;font-weight:900}
      .notice{margin:12px 0 0;padding:13px 16px;border:1px solid rgba(225,175,68,.24);background:rgba(225,175,68,.055);border-radius:12px;color:#efc767;font-size:13px}.empty{grid-column:1/-1;padding:58px 20px;text-align:center}.empty .icon{font-size:34px}.empty h3{margin:10px 0 5px}.empty p{color:#777;font-size:13px}
      .admin{margin-top:18px;padding:24px}.admin-head{display:flex;justify-content:space-between;gap:18px;align-items:end}.admin h2{font-size:23px;margin:4px 0}.admin p{color:#777;font-size:12px}.admin-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px;margin-top:18px}.admin-grid input,.admin-grid textarea{width:100%;border-radius:11px;border:1px solid rgba(255,255,255,.09);background:#080909;padding:13px;color:white;outline:none}.admin-grid input:focus,.admin-grid textarea:focus{border-color:#bd8421;box-shadow:0 0 0 3px rgba(189,132,33,.08)}
      .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}.info{padding:20px}.info-icon{font-size:19px}.info h3{margin:10px 0 6px;color:#e5bd69}.info p{color:#77746f;line-height:1.65;font-size:12px}
      @media(max-width:900px){.raffle-hero-grid,.featured-strip,.raffle-grid{grid-template-columns:1fr!important}.steps,.info-grid{grid-template-columns:1fr}.raffle-metrics{margin-top:4px}.raffle-hero{padding:25px}.raffle-cover{height:150px}.admin-grid{grid-template-columns:1fr}.admin-head{align-items:flex-start;flex-direction:column}}
      @media(max-width:560px){.raffle-page{padding:18px 10px 50px}.raffle-shell{border-radius:19px}.raffle-title{font-size:43px}.raffle-hero{padding:21px}.mini-grid{grid-template-columns:1fr}.tabs{width:100%}.tab{flex:1;padding:10px 9px;font-size:11px}.raffle-metrics{grid-template-columns:repeat(2,1fr)}.metric{padding:14px}.metric strong{font-size:24px}}
    `}</style>
    <div className="raffle-wrap">
      <header className="raffle-shell raffle-hero">
        <div className="raffle-hero-grid" style={{display:"grid",gridTemplateColumns:"1.15fr .85fr",gap:28,alignItems:"center"}}>
          <div>
            <div className="raffle-kicker"><i/> HASWOLF ÖDÜL & ŞEFFAFLIK MERKEZİ</div>
            <h1 className="raffle-title">Çekiliş Merkezi</h1>
            <p className="raffle-sub">Çekilişlere katılım Instagram üzerindeki resmî HASWOLF çekiliş gönderileri üzerinden yapılır. WhatsApp topluluğumuz çekiliş duyuruları, sonuçlar ve önemli bilgilendirmeler için kullanılır; site hesabıyla giriş zorunluluğu yoktur.</p>
            <div className="raffle-actions"><a href="/" className="rbtn">← Ana Sayfa</a><a href="/topluluk-kurallari" className="rbtn">Katılım Kuralları</a><a href={WHATSAPP_COMMUNITY} target="_blank" rel="noopener noreferrer" className="rbtn rbtn-primary">☘ WhatsApp Topluluğuna Katıl</a></div>
          </div>
          <div className="raffle-metrics"><Metric label="Aktif Çekiliş" value={active.length}/><Metric label="Katılım Kaynağı" value="Instagram"/><Metric label="Tamamlanan" value={archived.length}/><Metric label="Kazanan" value={winners.length}/></div>
        </div>
        <div className="featured-strip"><div className="raffle-shell feature"><div className="feature-label">Öne çıkan ödül</div><div className="feature-value">✦ {topPrize}</div></div><div className="raffle-shell feature"><div className="feature-label">Katılım modeli</div><div className="trust-row"><span><b>✓</b> Instagram gönderisi</span><span><b>✓</b> WhatsApp duyuruları</span><span><b>✓</b> Sonuç arşivi</span></div></div></div>
      </header>

      <section className="steps"><Step n="01" title="Topluluğa katıl" text="WhatsApp topluluğumuza katıl; çekiliş duyurularını ve sonuç bildirimlerini kaçırma."/><Step n="02" title="Instagram'dan katıl" text="Resmî HASWOLF Instagram çekiliş gönderisindeki katılım şartlarını tamamla. Katılımcılar bu gönderiden belirlenir."/><Step n="03" title="Sonucu takip et" text="Kazananlar çekiliş gönderisine katılanlar arasından seçilir ve HASWOLF kanallarında duyurulur."/></section>

      <div className="tabs">{([['active','Aktif Çekilişler'],['upcoming','Yaklaşanlar'],['archive','Kazananlar Arşivi']] as const).map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`tab ${tab===key?'active':''}`}>{label}</button>)}</div>
      {message&&<div className="notice">✦ {message}</div>}

      <section className="raffle-grid" style={{marginTop:16}}>{shown.map(r=>{
        const isSoon=new Date(r.starts_at).getTime()>now; const done=r.status==='completed';
        return <article key={r.id} className="raffle-shell raffle-card">
          <div className="raffle-cover" style={r.banner_url?{backgroundImage:`linear-gradient(rgba(0,0,0,.18),rgba(0,0,0,.72)),url(${r.banner_url})`,backgroundSize:'cover',backgroundPosition:'center'}:{}}/>
          <div className="raffle-body">
            <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><span className={`status ${done?'status-done':isSoon?'status-soon':'status-live'}`}>{done?'TAMAMLANDI':isSoon?'YAKLAŞIYOR':'● CANLI'}</span><span className="date">Bitiş: {new Date(r.ends_at).toLocaleString('tr-TR')}</span></div>
            <h2>{r.title}</h2><p className="desc">{r.description}</p>
            <div className="mini-grid"><Mini label="Ödül" value={r.prize}/><Mini label="Katılım" value="Instagram"/><Mini label="Kazanan" value={r.winner_count}/></div>
            {r.rules&&<details className="rules"><summary>Katılım koşullarını görüntüle</summary><p style={{whiteSpace:"pre-line"}}>{r.rules}</p></details>}
            {r.status==='active'&&!isSoon&&<a href={WHATSAPP_COMMUNITY} target="_blank" rel="noopener noreferrer" className="join-btn">☘ WhatsApp Topluluğuna Katıl</a>}
            {raffleWinners(r.id).length>0&&<div className="winner-box"><div style={{fontWeight:900,marginBottom:10}}>🏆 Kazananlar</div><div style={{display:"grid",gap:8}}>{raffleWinners(r.id).map(w=><div key={w.id} className="winner-item"><span className="winner-rank">#{w.position}</span><strong>{w.display_name}</strong></div>)}</div></div>}
          </div>
        </article>})}
        {shown.length===0&&<div className="raffle-shell empty"><div className="icon">✦</div><h3>Bu bölüm şimdilik sakin</h3><p>Yeni çekiliş veya sonuç yayınlandığında burada elit vitrin kartı olarak görünecek.</p></div>}
      </section>

      {isManager&&<section className="raffle-shell admin"><div className="admin-head"><div><div className="raffle-kicker">YETKİLİ ALANI</div><h2>Yeni Çekiliş Oluştur</h2></div><p>Çekiliş katılımcıları Instagram gönderisinden alınır; bu panel çekilişi sitede duyurmak ve arşivlemek içindir.</p></div><form onSubmit={createRaffle} className="admin-grid"><input name="title" required placeholder="Çekiliş başlığı"/><input name="prize" required placeholder="Ödül"/><input name="banner_url" style={{gridColumn:'1/-1'}} placeholder="Kapak görseli URL (isteğe bağlı)"/><textarea name="description" required style={{gridColumn:'1/-1'}} placeholder="Detaylı açıklama" rows={4}/><label style={{fontSize:12,color:'#8e8a82'}}>Başlangıç<input name="starts_at" type="datetime-local" required style={{marginTop:7}}/></label><label style={{fontSize:12,color:'#8e8a82'}}>Bitiş<input name="ends_at" type="datetime-local" required style={{marginTop:7}}/></label><input name="winner_count" type="number" min="1" max="100" defaultValue="1"/><textarea name="rules" style={{gridColumn:'1/-1'}} placeholder="Instagram katılım koşulları ve teslimat açıklaması" rows={6}/><button disabled={saving} className="join-btn" style={{gridColumn:'1/-1',marginTop:0,background:'linear-gradient(135deg,#f0c75f,#a86e13)',borderColor:'#d9a63c',color:'#080706'}}>{saving?'Kaydediliyor...':'✦ Çekilişi Yayınla'}</button></form></section>}

      <section className="info-grid"><Info icon="◎" title="Instagram Katılımı" text="Çekilişe katılım resmî HASWOLF Instagram gönderisindeki şartlar üzerinden gerçekleşir; site hesabı gerekmez."/><Info icon="☘" title="WhatsApp Topluluğu" text="Topluluğumuz çekiliş duyuruları, hatırlatmalar ve sonuçların hızlı biçimde paylaşılması için kullanılır."/><Info icon="✦" title="Sonuçlar" text="Kazananlar Instagram çekiliş gönderisine katılanlar arasından seçilir ve resmî HASWOLF kanallarında duyurulur."/></section>
    </div>
  </main>;
}

function Metric({label,value}:{label:string;value:string|number}){return <div className="metric"><strong>{value}</strong><span>{label}</span></div>}
function Step({n,title,text}:{n:string;title:string;text:string}){return <div className="raffle-shell step"><div className="step-num">{n}</div><h3>{title}</h3><p>{text}</p></div>}
function Mini({label,value}:{label:string;value:string|number}){return <div className="mini"><span>{label}</span><strong>{value}</strong></div>}
function Info({icon,title,text}:{icon:string;title:string;text:string}){return <div className="raffle-shell info"><div className="info-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>}

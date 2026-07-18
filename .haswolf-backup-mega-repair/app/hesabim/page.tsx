"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const sections=[
 ["orders","📦","Siparişlerim"],["favorites","♥","Favorilerim"],["alerts","🔔","Fiyat alarmım"],
 ["messages","💬","Mesajlarım"],["support","🛠","Destek taleplerim"],["reviews","⭐","Yorumlarım"],
 ["notifications","🔔","Bildirim tercihlerim"],["security","🔒","Güvenlik ayarlarım"],["sessions","📱","Oturum açan cihazlar"]
] as const;

export default function AccountPage(){
 const router=useRouter();const [active,setActive]=useState("orders");const [user,setUser]=useState<any>(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{supabase.auth.getUser().then(({data})=>{if(!data.user)router.replace("/login");else setUser(data.user);setLoading(false)})},[router]);
 if(loading)return <main className="haswolf-account-loading">Panel hazırlanıyor…</main>;
 return <main className="haswolf-account-page"><div className="haswolf-account-shell">
  <aside><a href="/" className="haswolf-account-brand">HASWOLF<small>KULLANICI PANELİ</small></a><div className="haswolf-account-user"><span>{user?.email?.[0]?.toUpperCase()}</span><div><strong>{user?.user_metadata?.full_name||"HASWOLF Üyesi"}</strong><small>{user?.email}</small></div></div>
  <nav>{sections.map(([id,icon,label])=><button className={active===id?"is-active":""} key={id} onClick={()=>setActive(id)}><span>{icon}</span>{label}</button>)}</nav>
  <button className="haswolf-account-logout" onClick={async()=>{await supabase.auth.signOut();router.replace("/")}}>Çıkış yap</button></aside>
  <section><header><div><small>HESABIM</small><h1>{sections.find(x=>x[0]===active)?.[2]}</h1></div><a href="/">Siteye dön</a></header>
  <Panel active={active}/></section>
 </div></main>;
}
function Panel({active}:{active:string}){
 if(active==="notifications")return <div className="haswolf-panel-card"><h2>Bildirim tercihleri</h2>{["Siparişler","Fiyat alarmları","Mesajlar","Kampanyalar","Favoriler","Admin duyuruları"].map(x=><label key={x}><span>{x}</span><input type="checkbox" defaultChecked/></label>)}</div>;
 if(active==="security")return <div className="haswolf-panel-card"><h2>Güvenlik ayarları</h2><button>Şifremi güncelle</button><button>İki adımlı doğrulamayı yapılandır</button><button>Diğer oturumları kapat</button></div>;
 if(active==="sessions")return <div className="haswolf-panel-card"><h2>Oturum açan cihazlar</h2><article><b>Bu cihaz</b><span>Chrome · Windows</span><em>Şimdi aktif</em></article></div>;
 return <div className="haswolf-panel-empty"><span>◆</span><h2>{active==="favorites"?"Favori ürünlerin burada görünür":"Bu bölüm kullanıma hazır"}</h2><p>İşlemlerin Supabase hesabınla eşleştikçe bu alanda listelenecek.</p><a href="/#market">Markete git</a></div>;
}

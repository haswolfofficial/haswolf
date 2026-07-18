
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const enc = "utf8";
const backupRoot = path.join(root, ".haswolf-backup-mega-sprint");

function abs(p){ return path.join(root,p); }
function ensureDir(p){ fs.mkdirSync(p,{recursive:true}); }
function read(p){ return fs.readFileSync(abs(p),enc).replace(/^\uFEFF/,""); }
function write(p,c){ ensureDir(path.dirname(abs(p))); fs.writeFileSync(abs(p),c,enc); }
function backup(p){
  const src=abs(p); if(!fs.existsSync(src)) throw new Error(`Dosya bulunamadı: ${p}`);
  const dst=path.join(backupRoot,p); ensureDir(path.dirname(dst));
  if(!fs.existsSync(dst)) fs.copyFileSync(src,dst);
}
function insertAfter(text,needle,addition,label){
  if(text.includes(addition.trim().slice(0,40))) return text;
  const i=text.indexOf(needle); if(i<0) throw new Error(`Bulunamadı: ${label}`);
  return text.slice(0,i+needle.length)+addition+text.slice(i+needle.length);
}
function replaceOnce(text,needle,replacement,label){
  if(!text.includes(needle)) throw new Error(`Bulunamadı: ${label}`);
  return text.replace(needle,replacement);
}

[
 "app/page.tsx","app/admin/page.tsx","app/globals.css",
 "components/LanguageSelector.tsx","components/AutoTranslate.tsx",
 "components/NotificationCenter.tsx"
].forEach(backup);

const files = {
"components/ProductExperience.tsx": String.raw`"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type ProductLite = {
  id:number; name:string; price:number; old_price?:number|null; server:string;
  category:"item"|"yang"|"dc"|"account"; stock:number; delivery_time?:string|null;
  view_count?:number|null; image_url?:string|null;
};

const FAVORITES_KEY="haswolf_favorites_v1";
const COMPARE_KEY="haswolf_compare_v1";
function guestKey(){
  let key=localStorage.getItem("haswolf_guest_key");
  if(!key){ key=crypto.randomUUID(); localStorage.setItem("haswolf_guest_key",key); }
  return key;
}

export default function ProductExperience({product,compact=false}:{product:ProductLite;compact?:boolean}){
  const [favorite,setFavorite]=useState(false);
  const [compared,setCompared]=useState(false);
  const [views,setViews]=useState(product.view_count ?? 0);
  const [confirming,setConfirming]=useState(false);
  const unit=product.category==="dc"?"M":"TL";

  useEffect(()=>{
    const favs=JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]") as number[];
    const compare=JSON.parse(localStorage.getItem(COMPARE_KEY)||"[]") as ProductLite[];
    setFavorite(favs.includes(product.id));
    setCompared(compare.some(x=>x.id===product.id));
    const seenKey=\`haswolf_viewed_\${product.id}\`;
    if(!sessionStorage.getItem(seenKey)){
      sessionStorage.setItem(seenKey,"1");
      setViews(v=>v+1);
      supabase.rpc("increment_product_view",{product_id_input:product.id}).then(()=>{});
    }
  },[product.id]);

  async function toggleFavorite(){
    const current=JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]") as number[];
    const next=current.includes(product.id)?current.filter(id=>id!==product.id):[...current,product.id];
    localStorage.setItem(FAVORITES_KEY,JSON.stringify(next));
    setFavorite(next.includes(product.id));
    window.dispatchEvent(new CustomEvent("haswolf:favorites"));
    const {data:{user}}=await supabase.auth.getUser();
    if(next.includes(product.id)){
      await supabase.from("product_favorites").upsert({
        user_id:user?.id ?? null,guest_key:user?null:guestKey(),product_id:product.id
      });
    }else{
      let q=supabase.from("product_favorites").delete().eq("product_id",product.id);
      q=user?q.eq("user_id",user.id):q.eq("guest_key",guestKey());
      await q;
    }
  }

  function toggleCompare(){
    const current=JSON.parse(localStorage.getItem(COMPARE_KEY)||"[]") as ProductLite[];
    const exists=current.some(x=>x.id===product.id);
    let next=exists?current.filter(x=>x.id!==product.id):[...current,product].slice(-3);
    localStorage.setItem(COMPARE_KEY,JSON.stringify(next));
    setCompared(!exists);
    window.dispatchEvent(new CustomEvent("haswolf:compare",{detail:next}));
  }

  async function share(){
    const url=\`\${location.origin}/?product=\${product.id}#market\`;
    const text=\`\${product.name} - \${product.price.toLocaleString("tr-TR")} \${unit}\`;
    if(navigator.share){ await navigator.share({title:product.name,text,url}); }
    else{ await navigator.clipboard.writeText(url); alert("Ürün bağlantısı kopyalandı."); }
  }

  function buy(){
    setConfirming(true);
    window.setTimeout(()=>{
      const msg=encodeURIComponent(\`Merhaba Haswolf, \${product.server} sunucusundaki \${product.name} ürününü satın almak istiyorum.\`);
      window.open(\`https://wa.me/905010942080?text=\${msg}\`,"_blank","noopener,noreferrer");
      setConfirming(false);
    },450);
  }

  return <div className={compact?"haswolf-product-xp is-compact":"haswolf-product-xp"}>
    <div className="haswolf-product-xp__meta">
      <span>👁 {views.toLocaleString("tr-TR")}</span>
      <span>⏱ {product.delivery_time || "1 saat"}</span>
      <span className={product.stock<=2?"is-low-stock":""}>📦 {product.stock<=2?"Az kaldı":\`Stok \${product.stock}\`}</span>
    </div>
    <div className="haswolf-product-xp__actions">
      <button type="button" className={favorite?"is-active":""} onClick={toggleFavorite}>{favorite?"♥ Favoride":"♡ Favoriye Ekle"}</button>
      <button type="button" className={compared?"is-active":""} onClick={toggleCompare}>⇄ Karşılaştır</button>
      <button type="button" onClick={share}>↗ Paylaş</button>
    </div>
    {!compact && <button type="button" onClick={buy} disabled={confirming} className="haswolf-buy-confirm">
      {confirming?"Satın alma hazırlanıyor…":"WhatsApp ile Satın Al"}
    </button>}
  </div>;
}
`,

"components/SmartSearch.tsx": String.raw`"use client";
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
`,

"components/CompareDock.tsx": String.raw`"use client";
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
`,

"components/AdminSearchAnalytics.tsx": String.raw`"use client";
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
`,

"app/hesabim/page.tsx": String.raw`"use client";
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
`
};

for(const [p,c] of Object.entries(files)) write(p,c);

let page=read("app/page.tsx");
if(!page.includes('import ProductExperience')){
 page=page.replace('import LanguageSelector from "../components/LanguageSelector";',
`import LanguageSelector from "../components/LanguageSelector";
import ProductExperience from "../components/ProductExperience";
import SmartSearch from "../components/SmartSearch";
import CompareDock from "../components/CompareDock";`);
}
page=page.replace('  created_at?: string;\n};','  created_at?: string;\n  delivery_time?: string | null;\n  view_count?: number | null;\n};');
page=page.replace('.select("id,name,category,item_category,server,price,old_price,description,image_url,stock,is_active,created_at")',
'.select("id,name,category,item_category,server,price,old_price,description,image_url,stock,is_active,created_at,delivery_time,view_count")');

if(!page.includes("<SmartSearch")){
 page=page.replace('<section id="market" className="scroll-mt-20', `<section className="mx-auto max-w-[1500px] px-3 pb-4 sm:px-6">
        <SmartSearch products={products} onPick={(product) => {
          setMarket(product.category);
          setSelectedServer(product.server);
          window.setTimeout(() => document.getElementById("market")?.scrollIntoView({ behavior: "smooth" }), 0);
        }} />
      </section>

      <section id="market" className="scroll-mt-20`);
}
page=page.replace('<p className="mt-2 text-center text-xs text-zinc-500">\n                        Stok: {product.stock}\n                      </p>',
`<ProductExperience product={product} />`);
page=page.replace('<p className="mt-2 text-center text-xs text-zinc-500">\n                      Stok: {account.stock}\n                    </p>',
`<ProductExperience product={account} />`);
page=page.replace('<div className="haswolf-yang-card__meta">\n                               <span>Stok: {pack.stock}</span>',
`<ProductExperience product={pack} compact />
                            <div className="haswolf-yang-card__meta">
                               <span>Stok: {pack.stock}</span>`);
page=page.replace('<div className="haswolf-yang-card__meta">\n                             <span>Stok: {pack.stock}</span>',
`<ProductExperience product={pack} compact />
                          <div className="haswolf-yang-card__meta">
                             <span>Stok: {pack.stock}</span>`);
if(!page.includes("<CompareDock")){
 page=page.replace("<MobileBottomNav activeMarket={market} onMarketChange={goToMarket} />",
`<CompareDock />
      <MobileBottomNav activeMarket={market} onMarketChange={goToMarket} />`);
}
page=page.replace(/>WhatsApp</g,">WhatsApp ile Satın Al<");
write("app/page.tsx",page);

let admin=read("app/admin/page.tsx");
if(!admin.includes("AdminSearchAnalytics")){
 admin=admin.replace('import { supabase } from "../../lib/supabase";',
`import { supabase } from "../../lib/supabase";
import AdminSearchAnalytics from "../../components/AdminSearchAnalytics";`);
}
admin=admin.replace('  is_active: boolean;\n};','  is_active: boolean;\n  delivery_time: string;\n};');
admin=admin.replace('  const [stock, setStock] = useState("1");',
'  const [stock, setStock] = useState("1");\n  const [deliveryTime, setDeliveryTime] = useState("1 saat");');
admin=admin.replace('.select("id,name,category,item_category,server,price,old_price,admin_note,description,image_url,stock,is_active")',
'.select("id,name,category,item_category,server,price,old_price,admin_note,description,image_url,stock,is_active,delivery_time")');
admin=admin.replace('    setStock("1");','    setStock("1");\n    setDeliveryTime("1 saat");');
admin=admin.replace('    setStock(String(product.stock));','    setStock(String(product.stock));\n    setDeliveryTime(product.delivery_time || "1 saat");');
admin=admin.replace('        stock: Number(stock),','        stock: Number(stock),\n        delivery_time: deliveryTime,');
if(!admin.includes('value={deliveryTime}')){
 admin=admin.replace('<input type="number" min="0" value={stock}', `<select value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="rounded-lg border border-cyan-500/30 bg-black px-4 py-3">
            <option value="30 dakika">Teslimat: 30 dakika</option>
            <option value="1 saat">Teslimat: 1 saat</option>
            <option value="2 saat">Teslimat: 2 saat</option>
            <option value="12 saat">Teslimat: 12 saat</option>
            <option value="24 saat">Teslimat: 24 saat</option>
          </select>

          <input type="number" min="0" value={stock}`);
}
if(!admin.includes("<AdminSearchAnalytics")){
 admin=admin.replace('<form\n          onSubmit={handleSubmit}', `<AdminSearchAnalytics />

        <form
          onSubmit={handleSubmit}`);
}
write("app/admin/page.tsx",admin);

let css=read("app/globals.css");
if(!css.includes("HASWOLF V4 MEGA SPRINT")){
 css += String.raw`

/* HASWOLF V4 MEGA SPRINT */
.haswolf-smart-search{position:relative;z-index:35}
.haswolf-smart-search__box{display:flex;align-items:center;gap:.75rem;border:1px solid rgba(217,170,74,.38);border-radius:1rem;background:linear-gradient(180deg,#111414,#080a0a);padding:.8rem 1rem;box-shadow:0 16px 50px rgba(0,0,0,.28)}
.haswolf-smart-search__box>span{font-size:1.4rem;color:#e5b64e}.haswolf-smart-search__box input{flex:1;background:transparent;outline:none;color:white}.haswolf-smart-search__box input::placeholder{color:#686d6d}
.haswolf-smart-search__results{position:absolute;top:calc(100% + .55rem);left:0;right:0;max-height:28rem;overflow:auto;border:1px solid rgba(217,170,74,.35);border-radius:1rem;background:rgba(7,9,9,.98);box-shadow:0 28px 90px rgba(0,0,0,.72);padding:.6rem}
.haswolf-smart-search__results header{display:flex;justify-content:space-between;padding:.6rem .7rem;color:#dcb45e}.haswolf-smart-search__results header small{color:#777}
.haswolf-smart-search__results>button{width:100%;display:flex;justify-content:space-between;gap:1rem;padding:.75rem;border-radius:.75rem;text-align:left}.haswolf-smart-search__results>button:hover{background:rgba(217,170,74,.1)}
.haswolf-smart-search__results strong,.haswolf-smart-search__results small{display:block}.haswolf-smart-search__results small{margin-top:.2rem;color:#777}.haswolf-smart-search__results b{color:#efc668}
.haswolf-search-empty{padding:1.2rem;text-align:center;color:#999}.haswolf-search-empty>*{display:block}.haswolf-search-empty b{color:#eee}.haswolf-search-empty button{margin:.8rem auto 0;border:1px solid #8b672d;border-radius:.65rem;padding:.55rem .8rem;color:#e7bd67}

.haswolf-product-xp{margin-top:.75rem}.haswolf-product-xp__meta{display:flex;flex-wrap:wrap;justify-content:center;gap:.35rem}.haswolf-product-xp__meta span{border:1px solid rgba(255,255,255,.08);border-radius:999px;background:rgba(255,255,255,.035);padding:.28rem .5rem;font-size:.62rem;color:#aeb2b2}.haswolf-product-xp__meta .is-low-stock{color:#ffb56b;border-color:rgba(255,135,55,.35);animation:haswolf-stock-pulse 1.8s infinite}
.haswolf-product-xp__actions{display:grid;grid-template-columns:repeat(3,1fr);gap:.35rem;margin-top:.55rem}.haswolf-product-xp__actions button{min-height:2.25rem;border:1px solid rgba(255,255,255,.09);border-radius:.6rem;background:#111414;color:#aeb2b2;font-size:.62rem;font-weight:700;transition:.2s}.haswolf-product-xp__actions button:hover,.haswolf-product-xp__actions button.is-active{transform:translateY(-2px);border-color:rgba(217,170,74,.55);color:#efc668;background:rgba(217,170,74,.08)}
.haswolf-buy-confirm{width:100%;min-height:2.7rem;margin-top:.55rem;border-radius:.7rem;background:linear-gradient(135deg,#15944b,#075b2b);font-weight:900;color:white;transition:.2s}.haswolf-buy-confirm:hover{filter:brightness(1.15);transform:translateY(-1px)}.haswolf-product-xp.is-compact{margin-top:.45rem}.haswolf-product-xp.is-compact .haswolf-buy-confirm{display:none}

.haswolf-compare-dock{position:fixed;z-index:85;left:50%;bottom:6rem;transform:translateX(-50%);display:flex;align-items:center;gap:.5rem;border:1px solid rgba(217,170,74,.4);border-radius:999px;background:rgba(7,9,9,.96);padding:.5rem .7rem;box-shadow:0 20px 70px rgba(0,0,0,.7);backdrop-filter:blur(20px)}.haswolf-compare-dock span{font-size:.72rem;color:#bbb}.haswolf-compare-dock span b{display:inline-grid;place-items:center;width:1.3rem;height:1.3rem;border-radius:50%;background:#d9aa4a;color:#111}.haswolf-compare-dock button{border-radius:999px;padding:.48rem .75rem;font-size:.68rem;font-weight:800}.haswolf-compare-dock button:first-of-type{background:#d9aa4a;color:#111}.haswolf-compare-dock button:last-child{color:#888}
.haswolf-compare-modal{position:fixed;z-index:150;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.78);padding:1rem;backdrop-filter:blur(8px)}.haswolf-compare-modal>div{width:min(60rem,100%);max-height:85vh;overflow:auto;border:1px solid rgba(217,170,74,.4);border-radius:1.2rem;background:#080a0a;box-shadow:0 30px 100px #000}.haswolf-compare-modal header{display:flex;justify-content:space-between;padding:1rem 1.2rem;border-bottom:1px solid rgba(255,255,255,.08)}.haswolf-compare-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));gap:.8rem;padding:1rem}.haswolf-compare-grid article{border:1px solid rgba(255,255,255,.09);border-radius:1rem;padding:1rem;background:#101313}.haswolf-compare-grid h3{color:#e9bd65}.haswolf-compare-grid dl div{display:flex;justify-content:space-between;border-bottom:1px dashed rgba(255,255,255,.08);padding:.6rem 0;font-size:.75rem}.haswolf-compare-grid dt{color:#777}

.haswolf-admin-analytics{margin-bottom:2rem;border:1px solid rgba(58,166,255,.28);border-radius:1rem;background:linear-gradient(180deg,rgba(8,28,42,.35),#0a0d0d);padding:1rem}.haswolf-admin-analytics>header{display:flex;justify-content:space-between;align-items:center}.haswolf-admin-analytics header small{color:#65bfff}.haswolf-admin-analytics header h2{font-size:1.2rem;font-weight:900}.haswolf-admin-analytics__grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin-top:1rem}.haswolf-admin-analytics__grid>div{border:1px solid rgba(255,255,255,.08);border-radius:.8rem;padding:.8rem;background:rgba(0,0,0,.24)}.haswolf-admin-analytics__grid h3{margin-bottom:.6rem;color:#dcb45e}.haswolf-admin-analytics__grid p{display:grid;grid-template-columns:1.5rem 1fr auto;gap:.5rem;padding:.48rem;border-radius:.5rem}.haswolf-admin-analytics__grid p:hover{background:rgba(255,255,255,.035)}.haswolf-admin-analytics__grid p b{color:#5fbaff}.haswolf-admin-analytics__grid p em{font-style:normal;color:#888}

.haswolf-account-page,.haswolf-account-loading{min-height:100vh;background:#050707;color:white}.haswolf-account-loading{display:grid;place-items:center}.haswolf-account-shell{display:grid;grid-template-columns:18rem 1fr;min-height:100vh}.haswolf-account-shell>aside{border-right:1px solid rgba(217,170,74,.22);background:#080a0a;padding:1.2rem}.haswolf-account-brand{display:block;color:#d9aa4a;font-size:1.5rem;font-weight:950;letter-spacing:.18em}.haswolf-account-brand small{display:block;margin-top:.25rem;color:#666;font-size:.55rem}.haswolf-account-user{display:flex;gap:.7rem;align-items:center;margin:1.3rem 0;padding:.8rem;border:1px solid rgba(255,255,255,.08);border-radius:.8rem}.haswolf-account-user>span{display:grid;place-items:center;width:2.4rem;height:2.4rem;border-radius:50%;background:#d9aa4a;color:#111;font-weight:900}.haswolf-account-user strong,.haswolf-account-user small{display:block}.haswolf-account-user small{color:#777;font-size:.65rem}.haswolf-account-shell nav{display:grid;gap:.3rem}.haswolf-account-shell nav button{display:flex;gap:.7rem;align-items:center;padding:.75rem;border-radius:.65rem;color:#999;text-align:left}.haswolf-account-shell nav button:hover,.haswolf-account-shell nav button.is-active{background:rgba(217,170,74,.1);color:#efc668}.haswolf-account-logout{margin-top:1rem;width:100%;border:1px solid rgba(255,70,70,.3);border-radius:.65rem;padding:.7rem;color:#ff9b9b}.haswolf-account-shell>section{padding:1.5rem}.haswolf-account-shell>section>header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem}.haswolf-account-shell>section>header small{color:#d9aa4a}.haswolf-account-shell>section>header h1{font-size:1.8rem;font-weight:950}.haswolf-panel-card,.haswolf-panel-empty{border:1px solid rgba(255,255,255,.08);border-radius:1rem;background:#0b0e0e;padding:1.2rem}.haswolf-panel-card label,.haswolf-panel-card article{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.07);padding:.8rem 0}.haswolf-panel-card button{display:block;width:100%;margin-top:.5rem;border:1px solid rgba(217,170,74,.25);border-radius:.65rem;padding:.75rem;text-align:left}.haswolf-panel-empty{text-align:center;padding:4rem 1rem}.haswolf-panel-empty>span{font-size:3rem;color:#d9aa4a}.haswolf-panel-empty a{display:inline-block;margin-top:1rem;border-radius:.7rem;background:#d9aa4a;padding:.7rem 1rem;color:#111;font-weight:900}

@keyframes haswolf-stock-pulse{50%{box-shadow:0 0 18px rgba(255,135,55,.25)}}@keyframes haswolf-skeleton{to{background-position:-200% 0}}
.haswolf-skeleton{background:linear-gradient(90deg,#101313 25%,#1a1e1e 37%,#101313 63%);background-size:200% 100%;animation:haswolf-skeleton 1.4s infinite}

@media(max-width:760px){.haswolf-admin-analytics__grid{grid-template-columns:1fr}.haswolf-account-shell{grid-template-columns:1fr}.haswolf-account-shell>aside{border-right:0;border-bottom:1px solid rgba(217,170,74,.22)}.haswolf-account-shell nav{grid-template-columns:repeat(2,1fr)}.haswolf-product-xp__actions{grid-template-columns:1fr}.haswolf-compare-dock{bottom:5.4rem;width:calc(100% - 1rem);justify-content:center}.haswolf-smart-search__results{position:fixed;left:.5rem;right:.5rem;top:7rem}}
`;
}
write("app/globals.css",css);

console.log("\nHASWOLF v4 Mega Sprint uygulandı.");
console.log("Yedekler:",backupRoot);
console.log("\nSıradaki adımlar:");
console.log("1) Supabase SQL Editor: supabase/haswolf_v4_mega_sprint.sql");
console.log("2) npm run dev");
console.log("3) npm run build");
console.log('4) git add . && git commit -m "HASWOLF v4 Mega Sprint" && git push');

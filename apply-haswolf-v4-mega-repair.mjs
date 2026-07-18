
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backupRoot = path.join(root, ".haswolf-backup-mega-repair");
const utf8 = "utf8";

function abs(p){ return path.join(root,p); }
function ensure(p){ fs.mkdirSync(p,{recursive:true}); }
function read(p){ return fs.readFileSync(abs(p),utf8).replace(/^\uFEFF/,""); }
function write(p,c){ ensure(path.dirname(abs(p))); fs.writeFileSync(abs(p),c,utf8); }
function backup(p){
  const src=abs(p); if(!fs.existsSync(src)) throw new Error(`Dosya bulunamadı: ${p}`);
  const dst=path.join(backupRoot,p); ensure(path.dirname(dst));
  if(!fs.existsSync(dst)) fs.copyFileSync(src,dst);
}
function replaceRequired(text, from, to, label){
  if(!text.includes(from)) throw new Error(`Kod bulunamadı: ${label}`);
  return text.replace(from,to);
}

/* Windows-1252 mojibake -> UTF-8 repair */
const cp1252 = new Map([
  [0x20AC,0x80],[0x201A,0x82],[0x0192,0x83],[0x201E,0x84],[0x2026,0x85],
  [0x2020,0x86],[0x2021,0x87],[0x02C6,0x88],[0x2030,0x89],[0x0160,0x8A],
  [0x2039,0x8B],[0x0152,0x8C],[0x017D,0x8E],[0x2018,0x91],[0x2019,0x92],
  [0x201C,0x93],[0x201D,0x94],[0x2022,0x95],[0x2013,0x96],[0x2014,0x97],
  [0x02DC,0x98],[0x2122,0x99],[0x0161,0x9A],[0x203A,0x9B],[0x0153,0x9C],
  [0x017E,0x9E],[0x0178,0x9F]
]);
function suspiciousScore(s){
  return (s.match(/Ã|Ä|Å|Â|ð|Ÿ|â|€|™|œ|ž|�/g)||[]).length;
}
function decodeCp1252AsUtf8(s){
  const bytes=[];
  for(const ch of s){
    const cp=ch.codePointAt(0);
    if(cp<=255) bytes.push(cp);
    else if(cp1252.has(cp)) bytes.push(cp1252.get(cp));
    else return s;
  }
  try{return Buffer.from(bytes).toString("utf8")}catch{return s}
}
function repairLine(line){
  if(!/[ÃÄÅÂðŸâ€™œž�]/.test(line)) return line;
  let cur=line;
  for(let i=0;i<3;i++){
    const next=decodeCp1252AsUtf8(cur);
    if(next===cur || suspiciousScore(next)>=suspiciousScore(cur)) break;
    cur=next;
  }
  return cur;
}
function repairFileEncoding(p){
  let text=read(p);
  text=text.split(/\r?\n/).map(repairLine).join("\n");
  write(p,text);
}

const coreFiles=[
  "app/page.tsx","app/admin/page.tsx","app/globals.css",
  "components/LanguageSelector.tsx","components/AutoTranslate.tsx",
  "components/NotificationCenter.tsx","components/ProductExperience.tsx",
  "components/SmartSearch.tsx","components/CompareDock.tsx",
  "components/AdminSearchAnalytics.tsx","app/hesabim/page.tsx"
];
coreFiles.filter(p=>fs.existsSync(abs(p))).forEach(backup);
coreFiles.filter(p=>fs.existsSync(abs(p))).forEach(repairFileEncoding);

/* AutoTranslate: toolbar kaldır, dil algılamayı koru */
write("components/AutoTranslate.tsx", `"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            multilanguagePage: boolean;
          },
          elementId: string,
        ) => void;
      };
    };
  }
}

const STORAGE_KEY = "haswolf_language";
const SUPPORTED = ["tr","en","de","fr","es","pt","ru","ar","it","pl"];

function detectedLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.includes(stored)) return stored;
  const browser = (navigator.languages?.[0] || navigator.language || "tr").split("-")[0];
  return SUPPORTED.includes(browser) ? browser : "tr";
}

function setCookie(language: string) {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = \`googtrans=;expires=\${expires};path=/\`;
  document.cookie = \`googtrans=;expires=\${expires};path=/;domain=\${location.hostname}\`;
  if (language !== "tr") {
    const value = \`/tr/\${language}\`;
    document.cookie = \`googtrans=\${value};path=/;SameSite=Lax\`;
    document.cookie = \`googtrans=\${value};path=/;domain=\${location.hostname};SameSite=Lax\`;
  }
}

export default function AutoTranslate() {
  useEffect(() => {
    const language = detectedLanguage();
    if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    setCookie(language);

    const hideTranslateChrome = () => {
      document.documentElement.style.marginTop = "0";
      document.body.style.top = "0";
      document.querySelectorAll("iframe.goog-te-banner-frame, .goog-te-banner-frame, .skiptranslate iframe")
        .forEach((node) => (node as HTMLElement).style.display = "none");
    };
    hideTranslateChrome();

    if (language === "tr") return;

    window.googleTranslateElementInit = () => {
      if (!window.google) return;
      new window.google.translate.TranslateElement({
        pageLanguage: "tr",
        includedLanguages: SUPPORTED.filter((x) => x !== "tr").join(","),
        autoDisplay: false,
        multilanguagePage: true,
      }, "google_translate_element");
      window.setTimeout(hideTranslateChrome, 250);
      window.setTimeout(hideTranslateChrome, 1200);
    };

    if (!document.getElementById("haswolf-google-translate")) {
      const script = document.createElement("script");
      script.id = "haswolf-google-translate";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return <div id="google_translate_element" className="haswolf-google-translate" aria-hidden="true" />;
}
`);

/* Dar, tüm dilleri gösteren dil menüsü */
write("components/LanguageSelector.tsx", `"use client";

import { useEffect, useRef, useState } from "react";

const languages = [
  ["tr","TR","🇹🇷","Türkçe"],["en","EN","🇬🇧","English"],
  ["de","DE","🇩🇪","Deutsch"],["fr","FR","🇫🇷","Français"],
  ["es","ES","🇪🇸","Español"],["pt","PT","🇵🇹","Português"],
  ["ru","RU","🇷🇺","Русский"],["ar","AR","🇸🇦","العربية"],
  ["it","IT","🇮🇹","Italiano"],["pl","PL","🇵🇱","Polski"],
] as const;
type Code=(typeof languages)[number][0];
const STORAGE_KEY="haswolf_language";

export default function LanguageSelector(){
  const [value,setValue]=useState<Code>("tr");
  const [open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const saved=localStorage.getItem(STORAGE_KEY) as Code|null;
    const detected=(navigator.languages?.[0]||navigator.language||"tr").split("-")[0] as Code;
    const initial=languages.some(x=>x[0]===(saved||detected))?(saved||detected):"tr";
    setValue(initial as Code);
    const close=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false)};
    document.addEventListener("pointerdown",close);
    return()=>document.removeEventListener("pointerdown",close);
  },[]);

  function select(code:Code){
    localStorage.setItem(STORAGE_KEY,code);
    document.documentElement.lang=code;
    document.documentElement.dir=code==="ar"?"rtl":"ltr";
    setValue(code); setOpen(false); location.reload();
  }
  const active=languages.find(x=>x[0]===value)||languages[0];

  return <div className="haswolf-language-compact" ref={ref}>
    <button type="button" onClick={()=>setOpen(x=>!x)} aria-expanded={open}>
      <span>{active[2]}</span><b>{active[1]}</b><i>⌄</i>
    </button>
    {open&&<div className="haswolf-language-compact__menu">
      {languages.map(([code,short,flag,label])=><button
        type="button" key={code} className={code===value?"is-active":""}
        onClick={()=>select(code)}>
        <span>{flag}</span><span>{label}</span><b>{short}</b>
      </button>)}
    </div>}
  </div>;
}
`);

/* Ana sayfayı sağlamlaştır */
let page=read("app/page.tsx");

if(!page.includes('import ProductExperience from')){
  page=page.replace(/import LanguageSelector[^\n]*\n/,
`import LanguageSelector from "../components/LanguageSelector";
import ProductExperience from "../components/ProductExperience";
import SmartSearch from "../components/SmartSearch";
import CompareDock from "../components/CompareDock";
`);
}

/* Header satın al ve bize sat -> WhatsApp */
page=page.replace(
  /onClick=\{\(\) => goToMarket\("item"\)\} className="haswolf-header-trade__buy"/g,
  'onClick={() => openWhatsApp("Merhaba Haswolf, ürün satın almak istiyorum. Bana yardımcı olur musunuz?")} className="haswolf-header-trade__buy"'
);
page=page.replace(
  /onClick=\{\(\) => \{\s*setSelectedServer\(server\.name\);\s*goToMarket\("yang"\);\s*\}\}/g,
  'onClick={() => openWhatsApp(`Merhaba Haswolf, ${server.name} sunucusundan Yang, DC veya ürün satın almak istiyorum.`)}'
);

/* Smart search yoksa marketten hemen önce ekle */
if(!page.includes("<SmartSearch")){
  const marker='<section id="market"';
  const idx=page.indexOf(marker);
  if(idx<0) throw new Error("Market bölümü bulunamadı.");
  const block=`<section className="mx-auto max-w-[1500px] px-3 pb-4 sm:px-6">
        <SmartSearch
          products={products}
          onPick={(product) => {
            setMarket(product.category as MarketType);
            setSelectedServer(product.server);
            window.setTimeout(() => document.getElementById("market")?.scrollIntoView({ behavior: "smooth" }), 0);
          }}
        />
      </section>

      `;
  page=page.slice(0,idx)+block+page.slice(idx);
}

/* ProductExperience item kartına yoksa ekle */
if(!page.includes("<ProductExperience product={product}")){
  const itemStock=`<p className="mt-2 text-center text-xs text-zinc-500">
                        Stok: {product.stock}
                      </p>`;
  if(page.includes(itemStock)) page=page.replace(itemStock,'<ProductExperience product={product} />');
}

/* Account kartına */
if(!page.includes("<ProductExperience product={account}")){
  const accountStock=`<p className="mt-2 text-center text-xs text-zinc-500">
                      Stok: {account.stock}
                    </p>`;
  if(page.includes(accountStock)) page=page.replace(accountStock,'<ProductExperience product={account} />');
}

/* Yang/DC compact deneyim; her kartta bir kez */
page=page.replace(
  /(<article key=\{pack\.id\} className="haswolf-yang-card">[\s\S]*?<div className="haswolf-yang-card__meta">)/g,
  (match)=>match.includes("ProductExperience")?match:match.replace('<div className="haswolf-yang-card__meta">','<ProductExperience product={pack} compact />\n                            <div className="haswolf-yang-card__meta">')
);

if(!page.includes("<CompareDock")){
  page=page.replace(
    '<MobileBottomNav activeMarket={market} onMarketChange={goToMarket} />',
    '<CompareDock />\n      <MobileBottomNav activeMarket={market} onMarketChange={goToMarket} />'
  );
}

/* WhatsApp metinleri */
page=page.replace(/>\s*WhatsApp\s*</g,">WhatsApp ile Satın Al<");
page=page.replace(/BİZDEN SATIN AL/g,"BİZDEN SATIN AL");
page=page.replace(/BİZE SAT/g,"BİZE SAT");
write("app/page.tsx",page);

/* Admin analitiği en üste taşı ve teslimatı garanti et */
let admin=read("app/admin/page.tsx");
if(!admin.includes('import AdminSearchAnalytics')){
  admin=admin.replace(
    'import { supabase } from "../../lib/supabase";',
    'import { supabase } from "../../lib/supabase";\nimport AdminSearchAnalytics from "../../components/AdminSearchAnalytics";'
  );
}
if(!admin.includes("<AdminSearchAnalytics")){
  const marker='<section className="mb-8 rounded-xl border border-[#765625]/50 bg-[#0b0d0d] p-5">';
  const idx=admin.indexOf(marker);
  if(idx>=0) admin=admin.slice(0,idx)+'<AdminSearchAnalytics />\n\n        '+admin.slice(idx);
}
write("app/admin/page.tsx",admin);

/* CSS: toolbar, dar menü, görünür search ve xp */
let css=read("app/globals.css");
if(!css.includes("HASWOLF MEGA REPAIR")){
css += `

/* HASWOLF MEGA REPAIR */
html,body{margin-top:0!important;top:0!important}
.goog-te-banner-frame,.goog-te-banner-frame.skiptranslate,
iframe.goog-te-banner-frame,.skiptranslate>iframe,
#goog-gt-tt,.goog-te-balloon-frame{display:none!important}
body>.skiptranslate{display:none!important}
.haswolf-google-translate{position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none}

.haswolf-language-compact{position:relative}
.haswolf-language-compact>button{display:flex;align-items:center;gap:.35rem;min-width:4.5rem;min-height:3rem;padding:.5rem .7rem;border:1px solid rgba(217,170,74,.38);border-radius:.75rem;background:#111313;color:#f1cc76}
.haswolf-language-compact>button i{font-style:normal;color:#777}
.haswolf-language-compact__menu{position:absolute;z-index:160;right:0;top:calc(100% + .55rem);display:grid;grid-template-columns:1fr 1fr;width:18rem;max-height:20rem;overflow:auto;padding:.45rem;border:1px solid rgba(217,170,74,.4);border-radius:.85rem;background:rgba(6,8,8,.99);box-shadow:0 25px 80px rgba(0,0,0,.75)}
.haswolf-language-compact__menu button{display:grid;grid-template-columns:auto 1fr auto;gap:.45rem;align-items:center;padding:.55rem;border-radius:.55rem;text-align:left;color:#c7caca;font-size:.7rem}
.haswolf-language-compact__menu button:hover,.haswolf-language-compact__menu button.is-active{background:rgba(217,170,74,.12);color:#efc76e}
.haswolf-language-compact__menu button b{color:#6d7272;font-size:.58rem}

.haswolf-smart-search{display:block!important;margin-top:.15rem}
.haswolf-product-xp{display:block!important}
.haswolf-product-xp__actions button{cursor:pointer}
.haswolf-notification-panel{width:min(21rem,calc(100vw - 1rem))!important;max-height:25rem!important}
.haswolf-notification-list{max-height:18rem!important}

.haswolf-product-card{position:relative}
.haswolf-product-card:hover{box-shadow:0 20px 55px rgba(0,0,0,.48),0 0 28px rgba(217,170,74,.08)}
.haswolf-category-drawer[open] .haswolf-category-summary__chevron{transform:rotate(180deg)}
.haswolf-category-summary__chevron{transition:transform .2s ease}

@media(max-width:760px){
  .haswolf-language-compact__menu{position:fixed;top:5rem;left:.5rem;right:.5rem;width:auto;grid-template-columns:1fr 1fr}
}
`;
}
write("app/globals.css",css);

/* Son kez tüm kaynaklarda mojibake düzelt */
const sourceExt=new Set([".ts",".tsx",".js",".jsx",".mjs",".css",".sql",".md"]);
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(["node_modules",".next",".git",".haswolf-backup-mega-repair"].includes(entry.name)) continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(full);
    else if(sourceExt.has(path.extname(entry.name))){
      const rel=path.relative(root,full);
      try{repairFileEncoding(rel)}catch{}
    }
  }
}
walk(root);

console.log("");
console.log("HASWOLF v4 Mega Repair başarıyla uygulandı.");
console.log("Yedek:",backupRoot);
console.log("");
console.log("Şimdi:");
console.log("1) Ctrl+C ile geliştirme sunucusunu durdur.");
console.log("2) .next klasörünü sil: Remove-Item .next -Recurse -Force");
console.log("3) npm run dev");
console.log("4) Tarayıcıda Ctrl+Shift+R");

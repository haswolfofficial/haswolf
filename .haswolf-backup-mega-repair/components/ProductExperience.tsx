"use client";

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

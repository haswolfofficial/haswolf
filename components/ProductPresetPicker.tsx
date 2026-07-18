"use client";
const presets={
 item:Array.from({length:3},(_,i)=>`/images/product-presets/item/item-${i+1}.svg`),
 yang:Array.from({length:3},(_,i)=>`/images/product-presets/yang/yang-${i+1}.svg`),
 dc:Array.from({length:3},(_,i)=>`/images/product-presets/dc/dc-${i+1}.svg`),
 account:[],
};
export function autoPreset(category:keyof typeof presets,name:string){
 const list=presets[category];if(!list.length)return null;
 let hash=0;for(const ch of name)hash=(hash*31+ch.charCodeAt(0))>>>0;
 return list[hash%list.length];
}
export default function ProductPresetPicker({category,value,onChange}:{category:keyof typeof presets;value:string;onChange:(value:string)=>void}){
 const list=presets[category];
 if(!list.length)return <p className="haswolf-preset-note">Hesap ilanlarında özel görsel yükleyebilirsin.</p>;
 return <div className="haswolf-preset-picker"><header><div><strong>HASWOLF Hazır Görseller</strong><small>Görsel yüklemezsen otomatik seçim yapılır.</small></div><button type="button" onClick={()=>onChange("")}>Otomatik Seç</button></header><div>{list.map(src=><button type="button" key={src} className={value===src?"is-selected":""} onClick={()=>onChange(src)}><img src={src} alt="HASWOLF hazır ürün görseli"/><span>{value===src?"Seçildi":"Seç"}</span></button>)}</div></div>;
}

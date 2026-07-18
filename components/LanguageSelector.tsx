"use client";

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

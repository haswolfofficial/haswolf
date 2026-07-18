"use client";
import { useEffect } from "react";

declare global { interface Window { googleTranslateElementInit?:()=>void; google?: { translate:{ TranslateElement:new(opts:unknown,id:string)=>void } } } }
export default function AutoTranslate(){
 useEffect(()=>{ const language=(navigator.languages?.[0]||navigator.language||"tr").split("-")[0]; document.documentElement.lang=language; if(language==="tr")return;
  const cookie=`/tr/${language}`; document.cookie=`googtrans=${cookie};path=/`; document.cookie=`googtrans=${cookie};path=/;domain=${location.hostname}`;
  window.googleTranslateElementInit=()=>{ if(window.google) new window.google.translate.TranslateElement({pageLanguage:"tr",autoDisplay:false},"google_translate_element") };
  if(!document.getElementById("haswolf-google-translate")){ const s=document.createElement("script");s.id="haswolf-google-translate";s.src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";s.async=true;document.body.appendChild(s) }
 },[]); return <div id="google_translate_element" className="sr-only" aria-hidden="true"/>;
}

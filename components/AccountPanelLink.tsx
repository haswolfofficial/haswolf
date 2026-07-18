"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AccountPanelLink() {
  const [visible,setVisible]=useState(false);
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setVisible(Boolean(data.session?.user)));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,session)=>setVisible(Boolean(session?.user)));
    return()=>subscription.unsubscribe();
  },[]);
  if(!visible)return null;
  return <a href="/hesabim" className="haswolf-account-panel-link"><span>👤</span><span>Hesabım</span></a>;
}

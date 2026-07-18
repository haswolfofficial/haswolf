"use client";
import { useEffect,useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ChatRoom } from "../../../types/chat";

type Profile={id:string;nickname:string|null;forced_room_slug:string|null};

export default function CommunityAdminTools({
  rooms,onRoomsChanged,onForceCurrentRoom,
}:{
  rooms:ChatRoom[];
  onRoomsChanged:()=>void;
  onForceCurrentRoom:(room:ChatRoom)=>void;
}){
  const [open,setOpen]=useState(false);
  const [name,setName]=useState("");
  const [slug,setSlug]=useState("");
  const [kind,setKind]=useState<"text"|"voice">("text");
  const [category,setCategory]=useState("chat");
  const [guild,setGuild]=useState("");
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [message,setMessage]=useState("");

  useEffect(()=>{if(open)loadProfiles()},[open]);
  async function loadProfiles(){
    const {data}=await supabase.from("profiles").select("id,nickname,forced_room_slug").order("nickname");
    setProfiles((data||[]) as Profile[]);
  }
  function makeSlug(value:string){return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
  async function createRoom(){
    const clean=name.trim(); if(clean.length<2)return setMessage("Oda adı en az 2 karakter olmalı.");
    const finalSlug=slug.trim()||makeSlug(clean);
    const {data:{user}}=await supabase.auth.getUser();
    const {error}=await supabase.from("chat_rooms").insert({
      name:clean,slug:finalSlug,icon:kind==="voice"?"🔊":category==="guild"?"🛡️":"💬",
      kind,category,guild_name:category==="guild"?(guild.trim()||null):null,
      is_active:true,sort_order:category==="guild"?70:100,created_by:user?.id,
    });
    if(error)return setMessage(error.message);
    setName("");setSlug("");setGuild("");setMessage("Oda oluşturuldu.");onRoomsChanged();
  }
  async function rename(room:ChatRoom){
    const next=prompt("Yeni oda adı",room.name)?.trim();if(!next)return;
    const {error}=await supabase.from("chat_rooms").update({name:next}).eq("id",room.id);
    if(error)setMessage(error.message);else onRoomsChanged();
  }
  async function toggle(room:ChatRoom){
    const current=(room as ChatRoom & {is_active?:boolean}).is_active!==false;
    await supabase.from("chat_rooms").update({is_active:!current}).eq("id",room.id);
    onRoomsChanged();
  }
  async function remove(room:ChatRoom){
    if(!confirm(`${room.name} odası silinsin mi?`))return;
    const {error}=await supabase.from("chat_rooms").delete().eq("id",room.id);
    if(error)setMessage(error.message);else onRoomsChanged();
  }
  async function moveMember(profile:Profile,room:ChatRoom){
    const {error}=await supabase.from("profiles").update({forced_room_slug:room.slug}).eq("id",profile.id);
    if(error)setMessage(error.message);else{setMessage(`${profile.nickname||"Üye"} → ${room.name}`);loadProfiles();}
  }

  return <>
    <button type="button" className="haswolf-room-admin-trigger" onClick={()=>setOpen(true)}>⚙ Oda Yönetimi</button>
    {open&&<div className="haswolf-room-admin-modal"><div>
      <header><div><small>YÖNETİM</small><h2>Oda ve Üye Yönetimi</h2></div><button onClick={()=>setOpen(false)}>×</button></header>
      <div className="haswolf-room-admin-grid">
        <section><h3>Yeni oda oluştur</h3>
          <input value={name} onChange={e=>{setName(e.target.value);setSlug(makeSlug(e.target.value))}} placeholder="Oda adı"/>
          <input value={slug} onChange={e=>setSlug(e.target.value)} placeholder="oda-slug"/>
          <div className="haswolf-room-admin-row"><select value={kind} onChange={e=>setKind(e.target.value as "text"|"voice")}><option value="text">Sohbet</option><option value="voice">Ses</option></select>
          <select value={category} onChange={e=>setCategory(e.target.value)}><option value="chat">Genel</option><option value="guild">Lonca</option><option value="announcement">Duyuru</option></select></div>
          {category==="guild"&&<input value={guild} onChange={e=>setGuild(e.target.value)} placeholder="Lonca adı"/>}
          <button className="haswolf-room-primary" onClick={createRoom}>Odayı oluştur</button>
          <h3>Mevcut odalar</h3><div className="haswolf-room-list">{rooms.map(room=><article key={room.id}><span>{room.icon} {room.name}<small>#{room.slug}</small></span><div><button onClick={()=>onForceCurrentRoom(room)}>Git</button><button onClick={()=>rename(room)}>Ad</button><button onClick={()=>toggle(room)}>Aç/Kapat</button><button onClick={()=>remove(room)}>Sil</button></div></article>)}</div>
        </section>
        <section><h3>Üyeyi odaya taşı</h3><p>Üye bir sonraki Realtime güncellemesinde seçilen odaya aktarılır.</p>
          <div className="haswolf-member-move-list">{profiles.map(profile=><article key={profile.id}><div><strong>{profile.nickname||"Mahlassız üye"}</strong><small>{profile.forced_room_slug||"Serbest"}</small></div><select defaultValue="" onChange={e=>{const room=rooms.find(r=>r.slug===e.target.value);if(room)moveMember(profile,room);e.currentTarget.value=""}}><option value="">Odaya taşı…</option>{rooms.map(room=><option key={room.id} value={room.slug}>{room.name}</option>)}</select></article>)}</div>
        </section>
      </div>
      {message&&<p className="haswolf-room-admin-message">{message}</p>}
    </div></div>}
  </>;
}

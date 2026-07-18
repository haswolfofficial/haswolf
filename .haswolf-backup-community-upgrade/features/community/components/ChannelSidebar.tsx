import type { ChatRoom } from "../../../types/chat";

type Props={
  rooms:ChatRoom[];selectedRoom:ChatRoom;onSelectRoom:(room:ChatRoom)=>void;
  canManageRooms?:boolean;onManageRooms?:()=>void;
};
export default function ChannelSidebar({rooms,selectedRoom,onSelectRoom,canManageRooms,onManageRooms}:Props){
  const active=rooms.filter(r=>(r as ChatRoom&{is_active?:boolean}).is_active!==false);
  const announcement=active.filter(r=>(r as ChatRoom&{category?:string}).category==="announcement"||r.slug==="news");
  const guilds=active.filter(r=>(r as ChatRoom&{category?:string}).category==="guild"&&!(r as ChatRoom&{kind?:string}).kind?.startsWith("voice")&&!r.slug.startsWith("voice"));
  const text=active.filter(r=>!announcement.includes(r)&&!guilds.includes(r)&&!((r as ChatRoom&{kind?:string}).kind==="voice"||r.slug.startsWith("voice")));
  const voice=active.filter(r=>(r as ChatRoom&{kind?:string}).kind==="voice"||r.slug.startsWith("voice"));
  function roomButton(room:ChatRoom,isVoice=false){const selected=selectedRoom.slug===room.slug;return <button key={room.id} onClick={()=>onSelectRoom(room)} className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${selected?"bg-[#d9aa4a]/15 text-[#f1c76c]":"text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}><span>{room.icon}</span><span className="flex-1 font-medium">{room.name}</span>{isVoice&&<i className={`h-2 w-2 rounded-full ${selected?"bg-green-400":"bg-zinc-700"}`}/>}</button>}
  function section(title:string,list:ChatRoom[],isVoice=false){if(!list.length)return null;return <section><p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[.18em] text-zinc-500">{title}</p><div className="space-y-1">{list.map(r=>roomButton(r,isVoice))}</div></section>}
  return <aside className="h-full w-64 shrink-0 border-r border-zinc-800 bg-[#090b0d]"><a href="/" className="block border-b border-zinc-800 px-5 py-5"><div className="flex items-center gap-3"><span className="text-3xl">🐺</span><div><h1 className="text-xl font-black tracking-widest text-[#d9aa4a]">HASWOLF</h1><p className="text-[10px] tracking-[.25em] text-zinc-500">TOPLULUK</p></div></div></a><div className="h-[calc(100vh-82px)] overflow-y-auto p-3 space-y-4">{section("Duyurular",announcement)}{section("Sohbet Kanalları",text)}{section("Lonca Odaları",guilds)}{section("Ses Kanalları",voice,true)}{canManageRooms&&<button onClick={onManageRooms} className="w-full rounded-lg border border-[#765625] px-3 py-2.5 text-sm font-bold text-[#e5b64e]">⚙ Oda Yönetimi</button>}</div></aside>;
}

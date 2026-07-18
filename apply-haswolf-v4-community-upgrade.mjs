
import fs from "node:fs";
import path from "node:path";
const root=process.cwd(), backup=path.join(root,".haswolf-backup-community-upgrade");
const read=p=>fs.readFileSync(path.join(root,p),"utf8").replace(/^\uFEFF/,"");
const write=(p,c)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),c,"utf8")};
const copy=(src,dst)=>{write(dst,fs.readFileSync(path.join(root,src),"utf8"))};
function bak(p){const s=path.join(root,p),d=path.join(backup,p);fs.mkdirSync(path.dirname(d),{recursive:true});if(fs.existsSync(s)&&!fs.existsSync(d))fs.copyFileSync(s,d)}
["app/page.tsx","app/layout.tsx","app/globals.css","components/FloatingWhatsApp.tsx","features/community/components/CommunityLayout.tsx","features/community/components/ChannelSidebar.tsx"].forEach(bak);
copy("_upgrade/components/NotificationCenter.tsx","components/NotificationCenter.tsx");
copy("_upgrade/components/AccountPanelLink.tsx","components/AccountPanelLink.tsx");
copy("_upgrade/components/FloatingWhatsApp.tsx","components/FloatingWhatsApp.tsx");
copy("_upgrade/features/community/components/CommunityAdminTools.tsx","features/community/components/CommunityAdminTools.tsx");
copy("_upgrade/features/community/components/ChannelSidebar.tsx","features/community/components/ChannelSidebar.tsx");

let layout=read("app/layout.tsx");
if(!layout.includes('import AutoTranslate')){
 layout=layout.replace('import FloatingWhatsApp from "@/components/FloatingWhatsApp";','import FloatingWhatsApp from "@/components/FloatingWhatsApp";\nimport AutoTranslate from "@/components/AutoTranslate";');
 layout=layout.replace('{children}\n        <FloatingWhatsApp />','<AutoTranslate />\n        {children}\n        <FloatingWhatsApp />');
}
write("app/layout.tsx",layout);

let page=read("app/page.tsx");
if(!page.includes('import AccountPanelLink')){
 page=page.replace('import LanguageSelector from "../components/LanguageSelector";','import LanguageSelector from "../components/LanguageSelector";\nimport AccountPanelLink from "../components/AccountPanelLink";');
}
/* remove top header trade block */
page=page.replace(/\s*<div className="haswolf-header-trade">[\s\S]*?<\/div>\s*(?=<div className="haswolf-topbar__actions">)/,"");
page=page.replace('<AuthButton />','<AccountPanelLink />\n              <AuthButton />');
page=page.replace('{isAdmin && <a href="/admin"><span aria-hidden="true">🛡</span><span>Admin</span></a>}',
'{isAdmin && <a href="/admin"><span aria-hidden="true">🛡</span><span>Admin</span></a>}\n            <AccountPanelLink />');
write("app/page.tsx",page);

let community=read("features/community/components/CommunityLayout.tsx");
community=community.replace('import { rooms } from "../constants/rooms";','import CommunityAdminTools from "./CommunityAdminTools";');
if(!community.includes("fallbackRooms")){
 community=community.replace('let sharedAudioContext',`const fallbackRooms: ChatRoom[] = [
  {id:"news",name:"Duyurular",slug:"news",icon:"📢"},
  {id:"genel",name:"Genel",slug:"genel",icon:"💬"},
  {id:"ephesus",name:"Ephesus",slug:"ephesus",icon:"⚔️"},
  {id:"pergamon",name:"Pergamon",slug:"pergamon",icon:"🛡️"},
  {id:"teos",name:"Teos",slug:"teos",icon:"🔥"},
  {id:"trade",name:"Alım Satım",slug:"trade",icon:"💰"},
];
let sharedAudioContext`);
}
community=community.replace('const [selectedRoom, setSelectedRoom] = useState(rooms[0]);',
'const [availableRooms,setAvailableRooms]=useState<ChatRoom[]>(fallbackRooms);\n  const [selectedRoom, setSelectedRoom] = useState(fallbackRooms[0]);\n  const [adminToolsOpen,setAdminToolsOpen]=useState(false);');
if(!community.includes("loadCommunityRooms")){
 community=community.replace('  function selectRoom(room: ChatRoom) {',`  async function loadCommunityRooms(){
    const {data}=await supabase.from("chat_rooms").select("id,name,slug,icon,kind,category,guild_name,is_active,sort_order").order("sort_order");
    const next=(data||[]).map((row:any)=>({...row,icon:row.icon||"💬"})) as ChatRoom[];
    if(next.length)setAvailableRooms(next);
  }
  useEffect(()=>{
    void loadCommunityRooms();
    const channel=supabase.channel("community-rooms-live").on("postgres_changes",{event:"*",schema:"public",table:"chat_rooms"},()=>void loadCommunityRooms()).subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[]);
  useEffect(()=>{
    const channel=supabase.channel(\`forced-room-\${currentUserId}\`).on("postgres_changes",{event:"UPDATE",schema:"public",table:"profiles",filter:\`id=eq.\${currentUserId}\`},(payload)=>{
      const slug=String((payload.new as any).forced_room_slug||"");
      const room=availableRooms.find(item=>item.slug===slug);if(room)selectRoom(room);
    }).subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[currentUserId,availableRooms]);

  function selectRoom(room: ChatRoom) {`);
}
community=community.replace(/\{rooms\.map\(\(room\) => \(/g,'{availableRooms.map((room) => (');
community=community.replace(/rooms=\{rooms\}/g,'rooms={availableRooms}');
/* ChannelSidebar calls */
community=community.replace(/<ChannelSidebar\s+rooms=\{availableRooms\}\s+selectedRoom=\{selectedRoom\}\s+onSelectRoom=\{selectRoom\}\s*\/>/g,
'<ChannelSidebar rooms={availableRooms} selectedRoom={selectedRoom} onSelectRoom={selectRoom} canManageRooms={canManageMembers} onManageRooms={() => setAdminToolsOpen(true)} />');
/* if multiline simpler add props after onSelectRoom */
community=community.replace('onSelectRoom={selectRoom}\n          />','onSelectRoom={selectRoom}\n            canManageRooms={canManageMembers}\n            onManageRooms={() => setAdminToolsOpen(true)}\n          />');
/* header manager button */
community=community.replace('<div className="flex shrink-0 items-center gap-2">','<div className="flex shrink-0 items-center gap-2">\n            {canManageMembers && <button type="button" onClick={() => setAdminToolsOpen(true)} className="haswolf-room-admin-trigger">⚙ Odalar</button>}');
/* modal near end */
community=community.replace('{wolfVisible && (','{adminToolsOpen && canManageMembers && <CommunityAdminTools rooms={availableRooms} onRoomsChanged={loadCommunityRooms} onForceCurrentRoom={(room) => { selectRoom(room); setAdminToolsOpen(false); }} />}\n\n      {wolfVisible && (');
write("features/community/components/CommunityLayout.tsx",community);

let css=read("app/globals.css");
if(!css.includes("HASWOLF COMMUNITY UPGRADE")){
 css+=`
/* HASWOLF COMMUNITY UPGRADE */
.haswolf-account-panel-link{display:inline-flex;align-items:center;gap:.4rem;min-height:3rem;padding:.6rem .8rem;border:1px solid rgba(217,170,74,.35);border-radius:.75rem;color:#efca76;font-size:.72rem;font-weight:800;background:rgba(217,170,74,.06)}
.haswolf-sell-button{border-color:rgba(238,164,49,.65)!important;background:linear-gradient(135deg,#6d3e0a,#c27c16)!important;color:#fff2cf!important}
.haswolf-sell-button:hover{background:linear-gradient(135deg,#8b4e0a,#e39b24)!important;box-shadow:0 0 24px rgba(227,155,36,.28)!important}
.haswolf-room-admin-trigger{border:1px solid rgba(217,170,74,.4);border-radius:.65rem;padding:.5rem .7rem;color:#e8bd65;background:rgba(217,170,74,.08);font-size:.7rem;font-weight:800}
.haswolf-room-admin-modal{position:fixed;z-index:300;inset:0;display:grid;place-items:center;padding:1rem;background:rgba(0,0,0,.82);backdrop-filter:blur(10px)}
.haswolf-room-admin-modal>div{width:min(70rem,100%);max-height:90vh;overflow:auto;border:1px solid rgba(217,170,74,.42);border-radius:1.1rem;background:#090b0c;box-shadow:0 35px 120px #000}
.haswolf-room-admin-modal header{display:flex;justify-content:space-between;padding:1rem 1.2rem;border-bottom:1px solid #26292b}.haswolf-room-admin-modal header small{color:#d9aa4a}.haswolf-room-admin-modal header h2{font-size:1.2rem;font-weight:900}
.haswolf-room-admin-grid{display:grid;grid-template-columns:1fr 1fr;gap:1rem;padding:1rem}.haswolf-room-admin-grid section{border:1px solid #252829;border-radius:.85rem;padding:1rem;background:#0e1112}.haswolf-room-admin-grid h3{margin:.4rem 0 .7rem;color:#e5b64e;font-weight:900}
.haswolf-room-admin-grid input,.haswolf-room-admin-grid select{width:100%;margin-bottom:.5rem;border:1px solid #303536;border-radius:.6rem;background:#070909;padding:.65rem;color:white}.haswolf-room-admin-row{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
.haswolf-room-primary{width:100%;border-radius:.65rem;background:#d9aa4a;padding:.7rem;color:#111;font-weight:900}
.haswolf-room-list article,.haswolf-member-move-list article{display:flex;align-items:center;justify-content:space-between;gap:.5rem;border-bottom:1px solid #242728;padding:.65rem 0}.haswolf-room-list article span small,.haswolf-member-move-list small{display:block;color:#686d6e;font-size:.62rem}.haswolf-room-list article div{display:flex;flex-wrap:wrap;gap:.3rem}.haswolf-room-list button{border:1px solid #383d3e;border-radius:.45rem;padding:.35rem .45rem;font-size:.62rem}.haswolf-room-admin-message{margin:0 1rem 1rem;border-radius:.65rem;background:rgba(217,170,74,.1);padding:.65rem;color:#e8c575}
.haswolf-floating-whatsapp--community{left:1.25rem!important;right:auto!important}
@media(max-width:800px){.haswolf-room-admin-grid{grid-template-columns:1fr}.haswolf-account-panel-link span:last-child{display:none}}
`;
}
write("app/globals.css",css);
console.log("HASWOLF Community + Notification paketi uygulandı.");
console.log("SQL: supabase/haswolf_v4_community_upgrade.sql");

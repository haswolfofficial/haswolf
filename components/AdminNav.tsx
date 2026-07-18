"use client";
import { usePathname } from "next/navigation";
const links=[
["/admin","Genel Bakış","⌂"],["/admin/urunler","Ürünler ve Görseller","▦"],
["/admin/kullanicilar","Kullanıcı Yönetimi","👥"],["/admin/yetkililer","Yönetici Üyelikleri","♛"],["/admin/premium","Premium Üyelikler","★"],
["/admin/loncalar","Lonca Yönetimi","🛡"],["/admin/sohbet","Sohbet Yönetimi","💬"],
["/admin/moderasyon","AI Moderasyon","✦"],["/admin/guvenlik","Güvenlik Merkezi","🔒"],
["/admin/reklamlar","Reklam ve Duyurular","📣"],["/admin/bildirimler","Bildirim Yönetimi","🔔"],
["/admin/analitik","Analitik","▥"],["/admin/denetim","Denetim Günlüğü","☷"],
];
export default function AdminNav(){
 const path=usePathname();
 return <nav className="haswolf-admin-nav"><a href="/" className="haswolf-admin-nav__brand">HASWOLF<small>V5 ULTIMATE ADMIN</small></a>
 <div>{links.map(([href,label,icon])=><a key={href} href={href} className={path===href?"is-active":""}><span>{icon}</span><b>{label}</b></a>)}</div></nav>;
}

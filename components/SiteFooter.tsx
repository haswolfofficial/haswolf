const columns = [
  {title:"Platform",links:[["Market","/#market"],["Sohbet Odaları","/topluluk"],["HASWOLF TV","https://www.youtube.com/@ROYALEONLINEHASWOLF"],["Çekiliş Merkezi","/cekilis"]]},
  {title:"Güven",links:[["Güvenli Ticaret","/guvenli-ticaret"],["Satıcı Doğrulama","/satici-dogrulama"],["Topluluk Kuralları","/topluluk-kurallari"],["Gizlilik","/gizlilik"]]},
  {title:"Destek",links:[["7/24 WhatsApp","https://wa.me/905010942080"],["Sık Sorulanlar","/sss"],["İletişim","/iletisim"],["Sorun Bildir","/sorun-bildir"]]},
];
export default function SiteFooter(){
  return <footer id="footer" className="haswolf-footer"><div className="haswolf-container py-10 sm:py-14">
    <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.35fr_1fr_1fr_1fr]">
      <div><p className="text-2xl font-black tracking-[0.18em] text-[#e7b84f]">HASWOLF</p><p className="mt-4 max-w-md text-sm leading-7 text-zinc-400">Güvenli ticaret, gerçek zamanlı topluluk, şeffaf çekiliş ve seçkin içerikleri tek çatı altında sunan yeni nesil oyuncu platformu.</p></div>
      {columns.map(c=><FooterColumn key={c.title} title={c.title} links={c.links}/>)}
    </div>
    <div className="flex flex-col gap-3 pt-7 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between"><p>© 2026 HASWOLF. Tüm hakları saklıdır.</p><div className="flex flex-wrap gap-3"><a href="/kullanim-kosullari">Kullanım Koşulları</a><a href="/cerez-politikasi">Çerez Politikası</a><a href="/gizlilik">Gizlilik</a></div></div>
  </div></footer>;
}
function FooterColumn({title,links}:{title:string;links:string[][]}) {
  return <div><h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#dfb456]">{title}</h3><div className="mt-5 flex flex-col gap-3 text-sm text-zinc-400">{links.map(([label,href])=><a key={label} href={href} target={href.startsWith("http")?"_blank":undefined} rel={href.startsWith("http")?"noreferrer":undefined} className="transition hover:text-white">{label}</a>)}</div></div>;
}

const footerGroups = [
  {
    title: "Platform",
    links: [
      ["Market", "/#market"],
      ["Sohbet Odaları", "/topluluk"],
      ["Çekiliş Merkezi", "/cekilis"],
      ["Uygulamayı Kur", "/uygulama"],
    ],
  },
  {
    title: "Güven",
    links: [
      ["Güvenli Ticaret", "/guvenli-ticaret"],
      ["Satıcı Doğrulama", "/satici-dogrulama"],
      ["Topluluk Kuralları", "/topluluk-kurallari"],
      ["Gizlilik", "/gizlilik"],
    ],
  },
  {
    title: "Yasal",
    links: [
      ["Kullanım Koşulları", "/kullanim-kosullari"],
      ["Çerez Politikası", "/cerez-politikasi"],
      ["Sık Sorulanlar", "/sss"],
      ["Sorun Bildir", "/sorun-bildir"],
    ],
  },
  {
    title: "Resmî Kanallar",
    links: [
      ["WhatsApp Destek", "https://wa.me/905010942080"],
      ["YouTube", "https://www.youtube.com/@ROYALEONLINEHASWOLF"],
      ["Instagram", "https://www.instagram.com/royaleonlinehaswolf"],
      ["TikTok", "https://www.tiktok.com/@haswolfgame"],
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer id="footer" className="border-t border-[#8c641e]/35 bg-[radial-gradient(circle_at_10%_0%,rgba(217,170,74,.08),transparent_25%),#050606]">
      <div className="haswolf-container py-10 sm:py-14">
        <div className="grid gap-10 border-b border-white/10 pb-10 sm:grid-cols-2 xl:grid-cols-[1.35fr_repeat(4,1fr)]">
          <div>
            <a href="/" className="inline-block text-2xl font-black tracking-[.18em] text-[#e7b84f] transition hover:text-white">HASWOLF</a>
            <p className="mt-4 max-w-sm text-sm leading-7 text-zinc-400">
              Güvenli pazar, gerçek zamanlı topluluk, şeffaf çekiliş ve seçkin oyun içeriklerini tek çatı altında birleştiren oyuncu platformu.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Güvenli ticaret", "Şeffaf çekiliş", "7/24 destek"].map((tag) => (
                <span key={tag} className="rounded-full border border-[#8c641e]/35 bg-black/30 px-3 py-1.5 text-xs text-[#d9aa4a]">{tag}</span>
              ))}
            </div>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-bold uppercase tracking-[.2em] text-[#d9aa4a]">{group.title}</h3>
              <div className="mt-5 flex flex-col gap-3 text-sm text-zinc-400">
                {group.links.map(([label, href]) => (
                  <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="transition hover:translate-x-1 hover:text-white">
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-7 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 HASWOLF. Tüm hakları saklıdır.</p>
          <p>Güvenli ticaret • Topluluk güvenliği • Şeffaf sonuçlar</p>
        </div>
      </div>
    </footer>
  );
}

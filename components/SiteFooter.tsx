export default function SiteFooter() {
  return (
    <footer id="footer" className="haswolf-footer">
      <div className="haswolf-container py-10 sm:py-14">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1.35fr_1fr_1fr_1fr]">
          <div>
            <p className="text-2xl font-black tracking-[0.18em] text-[#e7b84f]">HASWOLF</p>
            <p className="mt-4 max-w-md text-sm leading-7 text-zinc-400">
              Oyuncuları güvenli ticaret, gerçek zamanlı topluluk ve seçkin içeriklerle tek çatı altında buluşturan yeni nesil platform.
            </p>
          </div>

          <FooterColumn title="Platform" links={["Market", "Sohbet Odaları", "HASWOLF TV", "Çekiliş Merkezi"]} />
          <FooterColumn title="Güven" links={["Güvenli Ticaret", "Satıcı Doğrulama", "Topluluk Kuralları", "Gizlilik"]} />
          <FooterColumn title="Destek" links={["7/24 WhatsApp", "Sık Sorulanlar", "İletişim", "Sorun Bildir"]} />
        </div>

        <div className="flex flex-col gap-3 pt-7 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 HASWOLF. Tüm hakları saklıdır.</p>
          <p>Güvenilir • Hızlı • Profesyonel</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-[#dfb456]">{title}</h3>
      <div className="mt-5 flex flex-col gap-3 text-sm text-zinc-400">
        {links.map((link) => (
          <a key={link} href="#" className="transition hover:text-white">
            {link}
          </a>
        ))}
      </div>
    </div>
  );
}

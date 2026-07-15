"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const socialChannels = [
  { name: "YouTube", handle: "HASWOLF TV", href: "https://www.youtube.com/@ROYALEONLINEHASWOLF", icon: "▶" },
  { name: "Instagram", handle: "@royaleonlinehaswolf", href: "https://www.instagram.com/royaleonlinehaswolf", icon: "◎" },
  { name: "TikTok", handle: "@haswolfgame", href: "https://www.tiktok.com/@haswolfgame", icon: "♪" },
  { name: "Discord", handle: "HASWOLF Topluluğu", href: "/#footer", icon: "☁" },
];

const draws = [
  {
    id: 1,
    status: "Yakında",
    title: "HASWOLF Büyük Açılış Çekilişi",
    prize: "5.000 TL değerinde Item / Yang ödülü",
    description: "HASWOLF topluluğunun açılışına özel, farklı sunucularda kullanılabilecek büyük ödül paketi.",
    platform: "Tüm Kanallar",
    date: "Tarih yakında açıklanacak",
    participants: "Katılım açılmadı",
  },
  {
    id: 2,
    status: "Planlanıyor",
    title: "Haftalık Topluluk Ödülü",
    prize: "Sunucuya özel sürpriz paket",
    description: "Aktif topluluk üyeleri arasından şeffaf seçim sistemiyle haftalık kazanan belirlenecek.",
    platform: "Discord + Instagram",
    date: "Her hafta",
    participants: "Detaylar yakında",
  },
  {
    id: 3,
    status: "Planlanıyor",
    title: "Video Etkileşim Çekilişi",
    prize: "Premium item ve yang paketi",
    description: "YouTube ve TikTok içeriklerine katılım gösteren takipçiler için dönemsel özel çekiliş.",
    platform: "YouTube + TikTok",
    date: "Dönemsel",
    participants: "Detaylar yakında",
  },
];

const faqs = [
  ["Çekilişe nasıl katılırım?", "Aktif çekiliş kartındaki Katıl düğmesine basıp belirtilen sosyal medya adımlarını tamamlaman yeterlidir."],
  ["Kazananlar nasıl belirlenir?", "Katılım şartlarını sağlayan kullanıcılar arasından kayıt altına alınan şeffaf seçim yöntemiyle kazanan belirlenir."],
  ["Kazanan nereden duyurulur?", "Kazananlar bu sayfada ve çekilişin yapıldığı resmi HASWOLF sosyal medya kanalında duyurulur."],
  ["Ödül teslimatı nasıl yapılır?", "Kimlik ve hesap doğrulaması sonrasında, belirtilen sunucuda güvenli teslimat süreci başlatılır."],
];

export default function CekilisPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [filter, setFilter] = useState("Tümü");

  const visibleDraws = useMemo(() => {
    if (filter === "Tümü") return draws;
    return draws.filter((draw) => draw.platform.includes(filter));
  }, [filter]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050606] text-white">
      <header className="sticky top-0 z-30 border-b border-[#8c641e]/40 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d9aa4a]/50 bg-[#130d04] text-xl text-[#e6b84f]">🐺</div>
            <div>
              <strong className="block tracking-[.18em] text-[#dfb354]">HASWOLF</strong>
              <span className="text-[10px] tracking-[.24em] text-zinc-500">ÇEKİLİŞ MERKEZİ</span>
            </div>
          </Link>
          <Link href="/" className="rounded-xl border border-[#9c7229]/55 px-4 py-2.5 text-sm font-semibold text-[#e5bd68] transition hover:bg-[#d9aa4a] hover:text-black">Ana Sayfa</Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#8c641e]/35 bg-[radial-gradient(circle_at_70%_25%,rgba(196,123,15,.32),transparent_28%),linear-gradient(115deg,#050505_20%,#140b02_75%,#050505)]">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle,#d9aa4a_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative mx-auto grid max-w-[1400px] gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-[.28em] text-[#d9aa4a]">ŞEFFAF • GÜVENLİ • TOPLULUK ODAKLI</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">HASWOLF Çekiliş Merkezi</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">Resmî sosyal medya kanallarındaki bütün çekilişler, katılım şartları, sonuçlar ve kazanan duyuruları tek merkezde.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#aktif-cekilisler" className="rounded-xl bg-gradient-to-b from-[#f3c85f] to-[#a96d17] px-5 py-3 font-bold text-black">Çekilişleri Gör</a>
              <a href="#nasil-katilir" className="rounded-xl border border-[#a77928]/60 bg-black/30 px-5 py-3 font-semibold text-[#e6bd68]">Nasıl Katılırım?</a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["★", "Tek Merkez", "Tüm çekilişler tek sayfada"],
              ["✓", "Şeffaf Seçim", "Katılım ve sonuç süreci açık"],
              ["🛡", "Güvenli Teslimat", "Doğrulanmış ödül teslimi"],
              ["🔔", "Anlık Duyuru", "Kazananlar resmî kanallarda"],
            ].map(([icon, title, text]) => (
              <div key={title} className="rounded-2xl border border-[#8c641e]/45 bg-black/55 p-5 backdrop-blur">
                <div className="text-2xl text-[#e5b64e]">{icon}</div>
                <h2 className="mt-3 font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6" id="aktif-cekilisler">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[.25em] text-[#d9aa4a]">AKTİF VE PLANLANAN</p>
            <h2 className="mt-2 text-3xl font-black">Çekilişler</h2>
            <p className="mt-3 text-zinc-500">Resmî HASWOLF kanallarındaki güncel çekiliş planı.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Tümü", "Instagram", "YouTube", "TikTok", "Discord"].map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`rounded-lg border px-3 py-2 text-sm transition ${filter === item ? "border-[#d9aa4a] bg-[#d9aa4a] text-black" : "border-white/10 bg-white/5 text-zinc-400 hover:border-[#9c7229]"}`}>{item}</button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {visibleDraws.map((draw) => (
            <article key={draw.id} className="overflow-hidden rounded-2xl border border-[#765625]/50 bg-[linear-gradient(180deg,#14120d,#080909)] shadow-2xl shadow-black/20">
              <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(217,170,74,.2),transparent_40%)] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#d9aa4a]/50 bg-[#d9aa4a]/10 px-3 py-1 text-xs font-bold text-[#efc96e]">{draw.status}</span>
                  <span className="text-xs text-zinc-500">{draw.platform}</span>
                </div>
                <h3 className="mt-5 text-xl font-black text-[#e8bd67]">{draw.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{draw.description}</p>
              </div>
              <div className="space-y-4 p-5">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <span className="text-xs text-zinc-500">ÖDÜL</span>
                  <strong className="mt-1 block text-lg">{draw.prize}</strong>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white/5 p-3"><span className="block text-xs text-zinc-500">Tarih</span><span className="mt-1 block">{draw.date}</span></div>
                  <div className="rounded-lg bg-white/5 p-3"><span className="block text-xs text-zinc-500">Katılım</span><span className="mt-1 block">{draw.participants}</span></div>
                </div>
                <button disabled className="w-full cursor-not-allowed rounded-xl border border-[#9d701c]/40 bg-[#9d701c]/15 px-4 py-3 font-bold text-[#d8b361] opacity-80">Katılım Yakında Açılacak</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="nasil-katilir" className="border-y border-[#765625]/35 bg-[#090b0b]">
        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[.25em] text-[#d9aa4a]">4 BASİT ADIM</p>
            <h2 className="mt-2 text-3xl font-black">Nasıl Katılırım?</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ["1", "Çekilişi Seç", "Aktif çekiliş kartını ve ödül detaylarını incele."],
              ["2", "Şartları Tamamla", "İlgili sosyal medya hesabını takip et ve belirtilen görevi yap."],
              ["3", "Katılımını Doğrula", "Kullanıcı adını doğru girerek katılım kaydını tamamla."],
              ["4", "Sonucu Takip Et", "Kazanan duyurusunu bu sayfa ve resmî kanal üzerinden gör."],
            ].map(([number, title, text]) => (
              <div key={number} className="rounded-2xl border border-[#765625]/45 bg-black/30 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d9aa4a] font-black text-black">{number}</div>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <div className="rounded-2xl border border-[#765625]/45 bg-[#0b0d0d] p-6">
            <p className="text-xs font-bold tracking-[.22em] text-[#d9aa4a]">RESMÎ KANALLAR</p>
            <h2 className="mt-2 text-2xl font-black">Sosyal Medya</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">Sahte hesaplara karşı yalnızca aşağıdaki resmî HASWOLF kanallarını dikkate al.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {socialChannels.map((channel) => (
                <a key={channel.name} href={channel.href} target={channel.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-[#d9aa4a]/60 hover:bg-[#d9aa4a]/5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-[#e6bd68]">{channel.icon}</span>
                  <span><strong className="block">{channel.name}</strong><small className="text-zinc-500">{channel.handle}</small></span>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#765625]/45 bg-[#0b0d0d] p-6">
            <p className="text-xs font-bold tracking-[.22em] text-[#d9aa4a]">ŞEFFAFLIK MERKEZİ</p>
            <h2 className="mt-2 text-2xl font-black">Kazananlar ve Sonuçlar</h2>
            <div className="mt-6 rounded-xl border border-dashed border-[#765625]/55 bg-black/25 px-5 py-10 text-center">
              <div className="text-4xl">🏆</div>
              <h3 className="mt-4 text-lg font-bold text-[#e5bd68]">Henüz tamamlanan çekiliş yok</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">İlk çekiliş tamamlandığında kazanan kullanıcı adı, çekiliş tarihi ve ödül teslim durumu burada yayınlanacak.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#765625]/35 bg-black/35">
        <div className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[.22em] text-[#d9aa4a]">MERAK EDİLENLER</p>
            <h2 className="mt-2 text-3xl font-black">Sık Sorulan Sorular</h2>
          </div>
          <div className="mt-7 space-y-3">
            {faqs.map(([question, answer], index) => (
              <div key={question} className="overflow-hidden rounded-xl border border-[#765625]/45 bg-[#0b0d0d]">
                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold">
                  <span>{question}</span><span className="text-[#d9aa4a]">{openFaq === index ? "−" : "+"}</span>
                </button>
                {openFaq === index && <p className="border-t border-white/10 px-5 py-4 text-sm leading-7 text-zinc-400">{answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#765625]/35 bg-black px-4 py-8 text-center text-sm text-zinc-600">
        <p>HASWOLF çekilişlerinde katılım ücretsizdir. Ödül teslimi için hiçbir kullanıcıdan şifre veya ödeme talep edilmez.</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-[#d9aa4a]">HASWOLF Market'e Dön</Link>
      </footer>
    </main>
  );
}

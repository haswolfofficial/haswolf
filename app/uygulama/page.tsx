import Link from "next/link";

export default function UygulamaPage() {
  return (
    <main className="min-h-screen bg-[#050707] px-4 py-10 text-white">
      <section className="mx-auto flex min-h-[75vh] max-w-2xl flex-col items-center justify-center rounded-3xl border border-[#9d701c]/50 bg-[radial-gradient(circle_at_top,rgba(217,170,74,.18),transparent_42%),#090a0a] p-6 text-center shadow-2xl sm:p-10">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-[#d9aa4a]/50 bg-black text-5xl shadow-[0_0_50px_rgba(217,170,74,.18)]">
          🐺
        </div>
        <p className="mt-7 text-xs font-bold tracking-[.35em] text-[#d9aa4a]">HASWOLF MOBİL</p>
        <h1 className="mt-3 text-3xl font-black sm:text-5xl"><a href="/" className="transition hover:text-[#d9aa4a]">HASWOLF</a> APK</h1>
        <p className="mt-4 max-w-lg leading-7 text-zinc-400">
          HASWOLF mobil uygulamasını Android cihazına indir. İndirme tamamlandığında APK dosyasını açıp kurulumu başlatabilirsin.
        </p>
        <a
          href="/apk/HASWOLF.apk"
          download
          className="mt-8 inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-[#efc867] to-[#a97521] px-8 font-black text-black transition hover:-translate-y-0.5"
        >
          <span className="text-2xl">⇩</span>
          UYGULAMAYI İNDİR
        </a>
        <p className="mt-4 text-xs text-zinc-500">Android APK • HASWOLF</p>
        <Link href="/" className="mt-8 text-sm font-semibold text-[#d9aa4a] hover:text-[#f2d081]">
          ← Ana sayfaya dön
        </Link>
      </section>
    </main>
  );
}

import Link from "next/link";

export default function CekilisPage() {
  return (
    <main className="min-h-screen bg-[#050505] px-4 py-16 text-white">
      <section className="mx-auto max-w-3xl rounded-3xl border border-[#9d701c]/50 bg-[radial-gradient(circle_at_top,rgba(217,170,74,.16),transparent_38%),#090909] p-8 text-center shadow-2xl shadow-amber-950/20 sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#d9aa4a]/60 bg-[#171006] text-3xl text-[#f0bd50]">★</div>
        <p className="mt-6 text-sm font-bold tracking-[.32em] text-[#d9aa4a]">HASWOLF</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">Çekiliş Merkezi</h1>
        <p className="mx-auto mt-5 max-w-xl leading-7 text-zinc-400">
          Instagram, TikTok ve YouTube çekilişleri için hazırlanan merkez yakında aktif olacak.
        </p>
        <Link href="/" className="mt-8 inline-flex rounded-xl bg-gradient-to-b from-[#f0c35b] to-[#a96e18] px-6 py-3 font-bold text-black">
          Ana Sayfaya Dön
        </Link>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#2b2417] bg-black/90 backdrop-blur">
      <div className="mx-auto flex h-24 w-full max-w-[1700px] items-center justify-between px-24">

        <Link href="/" className="flex items-center gap-5">
          <img
            src="/logo.png"
            alt="Haswolf"
            className="h-16 w-16 object-contain"
          />

          <div>
            <h1 className="text-5xl font-black tracking-[8px] text-[#d9aa4a]">
              HASWOLF
            </h1>

            <p className="text-xs tracking-[6px] text-zinc-500">
              MARKET
            </p>
          </div>
        </Link>

        <nav className="flex items-center gap-10 text-lg text-zinc-300">
          <Link href="/">Ana Sayfa</Link>
          <Link href="/topluluk">Topluluk</Link>
          <Link href="/admin">Admin</Link>
        </nav>

        <div className="flex items-center gap-4">
          <button className="rounded-xl border border-[#d9aa4a] px-7 py-3 font-bold text-[#d9aa4a]">
            Giriş Yap
          </button>

          <button className="rounded-xl bg-[#d9aa4a] px-7 py-3 font-bold text-black">
            Kayıt Ol
          </button>
        </div>

      </div>
    </header>
  );
}
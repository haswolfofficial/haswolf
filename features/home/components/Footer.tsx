export default function Footer() {
  return (
    <footer className="border-t border-[#2d2417] bg-black py-12">
      <div className="mx-auto max-w-7xl px-8 flex items-center justify-between">

        <div>
          <h3 className="text-2xl font-black tracking-[5px] text-[#d9aa4a]">
            HASWOLF
          </h3>

          <p className="mt-2 text-zinc-500">
            © 2026 HASWOLF. Tüm Hakları Saklıdır.
          </p>
        </div>

        <div className="flex gap-8 text-zinc-400">
          <a href="#">Discord</a>
          <a href="#">Topluluk</a>
          <a href="#">İletişim</a>
        </div>

      </div>
    </footer>
  );
}
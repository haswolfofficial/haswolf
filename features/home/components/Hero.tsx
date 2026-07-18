export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#2b2417] bg-gradient-to-r from-[#090909] via-[#111111] to-[#1a1408]">
      <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between px-24 py-28">

        <div className="max-w-3xl">
          <p className="mb-6 uppercase tracking-[8px] text-[#d9aa4a]">
            Güvenilir • Hızlı • Profesyonel
          </p>

          <h1 className="text-[110px] font-black leading-none text-[#d9aa4a]">
            HASWOLF
          </h1>

          <h2 className="mt-3 text-[42px] tracking-[10px] text-zinc-300">
            MARKET
          </h2>

          <p className="mt-10 max-w-2xl text-2xl leading-10 text-zinc-400">
            Item, Yang ve Karakter alışverişinde güvenli,
            hızlı ve profesyonel pazar deneyimi.
          </p>

          <div className="mt-14 flex gap-6">
            <button className="rounded-xl bg-[#d9aa4a] px-10 py-5 text-lg font-bold text-black transition hover:bg-[#efc668]">
              Markete Git
            </button>

            <button className="rounded-xl border border-[#d9aa4a] px-10 py-5 text-lg font-bold text-[#d9aa4a] transition hover:bg-[#d9aa4a] hover:text-black">
              Nasıl Çalışır?
            </button>
          </div>
        </div>

        <div className="flex h-[520px] w-[520px] items-center justify-center rounded-full border border-[#3b311e] bg-black shadow-[0_0_160px_rgba(217,170,74,.22)]">
          <img
            src="/logo.png"
            alt="Haswolf"
            className="w-[340px]"
          />
        </div>

      </div>
    </section>
  );
}
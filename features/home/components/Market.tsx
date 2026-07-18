export default function Market() {
  return (
    <section className="bg-[#0d0d0d] py-24">
      <div className="mx-auto max-w-7xl px-8">

        <h2 className="mb-12 text-center text-4xl font-black text-[#d9aa4a]">
          MARKETLER
        </h2>

        <div className="grid gap-8 md:grid-cols-3">

          <div className="rounded-2xl border border-[#2d2417] bg-[#141414] p-8">
            <div className="mb-4 text-5xl">⚔️</div>

            <h3 className="mb-3 text-2xl font-bold text-white">
              Item Market
            </h3>

            <p className="mb-8 text-zinc-400">
              Silah, zırh, kostüm, pet ve tüm oyun eşyalarını güvenle al sat.
            </p>

            <button className="rounded-xl bg-[#d9aa4a] px-6 py-3 font-bold text-black">
              Markete Git
            </button>
          </div>

          <div className="rounded-2xl border border-[#2d2417] bg-[#141414] p-8">
            <div className="mb-4 text-5xl">💰</div>

            <h3 className="mb-3 text-2xl font-bold text-white">
              Yang Market
            </h3>

            <p className="mb-8 text-zinc-400">
              Tüm sunucularda güvenilir Yang ticareti.
            </p>

            <button className="rounded-xl bg-[#d9aa4a] px-6 py-3 font-bold text-black">
              Yang Satın Al
            </button>
          </div>

          <div className="rounded-2xl border border-[#2d2417] bg-[#141414] p-8">
            <div className="mb-4 text-5xl">👑</div>

            <h3 className="mb-3 text-2xl font-bold text-white">
              Hesap Market
            </h3>

            <p className="mb-8 text-zinc-400">
              Premium karakterleri güvenli escrow sistemiyle al sat.
            </p>

            <button className="rounded-xl bg-[#d9aa4a] px-6 py-3 font-bold text-black">
              Hesaplara Git
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
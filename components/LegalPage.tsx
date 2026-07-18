import SiteFooter from "@/components/SiteFooter";

type Section = {
  title: string;
  body: string;
  points?: string[];
};

export default function LegalPage({
  eyebrow,
  title,
  intro,
  updated = "15 Temmuz 2026",
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  sections: Section[];
}) {
  return (
    <main className="haswolf-legal-shell">
      <section className="haswolf-policy-hero">
        <div className="haswolf-container py-10 sm:py-16">
          <a href="/" className="inline-flex items-center gap-2 text-sm font-black tracking-[.22em] text-[#e5b64e]">
            <span>←</span> HASWOLF
          </a>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_310px] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.28em] text-[#bd8b35]">{eyebrow}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">{title}</h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-400">{intro}</p>
            </div>

            <aside className="rounded-2xl border border-[#8c641e]/40 bg-black/35 p-5">
              <p className="text-xs uppercase tracking-[.18em] text-zinc-600">Son güncelleme</p>
              <p className="mt-2 font-bold text-[#e5b64e]">{updated}</p>
              <p className="mt-4 text-xs leading-6 text-zinc-500">
                Bu metin HASWOLF platform güvenliği, topluluk düzeni ve kullanıcı şeffaflığı için hazırlanmıştır.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <section className="haswolf-container py-8 sm:py-12">
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="haswolf-legal-card h-fit p-5 lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#d9aa4a]">İçindekiler</p>
            <nav className="mt-4 space-y-2">
              {sections.map((section, index) => (
                <a
                  key={section.title}
                  href={`#section-${index + 1}`}
                  className="block rounded-lg border border-white/5 px-3 py-2.5 text-sm text-zinc-400 transition hover:border-[#8c641e]/50 hover:text-white"
                >
                  {index + 1}. {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="haswolf-legal-card p-6 sm:p-10">
            <div className="space-y-10">
              {sections.map((section, index) => (
                <section key={section.title} id={`section-${index + 1}`} className="scroll-mt-28 border-b border-white/10 pb-9 last:border-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9aa4a] font-black text-black">
                      {index + 1}
                    </span>
                    <div>
                      <h2 className="text-2xl font-black text-[#efc76b]">{section.title}</h2>
                      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-400 sm:text-base">{section.body}</p>
                      {section.points && (
                        <ul className="mt-5 space-y-3">
                          {section.points.map((point) => (
                            <li key={point} className="flex gap-3 rounded-xl border border-white/7 bg-black/25 p-4 text-sm leading-6 text-zinc-400">
                              <span className="mt-1 text-[#d9aa4a]">◆</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

type MessageRow = { id: string; created_at: string };

export default function HomeCommunityPreview() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [latestCount, setLatestCount] = useState(0);

  useEffect(() => {
    if (pathname !== "/") return;

    let active = true;

    async function loadLatestCount() {
      const { data } = await supabase
        .from("chat_messages")
        .select("id,created_at")
        .order("created_at", { ascending: false })
        .limit(8);

      if (!active) return;
      const rows = (data || []) as MessageRow[];
      setLatestCount(rows.length);
    }

    void loadLatestCount();

    const channel = supabase
      .channel("home-chat-launcher")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => {
          if (!active) return;
          setLatestCount((value) => Math.min(99, Math.max(1, value + 1)));
          setPulse(true);
          window.setTimeout(() => setPulse(false), 2200);
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (pathname !== "/") return null;

  return (
    <>
      <div className="fixed bottom-[96px] left-4 z-[72] sm:bottom-6 sm:left-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`group relative flex min-w-[190px] items-center gap-3 overflow-hidden rounded-[22px] border border-[#d7a53d]/55 bg-[linear-gradient(145deg,rgba(9,13,14,.98),rgba(18,15,8,.97))] px-3.5 py-3 text-left shadow-[0_18px_60px_rgba(0,0,0,.68),0_0_28px_rgba(217,170,74,.12)] transition duration-300 hover:-translate-y-0.5 hover:border-[#f2c85f]/90 hover:shadow-[0_22px_68px_rgba(0,0,0,.72),0_0_35px_rgba(217,170,74,.20)] ${pulse ? "scale-[1.025]" : ""}`}
          aria-label="HASWOLF canlı sohbeti aç"
        >
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(35,211,125,.13),transparent_34%),radial-gradient(circle_at_80%_110%,rgba(217,170,74,.11),transparent_38%)]" />
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/35 bg-[linear-gradient(145deg,rgba(22,101,52,.38),rgba(3,17,13,.85))] text-[19px] shadow-[inset_0_0_20px_rgba(34,197,94,.09),0_0_20px_rgba(34,197,94,.08)]">
            💬
            <i className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#090b0c] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" />
          </span>

          <span className="relative min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <b className="block truncate text-[12px] font-black tracking-[.08em] text-[#f3c967]">CANLI SOHBET</b>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-1.5 py-0.5 text-[8px] font-black tracking-[.08em] text-emerald-300">AKTİF</span>
            </span>
            <small className="mt-0.5 block text-[9px] text-zinc-500">HASWOLF Topluluk</small>
          </span>

          <span className="relative flex h-8 min-w-8 items-center justify-center rounded-xl border border-white/[.06] bg-white/[.035] px-2 text-[10px] font-black text-[#efd074] transition group-hover:bg-[#d9aa4a]/10">
            {latestCount > 0 ? latestCount : "→"}
          </span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-md sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label="HASWOLF canlı sohbet">
          <button type="button" className="absolute inset-0 cursor-default" onClick={() => setOpen(false)} aria-label="Sohbet penceresini kapat" />

          <section className="relative flex h-[94dvh] w-full max-w-[1480px] flex-col overflow-hidden rounded-t-[28px] border border-[#b58a36]/55 bg-[#06090a] shadow-[0_32px_120px_rgba(0,0,0,.88),0_0_55px_rgba(217,170,74,.10)] sm:h-[88vh] sm:rounded-[28px]">
            <header className="relative flex min-h-[66px] items-center justify-between gap-3 border-b border-[#8e6929]/35 bg-[linear-gradient(90deg,#0a0d0e,#151109,#0a0d0e)] px-4 sm:px-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(35,211,125,.08),transparent_26%),radial-gradient(circle_at_74%_0%,rgba(217,170,74,.08),transparent_28%)]" />
              <div className="relative flex min-w-0 items-center gap-3">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-lg">💬<i className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#0a0d0e] bg-emerald-400 shadow-[0_0_11px_rgba(52,211,153,.9)]" /></span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-[13px] font-black tracking-[.12em] text-[#f1c55e] sm:text-[15px]">HASWOLF CANLI SOHBET</h2>
                    <span className="hidden rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[8px] font-black tracking-[.12em] text-emerald-300 sm:inline">CANLI</span>
                  </div>
                  <p className="truncate text-[9px] text-zinc-500 sm:text-[10px]">Topluluk odaları · mesajlar · üyeler · HASWOLF TV</p>
                </div>
              </div>

              <div className="relative flex items-center gap-2">
                <a href="/topluluk" className="hidden rounded-xl border border-[#a57a2e]/35 bg-[#17130b] px-3 py-2 text-[10px] font-black tracking-[.04em] text-[#e8be58] transition hover:border-[#e7bb50]/75 hover:bg-[#211a0d] sm:inline-flex">TAM EKRAN ↗</a>
                <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[.08] bg-white/[.035] text-lg text-zinc-400 transition hover:border-red-400/35 hover:bg-red-500/10 hover:text-red-300" aria-label="Sohbet penceresini kapat">×</button>
              </div>
            </header>

            <div className="relative min-h-0 flex-1 bg-[#050708]">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-black/25 to-transparent" />
              <iframe
                src="/topluluk?embed=1"
                title="HASWOLF Topluluk Sohbeti"
                className="h-full w-full border-0 bg-[#050708]"
                allow="microphone; autoplay; clipboard-write"
              />
            </div>
          </section>
        </div>
      )}
    </>
  );
}

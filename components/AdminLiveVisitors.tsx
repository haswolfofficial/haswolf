"use client";

import { useEffect, useState } from "react";

const MIN_ACTIVITY = 15;
const MAX_ACTIVITY = 300;
const UPDATE_INTERVAL = 8000;

const clamp = (value: number) => Math.min(MAX_ACTIVITY, Math.max(MIN_ACTIVITY, value));

function getSharedActivity(now = Date.now()) {
  const bucket = Math.floor(now / UPDATE_INTERVAL);

  // Tüm cihazlarda aynı zaman diliminde aynı değeri üretir.
  // İki yavaş dalga üst üste bindirilerek ani sıçramalar engellenir.
  const waveA = Math.sin(bucket * 0.085) * 82;
  const waveB = Math.sin(bucket * 0.031 + 1.7) * 38;
  const waveC = Math.sin(bucket * 0.013 + 4.2) * 18;
  const value = Math.round(158 + waveA + waveB + waveC);

  return clamp(value);
}

function msUntilNextBucket(now = Date.now()) {
  return UPDATE_INTERVAL - (now % UPDATE_INTERVAL) + 25;
}

export default function AdminLiveVisitors({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState(() => getSharedActivity());

  useEffect(() => {
    if (!enabled) return;

    let interval: number | undefined;

    const sync = () => setActivity(getSharedActivity());
    sync();

    const timeout = window.setTimeout(() => {
      sync();
      interval = window.setInterval(sync, UPDATE_INTERVAL);
    }, msUntilNextBucket());

    return () => {
      window.clearTimeout(timeout);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <aside className={`haswolf-live-orb ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="haswolf-live-orb__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${activity} aktif`}
      >
        <span className="haswolf-live-dot" />
        <b>{activity}</b>
      </button>
      {open && (
        <div className="haswolf-live-orb__panel">
          <header>
            <small>CANLI DURUM</small>
            <strong>{activity} aktif</strong>
          </header>
          <p><span>Durum</span><b>Aktif</b></p>
        </div>
      )}
    </aside>
  );
}

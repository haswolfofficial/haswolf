"use client";

import { useEffect, useState } from "react";

const MIN_ACTIVITY = 15;
const MAX_ACTIVITY = 300;
const UPDATE_INTERVAL = 8000;
const CENTER = 155;

const clamp = (value: number) => Math.min(MAX_ACTIVITY, Math.max(MIN_ACTIVITY, value));

function seededNoise(seed: number) {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function getSharedActivity(now = Date.now()) {
  const bucket = Math.floor(now / UPDATE_INTERVAL);

  // Tüm cihazlarda aynı 8 saniyelik dilimde aynı değer üretilir.
  // Yavaş piyasa dalgası + küçük deterministik gürültü kullanılır.
  // Gürültü artış/azalış yönünde dengelidir ve merkez değere geri çekilme vardır.
  const slowWave = Math.sin(bucket * 0.055) * 48;
  const mediumWave = Math.sin(bucket * 0.017 + 1.8) * 24;
  const jitter = (seededNoise(bucket) - 0.5) * 14;
  const raw = CENTER + slowWave + mediumWave + jitter;

  return clamp(Math.round(raw));
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

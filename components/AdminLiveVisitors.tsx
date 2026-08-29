"use client";

import { useEffect, useState } from "react";

const MIN_ACTIVITY = 50;
const MAX_ACTIVITY = 900;
const UPDATE_INTERVAL = 5000;

const clamp = (value: number) => Math.min(MAX_ACTIVITY, Math.max(MIN_ACTIVITY, value));

export default function AdminLiveVisitors({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    // Eğlence/demo amaçlı hareketli site aktivitesi göstergesi.
    setActivity(Math.floor(Math.random() * 201) + 250);

    const timer = window.setInterval(() => {
      setActivity((current) => {
        const base = current || 350;
        const step = Math.floor(Math.random() * 41) - 20;
        return clamp(base + step);
      });
    }, UPDATE_INTERVAL);

    return () => window.clearInterval(timer);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <aside className={`haswolf-live-orb ${open ? "is-open" : ""}`}>
      <button
        type="button"
        className="haswolf-live-orb__trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${activity} site aktivitesi`}
      >
        <span className="haswolf-live-dot" />
        <b>{activity || 50}</b>
      </button>
      {open && (
        <div className="haswolf-live-orb__panel">
          <header>
            <small>CANLI DURUM</small>
            <strong>{activity || 50} site aktivitesi</strong>
          </header>
          <p><span>Durum</span><b>Aktif</b></p>
          <p><span>Gösterge</span><b>Demo</b></p>
        </div>
      )}
    </aside>
  );
}

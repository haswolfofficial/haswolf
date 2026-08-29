"use client";

import { useEffect, useState } from "react";

const MIN_ACTIVITY = 15;
const MAX_ACTIVITY = 300;
const UPDATE_INTERVAL = 8000;

const clamp = (value: number) => Math.min(MAX_ACTIVITY, Math.max(MIN_ACTIVITY, value));

export default function AdminLiveVisitors({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [activity, setActivity] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    setActivity(Math.floor(Math.random() * 86) + 65);

    const timer = window.setInterval(() => {
      setActivity((current) => {
        const base = current || 100;
        const step = Math.floor(Math.random() * 21) - 10;
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
        aria-label={`${activity} aktif`}
      >
        <span className="haswolf-live-dot" />
        <b>{activity || MIN_ACTIVITY}</b>
      </button>
      {open && (
        <div className="haswolf-live-orb__panel">
          <header>
            <small>CANLI DURUM</small>
            <strong>{activity || MIN_ACTIVITY} aktif</strong>
          </header>
          <p><span>Durum</span><b>Aktif</b></p>
        </div>
      )}
    </aside>
  );
}

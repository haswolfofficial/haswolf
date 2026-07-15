"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    setInstalled(standalone);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (installed) return;

    if (promptEvent) {
      await promptEvent.prompt();
      await promptEvent.userChoice;
      setPromptEvent(null);
      return;
    }

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      alert('Safari paylaşım menüsünden "Ana Ekrana Ekle" seçeneğine dokun.');
      return;
    }

    alert('Chrome menüsünden "Uygulamayı yükle" veya "Ana ekrana ekle" seçeneğini kullan.');
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="haswolf-download-button"
      aria-label="HASWOLF uygulamasını yükle"
      disabled={installed}
    >
      <span aria-hidden="true">{installed ? "✓" : "⇩"}</span>
      <span className="hidden sm:block">
        <strong>{installed ? "UYGULAMA YÜKLÜ" : "UYGULAMA İNDİR"}</strong>
        <small>HASWOLF UYGULAMASI</small>
      </span>
    </button>
  );
}

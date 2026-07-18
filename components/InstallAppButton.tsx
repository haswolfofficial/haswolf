"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone,
      );

    setInstalled(standalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker kaydı başarısız:", error);
      });
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function installApplication() {
    if (installed) return;

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
      }
      return;
    }

    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      window.alert(
        'Safari paylaşım menüsünü açıp "Ana Ekrana Ekle" seçeneğine dokun.',
      );
      return;
    }

    window.alert(
      'Chrome menüsünden "Uygulamayı yükle" veya "Ana ekrana ekle" seçeneğini kullan.',
    );
  }

  return (
    <button
      type="button"
      onClick={installApplication}
      className="haswolf-download-button"
      aria-label={
        installed
          ? "HASWOLF uygulaması yüklü"
          : "HASWOLF uygulamasını yükle"
      }
      disabled={installed}
    >
      <span aria-hidden="true">{installed ? "✓" : "⇩"}</span>
      <span className="hidden sm:block">
        <strong>
          {installed ? "UYGULAMA YÜKLÜ" : "UYGULAMA İNDİR"}
        </strong>
        <small>{installed ? "HASWOLF PWA" : "HASWOLF UYGULAMASI"}</small>
      </span>
    </button>
  );
}

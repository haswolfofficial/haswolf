"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay: boolean },
          elementId: string,
        ) => void;
      };
    };
  }
}

const supported = new Set(["tr", "en", "de", "fr", "es", "pt", "ru", "ar", "it", "pl"]);

export default function AutoTranslate() {
  useEffect(() => {
    const saved = localStorage.getItem("haswolf_language");
    const detected = (saved || navigator.languages?.[0] || navigator.language || "tr").split("-")[0];
    const language = supported.has(detected) ? detected : "tr";

    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    if (!saved) localStorage.setItem("haswolf_language", language);
    if (language === "tr") return;

    const cookie = `/tr/${language}`;
    document.cookie = `googtrans=${cookie};path=/;SameSite=Lax`;
    document.cookie = `googtrans=${cookie};path=/;domain=${location.hostname};SameSite=Lax`;

    window.googleTranslateElementInit = () => {
      if (window.google) {
        new window.google.translate.TranslateElement(
          { pageLanguage: "tr", autoDisplay: false },
          "google_translate_element",
        );
      }
    };

    if (!document.getElementById("haswolf-google-translate")) {
      const script = document.createElement("script");
      script.id = "haswolf-google-translate";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return <div id="google_translate_element" className="sr-only" aria-hidden="true" />;
}
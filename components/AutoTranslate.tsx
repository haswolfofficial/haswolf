"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            includedLanguages: string;
            autoDisplay: boolean;
            multilanguagePage: boolean;
          },
          elementId: string,
        ) => void;
      };
    };
  }
}

const STORAGE_KEY = "haswolf_language";
const SUPPORTED = ["tr","en","de","fr","es","pt","ru","ar","it","pl"];

function detectedLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED.includes(stored)) return stored;
  const browser = (navigator.languages?.[0] || navigator.language || "tr").split("-")[0];
  return SUPPORTED.includes(browser) ? browser : "tr";
}

function setCookie(language: string) {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=;expires=${expires};path=/`;
  document.cookie = `googtrans=;expires=${expires};path=/;domain=${location.hostname}`;
  if (language !== "tr") {
    const value = `/tr/${language}`;
    document.cookie = `googtrans=${value};path=/;SameSite=Lax`;
    document.cookie = `googtrans=${value};path=/;domain=${location.hostname};SameSite=Lax`;
  }
}

export default function AutoTranslate() {
  useEffect(() => {
    const language = detectedLanguage();
    if (!localStorage.getItem(STORAGE_KEY)) localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    setCookie(language);

    const hideTranslateChrome = () => {
      document.documentElement.style.marginTop = "0";
      document.body.style.top = "0";
      document.querySelectorAll("iframe.goog-te-banner-frame, .goog-te-banner-frame, .skiptranslate iframe")
        .forEach((node) => (node as HTMLElement).style.display = "none");
    };
    hideTranslateChrome();

    if (language === "tr") return;

    window.googleTranslateElementInit = () => {
      if (!window.google) return;
      new window.google.translate.TranslateElement({
        pageLanguage: "tr",
        includedLanguages: SUPPORTED.filter((x) => x !== "tr").join(","),
        autoDisplay: false,
        multilanguagePage: true,
      }, "google_translate_element");
      window.setTimeout(hideTranslateChrome, 250);
      window.setTimeout(hideTranslateChrome, 1200);
    };

    if (!document.getElementById("haswolf-google-translate")) {
      const script = document.createElement("script");
      script.id = "haswolf-google-translate";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return <div id="google_translate_element" className="haswolf-google-translate" aria-hidden="true" />;
}

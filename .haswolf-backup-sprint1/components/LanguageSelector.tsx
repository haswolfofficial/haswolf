"use client";

import { useEffect, useState } from "react";

const languages = [
  ["tr", "TR"], ["en", "EN"], ["de", "DE"], ["fr", "FR"], ["es", "ES"],
  ["pt", "PT"], ["ru", "RU"], ["ar", "AR"], ["it", "IT"], ["pl", "PL"],
] as const;

export default function LanguageSelector() {
  const [value, setValue] = useState("tr");
  useEffect(() => {
    const saved = localStorage.getItem("haswolf_language");
    const detected = (saved || navigator.languages?.[0] || navigator.language || "tr").split("-")[0];
    setValue(languages.some(([code]) => code === detected) ? detected : "tr");
  }, []);

  function changeLanguage(language: string) {
    localStorage.setItem("haswolf_language", language);
    if (language === "tr") {
      document.cookie = "googtrans=;Max-Age=0;path=/";
      location.reload();
      return;
    }
    const cookie = `/tr/${language}`;
    document.cookie = `googtrans=${cookie};path=/`;
    document.cookie = `googtrans=${cookie};path=/;domain=${location.hostname}`;
    location.reload();
  }

  return (
    <label className="haswolf-language-selector" aria-label="Site dili">
      <span aria-hidden="true">🌐</span>
      <select value={value} onChange={(event) => changeLanguage(event.target.value)}>
        {languages.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>
  );
}

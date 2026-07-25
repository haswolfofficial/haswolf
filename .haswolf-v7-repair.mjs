import fs from "node:fs";
import path from "node:path";

const roots = ["app", "components", "features", "lib"];
const extensions = new Set([".ts", ".tsx", ".css"]);

const replacements = [
  ["Kat\u00c3\u201e\u00c2\u00b1l\u00c3\u201e\u00c2\u00b1mc\u00c3\u201e\u00c2\u00b1", "Kat\u0131l\u0131mc\u0131"],
  ["Ses odas\u00c3\u201e\u00c2\u00b1 ba\u00c3\u201e\u00c5\u00b8lant\u00c3\u201e\u00c2\u00b1s\u00c3\u201e\u00c2\u00b1 haz\u00c3\u201e\u00c2\u00b1r de\u00c3\u201e\u00c5\u00b8il.", "Ses odas\u0131 ba\u011flant\u0131s\u0131 haz\u0131r de\u011fil."],
  ["Mikrofon yay\u00c3\u201e\u00c2\u00b1n\u00c3\u201e\u00c2\u00b1 ba\u00c3\u2026\u00c5\u00b8lat\u00c3\u201e\u00c2\u00b1lamad\u00c3\u201e\u00c2\u00b1. Taray\u00c3\u201e\u00c2\u00b1c\u00c3\u201e\u00c2\u00b1 mikrofon iznini kontrol et.", "Mikrofon yay\u0131n\u0131 ba\u015flat\u0131lamad\u0131. Taray\u0131c\u0131 mikrofon iznini kontrol et."],
  ["Mikrofon a\u00c3\u0192\u00c2\u00a7\u00c3\u201e\u00c2\u00b1lamad\u00c3\u201e\u00c2\u00b1.", "Mikrofon a\u00e7\u0131lamad\u0131."],
  ["Ses odas\u00c3\u201e\u00c2\u00b1na ba\u00c3\u201e\u00c5\u00b8lan\u00c3\u201e\u00c2\u00b1lamad\u00c3\u201e\u00c2\u00b1.", "Ses odas\u0131na ba\u011flan\u0131lamad\u0131."],
  ["Sipari\u00c3\u2026\u0178lerim", "Sipari\u015flerim"],
  ["Fiyat alarm\u00c3\u201e\u00c2\u00b1m", "Fiyat alarm\u0131m"],
  ["Mesajlar\u00c3\u201e\u00c2\u00b1m", "Mesajlar\u0131m"],
  ["G\u00c3\u00bcvenlik ayarlar\u00c3\u201e\u00c2\u00b1m", "G\u00fcvenlik ayarlar\u0131m"],
  ["Oturum a\u00c3\u00a7an cihazlar", "Oturum a\u00e7an cihazlar"],
  ["Panel haz\u00c3\u201e\u00c2\u00b1rlan\u00c3\u201e\u00c2\u00b1yor\u00e2\u20ac\u00a6", "Panel haz\u0131rlan\u0131yor\u2026"],
  ["KULLANICI PANEL\u00c3\u201e\u00c2\u00b0", "KULLANICI PANEL\u0130"],
  ["HASWOLF \u00c3\u0153yesi", "HASWOLF \u00dcyesi"],
  ["\u00c3\u2021\u00c3\u201e\u00c2\u00b1k\u00c3\u201e\u00c2\u00b1\u00c3\u2026\u0178 yap", "\u00c7\u0131k\u0131\u015f yap"],
  ["Siteye d\u00c3\u00b6n", "Siteye d\u00f6n"],
  ["Sipari\u00c3\u2026\u0178ler", "Sipari\u015fler"],
  ["Fiyat alarmlar\u00c3\u201e\u00c2\u00b1", "Fiyat alarmlar\u0131"],
  ["Admin duyurular\u00c3\u201e\u00c2\u00b1", "Admin duyurular\u0131"],
  ["Favoriler y\u00c3\u00bcklenemedi.", "Favoriler y\u00fcklenemedi."],
  ["Favoriler y\u00c3\u00bckleniyor...", "Favoriler y\u00fckleniyor..."],
  ["Hen\u00c3\u00bcz favori \u00c3\u00bcr\u00c3\u00bcn\u00c3\u00bcn yok", "Hen\u00fcz favori \u00fcr\u00fcn\u00fcn yok"],
  ["Favoriye ekledi\u00c4\u0178in \u00c3\u00bcr\u00c3\u00bcnler burada g\u00c3\u00b6r\u00c3\u00bcnt\u00c3\u00bclenir.", "Favoriye ekledi\u011fin \u00fcr\u00fcnler burada g\u00f6r\u00fcnt\u00fclenir."],
  ["\u00c3\u0153r\u00c3\u00bcne git", "\u00dcr\u00fcne git"],
  ["Kald\u00c3\u201e\u00c2\u00b1r", "Kald\u0131r"]
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name.startsWith(".haswolf-backup-")) continue;
      out.push(...walk(full));
    } else if (extensions.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

let changed = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    let text = fs.readFileSync(file, "utf8");
    const original = text;
    for (const [from, to] of replacements) text = text.split(from).join(to);
    if (text !== original) {
      fs.writeFileSync(file, text, "utf8");
      console.log("UTF-8 repaired:", file);
      changed++;
    }
  }
}

const provider = path.join("components", "PersistentVoiceProvider.tsx");
if (fs.existsSync(provider)) {
  let text = fs.readFileSync(provider, "utf8");
  text = text.replace(
    'const trackKey = publication.trackSid || track.sid || `audio-${Date.now()}-${Math.random().toString(36).slice(2)}`;',
    'const trackKey = publication.trackSid || track.sid || `${track.kind}-${publication.source}-${publication.trackName || "audio"}`;'
  );
  text = text.replaceAll(
    "element.volume = outputEnabledRef.current ? 1 : 0;",
    "element.volume = outputEnabledRef.current ? 0.82 : 0;"
  );
  fs.writeFileSync(provider, text, "utf8");
}

console.log("Changed files:", changed);
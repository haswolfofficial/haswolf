import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function writeUtf8(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function score(text) {
  const patterns = ["Ã", "Ä", "Å", "Â", "â€", "ðŸ", "�", "BaÄ", "KonuÅ", "KatÄ"];
  return patterns.reduce((sum, p) => sum + (text.split(p).length - 1), 0);
}

function repairLatin1Utf8(text) {
  let current = text;
  for (let i = 0; i < 3; i += 1) {
    const before = score(current);
    if (before === 0) break;
    const candidate = Buffer.from(current, "latin1").toString("utf8");
    if (candidate.includes("�")) break;
    const after = score(candidate);
    if (after >= before) break;
    current = candidate;
  }
  return current;
}

const replacements = [
  ["BaÄŸlantÄ±", "Bağlantı"],
  ["BaÄŸlÄ±", "Bağlı"],
  ["BaÄŸlanÄ±yor", "Bağlanıyor"],
  ["KatÄ±lÄ±mcÄ±", "Katılımcı"],
  ["KonuÅŸma sÄ±rasÄ±", "Konuşma sırası"],
  ["KonuÅŸmayÄ± AÃ§", "Konuşmayı Aç"],
  ["Ses odasÄ±ndan Ã§Ä±k", "Ses odasından çık"],
  ["baÄŸlandÄ±n", "bağlandın"],
  ["geÃ§tiÄŸinde", "geçtiğinde"],
  ["baÄŸlantÄ±sÄ±", "bağlantısı"],
  ["kÃ¼Ã§Ã¼k", "küçük"],
  ["BaÅŸka", "Başka"],
  ["konuÅŸurken", "konuşurken"],
  ["KonuÅŸma", "Konuşma"],
  ["BoÅŸ", "Boş"],
];

function repairText(text) {
  let out = repairLatin1Utf8(text);
  for (const [bad, good] of replacements) {
    out = out.split(bad).join(good);
  }
  return out;
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result;
}

const roots = ["app", "components", "features", "lib", "types"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".json", ".md"]);

for (const folder of roots) {
  for (const file of walk(path.join(root, folder))) {
    if (!extensions.has(path.extname(file).toLowerCase())) continue;
    const original = fs.readFileSync(file, "utf8");
    const fixed = repairText(original);
    if (fixed !== original) {
      writeUtf8(file, fixed);
      console.log("UTF-8 repaired:", path.relative(root, file));
    }
  }
}

const mediaSessionLines = [
  '"use client";',
  '',
  'import { useEffect, useRef } from "react";',
  'import { usePersistentVoice } from "@/components/PersistentVoiceProvider";',
  '',
  'type ExtendedMediaSession = MediaSession & {',
  '  setMicrophoneActive?: (active: boolean) => void;',
  '};',
  '',
  'export default function VoiceMediaSession() {',
  '  const voice = usePersistentVoice();',
  '  const audioRef = useRef<HTMLAudioElement | null>(null);',
  '',
  '  useEffect(() => {',
  '    const audio = new Audio("/audio/haswolf-voice-session.wav");',
  '    audio.loop = true;',
  '    audio.preload = "auto";',
  '    audio.volume = 0.001;',
  '    audioRef.current = audio;',
  '',
  '    return () => {',
  '      audio.pause();',
  '      audio.src = "";',
  '      audioRef.current = null;',
  '    };',
  '  }, []);',
  '',
  '  useEffect(() => {',
  '    const audio = audioRef.current;',
  '    if (!audio) return;',
  '',
  '    if (voice.connected) {',
  '      void audio.play().catch(() => {});',
  '    } else {',
  '      audio.pause();',
  '      audio.currentTime = 0;',
  '    }',
  '  }, [voice.connected]);',
  '',
  '  useEffect(() => {',
  '    if (!("mediaSession" in navigator)) return;',
  '',
  '    const session = navigator.mediaSession as ExtendedMediaSession;',
  '',
  '    if (!voice.connected) {',
  '      session.metadata = null;',
  '      session.playbackState = "none";',
  '      return;',
  '    }',
  '',
  '    const speaker = voice.activeSpeaker?.trim();',
  '    const title = speaker',
  '      ? speaker + " konuşuyor"',
  '      : voice.microphoneEnabled',
  '        ? (voice.nickname || "Sen") + " konuşmaya hazır"',
  '        : "Ses odası arka planda aktif";',
  '',
  '    session.metadata = new MediaMetadata({',
  '      title,',
  '      artist: voice.roomName || "HASWOLF Ses Odası",',
  '      album: voice.outputEnabled ? "Ses açık" : "Ses kapalı",',
  '      artwork: [',
  '        { src: "/icons/haswolf-192.png", sizes: "192x192", type: "image/png" },',
  '        { src: "/icons/haswolf-512.png", sizes: "512x512", type: "image/png" },',
  '      ],',
  '    });',
  '',
  '    session.playbackState = voice.outputEnabled ? "playing" : "paused";',
  '',
  '    try {',
  '      session.setMicrophoneActive?.(voice.microphoneEnabled);',
  '    } catch {}',
  '',
  '    const setAction = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {',
  '      try {',
  '        session.setActionHandler(action, handler);',
  '      } catch {}',
  '    };',
  '',
  '    setAction("play", () => {',
  '      voice.setOutput(true);',
  '      void audioRef.current?.play();',
  '    });',
  '    setAction("pause", () => voice.setOutput(false));',
  '    setAction("stop", () => void voice.disconnectVoice());',
  '',
  '    return () => {',
  '      setAction("play", null);',
  '      setAction("pause", null);',
  '      setAction("stop", null);',
  '    };',
  '  }, [',
  '    voice.activeSpeaker,',
  '    voice.connected,',
  '    voice.disconnectVoice,',
  '    voice.microphoneEnabled,',
  '    voice.nickname,',
  '    voice.outputEnabled,',
  '    voice.roomName,',
  '    voice.setOutput,',
  '  ]);',
  '',
  '  return null;',
  '}',
  '',
];

writeUtf8(
  path.join(root, "components", "VoiceMediaSession.tsx"),
  mediaSessionLines.join("\n"),
);

const audioDir = path.join(root, "public", "audio");
fs.mkdirSync(audioDir, { recursive: true });
const sampleRate = 8000;
const seconds = 8;
const sampleCount = sampleRate * seconds;
const dataSize = sampleCount * 2;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(1, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 2, 28);
buffer.writeUInt16LE(2, 32);
buffer.writeUInt16LE(16, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

for (let i = 0; i < sampleCount; i += 1) {
  buffer.writeInt16LE(i % 64 === 0 ? 1 : 0, 44 + i * 2);
}

fs.writeFileSync(path.join(audioDir, "haswolf-voice-session.wav"), buffer);

const layoutPath = path.join(root, "app", "layout.tsx");
let layout = repairText(fs.readFileSync(layoutPath, "utf8"));

if (!layout.includes('import VoiceMediaSession from "@/components/VoiceMediaSession";')) {
  const providerImport =
    'import { PersistentVoiceProvider } from "@/components/PersistentVoiceProvider";';
  layout = layout.replace(
    providerImport,
    providerImport + '\nimport VoiceMediaSession from "@/components/VoiceMediaSession";',
  );
}

if (!layout.includes("<VoiceMediaSession />")) {
  layout = layout.replace(
    "<PersistentVoiceProvider>",
    "<PersistentVoiceProvider>\n          <VoiceMediaSession />",
  );
}

writeUtf8(layoutPath, layout);
console.log("HASWOLF Mobile Voice V6.1 patch completed successfully.");

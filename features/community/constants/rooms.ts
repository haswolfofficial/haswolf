import type { ChatRoom } from "../../../types/chat";

export const rooms: ChatRoom[] = [
  { id: "1", name: "Genel", slug: "genel", icon: "💬" },
  { id: "2", name: "Ephesus", slug: "ephesus", icon: "⚔️" },
  { id: "3", name: "Pergamon", slug: "pergamon", icon: "🛡️" },
  { id: "4", name: "Teos", slug: "teos", icon: "🔥" },
  { id: "5", name: "Alım Satım", slug: "trade", icon: "💰" },
  { id: "6", name: "Duyurular", slug: "news", icon: "📢" },

  // SES KANALI
  { id: "7", name: "Ses Odası", slug: "voice", icon: "🔊" },
];
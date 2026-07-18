import type { ChatMessage } from "../../../types/chat";

export const initialMessages: ChatMessage[] = [
  {
    id: "1",
    roomSlug: "genel",
    nickname: "Haswolf",
    message: "HASWOLF topluluğuna hoş geldin.",
    createdAt: "03:30",
  },
  {
    id: "2",
    roomSlug: "ephesus",
    nickname: "KaraKurt",
    message: "Selam arkadaşlar, Ephesus oyuncuları burada mı?",
    createdAt: "03:31",
  },
  {
    id: "3",
    roomSlug: "pergamon",
    nickname: "Bozkurt",
    message: "Pergamon oyuncuları burada toplanabilir.",
    createdAt: "03:32",
  },
  {
    id: "4",
    roomSlug: "teos",
    nickname: "WolfTR",
    message: "Teos kanalı aktif.",
    createdAt: "03:33",
  },
];
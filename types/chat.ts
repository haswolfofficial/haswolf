export type ChatRoom = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

export type ChatMessage = {
  id: string;
  roomSlug: string;
  userId?: string;
  nickname: string;
  message: string;
  createdAt: string;
  createdAtIso?: string;
  isMine?: boolean;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    nickname: string;
    message: string;
  } | null;
};
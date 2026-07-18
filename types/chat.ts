export type ChatRoom = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

export type ChatMessage = {
  id: string;
  roomSlug: string;
  nickname: string;
  message: string;
  createdAt: string;
  isMine?: boolean;
};
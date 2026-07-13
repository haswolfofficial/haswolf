import type { ChatMessage } from "../../../types/chat";

type MessageBubbleProps = {
  message: ChatMessage;
};

export default function MessageBubble({
  message,
}: MessageBubbleProps) {
  return (
    <article
      className={`flex max-w-2xl gap-3 ${
        message.isMine ? "ml-auto flex-row-reverse" : ""
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9aa4a] font-black text-black">
        {message.nickname.charAt(0).toUpperCase()}
      </div>

      <div className={message.isMine ? "text-right" : ""}>
        <div
          className={`mb-1 flex items-center gap-2 ${
            message.isMine ? "justify-end" : ""
          }`}
        >
          <strong className="text-sm text-[#d9aa4a]">
            {message.nickname}
          </strong>

          <time className="text-xs text-zinc-600">
            {message.createdAt}
          </time>
        </div>

        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            message.isMine
              ? "rounded-tr-sm bg-[#d9aa4a] text-black"
              : "rounded-tl-sm bg-zinc-900 text-zinc-200"
          }`}
        >
          {message.message}
        </div>
      </div>
    </article>
  );
}
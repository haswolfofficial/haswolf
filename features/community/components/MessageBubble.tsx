import type { ChatMessage } from "../../../types/chat";

type MessageBubbleProps = {
  message: ChatMessage;
  currentNickname: string;
  onReply?: (message: ChatMessage) => void;
  onReport?: (message: ChatMessage) => void;
};

function renderMentions(text: string, currentNickname: string) {
  const parts = text.split(/(@[^\s@]+)/g);
  const normalizedCurrent = currentNickname.trim().toLocaleLowerCase("tr-TR");

  return parts.map((part, index) => {
    if (!part.startsWith("@")) return <span key={`${part}-${index}`}>{part}</span>;
    const target = part.slice(1).replace(/[.,!?;:]+$/g, "");
    const mine = target.toLocaleLowerCase("tr-TR") === normalizedCurrent;
    return (
      <strong
        key={`${part}-${index}`}
        className={`rounded px-1 py-0.5 ${mine ? "bg-amber-300 text-black" : "bg-sky-500/15 text-sky-300"}`}
      >
        {part}
      </strong>
    );
  });
}

export default function MessageBubble({ message, currentNickname, onReply, onReport }: MessageBubbleProps) {
  return (
    <article
      id={`chat-message-${message.id}`}
      className={`group flex max-w-2xl gap-3 ${message.isMine ? "ml-auto flex-row-reverse" : ""}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9aa4a] font-black text-black">
        {message.nickname.charAt(0).toUpperCase()}
      </div>

      <div className={`min-w-0 ${message.isMine ? "text-right" : ""}`}>
        <div className={`mb-1 flex items-center gap-2 ${message.isMine ? "justify-end" : ""}`}>
          <strong className="text-sm text-[#d9aa4a]">{message.nickname}</strong>
          <time className="text-xs text-zinc-600">{message.createdAt}</time>
        </div>

        {message.replyTo && (
          <button
            type="button"
            onClick={() => document.getElementById(`chat-message-${message.replyTo?.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className={`mb-1 block max-w-full rounded-lg border-l-2 border-[#d9aa4a] bg-black/30 px-3 py-2 text-left text-xs ${message.isMine ? "ml-auto" : ""}`}
          >
            <span className="block font-bold text-[#e5b64e]">↩ {message.replyTo.nickname}</span>
            <span className="mt-0.5 block max-w-[22rem] truncate text-zinc-400">{message.replyTo.message}</span>
          </button>
        )}

        <div
          className={`break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            message.isMine
              ? "rounded-tr-sm bg-[#d9aa4a] text-black"
              : "rounded-tl-sm bg-zinc-900 text-zinc-200"
          }`}
        >
          {renderMentions(message.message, currentNickname)}
        </div>

        <div className={`mt-1 flex gap-2 opacity-0 transition group-hover:opacity-100 ${message.isMine ? "justify-end" : ""}`}>
          <button type="button" onClick={() => onReply?.(message)} className="text-[11px] font-semibold text-zinc-500 hover:text-[#e5b64e]">↩ Yanıtla</button>
          {!message.isMine && (
            <button type="button" onClick={() => onReport?.(message)} className="text-[11px] font-semibold text-zinc-600 hover:text-red-400">⚑ Raporla</button>
          )}
        </div>
      </div>
    </article>
  );
}
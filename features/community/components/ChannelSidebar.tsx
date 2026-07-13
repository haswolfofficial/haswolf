import type { ChatRoom } from "../../../types/chat";

type ChannelSidebarProps = {
  rooms: ChatRoom[];
  selectedRoom: ChatRoom;
  onSelectRoom: (room: ChatRoom) => void;
};

export default function ChannelSidebar({
  rooms,
  selectedRoom,
  onSelectRoom,
}: ChannelSidebarProps) {
  const textRooms = rooms.filter((room) =>
    ["genel", "ephesus", "pergamon", "teos", "trade"].includes(
      room.slug
    )
  );

  const voiceRooms: ChatRoom[] = [
    {
      id: "voice-general",
      name: "Genel Ses",
      slug: "voice",
      icon: "🔊",
    },
    {
      id: "voice-ephesus",
      name: "Ephesus",
      slug: "voice-ephesus",
      icon: "🔊",
    },
    {
      id: "voice-pergamon",
      name: "Pergamon",
      slug: "voice-pergamon",
      icon: "🔊",
    },
    {
      id: "voice-teos",
      name: "Teos",
      slug: "voice-teos",
      icon: "🔊",
    },
  ];

  const infoRooms = rooms.filter((room) => room.slug === "news");

  function renderRoom(room: ChatRoom, isVoice = false) {
    const active = selectedRoom.slug === room.slug;

    return (
      <button
        key={room.id}
        type="button"
        onClick={() => onSelectRoom(room)}
        className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
          active
            ? "bg-[#d9aa4a]/15 text-[#f1c76c]"
            : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
        }`}
      >
        <span className="text-base">{room.icon}</span>

        <span className="flex-1 font-medium">
          {room.name}
        </span>

        {isVoice && (
          <span
            className={`h-2 w-2 rounded-full ${
              active
                ? "bg-green-400"
                : "bg-zinc-700 group-hover:bg-green-500"
            }`}
          />
        )}
      </button>
    );
  }

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800 bg-[#090b0d]">
      <div className="border-b border-zinc-800 px-5 py-5">
        <h1 className="text-xl font-black tracking-widest text-[#d9aa4a]">
          HASWOLF
        </h1>

        <p className="mt-1 text-xs text-zinc-500">
          TOPLULUK
        </p>
      </div>

      <div className="h-[calc(100vh-81px)] overflow-y-auto p-3">
        <section>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Sohbet Kanalları
          </p>

          <div className="space-y-1">
            {textRooms.map((room) => renderRoom(room))}
          </div>
        </section>

        <div className="my-4 border-t border-zinc-800" />

        <section>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Ses Kanalları
          </p>

          <div className="space-y-1">
            {voiceRooms.map((room) =>
              renderRoom(room, true)
            )}
          </div>
        </section>

        <div className="my-4 border-t border-zinc-800" />

        <section>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Bilgi
          </p>

          <div className="space-y-1">
            {infoRooms.map((room) => renderRoom(room))}
          </div>
        </section>
      </div>
    </aside>
  );
}
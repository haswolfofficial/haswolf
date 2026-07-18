import type { ChatRoom } from "../../../types/chat";

type RoomExtra = ChatRoom & {
  is_active?: boolean;
  category?: string;
  kind?: string;
  guild_name?: string | null;
};

type Props = {
  rooms: ChatRoom[];
  selectedRoom: ChatRoom;
  onSelectRoom: (room: ChatRoom) => void;
  canManageRooms?: boolean;
  onManageRooms?: () => void;
};

const SERVER_KEYS = [
  { key: "ephesus", label: "Ephesus" },
  { key: "pergamon", label: "Pergamon" },
  { key: "teos", label: "Teos" },
] as const;

export default function ChannelSidebar({ rooms, selectedRoom, onSelectRoom, canManageRooms, onManageRooms }: Props) {
  const active = rooms.filter((room) => (room as RoomExtra).is_active !== false) as RoomExtra[];
  const isVoice = (room: RoomExtra) => room.kind === "voice" || room.slug.startsWith("voice-") || room.slug.startsWith("voice");
  const isAnnouncement = (room: RoomExtra) => room.category === "announcement" || room.slug === "news";
  const isGuild = (room: RoomExtra) => room.category === "guild" || Boolean(room.guild_name) || room.slug.includes("guild");
  const announcement = active.filter(isAnnouncement);
  const general = active.filter((room) => !isVoice(room) && !isAnnouncement(room) && !isGuild(room) && room.slug === "genel");
  const trade = active.filter((room) => !isVoice(room) && !isGuild(room) && (room.category === "trade" || room.slug === "trade"));
  const otherText = active.filter((room) => !isVoice(room) && !isAnnouncement(room) && !isGuild(room) && room.slug !== "genel" && room.slug !== "trade" && !SERVER_KEYS.some((server) => room.slug === server.key));
  const guildText = active.filter((room) => isGuild(room) && !isVoice(room));
  const guildVoice = active.filter((room) => isGuild(room) && isVoice(room));

  function roomButton(room: RoomExtra, voice = false, nested = false) {
    const selected = selectedRoom.slug === room.slug;
    return (
      <button
        key={room.id}
        onClick={() => onSelectRoom(room)}
        className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${nested ? "pl-6" : ""} ${selected ? "bg-[#d9aa4a]/15 text-[#f1c76c]" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"}`}
      >
        <span className="text-[13px]">{room.icon || (voice ? "🔊" : "💬")}</span>
        <span className="flex-1 truncate text-[13px] font-medium">{room.name}</span>
        {voice && <i className={`h-2 w-2 rounded-full ${selected ? "bg-green-400" : "bg-zinc-700"}`} />}
      </button>
    );
  }

  function sectionTitle(title: string) {
    return <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">{title}</p>;
  }

  function separator() {
    return <div className="mx-2 h-px bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent" />;
  }

  return (
    <aside className="h-full w-60 shrink-0 border-r border-zinc-800 bg-[#090b0d]">
      <a href="/" className="block border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center gap-2.5"><span className="text-2xl">🐺</span><div><h1 className="text-lg font-black tracking-widest text-[#d9aa4a]">HASWOLF</h1><p className="text-[10px] tracking-[.25em] text-zinc-500">TOPLULUK</p></div></div>
      </a>
      <div className="h-[calc(100vh-70px)] space-y-2.5 overflow-y-auto p-2.5">
        {announcement.length > 0 && <section>{sectionTitle("Duyurular")}<div className="space-y-1">{announcement.map((room) => roomButton(room))}</div></section>}

        <section>
          {sectionTitle("Genel")}
          <div className="space-y-1">{general.map((room) => roomButton(room))}</div>
        </section>

        <section>
          {sectionTitle("Sunucular")}
          <div className="space-y-1.5">
            {SERVER_KEYS.map((server) => {
              const textRoom = active.find((room) => !isVoice(room) && room.slug === server.key);
              const voiceRoom = active.find((room) => isVoice(room) && (room.slug === `voice-${server.key}` || room.slug === `${server.key}-voice` || room.name.toLocaleLowerCase("tr-TR").includes(server.key)));
              if (!textRoom && !voiceRoom) return null;
              return <div key={server.key} className="rounded-lg border border-white/[.04] bg-black/10 p-0.5">{textRoom && roomButton(textRoom)}{voiceRoom && roomButton(voiceRoom, true, true)}</div>;
            })}
          </div>
        </section>

        {separator()}
        {trade.length > 0 && <section>{sectionTitle("Alım Satım")}<div className="space-y-1">{trade.map((room) => roomButton(room))}</div></section>}
        {otherText.length > 0 && <section>{sectionTitle("Diğer Kanallar")}<div className="space-y-1">{otherText.map((room) => roomButton(room))}</div></section>}

        {separator()}
        {(guildText.length > 0 || guildVoice.length > 0) && <section>
          {sectionTitle("Lonca Odaları")}
          <div className="space-y-1.5">
            {guildText.map((room) => {
              const guildKey = (room.guild_name || room.slug.replace(/^guild-/, "")).toLocaleLowerCase("tr-TR");
              const voices = guildVoice.filter((voice) => {
                const voiceKey = (voice.guild_name || voice.slug).toLocaleLowerCase("tr-TR");
                return voiceKey.includes(guildKey) || guildKey.includes(voiceKey.replace(/^voice-guild-/, ""));
              });
              return <div key={room.id} className="rounded-lg border border-[#d9aa4a]/10 bg-[#d9aa4a]/[.025] p-0.5">{roomButton(room)}{voices.map((voice) => roomButton(voice, true, true))}</div>;
            })}
            {guildText.length === 0 && guildVoice.map((room) => roomButton(room, true, true))}
          </div>
        </section>}

        {canManageRooms && <button onClick={onManageRooms} className="w-full rounded-lg border border-[#765625] px-3 py-2 text-xs font-bold text-[#e5b64e]">⚙ Oda Yönetimi</button>}
      </div>
    </aside>
  );
}

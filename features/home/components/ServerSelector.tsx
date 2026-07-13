"use client";

type Server = {
  name: string;
  color: string;
};

interface Props {
  servers: Server[];
  selectedServer: string;
  setSelectedServer: (server: string) => void;
}

export default function ServerSelector({
  servers,
  selectedServer,
  setSelectedServer,
}: Props) {
  return (
    <section className="mx-auto max-w-[1500px] px-6 py-8">
      <div className="rounded-xl border border-[#8c641e]/40 bg-[#0d0f0f]/95 p-6">
        <h2 className="mb-6 text-center text-xl font-bold text-[#ddb45b]">
          ─── SUNUCU SEÇİNİZ ───
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {servers.map((server) => {
            const active = selectedServer === server.name;

            return (
              <button
                key={server.name}
                onClick={() => setSelectedServer(server.name)}
                className={`rounded-xl border bg-black/70 p-6 text-left transition hover:-translate-y-1 ${
                  active ? "scale-[1.02]" : ""
                }`}
                style={{
                  borderColor: server.color,
                  boxShadow: active
                    ? `0 0 35px ${server.color}44`
                    : "none",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full border text-3xl"
                    style={{
                      borderColor: server.color,
                      color: server.color,
                      background: `${server.color}18`,
                    }}
                  >
                    ◆
                  </div>

                  <div>
                    <h3
                      className="text-2xl font-black"
                      style={{ color: server.color }}
                    >
                      {server.name}
                    </h3>

                    <p className="mt-1 text-sm text-zinc-400">
                      <span style={{ color: server.color }}>●</span> Online
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
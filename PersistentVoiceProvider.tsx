"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteTrackPublication,
} from "livekit-client";

type PersistedVoice = {
  roomName: string;
  nickname: string;
  microphoneWanted: boolean;
  outputEnabled: boolean;
};

type VoiceContextValue = {
  roomName: string;
  nickname: string;
  connected: boolean;
  connecting: boolean;
  microphoneEnabled: boolean;
  outputEnabled: boolean;
  activeSpeaker: string;
  participantCount: number;
  error: string;
  connectVoice: (roomName: string, nickname: string) => Promise<void>;
  disconnectVoice: () => Promise<void>;
  setMicrophone: (enabled: boolean) => Promise<void>;
  setOutput: (enabled: boolean) => void;
};

const STORAGE_KEY = "haswolf_active_voice_room";

const initialState = {
  roomName: "",
  nickname: "",
  connected: false,
  connecting: false,
  microphoneEnabled: false,
  outputEnabled: true,
  activeSpeaker: "",
  participantCount: 0,
  error: "",
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

function getParticipantCount(room: Room) {
  const identities = new Set<string>();
  identities.add(room.localParticipant.identity || "local");

  room.remoteParticipants.forEach((participant) => {
    identities.add(participant.identity);
  });

  return identities.size;
}

export function PersistentVoiceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const roomRef = useRef<Room | null>(null);
  const wantedMicRef = useRef(false);
  const connectingRef = useRef(false);
  const outputEnabledRef = useRef(true);
  const audioElementsRef = useRef(new Set<HTMLMediaElement>());

  const [state, setState] = useState(initialState);

  const persist = useCallback(
    (
      roomName = state.roomName,
      nickname = state.nickname,
      microphoneWanted = wantedMicRef.current,
      outputEnabled = outputEnabledRef.current,
    ) => {
      if (!roomName || !nickname) return;

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          roomName,
          nickname,
          microphoneWanted,
          outputEnabled,
        } satisfies PersistedVoice),
      );
    },
    [state.nickname, state.roomName],
  );

  const updateParticipantCount = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    setState((current) => ({
      ...current,
      participantCount: getParticipantCount(room),
    }));
  }, []);

  const updateActiveSpeaker = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    const speaker = [...room.remoteParticipants.values()].find(
      (participant) => participant.isSpeaking,
    );

    setState((current) => ({
      ...current,
      activeSpeaker:
        speaker?.name ||
        speaker?.identity ||
        (room.localParticipant.isSpeaking
          ? current.nickname
          : ""),
    }));
  }, []);

  const setOutput = useCallback((enabled: boolean) => {
    outputEnabledRef.current = enabled;

    audioElementsRef.current.forEach((element) => {
      element.muted = !enabled;
      element.volume = enabled ? 1 : 0;
    });

    setState((current) => ({
      ...current,
      outputEnabled: enabled,
    }));

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as PersistedVoice;
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...saved, outputEnabled: enabled }),
      );
    } catch {
      // Eski kayıt göz ardı edilir.
    }
  }, []);

  const disconnectVoice = useCallback(async () => {
    sessionStorage.removeItem(STORAGE_KEY);
    wantedMicRef.current = false;
    connectingRef.current = false;

    audioElementsRef.current.forEach((element) => {
      element.pause();
      element.remove();
    });
    audioElementsRef.current.clear();

    const room = roomRef.current;
    roomRef.current = null;

    if (room) {
      await room.localParticipant
        .setMicrophoneEnabled(false)
        .catch(() => undefined);
      await room.disconnect().catch(() => undefined);
    }

    setState(initialState);
  }, []);

  const setMicrophone = useCallback(
    async (enabled: boolean) => {
      const room = roomRef.current;

      if (!room || room.state !== "connected") {
        setState((current) => ({
          ...current,
          microphoneEnabled: false,
          error: "Ses odası bağlantısı hazır değil.",
        }));
        return;
      }

      wantedMicRef.current = enabled;
      setState((current) => ({ ...current, error: "" }));

      try {
        await room.localParticipant.setMicrophoneEnabled(enabled, {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        });

        const publication =
          room.localParticipant.getTrackPublication(
            Track.Source.Microphone,
          );

        const active =
          Boolean(publication) &&
          !publication?.isMuted &&
          enabled;

        setState((current) => ({
          ...current,
          microphoneEnabled: active,
          error:
            enabled && !active
              ? "Mikrofon yayını başlatılamadı. Tarayıcı mikrofon iznini kontrol et."
              : "",
        }));

        persist(
          state.roomName,
          state.nickname,
          enabled,
          outputEnabledRef.current,
        );
      } catch (error) {
        wantedMicRef.current = false;

        setState((current) => ({
          ...current,
          microphoneEnabled: false,
          error:
            error instanceof Error
              ? error.message
              : "Mikrofon açılamadı.",
        }));
      }
    },
    [persist, state.nickname, state.roomName],
  );

  const connectVoice = useCallback(
    async (roomName: string, nickname: string) => {
      const existing = roomRef.current;

      if (
        existing?.state === "connected" &&
        existing.name === roomName
      ) {
        return;
      }

      if (connectingRef.current) return;
      connectingRef.current = true;

      if (existing) {
        await existing.disconnect().catch(() => undefined);
        roomRef.current = null;
      }

      setState((current) => ({
        ...current,
        roomName,
        nickname,
        connected: false,
        connecting: true,
        participantCount: 0,
        error: "",
      }));

      try {
        const response = await fetch("/api/livekit-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName,
            participantName: nickname,
          }),
        });

        const data = (await response.json()) as {
          token?: string;
          serverUrl?: string;
          error?: string;
        };

        if (!response.ok || !data.token || !data.serverUrl) {
          throw new Error(data.error || "Ses odasına bağlanılamadı.");
        }

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
          disconnectOnPageLeave: false,
        });

        roomRef.current = room;

        room.on(
          RoomEvent.TrackSubscribed,
          (
            track: RemoteTrack,
            _publication: RemoteTrackPublication,
          ) => {
            if (track.kind !== Track.Kind.Audio) return;

            const element = track.attach();
            element.autoplay = true;
            element.muted = !outputEnabledRef.current;
            element.volume = outputEnabledRef.current ? 1 : 0;
            element.dataset.haswolfVoice = "true";
            document.body.appendChild(element);
            audioElementsRef.current.add(element);
          },
        );

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach().forEach((element) => {
            audioElementsRef.current.delete(element);
            element.remove();
          });
        });

        room.on(RoomEvent.ActiveSpeakersChanged, updateActiveSpeaker);
        room.on(RoomEvent.ParticipantConnected, updateParticipantCount);
        room.on(RoomEvent.ParticipantDisconnected, updateParticipantCount);
        room.on(RoomEvent.Reconnected, updateParticipantCount);

        await room.connect(data.serverUrl, data.token);

        setState((current) => ({
          ...current,
          connected: true,
          connecting: false,
          participantCount: getParticipantCount(room),
          error: "",
        }));

        persist(
          roomName,
          nickname,
          wantedMicRef.current,
          outputEnabledRef.current,
        );

        if (wantedMicRef.current) {
          window.setTimeout(() => {
            void setMicrophone(true);
          }, 450);
        }
      } catch (error) {
        roomRef.current = null;

        setState((current) => ({
          ...current,
          connected: false,
          connecting: false,
          participantCount: 0,
          error:
            error instanceof Error
              ? error.message
              : "Ses odasına bağlanılamadı.",
        }));
      } finally {
        connectingRef.current = false;
      }
    },
    [
      persist,
      setMicrophone,
      updateActiveSpeaker,
      updateParticipantCount,
    ],
  );

  useEffect(() => {
    if (roomRef.current || connectingRef.current) return;

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as PersistedVoice;

      if (!saved.roomName || !saved.nickname) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }

      wantedMicRef.current = Boolean(saved.microphoneWanted);
      outputEnabledRef.current = saved.outputEnabled !== false;

      setState((current) => ({
        ...current,
        roomName: saved.roomName,
        nickname: saved.nickname,
        outputEnabled: outputEnabledRef.current,
      }));

      void connectVoice(saved.roomName, saved.nickname);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [connectVoice]);

  useEffect(() => {
    if (!state.connected) return;

    const timer = window.setInterval(() => {
      updateParticipantCount();
      updateActiveSpeaker();
    }, 1000);

    return () => window.clearInterval(timer);
  }, [
    state.connected,
    updateActiveSpeaker,
    updateParticipantCount,
  ]);

  const value = useMemo<VoiceContextValue>(
    () => ({
      ...state,
      connectVoice,
      disconnectVoice,
      setMicrophone,
      setOutput,
    }),
    [
      connectVoice,
      disconnectVoice,
      setMicrophone,
      setOutput,
      state,
    ],
  );

  const isCommunityPage = pathname?.startsWith("/topluluk");

  return (
    <VoiceContext.Provider value={value}>
      {children}

      {state.connected && !isCommunityPage && (
        <div className="haswolf-persistent-voice" role="status">
          <div className="haswolf-persistent-voice__status">
            <span
              className={state.microphoneEnabled ? "is-live" : ""}
              aria-hidden="true"
            >
              ●
            </span>

            <div className="haswolf-persistent-voice__summary">
              <strong>{state.roomName}</strong>
              <small>
                {state.activeSpeaker
                  ? `${state.activeSpeaker} konuşuyor`
                  : state.microphoneEnabled
                    ? `${state.nickname} mikrofonu açık`
                    : "Ses odası arka planda aktif"}
              </small>
            </div>
          </div>

          <div className="haswolf-persistent-voice__actions">
            <button
              type="button"
              onClick={() => setOutput(!state.outputEnabled)}
              title={state.outputEnabled ? "Oda sesini kapat" : "Oda sesini aç"}
            >
              {state.outputEnabled ? "🔊" : "🔇"}
            </button>

            <button
              type="button"
              className={state.microphoneEnabled ? "is-active" : ""}
              onClick={() =>
                void setMicrophone(!state.microphoneEnabled)
              }
              title={state.microphoneEnabled ? "Mikrofonu sustur" : "Mikrofonu aç"}
            >
              {state.microphoneEnabled ? "🎙️" : "🎤"}
            </button>

            <button
              type="button"
              className="is-danger"
              onClick={() => void disconnectVoice()}
              title="Ses odasından çık"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {state.error && !isCommunityPage && (
        <div className="haswolf-voice-error">
          {state.error}
        </div>
      )}
    </VoiceContext.Provider>
  );
}

export function usePersistentVoice() {
  const value = useContext(VoiceContext);

  if (!value) {
    throw new Error("PersistentVoiceProvider eksik.");
  }

  return value;
}

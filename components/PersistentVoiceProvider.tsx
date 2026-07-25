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
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
} from "livekit-client";

export type VoiceParticipant = {
  identity: string;
  userId: string;
  name: string;
  isGuest: boolean;
  isLocal: boolean;
  isSpeaking: boolean;
};

type PersistedVoice = {
  roomName: string;
  nickname: string;
  userId: string;
  microphoneWanted: boolean;
  outputEnabled: boolean;
};

type VoiceContextValue = {
  roomName: string;
  nickname: string;
  userId: string;
  connected: boolean;
  connecting: boolean;
  microphoneEnabled: boolean;
  outputEnabled: boolean;
  activeSpeaker: string;
  participantCount: number;
  participants: VoiceParticipant[];
  error: string;
  connectVoice: (roomName: string, nickname: string, userId?: string) => Promise<void>;
  disconnectVoice: () => Promise<void>;
  setMicrophone: (enabled: boolean) => Promise<void>;
  setOutput: (enabled: boolean) => void;
};

const STORAGE_KEY = "haswolf_active_voice_room";

const initialState = {
  roomName: "",
  nickname: "",
  userId: "",
  connected: false,
  connecting: false,
  microphoneEnabled: false,
  outputEnabled: true,
  activeSpeaker: "",
  participantCount: 0,
  participants: [] as VoiceParticipant[],
  error: "",
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

function parseMetadata(metadata?: string) {
  try {
    const parsed = JSON.parse(metadata || "{}") as {
      userId?: string;
      isGuest?: boolean;
    };
    return {
      userId: String(parsed.userId || ""),
      isGuest: Boolean(parsed.isGuest),
    };
  } catch {
    return { userId: "", isGuest: false };
  }
}

function participantToItem(
  participant: RemoteParticipant | Room["localParticipant"],
  isLocal: boolean,
): VoiceParticipant {
  const metadata = parseMetadata(participant.metadata);
  return {
    identity: participant.identity,
    userId: metadata.userId || participant.identity,
    name: participant.name || participant.identity || "KatÃ„Â±lÃ„Â±mcÃ„Â±",
    isGuest: metadata.isGuest,
    isLocal,
    isSpeaking: participant.isSpeaking,
  };
}

function getParticipants(room: Room) {
  const items: VoiceParticipant[] = [
    participantToItem(room.localParticipant, true),
  ];

  room.remoteParticipants.forEach((participant) => {
    items.push(participantToItem(participant, false));
  });

  return items;
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
  const audioByTrackRef = useRef(new Map<string, HTMLMediaElement>());
  const [state, setState] = useState(initialState);

  const persist = useCallback(
    (
      roomName: string,
      nickname: string,
      userId: string,
      microphoneWanted: boolean,
      outputEnabled: boolean,
    ) => {
      if (!roomName || !nickname) return;
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          roomName,
          nickname,
          userId,
          microphoneWanted,
          outputEnabled,
        } satisfies PersistedVoice),
      );
    },
    [],
  );

  const refreshParticipants = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    const participants = getParticipants(room);
    const active =
      participants.find((participant) => participant.isSpeaking)?.name || "";

    setState((current) => ({
      ...current,
      participants,
      participantCount: participants.length,
      activeSpeaker: active,
    }));
  }, []);

  const clearAudio = useCallback(() => {
    audioByTrackRef.current.forEach((element) => {
      element.pause();
      element.srcObject = null;
      element.remove();
    });
    audioByTrackRef.current.clear();

    document
      .querySelectorAll<HTMLMediaElement>("audio[data-haswolf-voice-track]")
      .forEach((element) => {
        element.pause();
        element.srcObject = null;
        element.remove();
      });
  }, []);

  const setOutput = useCallback((enabled: boolean) => {
    outputEnabledRef.current = enabled;

    audioByTrackRef.current.forEach((element) => {
      element.muted = !enabled;
      element.volume = enabled ? 1 : 0;
    });

    setState((current) => ({ ...current, outputEnabled: enabled }));

    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as PersistedVoice;
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...saved, outputEnabled: enabled }),
      );
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const disconnectVoice = useCallback(async () => {
    sessionStorage.removeItem(STORAGE_KEY);
    wantedMicRef.current = false;
    connectingRef.current = false;
    clearAudio();

    const room = roomRef.current;
    roomRef.current = null;

    if (room) {
      await room.localParticipant
        .setMicrophoneEnabled(false)
        .catch(() => undefined);
      await room.disconnect().catch(() => undefined);
    }

    setState(initialState);
  }, [clearAudio]);

  const setMicrophone = useCallback(
    async (enabled: boolean) => {
      const room = roomRef.current;

      if (!room || room.state !== "connected") {
        setState((current) => ({
          ...current,
          microphoneEnabled: false,
          error: "Ses odasÃ„Â± baÃ„Å¸lantÃ„Â±sÃ„Â± hazÃ„Â±r deÃ„Å¸il.",
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

        const publication = room.localParticipant.getTrackPublication(
          Track.Source.Microphone,
        );
        const active = Boolean(publication) && !publication?.isMuted && enabled;

        setState((current) => {
          persist(
            current.roomName,
            current.nickname,
            current.userId,
            enabled,
            outputEnabledRef.current,
          );
          return {
            ...current,
            microphoneEnabled: active,
            error:
              enabled && !active
                ? "Mikrofon yayÃ„Â±nÃ„Â± baÃ…Å¸latÃ„Â±lamadÃ„Â±. TarayÃ„Â±cÃ„Â± mikrofon iznini kontrol et."
                : "",
          };
        });

        refreshParticipants();
      } catch (error) {
        wantedMicRef.current = false;
        setState((current) => ({
          ...current,
          microphoneEnabled: false,
          error:
            error instanceof Error ? error.message : "Mikrofon aÃƒÂ§Ã„Â±lamadÃ„Â±.",
        }));
      }
    },
    [persist, refreshParticipants],
  );

  const connectVoice = useCallback(
    async (roomName: string, nickname: string, userId = "") => {
      const existing = roomRef.current;

      if (existing?.state === "connected" && existing.name === roomName) {
        refreshParticipants();
        return;
      }

      if (connectingRef.current) return;
      connectingRef.current = true;

      if (existing) {
        clearAudio();
        await existing.disconnect().catch(() => undefined);
        roomRef.current = null;
      }

      setState((current) => ({
        ...current,
        roomName,
        nickname,
        userId,
        connected: false,
        connecting: true,
        participants: [],
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
            userId,
          }),
        });

        const data = (await response.json()) as {
          token?: string;
          serverUrl?: string;
          error?: string;
        };

        if (!response.ok || !data.token || !data.serverUrl) {
          throw new Error(data.error || "Ses odasÃ„Â±na baÃ„Å¸lanÃ„Â±lamadÃ„Â±.");
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
            publication: RemoteTrackPublication,
          ) => {
            if (track.kind !== Track.Kind.Audio) return;

            const trackKey = publication.trackSid || track.sid || `audio-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const previous = audioByTrackRef.current.get(trackKey);
            if (previous) {
              previous.pause();
              previous.srcObject = null;
              previous.remove();
              audioByTrackRef.current.delete(trackKey);
            }

            document
              .querySelectorAll<HTMLMediaElement>(
                `audio[data-haswolf-voice-track="${trackKey}"]`,
              )
              .forEach((duplicate) => duplicate.remove());

            track.detach().forEach((element) => element.remove());
            const element = track.attach() as HTMLMediaElement;
            element.autoplay = true;
element.muted = !outputEnabledRef.current;
            element.volume = outputEnabledRef.current ? 1 : 0;
            element.dataset.haswolfVoiceTrack = trackKey;
            document.body.appendChild(element);
            audioByTrackRef.current.set(trackKey, element);
            void element.play().catch(() => undefined);
          },
        );

        room.on(
          RoomEvent.TrackUnsubscribed,
          (
            track: RemoteTrack,
            publication: RemoteTrackPublication,
          ) => {
            const trackKey = publication.trackSid || track.sid;

            if (trackKey) {
              const element = audioByTrackRef.current.get(trackKey);
              if (element) {
                element.pause();
                element.srcObject = null;
                element.remove();
                audioByTrackRef.current.delete(trackKey);
              }
            }

            track.detach().forEach((element) => {
              element.pause();
              element.srcObject = null;
              element.remove();
            });
          },
        );

        room.on(RoomEvent.ActiveSpeakersChanged, refreshParticipants);
        room.on(RoomEvent.ParticipantConnected, refreshParticipants);
        room.on(RoomEvent.ParticipantDisconnected, refreshParticipants);
        room.on(RoomEvent.ParticipantMetadataChanged, refreshParticipants);
        room.on(RoomEvent.Reconnected, refreshParticipants);

        await room.connect(data.serverUrl, data.token);

        const participants = getParticipants(room);
        setState((current) => ({
          ...current,
          connected: true,
          connecting: false,
          participants,
          participantCount: participants.length,
          error: "",
        }));

        persist(
          roomName,
          nickname,
          userId,
          wantedMicRef.current,
          outputEnabledRef.current,
        );

        if (wantedMicRef.current) {
          window.setTimeout(() => void setMicrophone(true), 350);
        }
      } catch (error) {
        roomRef.current = null;
        clearAudio();
        setState((current) => ({
          ...current,
          connected: false,
          connecting: false,
          participants: [],
          participantCount: 0,
          error:
            error instanceof Error
              ? error.message
              : "Ses odasÃ„Â±na baÃ„Å¸lanÃ„Â±lamadÃ„Â±.",
        }));
      } finally {
        connectingRef.current = false;
      }
    },
    [
      clearAudio,
      persist,
      refreshParticipants,
      setMicrophone,
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
        userId: saved.userId || "",
        outputEnabled: outputEnabledRef.current,
      }));
      void connectVoice(saved.roomName, saved.nickname, saved.userId || "");
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [connectVoice]);

  useEffect(() => {
    if (!state.connected) return;
    const timer = window.setInterval(refreshParticipants, 750);
    return () => window.clearInterval(timer);
  }, [refreshParticipants, state.connected]);

  useEffect(() => () => clearAudio(), [clearAudio]);

  const value = useMemo<VoiceContextValue>(
    () => ({
      ...state,
      connectVoice,
      disconnectVoice,
      setMicrophone,
      setOutput,
    }),
    [connectVoice, disconnectVoice, setMicrophone, setOutput, state],
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
              Ã¢â€”Â
            </span>
            <div className="haswolf-persistent-voice__summary">
              <strong>{state.roomName}</strong>
              <small>
                {state.activeSpeaker
                  ? `${state.activeSpeaker} konuÃ…Å¸uyor`
                  : state.microphoneEnabled
                    ? `${state.nickname} mikrofonu aÃƒÂ§Ã„Â±k`
                    : "Ses odasÃ„Â± arka planda aktif"}
              </small>
            </div>
          </div>

          <div className="haswolf-persistent-voice__actions">
            <button
              type="button"
              onClick={() => setOutput(!state.outputEnabled)}
              title={state.outputEnabled ? "Oda sesini kapat" : "Oda sesini aÃƒÂ§"}
            >
              {state.outputEnabled ? "ÄŸÅ¸â€Å " : "ÄŸÅ¸â€â€¡"}
            </button>
            <button
              type="button"
              className={state.microphoneEnabled ? "is-active" : ""}
              onClick={() => void setMicrophone(!state.microphoneEnabled)}
              title={
                state.microphoneEnabled ? "Mikrofonu sustur" : "Mikrofonu aÃƒÂ§"
              }
            >
              {state.microphoneEnabled ? "ÄŸÅ¸Ââ„¢Ã¯Â¸Â" : "ÄŸÅ¸ÂÂ¤"}
            </button>
            <button
              type="button"
              className="is-danger"
              onClick={() => void disconnectVoice()}
              title="Ses odasÃ„Â±ndan ÃƒÂ§Ã„Â±k"
            >
              Ã¢Å“â€¢
            </button>
          </div>
        </div>
      )}

      {state.error && !isCommunityPage && (
        <div className="haswolf-voice-error">{state.error}</div>
      )}
    </VoiceContext.Provider>
  );
}

export function usePersistentVoice() {
  const value = useContext(VoiceContext);
  if (!value) throw new Error("PersistentVoiceProvider eksik.");
  return value;
}


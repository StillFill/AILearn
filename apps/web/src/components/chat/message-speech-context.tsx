"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { fetchTtsStatus, postTtsSpeech } from "@/lib/api/v1-client";
import {
  pickPreferredPortugueseVoice,
  SPEECH_SYNTHESIS_RATE,
} from "@/lib/pick-speech-synthesis-voice";

function speechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function subscribeSpeechSupport(onStoreChange: () => void) {
  void onStoreChange;
  return () => {};
}

type MessageSpeechContextValue = {
  playingMessageId: string | null;
  /** Browser nativo ou TTS OpenAI ativo no servidor. */
  supported: boolean;
  toggleSpeak: (messageId: string, plainText: string) => void;
};

const MessageSpeechContext = createContext<MessageSpeechContextValue | null>(
  null,
);

export function MessageSpeechProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(
    null,
  );
  const [openAiTtsEnabled, setOpenAiTtsEnabled] = useState(false);
  const utteranceGeneration = useRef(0);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanupMedia = useCallback(() => {
    if (typeof window === "undefined") return;
    window.speechSynthesis?.cancel();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      void audio.load();
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    const syncVoices = () => {
      voicesRef.current = synth.getVoices();
    };
    syncVoices();
    synth.addEventListener("voiceschanged", syncVoices);
    return () => synth.removeEventListener("voiceschanged", syncVoices);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchTtsStatus();
        if (cancelled) return;
        if (!res.ok) {
          setOpenAiTtsEnabled(false);
          return;
        }
        const data = (await res.json()) as { openaiTtsEnabled?: boolean };
        setOpenAiTtsEnabled(Boolean(data.openaiTtsEnabled));
      } catch {
        if (!cancelled) setOpenAiTtsEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const nativeSupported = useSyncExternalStore(
    subscribeSpeechSupport,
    speechSynthesisSupported,
    () => false,
  );

  const supported = nativeSupported || openAiTtsEnabled;

  const toggleSpeak = useCallback(
    (messageId: string, plainText: string) => {
      if (typeof window === "undefined") return;
      const trimmed = plainText.trim();
      if (!trimmed) return;

      if (playingMessageId === messageId) {
        utteranceGeneration.current += 1;
        cleanupMedia();
        setPlayingMessageId(null);
        return;
      }

      utteranceGeneration.current += 1;
      const gen = utteranceGeneration.current;
      cleanupMedia();
      setPlayingMessageId(messageId);

      const finish = () => {
        if (utteranceGeneration.current === gen) setPlayingMessageId(null);
      };

      const speakNative = () => {
        if (!window.speechSynthesis) {
          finish();
          return;
        }
        const utterance = new SpeechSynthesisUtterance(trimmed);
        utterance.lang = "pt-BR";
        utterance.rate = SPEECH_SYNTHESIS_RATE;
        const voices =
          voicesRef.current.length > 0
            ? voicesRef.current
            : window.speechSynthesis.getVoices();
        const voice = pickPreferredPortugueseVoice(voices);
        if (voice) utterance.voice = voice;
        utterance.onend = finish;
        utterance.onerror = finish;
        window.speechSynthesis.speak(utterance);
      };

      if (openAiTtsEnabled) {
        void (async () => {
          try {
            const res = await postTtsSpeech(trimmed);
            if (utteranceGeneration.current !== gen) return;
            if (!res.ok) {
              if (speechSynthesisSupported()) speakNative();
              else finish();
              return;
            }
            const blob = await res.blob();
            if (utteranceGeneration.current !== gen) return;
            const url = URL.createObjectURL(blob);
            objectUrlRef.current = url;
            const audio = new Audio(url);
            audioRef.current = audio;
            const revokeThis = () => {
              if (objectUrlRef.current === url) {
                URL.revokeObjectURL(url);
                objectUrlRef.current = null;
                audioRef.current = null;
              }
            };
            audio.onended = () => {
              revokeThis();
              finish();
            };
            audio.onerror = () => {
              revokeThis();
              if (
                utteranceGeneration.current === gen &&
                speechSynthesisSupported()
              ) {
                speakNative();
              } else {
                finish();
              }
            };
            try {
              await audio.play();
            } catch {
              revokeThis();
              if (
                utteranceGeneration.current === gen &&
                speechSynthesisSupported()
              ) {
                speakNative();
              } else {
                finish();
              }
            }
          } catch {
            if (utteranceGeneration.current !== gen) return;
            if (speechSynthesisSupported()) speakNative();
            else finish();
          }
        })();
        return;
      }

      speakNative();
    },
    [playingMessageId, openAiTtsEnabled, cleanupMedia],
  );

  useEffect(() => {
    return () => {
      utteranceGeneration.current += 1;
      cleanupMedia();
    };
  }, [cleanupMedia]);

  const value = useMemo(
    () => ({ playingMessageId, toggleSpeak, supported }),
    [playingMessageId, toggleSpeak, supported],
  );

  return (
    <MessageSpeechContext.Provider value={value}>
      {children}
    </MessageSpeechContext.Provider>
  );
}

export function useMessageSpeech() {
  const ctx = useContext(MessageSpeechContext);
  if (!ctx) {
    throw new Error("useMessageSpeech must be used within MessageSpeechProvider");
  }
  return ctx;
}

import { useState, useRef, useCallback, useEffect } from 'react';

function pickBestFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const english = voices.filter((v) => v.lang.startsWith('en'));

  // Priority 1: Natural / Online Neural Female Voices (Edge & Chrome Natural voices)
  const naturalFemale = english.find((v) => {
    const n = v.name.toLowerCase();
    const isNatural = n.includes('natural') || n.includes('neural') || n.includes('online');
    const isFemale =
      n.includes('jenny') ||
      n.includes('aria') ||
      n.includes('female') ||
      n.includes('sara') ||
      n.includes('michelle') ||
      n.includes('ava') ||
      n.includes('emma');
    return isNatural && isFemale;
  });
  if (naturalFemale) return naturalFemale;

  // Priority 2: Named Female voices (Jenny, Aria, Zira, Samantha, Victoria, Karen)
  const namedFemale = english.find((v) => {
    const n = v.name.toLowerCase();
    return (
      n.includes('jenny') ||
      n.includes('aria') ||
      n.includes('zira') ||
      n.includes('samantha') ||
      n.includes('victoria') ||
      n.includes('karen') ||
      n.includes('female') ||
      n.includes('allison')
    );
  });
  if (namedFemale) return namedFemale;

  // Priority 3: Google US or UK Female
  const googleFemale = english.find((v) => {
    const n = v.name.toLowerCase();
    return n.includes('google') && (n.includes('female') || n.includes('en-us') || n.includes('en-gb'));
  });
  if (googleFemale) return googleFemale;

  // Priority 4: Non-male English voice
  const nonMale = english.find((v) => {
    const n = v.name.toLowerCase();
    return (
      !n.includes('david') &&
      !n.includes('mark') &&
      !n.includes('guy') &&
      !n.includes('george') &&
      !n.includes('male')
    );
  });
  if (nonMale) return nonMale;

  return english[0] || voices[0] || null;
}

export interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  activeVoiceName: string;
  speak: (text: string) => void;
  stop: () => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const isSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMutedState] = useState(false);
  const [activeVoiceName, setActiveVoiceName] = useState('');
  const isMutedRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const cachedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!isSupported) return;

    const refreshVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const best = pickBestFemaleVoice(voices);
      if (best) {
        cachedVoiceRef.current = best;
        setActiveVoiceName(best.name);
      }
    };

    refreshVoice();
    window.speechSynthesis.onvoiceschanged = refreshVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || isMutedRef.current) return;
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.96; // warm, conversational pacing
      utterance.pitch = 1.05; // natural feminine tone
      utterance.volume = 1;

      // Assign natural female voice
      const voice = cachedVoiceRef.current || pickBestFemaleVoice(window.speechSynthesis.getVoices());
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = (e) => {
        if (e.error !== 'canceled' && e.error !== 'interrupted') {
          console.warn('Speech synthesis warning:', e.error);
        }
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const toggleMute = useCallback(() => {
    const newMuted = !isMutedRef.current;
    isMutedRef.current = newMuted;
    setIsMutedState(newMuted);
    if (newMuted) {
      stop();
    }
  }, [stop]);

  const setMuted = useCallback((muted: boolean) => {
    isMutedRef.current = muted;
    setIsMutedState(muted);
    if (muted) {
      if (isSupported) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    isMuted,
    activeVoiceName,
    speak,
    stop,
    toggleMute,
    setMuted,
  };
}

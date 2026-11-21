import { useState, useRef, useCallback, useEffect } from 'react';
import { groqService } from '@/services/groqService';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export interface UseVoiceRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  isTranscribing: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  engine: 'browser' | 'whisper';
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const hasMediaRecorder =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== 'undefined';

  const isSupported = Boolean(SpeechRecognitionAPI || hasMediaRecorder);

  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<'browser' | 'whisper'>('browser');

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const useWhisperFallbackRef = useRef(false);
  const isStoppingRef = useRef(false);
  const finalTranscriptRef = useRef('');

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onstart = null;
      try {
        recognitionRef.current.abort();
      } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch { /* ignore */ }
      mediaRecorderRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Microphone audio input is not supported in this browser.');
      return;
    }

    cleanup();
    setError(null);
    isStoppingRef.current = false;
    useWhisperFallbackRef.current = false;
    audioChunksRef.current = [];
    finalTranscriptRef.current = transcript;
    setEngine('browser');

    // 1. Start audio recording via MediaRecorder as universal, fail-proof recorder
    try {
      if (hasMediaRecorder) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        let mimeType = '';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }

        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(250);
        mediaRecorderRef.current = recorder;
      }
    } catch (micErr) {
      console.warn('Microphone stream error:', micErr);
      if (
        micErr instanceof DOMException &&
        (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError')
      ) {
        setError('Microphone access was denied. Please allow microphone permission in your browser.');
        setIsListening(false);
        return;
      }
    }

    // 2. Start Web Speech API if supported (for instant live preview)
    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interim = '';
          let final = finalTranscriptRef.current;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              const newText = result[0].transcript.trim();
              if (newText) {
                final = final ? `${final} ${newText}` : newText;
              }
            } else {
              interim += result[0].transcript;
            }
          }

          finalTranscriptRef.current = final;
          setTranscript(final);
          setInterimTranscript(interim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'aborted' || event.error === 'no-speech') {
            return;
          }
          if (event.error === 'not-allowed') {
            setError('Microphone access was denied. Please allow microphone permission.');
            setIsListening(false);
          } else if (event.error === 'network') {
            // Google Web Speech API network error:
            // Intercept seamlessly! Do NOT fail or abort the recording.
            // Switch engine to Groq Whisper AI which will transcribe the pristine audio on stop.
            console.info('Google Speech network unavailable. Falling back seamlessly to Groq Whisper AI.');
            useWhisperFallbackRef.current = true;
            setEngine('whisper');
            setError(null);
          } else {
            console.warn('Speech recognition warning:', event.error);
            useWhisperFallbackRef.current = true;
          }
        };

        recognition.onend = () => {
          if (isStoppingRef.current) {
            setIsListening(false);
            setInterimTranscript('');
          }
        };

        recognition.start();
      } catch (err) {
        console.warn('Could not initialize Web Speech, using Groq Whisper:', err);
        useWhisperFallbackRef.current = true;
        setEngine('whisper');
      }
    } else {
      useWhisperFallbackRef.current = true;
      setEngine('whisper');
    }

    setIsListening(true);
  }, [SpeechRecognitionAPI, hasMediaRecorder, isSupported, transcript, cleanup]);

  const stopListening = useCallback(async () => {
    isStoppingRef.current = true;
    setIsListening(false);
    setInterimTranscript('');

    // Stop Web Speech
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch { /* ignore */ }
    }

    // Stop MediaRecorder and wait for final chunks
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        try {
          recorder.stop();
        } catch {
          resolve();
        }
      });
    }

    // Release microphone hardware
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Check whether we need Groq Whisper AI transcription:
    // Whisper is used if:
    // 1) Web Speech API reported a network error (useWhisperFallbackRef is true), OR
    // 2) Web Speech API didn't transcribe any text at all
    const hasWebSpeechResult = Boolean(
      finalTranscriptRef.current && finalTranscriptRef.current.trim().length > 0
    );
    const shouldTranscribeWithWhisper =
      useWhisperFallbackRef.current || !hasWebSpeechResult;

    if (shouldTranscribeWithWhisper && audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder?.mimeType || 'audio/webm',
      });

      // Ensure we recorded more than just a momentary click (> 1000 bytes)
      if (audioBlob.size > 1000) {
        setIsTranscribing(true);
        try {
          const transcribedText = await groqService.transcribeAudio(audioBlob);
          if (transcribedText) {
            const current = finalTranscriptRef.current.trim();
            const combined = current
              ? `${current} ${transcribedText}`
              : transcribedText;
            finalTranscriptRef.current = combined;
            setTranscript(combined);
            setError(null);
          }
        } catch (whisperErr) {
          console.error('Whisper transcription failed:', whisperErr);
          setError('Could not transcribe audio. You can type your answer or record again.');
        } finally {
          setIsTranscribing(false);
        }
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    setError(null);
  }, []);

  return {
    isSupported,
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    error,
    engine,
    startListening,
    stopListening,
    resetTranscript,
  };
}

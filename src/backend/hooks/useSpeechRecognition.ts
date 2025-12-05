'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { logError } from '@/backend/errors';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
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
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// User-friendly error messages for speech recognition errors
const SPEECH_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': 'Microphone access denied. Please enable microphone permissions in your browser settings.',
  'no-speech': 'No speech was detected. Please try speaking again.',
  'audio-capture': 'No microphone found. Please connect a microphone and try again.',
  'network': 'Network error occurred. Please check your internet connection.',
  'aborted': 'Voice recognition was cancelled.',
  'service-not-allowed': 'Speech recognition service is not available.',
  'bad-grammar': 'Speech recognition grammar error.',
  'language-not-supported': 'The selected language is not supported.',
};

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
  errorCode: string | null;
  isSupported: boolean;
  clearError: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);

    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
          setErrorCode(null);
          retryCountRef.current = 0;
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interim = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPart = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPart;
            } else {
              interim += transcriptPart;
            }
          }

          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
          }
          setInterimTranscript(interim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          const errorMessage = SPEECH_ERROR_MESSAGES[event.error] || `Voice recognition error: ${event.error}`;
          
          // Log error for monitoring
          logError(new Error(errorMessage), {
            context: 'useSpeechRecognition',
            errorCode: event.error,
            message: event.message,
          });

          // Handle specific errors
          switch (event.error) {
            case 'no-speech':
              // Don't show error for no-speech, just reset
              if (retryCountRef.current < maxRetries) {
                retryCountRef.current++;
                // Will auto-restart via onend
              } else {
                setError(errorMessage);
                setErrorCode(event.error);
              }
              break;
              
            case 'aborted':
              // User cancelled, don't show error
              break;
              
            case 'network':
              setError(errorMessage);
              setErrorCode(event.error);
              break;
              
            default:
              setError(errorMessage);
              setErrorCode(event.error);
          }
          
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
        };

        recognitionRef.current = recognition;
      } catch (err) {
        logError(err, { context: 'useSpeechRecognition.init' });
        setError('Failed to initialize speech recognition');
        setIsSupported(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Already stopped
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not available');
      return;
    }
    
    if (isListening) {
      return; // Already listening
    }
    
    setError(null);
    setErrorCode(null);
    setTranscript('');
    setInterimTranscript('');
    retryCountRef.current = 0;
    
    try {
      recognitionRef.current.start();
    } catch (err) {
      // Handle "already started" error
      const error = err as Error;
      if (error.message?.includes('already started')) {
        // Recognition is already running, stop and restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current?.start();
          }, 100);
        } catch {
          setError('Unable to start voice recognition. Please try again.');
        }
      } else {
        logError(err, { context: 'startListening' });
        setError('Failed to start voice recognition. Please try again.');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        logError(err, { context: 'stopListening' });
        // Force state update even if stop fails
        setIsListening(false);
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    error,
    errorCode,
    isSupported,
    clearError,
  };
}

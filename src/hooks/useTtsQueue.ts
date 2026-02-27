'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { textToSpeech } from '@/ai/flows/text-to-speech';

// Browser voice preferences for alternating male/female
const PREFERRED_FEMALE_VOICES = ['Microsoft Zira', 'Google UK English Female', 'Samantha', 'Karen', 'Victoria', 'Female'];
const PREFERRED_MALE_VOICES = ['Microsoft David', 'Google UK English Male', 'Daniel', 'Alex', 'Male'];

interface QueueItem {
  text: string;
  useFemale: boolean;
  ticketKey: string;
}

interface UseTtsQueueOptions {
  isStarted: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

export function useTtsQueue({ isStarted, onPlayStart, onPlayEnd }: UseTtsQueueOptions) {
  const queueRef = useRef<QueueItem[]>([]);
  const isPlayingRef = useRef(false);
  const announcedRef = useRef<Set<string>>(new Set());
  const voiceToggleRef = useRef(false); // false=male, true=female
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const apiCacheRef = useRef<Map<string, string>>(new Map()); // text -> audio data URI
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasBrowserTts, setHasBrowserTts] = useState(false);

  // Load browser voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setBrowserVoices(voices);
        setHasBrowserTts(true);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Pick a browser voice
  const pickBrowserVoice = useCallback((useFemale: boolean): SpeechSynthesisVoice | null => {
    if (browserVoices.length === 0) return null;

    const preferred = useFemale ? PREFERRED_FEMALE_VOICES : PREFERRED_MALE_VOICES;
    const englishVoices = browserVoices.filter(v => v.lang.startsWith('en'));

    // Try to find a preferred voice
    for (const name of preferred) {
      const match = englishVoices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
      if (match) return match;
    }

    // Fallback: just pick any English voice, alternating by index
    if (englishVoices.length >= 2) {
      return useFemale ? englishVoices[1] : englishVoices[0];
    }

    return englishVoices[0] || browserVoices[0] || null;
  }, [browserVoices]);

  // Speak using browser TTS
  const speakBrowser = useCallback((text: string, useFemale: boolean): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('No browser TTS'));
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickBrowserVoice(useFemale);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.9;
      utterance.pitch = useFemale ? 1.1 : 0.9;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        if (e.error === 'canceled') {
          resolve(); // Not a real error
        } else {
          reject(e);
        }
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [pickBrowserVoice]);

  // Speak using Gemini API (with caching)
  const speakApi = useCallback(async (text: string, useFemale: boolean): Promise<void> => {
    const voiceName = useFemale ? 'Aoede' : 'Algenib';
    const cacheKey = `${text}__${voiceName}`;

    let audioSrc = apiCacheRef.current.get(cacheKey);

    if (!audioSrc) {
      const result = await textToSpeech(text, voiceName);
      if (result.media) {
        audioSrc = result.media;
        apiCacheRef.current.set(cacheKey, audioSrc);
        // Limit cache size
        if (apiCacheRef.current.size > 50) {
          const firstKey = apiCacheRef.current.keys().next().value;
          if (firstKey) apiCacheRef.current.delete(firstKey);
        }
      } else {
        throw new Error(result.error || 'TTS API failed');
      }
    }

    return new Promise((resolve, reject) => {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      audio.src = audioSrc!;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Audio playback failed'));
      audio.play().catch(reject);
    });
  }, []);

  // Process queue
  const processQueue = useCallback(async () => {
    if (isPlayingRef.current || queueRef.current.length === 0 || !isStarted) return;

    isPlayingRef.current = true;
    const item = queueRef.current.shift()!;

    onPlayStart?.();

    try {
      if (hasBrowserTts) {
        // Use free browser TTS
        await speakBrowser(item.text, item.useFemale);
      } else {
        // Fallback to Gemini API with caching
        await speakApi(item.text, item.useFemale);
      }
    } catch (error) {
      console.warn('Primary TTS failed, trying fallback...', error);
      try {
        // If browser TTS failed, try API. If API failed, try browser.
        if (hasBrowserTts) {
          await speakApi(item.text, item.useFemale);
        } else {
          await speakBrowser(item.text, item.useFemale);
        }
      } catch (fallbackError) {
        console.error('All TTS methods failed:', fallbackError);
      }
    }

    onPlayEnd?.();
    isPlayingRef.current = false;

    // Process next after a short gap
    setTimeout(() => processQueue(), 500);
  }, [isStarted, hasBrowserTts, speakBrowser, speakApi, onPlayStart, onPlayEnd]);

  // Add to queue
  const announce = useCallback((ticketNumber: string, stationName: string, callTime: number) => {
    const uniqueKey = `${ticketNumber}-${callTime}`;
    if (announcedRef.current.has(uniqueKey)) return;
    announcedRef.current.add(uniqueKey);

    const useFemale = voiceToggleRef.current;
    voiceToggleRef.current = !voiceToggleRef.current;

    const number = parseInt(ticketNumber, 10) || ticketNumber;
    const text = `Customer number ${number}, please proceed to ${stationName}.`;

    queueRef.current.push({ text, useFemale, ticketKey: uniqueKey });
    processQueue();
  }, [processQueue]);

  // Cleanup old announced tickets
  useEffect(() => {
    const interval = setInterval(() => {
      if (announcedRef.current.size > 100) {
        announcedRef.current.clear();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return { announce, hasBrowserTts };
}

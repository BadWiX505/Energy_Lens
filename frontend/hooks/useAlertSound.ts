'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { AlertSeverity } from '@/types';

/**
 * Hook to manage alert sound playback with Web Audio API
 * 
 * Features:
 * - Severity-based sound selection (critical, warning, info)
 * - Handles browser autoplay restrictions gracefully
 * - Preloads audio elements for instant playback
 * - Falls back gracefully if audio files not found
 * 
 * Usage:
 * const { playSound, isReady } = useAlertSound();
 * await playSound('critical');
 */
export function useAlertSound() {
  const audioRefs = useRef<Record<AlertSeverity, HTMLAudioElement | null>>({
    critical: null,
    warning: null,
    info: null,
  });

  const isReadyRef = useRef(false);

  /**
   * Initialize audio elements
   */
  useEffect(() => {
    const initAudio = () => {
      // Critical alert sound
      const criticalAudio = new Audio('/sounds/critical-alert.mp3');
      criticalAudio.preload = 'auto';
      audioRefs.current.critical = criticalAudio;

      // Warning alert sound
      const warningAudio = new Audio('/sounds/warning-alert.mp3');
      warningAudio.preload = 'auto';
      audioRefs.current.warning = warningAudio;

      // Info alert sound
      const infoAudio = new Audio('/sounds/info-alert.mp3');
      infoAudio.preload = 'auto';
      audioRefs.current.info = infoAudio;

      isReadyRef.current = true;
    };

    // Allow autoplay on user interaction
    const enableAudioOnInteraction = () => {
      initAudio();
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
      document.removeEventListener('keydown', enableAudioOnInteraction);
    };

    // Try to init immediately
    initAudio();

    // Also setup interaction listeners as fallback for stricter browsers
    if (!isReadyRef.current) {
      document.addEventListener('click', enableAudioOnInteraction);
      document.addEventListener('touchstart', enableAudioOnInteraction);
      document.addEventListener('keydown', enableAudioOnInteraction);

      return () => {
        document.removeEventListener('click', enableAudioOnInteraction);
        document.removeEventListener('touchstart', enableAudioOnInteraction);
        document.removeEventListener('keydown', enableAudioOnInteraction);
      };
    }
  }, []);

  /**
   * Play sound based on alert severity
   * Handles errors gracefully if audio files missing
   */
  const playSound = useCallback(async (severity: AlertSeverity): Promise<void> => {
    try {
      const audio = audioRefs.current[severity];
      
      if (!audio) {
        console.warn(`[AlertSound] Audio element not initialized for severity: ${severity}`);
        return;
      }

      // Reset playback position to ensure sound plays from start even if already playing
      audio.currentTime = 0;

      // Attempt to play with error handling
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        try {
          await playPromise;
          console.debug(`[AlertSound] Playing ${severity} alert sound`);
        } catch (err: any) {
          // Autoplay was prevented or audio file missing
          if (err.name === 'NotAllowedError') {
            console.warn('[AlertSound] Autoplay prevented by browser. User interaction required.');
          } else if (err.name === 'NotSupportedError') {
            console.warn('[AlertSound] Audio file format not supported or file missing');
          } else {
            console.error('[AlertSound] Playback error:', err);
          }
        }
      }
    } catch (err) {
      console.error('[AlertSound] Unexpected error playing sound:', err);
    }
  }, []);

  const isReady = isReadyRef.current;

  return { playSound, isReady };
}

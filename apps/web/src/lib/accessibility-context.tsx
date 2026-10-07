'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SupportedLanguage } from '@rehabsense/types';
import { audioCoach } from './audio-coach';
import { spatialAudio, AudioPanSide } from './spatial-audio';

interface AccessibilityContextType {
  highContrast: boolean;
  largeText: boolean;
  voiceEnabled: boolean;
  language: SupportedLanguage;
  earphoneMode: boolean;
  activePanSide: AudioPanSide;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleVoice: () => void;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleEarphoneMode: () => void;
  testEarphone: (side: 'left' | 'right') => void;
  playSpatialBuzz: (side: AudioPanSide) => void;
  playSpatialRing: (side: AudioPanSide) => void;
  playSuccessChime: () => void;
  speak: (message: string, customLang?: SupportedLanguage) => void;
  getPhrase: (key: string, opts?: any) => string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [largeText, setLargeText] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [earphoneMode, setEarphoneMode] = useState<boolean>(true);
  const [activePanSide, setActivePanSide] = useState<AudioPanSide>('center');

  // Subscribe to live audio panning changes for UI visualization
  useEffect(() => {
    const unsubscribe = spatialAudio.subscribe((side) => {
      setActivePanSide(side);
    });
    return unsubscribe;
  }, []);

  // Restore preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedHighContrast = localStorage.getItem('rehab_high_contrast');
      const savedLargeText = localStorage.getItem('rehab_large_text');
      const savedVoice = localStorage.getItem('rehab_voice_enabled');
      const savedLang = localStorage.getItem('rehab_language') as SupportedLanguage | null;
      const savedEarphone = localStorage.getItem('rehab_earphone_mode');

      if (savedHighContrast !== null) setHighContrast(savedHighContrast === 'true');
      if (savedLargeText !== null) setLargeText(savedLargeText === 'true');
      if (savedVoice !== null) {
        const isVoice = savedVoice === 'true';
        setVoiceEnabled(isVoice);
        audioCoach.setVoiceEnabled(isVoice);
      }
      if (savedLang && (savedLang === 'en' || savedLang === 'hi' || savedLang === 'mr')) {
        setLanguageState(savedLang);
        audioCoach.setLanguage(savedLang);
      }
      if (savedEarphone !== null) {
        const isEarphone = savedEarphone === 'true';
        setEarphoneMode(isEarphone);
        audioCoach.setEarphoneFeedbackEnabled(isEarphone);
      }
    } catch {
      // Storage access might be restricted
    }
  }, []);

  // Update DOM classes when accessibility settings change
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (highContrast) {
        document.documentElement.classList.add('dark', 'high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (!prefersDark) {
          document.documentElement.classList.remove('dark');
        }
      }

      if (largeText) {
        document.documentElement.classList.add('text-lg');
      } else {
        document.documentElement.classList.remove('text-lg');
      }
    }
  }, [highContrast, largeText]);

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rehab_high_contrast', String(next));
      } catch {}
      return next;
    });
  };

  const toggleLargeText = () => {
    setLargeText((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rehab_large_text', String(next));
      } catch {}
      return next;
    });
  };

  const toggleVoice = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      audioCoach.setVoiceEnabled(next);
      try {
        localStorage.setItem('rehab_voice_enabled', String(next));
      } catch {}
      return next;
    });
  };

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    audioCoach.setLanguage(lang);
    try {
      localStorage.setItem('rehab_language', lang);
    } catch {}
  };

  const toggleEarphoneMode = () => {
    setEarphoneMode((prev) => {
      const next = !prev;
      audioCoach.setEarphoneFeedbackEnabled(next);
      try {
        localStorage.setItem('rehab_earphone_mode', String(next));
      } catch {}
      return next;
    });
  };

  const testEarphone = (side: 'left' | 'right') => {
    if (side === 'left') {
      audioCoach.testLeftEarphone();
    } else {
      audioCoach.testRightEarphone();
    }
  };

  const playSpatialBuzz = (side: AudioPanSide) => {
    if (earphoneMode) {
      spatialAudio.playPostureBuzz(side);
    }
  };

  const playSpatialRing = (side: AudioPanSide) => {
    if (earphoneMode) {
      spatialAudio.playPostureRing(side);
    }
  };

  const playSuccessChime = () => {
    spatialAudio.playSuccessChime();
  };

  const speak = (message: string, customLang?: SupportedLanguage) => {
    if (!voiceEnabled) return;
    audioCoach.speak(message, customLang || language);
  };

  const getPhrase = (key: string, opts?: any) => {
    return audioCoach.getPhrase(key, opts);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        largeText,
        voiceEnabled,
        language,
        earphoneMode,
        activePanSide,
        toggleHighContrast,
        toggleLargeText,
        toggleVoice,
        setLanguage,
        toggleEarphoneMode,
        testEarphone,
        playSpatialBuzz,
        playSpatialRing,
        playSuccessChime,
        speak,
        getPhrase,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

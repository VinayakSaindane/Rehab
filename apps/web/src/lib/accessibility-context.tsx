'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  largeText: boolean;
  voiceEnabled: boolean;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleVoice: () => void;
  speak: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [largeText, setLargeText] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Restore preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedHighContrast = localStorage.getItem('rehab_high_contrast');
      const savedLargeText = localStorage.getItem('rehab_large_text');
      const savedVoice = localStorage.getItem('rehab_voice_enabled');

      if (savedHighContrast !== null) setHighContrast(savedHighContrast === 'true');
      if (savedLargeText !== null) setLargeText(savedLargeText === 'true');
      if (savedVoice !== null) setVoiceEnabled(savedVoice === 'true');
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
        // Only remove 'dark' if it was added by high-contrast (not user preference)
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
      try {
        localStorage.setItem('rehab_voice_enabled', String(next));
      } catch {}
      return next;
    });
  };

  const speak = (message: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        largeText,
        voiceEnabled,
        toggleHighContrast,
        toggleLargeText,
        toggleVoice,
        speak,
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

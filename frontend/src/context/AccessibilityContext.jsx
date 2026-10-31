import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  // 1. High contrast mode
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('brightloop_high_contrast') === 'true';
  });

  // 2. Adjustable text size: 'normal' | 'large' | 'xlarge'
  const [textSize, setTextSize] = useState(() => {
    return localStorage.getItem('brightloop_text_size') || 'normal';
  });

  // 3. Screen reader live announcement
  const [announcement, setAnnouncement] = useState('');

  // 4. Speech synthesis (Read Aloud)
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Apply high contrast class
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('brightloop_high_contrast', highContrast.toString());
  }, [highContrast]);

  // Apply font scale
  useEffect(() => {
    const root = document.documentElement;
    let scale = '1rem';
    if (textSize === 'large') scale = '1.125rem'; // 18px
    if (textSize === 'xlarge') scale = '1.25rem';  // 20px
    root.style.setProperty('--font-scale', scale);
    localStorage.setItem('brightloop_text_size', textSize);
  }, [textSize]);

  const toggleHighContrast = useCallback(() => {
    setHighContrast(prev => {
      const next = !prev;
      announce(next ? 'High contrast mode enabled' : 'High contrast mode disabled');
      return next;
    });
  }, []);

  const changeTextSize = useCallback((size) => {
    setTextSize(size);
    announce(`Font size changed to ${size}`);
  }, []);

  const announce = useCallback((message) => {
    setAnnouncement(message);
    const timer = setTimeout(() => setAnnouncement(''), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Web Speech API for Read-Aloud
  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window)) {
      announce('Text to speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    if (!text) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // slightly slower for better accessibility clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    announce('Reading text aloud');
  }, [announce]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    announce('Stopped reading');
  }, [announce]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        textSize,
        changeTextSize,
        announce,
        speak,
        stopSpeaking,
        isSpeaking,
      }}
    >
      {/* Invisible live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
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


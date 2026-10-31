import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

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

  // 3. Hover-to-speech settings
  const [hoverToSpeech, setHoverToSpeech] = useState(() => {
    const saved = localStorage.getItem('brightloop_hover_speech');
    return saved !== null ? saved === 'true' : true; // Enabled by default for demonstration
  });

  const [speechRate, setSpeechRate] = useState(() => {
    const saved = localStorage.getItem('brightloop_speech_rate');
    return saved ? parseFloat(saved) : 1.0;
  });

  const [hoverDelay, setHoverDelay] = useState(600); // 600ms debounce
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const isSpeechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const hoverTimerRef = useRef(null);
  const lastSpokenElementRef = useRef(null);

  // Apply high contrast class to html root
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

  // Save speech settings
  useEffect(() => {
    localStorage.setItem('brightloop_hover_speech', hoverToSpeech.toString());
  }, [hoverToSpeech]);

  useEffect(() => {
    localStorage.setItem('brightloop_speech_rate', speechRate.toString());
  }, [speechRate]);

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

  const stopSpeaking = useCallback(() => {
    if (isSpeechSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [isSpeechSupported]);

  const speakText = useCallback((text) => {
    if (!isSpeechSupported || !text) return;
    const cleanText = text.trim();
    if (!cleanText) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSpeechSupported, speechRate]);

  // Clean element text extraction: extracts readable short label
  const extractReadableText = useCallback((el) => {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return '';

    // Ignore aria-hidden, scripts, svgs, or decorative containers
    if (el.getAttribute('aria-hidden') === 'true' || el.tagName === 'svg' || el.tagName === 'path') {
      return '';
    }

    // 1. Check aria-label
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.trim()) return ariaLabel.trim();

    // 2. Check title attribute
    const title = el.getAttribute('title');
    if (title && title.trim()) return title.trim();

    // 3. For buttons, headings, table cells, form labels, links
    const clone = el.cloneNode(true);
    // Remove svgs or icons inside clone
    clone.querySelectorAll('svg, [aria-hidden="true"]').forEach(n => n.remove());

    const text = clone.innerText || clone.textContent || '';
    const trimmed = text.replace(/\s+/g, ' ').trim();

    // Avoid reading very large blocks of text all at once
    if (trimmed.length > 180) {
      return trimmed.slice(0, 180) + '...';
    }
    return trimmed;
  }, []);

  // Global Hover-To-Speech Event Listener
  useEffect(() => {
    if (!hoverToSpeech || !isSpeechSupported) {
      stopSpeaking();
      return;
    }

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target || !(target instanceof HTMLElement)) return;

      // Find closest relevant text element
      const relevantEl = target.closest(
        'button, a, h1, h2, h3, h4, h5, h6, th, td, label, [role="status"], [role="button"], [data-speech="true"], p'
      );

      if (!relevantEl || relevantEl === lastSpokenElementRef.current) {
        return;
      }

      // Clear any pending timer
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }

      const text = extractReadableText(relevantEl);
      if (!text || text.length < 2) return;

      // Start hover debounce timer (500-700ms)
      hoverTimerRef.current = setTimeout(() => {
        lastSpokenElementRef.current = relevantEl;
        speakText(text);
      }, hoverDelay);
    };

    const handleMouseOut = (e) => {
      const target = e.target;
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      if (lastSpokenElementRef.current === target) {
        lastSpokenElementRef.current = null;
      }
    };

    // Keyboard support: Alt + S reads current focused element
    const handleKeyDown = (e) => {
      if ((e.altKey && (e.key === 's' || e.key === 'S')) || (e.shiftKey && e.code === 'Space' && e.target !== document.body)) {
        const active = document.activeElement;
        if (active && active !== document.body) {
          const text = extractReadableText(active);
          if (text) {
            e.preventDefault();
            speakText(text);
          }
        }
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('keydown', handleKeyDown);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, [hoverToSpeech, isSpeechSupported, hoverDelay, extractReadableText, speakText, stopSpeaking]);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        toggleHighContrast,
        textSize,
        changeTextSize,
        hoverToSpeech,
        setHoverToSpeech,
        speechRate,
        setSpeechRate,
        hoverDelay,
        setHoverDelay,
        isSpeechSupported,
        isSpeaking,
        speakText,
        stopSpeaking,
        announce,
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


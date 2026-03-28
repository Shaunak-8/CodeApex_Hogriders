import React, { useState, useEffect, useRef } from 'react';

const lines = [
  { type: 'prompt', text: 'INITIALIZING_CORE_RECOVERY...' },
  { type: 'dim', label: '[SYSTEM]', text: ' ANALYZING_REPOSTRUCTURE_X' },
  { type: 'dim', label: '[DB]', text: ' FOUND_LOOSE_KEY_AT_D2f1a-98X-B' },
  { type: 'action', label: '[ACTION]', text: ' OPTIMIZING_CACHE_LAYER_02' },
  { type: 'success', label: '●●●', text: ' INJECTING_AUTO_PATCH_01' },
  { type: 'dim', label: '[OK]', text: ' INTEGRITY_CHECK_PASSED (0.003ms)' },
  { type: 'dim', label: '[SYSTEM]', text: ' MAPPING_PROX_NODES...' }
];

const styles = {
  termLine: { marginBottom: 18, display: 'flex', gap: 12, alignItems: 'flex-start' },
  termPrompt: { color: 'var(--text-secondary)', fontSize: 18, fontWeight: 800 },
  termDim: { color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 16, fontWeight: 700 },
  termSuccess: { color: 'var(--green)', WebkitTextStroke: '0.2px black', whiteSpace: 'nowrap', fontSize: 16, fontWeight: 800 },
  termAction: { color: 'var(--cyan)', whiteSpace: 'nowrap', fontSize: 16, fontWeight: 800 },
  text: { color: 'var(--green)', WebkitTextStroke: '0.2px black', wordBreak: 'break-all', fontSize: 18, fontWeight: 600, letterSpacing: '0.5px' },
  cursor: { display: 'inline-block', width: 10, height: 20, background: 'var(--green)', marginLeft: 4, animation: 'blink 1s step-end infinite', verticalAlign: 'middle' }
};

export default function TypingTerminal() {
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Initial delay before starting
    if (currentLineIndex === 0 && currentCharIndex === 0 && displayedLines.length === 0) {
      const startTimeout = setTimeout(() => {
        setDisplayedLines(['']);
      }, 1000);
      return () => clearTimeout(startTimeout);
    }

    if (isDone) {
      const resetTimeout = setTimeout(() => {
        setDisplayedLines([]);
        setCurrentLineIndex(0);
        setCurrentCharIndex(0);
        setIsDone(false);
      }, 3000);
      return () => clearTimeout(resetTimeout);
    }

    const currentLineData = lines[currentLineIndex];
    if (!currentLineData) return;

    if (currentCharIndex < currentLineData.text.length) {
      // Typing character
      const baseSpeed = 30;
      const randomness = Math.random() * 20;
      const isSpace = currentLineData.text[currentCharIndex] === ' ';
      const isPauseChar = ['.', '_', '-'].includes(currentLineData.text[currentCharIndex]);
      
      let delay = baseSpeed + randomness;
      if (isSpace) delay += 30;
      if (isPauseChar && Math.random() > 0.7) delay += 150; // Micro-pause

      const timeout = setTimeout(() => {
        setDisplayedLines(prev => {
          const newLines = [...prev];
          newLines[currentLineIndex] = currentLineData.text.slice(0, currentCharIndex + 1);
          return newLines;
        });
        setCurrentCharIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    } else {
      // Line finished, wait and move to next
      if (currentLineIndex < lines.length - 1) {
        const lineDelay = 400 + Math.random() * 200;
        const timeout = setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1);
          setCurrentCharIndex(0);
          setDisplayedLines(prev => [...prev, '']);
        }, lineDelay);
        return () => clearTimeout(timeout);
      } else {
        setIsDone(true);
      }
    }
  }, [currentLineIndex, currentCharIndex, displayedLines.length, isDone]);

  return (
    <div>
      {displayedLines.map((text, idx) => {
        const lineData = lines[idx];
        return (
          <div key={idx} style={styles.termLine}>
            {lineData.type === 'prompt' && <span style={styles.termPrompt}>»</span>}
            {lineData.type === 'dim' && <span style={styles.termDim}>{lineData.label}</span>}
            {lineData.type === 'action' && <span style={styles.termAction}>{lineData.label}</span>}
            {lineData.type === 'success' && <span style={styles.termSuccess}>{lineData.label}</span>}
            <span style={styles.text}>
              {text}
              {!isDone && idx === currentLineIndex && <span style={styles.cursor}></span>}
            </span>
          </div>
        );
      })}
      <style>{`
        @keyframes blink {
          from, to { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

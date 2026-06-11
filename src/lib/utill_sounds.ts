export const playBeep = () => {
  if (typeof window === 'undefined') return;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startTime = audioContext.currentTime;

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, startTime);
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.25, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.28);
    oscillator.onended = () => {
      audioContext.close().catch(() => undefined);
    };
  } catch {
    // Audio is non-critical; keep the scan flow running if the browser blocks sound.
  }
};

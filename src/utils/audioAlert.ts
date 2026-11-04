/**
 * Web Audio API synthesizer for Breaking Race Call fanfare chimes.
 * Clean, pleasant two-tone breaking news alert sound.
 */

let audioCtx: AudioContext | null = null;

export function playRaceCallChime(isFlip: boolean = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Frequencies: Higher exciting chime if it's a major flip!
    const notes = isFlip
      ? [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 (major fanfare chord)
      : [440, 554.37, 659.25]; // A4, C#5, E5

    notes.forEach((freq, idx) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.45);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.5);
    });
  } catch (err) {
    // Graceful fallback if Web Audio is blocked or unavailable
    console.debug('Audio play skipped:', err);
  }
}

// Sound generator utilizing the Web Audio API for cute, arcade-like retro sound effects
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playBubblePop(pitchMultiplier = 1) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400 * pitchMultiplier, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200 * pitchMultiplier, ctx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

export function playEatCrunch() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Simulate multiple little crunches
  for (let i = 0; i < 3; i++) {
    const time = ctx.currentTime + i * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.setValueAtTime(80, time + 0.04);

    gain.gain.setValueAtTime(0.1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.start(time);
    osc.stop(time + 0.06);
  }
}

export function playPlaySound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Play a happy little rising arpeggio
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
  notes.forEach((freq, idx) => {
    const time = ctx.currentTime + idx * 0.07;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.08, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.start(time);
    osc.stop(time + 0.12);
  });
}

export function playLevelUp() {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Joyful victory fanfare
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const time = ctx.currentTime + idx * 0.08;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.1, time);
    // Let the final note ring longer
    const duration = idx === notes.length - 1 ? 0.4 : 0.12;
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.start(time);
    osc.stop(time + duration);
  });
}

export function playSnore() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'triangle';
  // Slow gentle snore modulation
  osc.frequency.setValueAtTime(90, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.3);
  osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.6);

  gain.gain.setValueAtTime(0.03, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.3);
  gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.6);

  osc.start();
  osc.stop(ctx.currentTime + 0.6);
}

export function playPetAffection() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

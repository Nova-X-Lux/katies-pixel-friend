export type SoundKind = "tap" | "reward" | "drop" | "success";

let audioContext: AudioContext | null = null;
let lastPlayedAt = -1;

function soundsEnabled(): boolean {
  try {
    return localStorage.getItem("kpf:sound") === "on";
  } catch {
    return false;
  }
}

function tone(context: AudioContext, frequency: number, start: number, duration: number, volume: number, endFrequency = frequency) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + .008);
  gain.gain.exponentialRampToValueAtTime(.001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .02);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}

/** Call from a button or key press first; later game events reuse the unlocked context. */
export function playSound(kind: SoundKind): void {
  if (typeof window === "undefined" || document.hidden || !soundsEnabled()) return;
  try {
    if (!audioContext || audioContext.state !== "running") {
      // An unopened or suspended context must only be resumed during a gesture.
      if (navigator.userActivation && !navigator.userActivation.isActive) return;
      const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext ??= new AudioContextClass();
      if (audioContext.state === "suspended") {
        void audioContext.resume().catch(() => undefined);
      }
    }
    const context = audioContext;
    const now = context.currentTime;
    if (kind === "tap" && now - lastPlayedAt < .035) return;
    lastPlayedAt = now;
    if (kind === "tap") {
      tone(context, 520, now, .065, .045, 680);
    } else if (kind === "drop") {
      tone(context, 360, now, .12, .06, 190);
    } else if (kind === "reward") {
      tone(context, 660, now, .12, .055);
      tone(context, 880, now + .065, .14, .045);
    } else {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        tone(context, frequency, now + index * .085, .2, .045);
      });
    }
  } catch {
    // Audio is optional; browser audio limits must never interrupt care or play.
  }
}

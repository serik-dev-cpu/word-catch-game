import { getSoundEnabled, setSoundEnabled } from "./storage.js";

const SOUND_ON_ICON = "🔊";
const SOUND_OFF_ICON = "🔇";

let ctx = null;

function getCtx() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ freq, freqEnd, duration, type = "sine", gain = 0.16, startTime = 0 }) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + startTime;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration);
  gainNode.gain.setValueAtTime(gain, t0);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

function play(fn) {
  if (!getSoundEnabled()) return;
  try {
    fn();
  } catch {
    // audio unavailable (unsupported browser, blocked context, etc.) — fail silently
  }
}

export function unlockAudio() {
  getCtx();
}

export function playCatchCorrect() {
  play(() => tone({ freq: 660, freqEnd: 990, duration: 0.11, gain: 0.16 }));
}

export function playCatchWrong() {
  play(() => tone({ freq: 200, freqEnd: 110, duration: 0.18, type: "sawtooth", gain: 0.13 }));
}

export function playWordComplete() {
  play(() => {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      tone({ freq, duration: 0.15, gain: 0.15, startTime: i * 0.09 })
    );
  });
}

export function playGameOver() {
  play(() => {
    [392, 349.23, 293.66, 220].forEach((freq, i) =>
      tone({ freq, duration: 0.26, type: "triangle", gain: 0.14, startTime: i * 0.14 })
    );
  });
}

export function playUiTap() {
  play(() => tone({ freq: 440, duration: 0.05, gain: 0.07 }));
}

export function syncSoundButtons() {
  const enabled = getSoundEnabled();
  document.querySelectorAll(".sound-toggle").forEach((btn) => {
    btn.textContent = enabled ? SOUND_ON_ICON : SOUND_OFF_ICON;
    btn.setAttribute("aria-pressed", String(enabled));
    btn.setAttribute("aria-label", enabled ? "Выключить звук" : "Включить звук");
  });
}

export function initSoundToggles() {
  document.querySelectorAll(".sound-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      unlockAudio();
      const next = !getSoundEnabled();
      setSoundEnabled(next);
      syncSoundButtons();
      if (next) playUiTap();
    });
  });
  syncSoundButtons();
}

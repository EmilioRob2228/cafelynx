let ctx;

export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = ctx || new AC();
    if (ctx.state === "suspended") ctx.resume();
  } catch {
    /* sin audio disponible */
  }
}

function tone(freq, start, dur, gain = 0.18) {
  if (!ctx || ctx.state !== "running") return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur + 0.05);
}

export function playReady() {
  [660, 880, 1100].forEach((f, i) => tone(f, i * 0.16, 0.35));
}

export function playNewOrder() {
  tone(880, 0, 0.25);
  tone(880, 0.35, 0.25);
}

export function vibrate() {
  try {
    navigator.vibrate?.([200, 100, 200, 100, 400]);
  } catch {
    /* no soportado (iPhone) */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", unlockAudio, { once: true });
}

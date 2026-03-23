// ── Web Audio API — sonidos sintetizados (sin archivos externos) ──────────────
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
    if (!_ctx) _ctx = new AudioContext();
    return _ctx;
}

/** Llama esto una vez para que el AudioContext se reactive tras el primer gesto */
export function initAudio() {
    const resume = () => {
        getCtx().resume();
        document.removeEventListener('pointerdown', resume);
        document.removeEventListener('keydown', resume);
    };
    document.addEventListener('pointerdown', resume);
    document.addEventListener('keydown', resume);
}

/** Sonido de choque: ruido blanco + golpe grave */
export function playCrash() {
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;

        // Ruido blanco (impacto)
        const bufLen = Math.floor(ctx.sampleRate * 0.25);
        const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        noise.connect(noiseGain).connect(ctx.destination);
        noise.start(now);

        // Golpe grave (thud)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.18);
        oscGain.gain.setValueAtTime(0.45, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(oscGain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    } catch { /* AudioContext no disponible */ }
}

/** Jingle de victoria: cuatro notas ascendentes */
export function playWin() {
    try {
        const ctx = getCtx();
        const now = ctx.currentTime;
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const t = now + i * 0.13;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.22, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            osc.connect(gain).connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.22);
        });
    } catch { /* AudioContext no disponible */ }
}

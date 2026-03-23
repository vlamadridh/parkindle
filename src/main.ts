import './style.css';
import { getLevelForDate, getLevelById, DIFFICULTY_COLORS, LEVELS, type Level, type Rect } from './levels';
import { createCar, updateCar, isParked, isSpawnSafe, computeParkingScore, HITBOX_W, type CarState } from './car';
import {
    drawFrame, setCrashAngleOffset,
    createCrashParticles, createWinParticles, updateParticles,
    type Particle,
} from './renderer';

// ── Canvas ──────────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// ── Interfaces ───────────────────────────────────────────────────────────────
interface SavedDay { result: 'won' | 'lost'; levelId: number; attempts: number; }

// ── Sistema de fechas (UTC para consistencia entre zonas horarias) ────────────
const today      = new Date();
const dateKey    = `${today.getUTCFullYear()}-${today.getUTCMonth() + 1}-${today.getUTCDate()}`;
const dateString = `${today.getUTCDate()}/${today.getUTCMonth() + 1}/${today.getUTCFullYear()}`;

// ── Estado persistente ───────────────────────────────────────────────────────
let history: Record<string, SavedDay> = loadHistory();
let streak = loadStreak();

// ── Nivel ────────────────────────────────────────────────────────────────────
const dailyLevel  = getLevelForDate(today);
let   currentLevel: Level = dailyLevel;

// ── Estado del juego ─────────────────────────────────────────────────────────
let gameState: 'playing' | 'won' | 'lost' = history[dateKey]?.result ?? 'playing';
let attemptCount  = history[dateKey]?.attempts ?? 1; // El primer intento es el 1
let finishTriggered = false;
let particles: Particle[] = [];
let lastParkingScore = 0;

// ── Coche ────────────────────────────────────────────────────────────────────
// findSafeSpawn se define más abajo, así que usamos carStart directamente aquí;
// loadLevel() aplica la validación completa al cambiar de nivel.
let car: CarState = createCar(
    currentLevel.carStart.x,
    currentLevel.carStart.y,
    currentLevel.carStart.angle,
);

// ── Input ────────────────────────────────────────────────────────────────────
const keys: Record<string, boolean> = {};
const GAME_KEYS = new Set([
    'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
    'w','W','a','A','s','S','d','D',
]);

window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (GAME_KEYS.has(e.key)) e.preventDefault();
    if (e.key === 'r' || e.key === 'R') retryLevel();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// ── Delta time ───────────────────────────────────────────────────────────────
let lastTime = performance.now();

// ── Game loop ─────────────────────────────────────────────────────────────────
function gameLoop(timestamp: number) {
    const dt = Math.min((timestamp - lastTime) / (1000 / 60), 3); // normalizado a 60fps, capped
    lastTime = timestamp;

    if (gameState === 'playing') {
        const result = updateCar(
            car, keys, dt,
            canvas.width, canvas.height,
            currentLevel.walls,
            currentLevel.parkedCars,
        );

        if (result === 'crashed') {
            // Offset visual aleatorio al chocar
            setCrashAngleOffset((Math.random() - 0.5) * 0.4);
            particles = createCrashParticles(car.x, car.y);
            endGame('lost');
        } else if (isParked(car, currentLevel.parkingSpot)) {
            lastParkingScore = computeParkingScore(car, currentLevel.parkingSpot);
            particles = createWinParticles(car.x, car.y);
            endGame('won');
        }
    }

    // Actualizar partículas siempre (siguen animándose tras el fin)
    particles = updateParticles(particles, dt);

    drawFrame(ctx, canvas, currentLevel, car, gameState, particles);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(t => { lastTime = t; requestAnimationFrame(gameLoop); });

// ── Fin del juego ─────────────────────────────────────────────────────────────
function endGame(result: 'won' | 'lost') {
    if (finishTriggered) return;
    finishTriggered = true;
    gameState = result;

    if (currentLevel.id === dailyLevel.id) {
        streak = result === 'won' ? streak + 1 : 0;
        // attemptCount ya fue incrementado al inicio del intento (en retryLevel o al arrancar)
        history[dateKey] = { result, levelId: currentLevel.id, attempts: attemptCount };
        saveHistory();
        saveStreak();
    }

    setTimeout(() => showModal(result), 800);
}

function retryLevel() {
    if (gameState === 'won' && currentLevel.id === dailyLevel.id) {
        // Feedback visual: el R no funciona si ya ganaste el nivel diario
        const c = document.getElementById('gameCanvas') as HTMLCanvasElement;
        c?.classList.add('shake');
        setTimeout(() => c?.classList.remove('shake'), 400);
        return;
    }
    attemptCount++;
    // Actualizamos el historial con el nuevo intento en progreso
    if (currentLevel.id === dailyLevel.id) {
        history[dateKey] = { result: 'lost', levelId: currentLevel.id, attempts: attemptCount };
        saveHistory();
    }
    const retrySpawn = findSafeSpawn(currentLevel);
    car = createCar(retrySpawn.x, retrySpawn.y, retrySpawn.angle);
    gameState = 'playing';
    finishTriggered = false;
    particles = [];
    lastParkingScore = 0;
    setCrashAngleOffset(0);
    document.getElementById('result-modal')?.classList.add('hidden');
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function showModal(result: 'won' | 'lost') {
    const modal = document.getElementById('result-modal');
    if (!modal) return;

    modal.classList.remove('hidden');

    const title        = document.getElementById('modal-title');
    const desc         = document.getElementById('modal-desc');
    const streakSpan   = document.getElementById('streak-count');
    const attemptsSpan = document.getElementById('attempts-count');
    const diffBadge    = document.getElementById('modal-diff');
    const retryBtn     = document.getElementById('retry-btn');
    const scoreBox     = document.getElementById('score-box');
    const scoreNum     = document.getElementById('score-num');

    if (streakSpan)   streakSpan.innerText   = streak.toString();
    if (attemptsSpan) attemptsSpan.innerText = attemptCount.toString();

    if (diffBadge) {
        diffBadge.innerText = currentLevel.difficulty.toUpperCase();
        diffBadge.style.background = DIFFICULTY_COLORS[currentLevel.difficulty] ?? '#555';
        diffBadge.style.color = currentLevel.difficulty === 'medio' ? '#000' : '#fff';
    }

    if (result === 'won') {
        if (title)    title.innerText = '¡Aparcado! 🎉';
        if (desc)     desc.innerText  = 'Perfecto. Eres un maestro del volante.';
        if (retryBtn) {
            if (currentLevel.id === dailyLevel.id) retryBtn.classList.add('hidden');
            else retryBtn.classList.remove('hidden');
        }
        if (title)    title.className = 'win-text';

        // Puntuación de aparcamiento
        if (scoreBox && scoreNum) {
            scoreBox.classList.remove('hidden');
            scoreNum.innerText = lastParkingScore.toString();
            const scoreColors: Record<number, string> = {
                10: '#00ff88', 9: '#00e676', 8: '#69f0ae',
                7: '#ffeb3b', 6: '#ffc107', 5: '#ff9800',
                4: '#ff7043', 3: '#f44336', 2: '#e53935', 1: '#b71c1c',
            };
            scoreNum.style.color = scoreColors[lastParkingScore] ?? '#fff';
        }
    } else {
        if (scoreBox) scoreBox.classList.add('hidden');
        if (title)    title.innerText = '¡Choque! 💥';
        if (desc)     desc.innerText  = 'Has rayado la pintura. Toca pagar el seguro.';
        if (retryBtn) retryBtn.classList.remove('hidden');
        if (title)    title.className = 'lose-text';
    }

    renderArchive();
    renderHistoryGrid();
    startCountdown();
}

// ── Historial de última semana (mini grid) ───────────────────────────────────
function renderHistoryGrid() {
    const grid = document.getElementById('history-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 6; i >= 0; i--) {
        const d   = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
        const day = history[key];
        const box = document.createElement('div');
        box.className = 'history-dot';
        box.style.background = day
            ? (day.result === 'won' ? '#2ecc71' : '#e74c3c')
            : '#444';
        box.title = key;
        grid.appendChild(box);
    }
}

// ── Archivo de niveles anteriores ─────────────────────────────────────────────
function renderArchive() {
    const list = document.getElementById('archive-list');
    if (!list) return;
    list.innerHTML = '';

    // Muestra los últimos 7 históricos (excluye el nivel de hoy)
    const entries = Object.entries(history)
        .filter(([k]) => k !== dateKey)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 7);

    if (entries.length === 0) {
        list.innerHTML = '<p style="color:#666;font-size:0.85rem;">Sin historial todavía.</p>';
        return;
    }

    for (const [key, saved] of entries) {
        const lvl  = getLevelById(saved.levelId);
        const emoji = saved.result === 'won' ? '🟩' : '🟥';
        const row  = document.createElement('div');
        row.className = 'archive-row';
        row.innerHTML = `<span>${emoji} ${key}</span><span>${lvl?.name ?? `Nivel ${saved.levelId}`}</span>`;
        list.appendChild(row);
    }
}

// ── Sistema de compartir ──────────────────────────────────────────────────────
function buildShareText(): string {
    const emoji = gameState === 'won' ? '🟩' : '🟥';
    const diff  = currentLevel.difficulty.toUpperCase();
    const scoreStr = gameState === 'won' ? ` · Precisión ${lastParkingScore}/10 ⭐` : '';
    return `🚗 Parkindle ${dateString} — ${diff}\n${emoji} ${attemptCount} intento${attemptCount === 1 ? '' : 's'} · Racha ${streak} 🔥${scoreStr}\nparkindle.com`;
}

document.getElementById('share-copy-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(buildShareText()).then(() => {
        const btn = document.getElementById('share-copy-btn') as HTMLButtonElement;
        const prev = btn.innerHTML;
        btn.innerHTML = '✔ Copiado';
        setTimeout(() => { btn.innerHTML = prev; }, 2000);
    });
});

document.getElementById('share-twitter-btn')?.addEventListener('click', () => {
    const url = encodeURIComponent('https://parkindle.com');
    const txt = encodeURIComponent(buildShareText());
    window.open(`https://twitter.com/intent/tweet?text=${txt}&url=${url}`, '_blank', 'noopener,width=560,height=420');
});

const nativeBtn = document.getElementById('share-native-btn');
if (!navigator.share) {
    nativeBtn?.classList.add('hidden');
} else {
    nativeBtn?.addEventListener('click', () => {
        navigator.share({
            title: 'Parkindle',
            text: buildShareText(),
            url: 'https://parkindle.com',
        }).catch(() => { /* usuario canceló */ });
    });
}

// ── Reintentar ────────────────────────────────────────────────────────────────
document.getElementById('retry-btn')?.addEventListener('click', retryLevel);

// ── Cuenta atrás ──────────────────────────────────────────────────────────────
let countdownInterval: ReturnType<typeof setInterval> | null = null;

function updateCountdown() {
    const now    = new Date();
    const nowKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;

    // Si ya cambió el día, recargamos para que cargue el nivel nuevo
    if (nowKey !== dateKey) {
        stopCountdown();
        location.reload();
        return;
    }

    const tomorrowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
    const diff        = tomorrowUTC - now.getTime();

    const h = Math.floor(diff / 3_600_000).toString().padStart(2, '0');
    const m = Math.floor((diff % 3_600_000) / 60_000).toString().padStart(2, '0');
    const s = Math.floor((diff % 60_000) / 1_000).toString().padStart(2, '0');

    const timeSpan = document.getElementById('time-left');
    if (timeSpan) timeSpan.innerText = `${h}:${m}:${s}`;
}

function startCountdown() {
    if (countdownInterval !== null) return; // ya está corriendo
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
}

function stopCountdown() {
    if (countdownInterval !== null) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

window.addEventListener('beforeunload', stopCountdown);

// ── Persistencia ─────────────────────────────────────────────────────────────
function loadHistory(): Record<string, SavedDay> {
    try {
        const raw = localStorage.getItem('parkindle_history');
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
        const valid: Record<string, SavedDay> = {};
        for (const [key, val] of Object.entries(parsed)) {
            const v = val as Record<string, unknown>;
            if (
                typeof v === 'object' && v !== null &&
                (v.result === 'won' || v.result === 'lost') &&
                typeof v.levelId === 'number' &&
                typeof v.attempts === 'number'
            ) {
                valid[key] = v as unknown as SavedDay;
            }
        }
        return valid;
    } catch {
        return {};
    }
}

function loadStreak(): number {
    try {
        const n = parseInt(localStorage.getItem('parkindle_streak') ?? '0', 10);
        return isNaN(n) || n < 0 ? 0 : n;
    } catch {
        return 0;
    }
}

function saveHistory() {
    try { localStorage.setItem('parkindle_history', JSON.stringify(history)); } catch { /* cuota excedida o no disponible */ }
}

function saveStreak() {
    try { localStorage.setItem('parkindle_streak', streak.toString()); } catch { /* cuota excedida o no disponible */ }
}

// ── Tutorial (primera visita) ─────────────────────────────────────────────────
(function initTutorial() {
    const modal = document.getElementById('tutorial-modal');
    const btn   = document.getElementById('tutorial-close-btn');
    if (!modal || !btn) return;

    if (!localStorage.getItem('parkindle_tutorial_seen')) {
        modal.classList.remove('hidden');
    }

    btn.addEventListener('click', () => {
        modal.classList.add('hidden');
        localStorage.setItem('parkindle_tutorial_seen', '1');
    });
})();

// ── Helpers de validación de nivel ───────────────────────────────────────────

/** Busca un spawn seguro: si el spawn por defecto está bloqueado, busca uno cercano. */
function findSafeSpawn(lvl: Level): { x: number; y: number; angle: number } {
    const { x, y, angle } = lvl.carStart;
    if (isSpawnSafe(x, y, angle, lvl.walls, lvl.parkedCars)) return { x, y, angle };

    const STEP = 20;
    const RANGE = 6;
    for (let dy = -RANGE; dy <= RANGE; dy++) {
        for (let dx = -RANGE; dx <= RANGE; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx * STEP;
            const ny = y + dy * STEP;
            if (nx < 40 || nx > 760 || ny < 40 || ny > 560) continue;
            if (isSpawnSafe(nx, ny, angle, lvl.walls, lvl.parkedCars)) {
                console.warn(`[Parkindle] Nivel ${lvl.id}: spawn desplazado de (${x},${y}) a (${nx},${ny})`);
                return { x: nx, y: ny, angle };
            }
        }
    }
    console.error(`[Parkindle] Nivel ${lvl.id}: no se encontró spawn seguro — usando centro del canvas`);
    return { x: 400, y: 400, angle };
}

/** Comprueba si hay espacio libre en la entrada de la plaza de aparcamiento. */
function rectsOverlap(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function validateParkingAccess(lvl: Level): void {
    const spot = lvl.parkingSpot;
    const MARGIN = HITBOX_W + 15;
    const isBattery = spot.h > spot.w;

    // Zona de entrada: justo delante de la plaza
    const entrance: Rect = isBattery
        ? { x: spot.x + spot.w / 2 - MARGIN / 2, y: spot.y + spot.h, w: MARGIN, h: MARGIN }
        : { x: spot.x + spot.w,                   y: spot.y + spot.h / 2 - MARGIN / 2, w: MARGIN, h: MARGIN };

    const blocked = [...lvl.walls, ...lvl.parkedCars].some(obs => rectsOverlap(entrance, obs));
    if (blocked) {
        console.warn(`[Parkindle] Nivel ${lvl.id}: la entrada de la plaza parece bloqueada — revisa el diseño.`);
    }

    // La plaza en sí no debe solapar ningún obstáculo
    const spotRect: Rect = { x: spot.x, y: spot.y, w: spot.w, h: spot.h };
    const spotBlocked = [...lvl.walls, ...lvl.parkedCars].some(obs => rectsOverlap(spotRect, obs));
    if (spotBlocked) {
        console.error(`[Parkindle] Nivel ${lvl.id}: ¡la plaza de aparcamiento está TAPADA por un obstáculo!`);
    }
}

// ── Selector de niveles ───────────────────────────────────────────────────────
function loadLevel(lvl: Level) {
    const safeSpawn = findSafeSpawn(lvl);
    validateParkingAccess(lvl);
    currentLevel = lvl;
    car = createCar(safeSpawn.x, safeSpawn.y, safeSpawn.angle);
    gameState = 'playing';
    finishTriggered = false;
    particles = [];
    attemptCount = 1;
    setCrashAngleOffset(0);
    document.getElementById('result-modal')?.classList.add('hidden');
}

(function initLevelSelector() {
    const sel = document.getElementById('level-select') as HTMLSelectElement | null;
    if (!sel) return;

    const diffLabels: Record<string, string> = { 'fácil': 'F', 'medio': 'M', 'difícil': 'D', 'experto': 'E' };
    for (const lvl of LEVELS) {
        const opt = document.createElement('option');
        opt.value = String(lvl.id);
        opt.textContent = `[${diffLabels[lvl.difficulty]}] Nv.${lvl.id} — ${lvl.name}`;
        if (lvl.id === dailyLevel.id) opt.textContent += ' ★';
        sel.appendChild(opt);
    }
    sel.value = String(dailyLevel.id);

    sel.addEventListener('change', () => {
        const lvl = getLevelById(parseInt(sel.value, 10));
        if (lvl) loadLevel(lvl);
    });
})();

// Si ya hay un resultado guardado de hoy, mostrar el modal directamente
if (gameState === 'won' || gameState === 'lost') {
    const savedResult = gameState;
    setTimeout(() => showModal(savedResult), 300);
}

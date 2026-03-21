import './style.css';
import { getLevelForDate, getLevelById, type Level } from './levels';
import { createCar, updateCar, isParked, type CarState } from './car';
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

// ── Sistema de fechas ────────────────────────────────────────────────────────
const today      = new Date();
const dateKey    = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
const dateString = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

// ── Estado persistente ───────────────────────────────────────────────────────
let history: Record<string, SavedDay> = JSON.parse(localStorage.getItem('parkindle_history') || '{}');
let streak = parseInt(localStorage.getItem('parkindle_streak') || '0');

// ── Nivel ────────────────────────────────────────────────────────────────────
const dailyLevel  = getLevelForDate(today);
let   currentLevel: Level = dailyLevel;

// ── Estado del juego ─────────────────────────────────────────────────────────
let gameState: 'playing' | 'won' | 'lost' = history[dateKey]?.result ?? 'playing';
let attemptCount  = history[dateKey]?.attempts ?? 1; // El primer intento es el 1
let finishTriggered = false;
let particles: Particle[] = [];

// ── Coche ────────────────────────────────────────────────────────────────────
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
        if (result === 'won') {
            streak++;
        } else {
            streak = 0;
        }
        // attemptCount ya fue incrementado al inicio del intento (en retryLevel o al arrancar)
        history[dateKey] = { result, levelId: currentLevel.id, attempts: attemptCount };
        localStorage.setItem('parkindle_history', JSON.stringify(history));
        localStorage.setItem('parkindle_streak', streak.toString());
    }

    setTimeout(() => showModal(result), 800);
}

function retryLevel() {
    if (gameState === 'won' && currentLevel.id === dailyLevel.id) {
        // Feedback visual: el R no funciona si ya ganaste el nivel diario
        const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        canvas?.classList.add('shake');
        setTimeout(() => canvas?.classList.remove('shake'), 400);
        return;
    }
    attemptCount++;
    // Actualizamos el historial con el nuevo intento en progreso
    if (currentLevel.id === dailyLevel.id) {
        history[dateKey] = { result: 'lost', levelId: currentLevel.id, attempts: attemptCount };
        localStorage.setItem('parkindle_history', JSON.stringify(history));
    }
    car = createCar(currentLevel.carStart.x, currentLevel.carStart.y, currentLevel.carStart.angle);
    gameState = 'playing';
    finishTriggered = false;
    particles = [];
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

    if (streakSpan)   streakSpan.innerText   = streak.toString();
    if (attemptsSpan) attemptsSpan.innerText = attemptCount.toString();

    // Color del badge según dificultad
    const diffColors: Record<string, string> = {
        'fácil':   '#00e676',
        'medio':   '#ffeb3b',
        'difícil': '#ff9800',
        'experto': '#f44336',
    };
    if (diffBadge) {
        diffBadge.innerText = currentLevel.difficulty.toUpperCase();
        diffBadge.style.background = diffColors[currentLevel.difficulty] ?? '#555';
        diffBadge.style.color = currentLevel.difficulty === 'medio' ? '#000' : '#fff';
    }

    if (result === 'won') {
        if (title)    title.innerText = '¡Aparcado! 🎉';
        if (desc)     desc.innerText  = 'Perfecto. Eres un maestro del volante.';
        if (retryBtn) retryBtn.classList.add('hidden');
        if (title)    title.className = 'win-text';
    } else {
        if (title)    title.innerText = '¡Choque! 💥';
        if (desc)     desc.innerText  = 'Has rayado la pintura. Toca pagar el seguro.';
        if (retryBtn) retryBtn.classList.remove('hidden');
        if (title)    title.className = 'lose-text';
    }

    renderArchive();
    renderHistoryGrid();
    updateCountdown();
}

// ── Historial de última semana (mini grid) ───────────────────────────────────
function renderHistoryGrid() {
    const grid = document.getElementById('history-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 6; i >= 0; i--) {
        const d    = new Date(today);
        d.setDate(d.getDate() - i);
        const key  = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const day  = history[key];
        const box  = document.createElement('div');
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

// ── Botón compartir ───────────────────────────────────────────────────────────
document.getElementById('share-btn')?.addEventListener('click', () => {
    const emoji     = gameState === 'won' ? '🟩' : '🟥';
    const shareText = `🚗 Parkindle - ${dateString}\nResultado: ${emoji}\nIntentos: ${attemptCount} · Racha: ${streak} 🔥\n\nJuega en: parkindle.com`;
    navigator.clipboard.writeText(shareText).then(() => {
        const btn = document.getElementById('share-btn')!;
        const prev = btn.innerText;
        btn.innerText = '¡Copiado! ✔️';
        setTimeout(() => btn.innerText = prev, 2000);
    });
});

// ── Reintentar ────────────────────────────────────────────────────────────────
document.getElementById('retry-btn')?.addEventListener('click', retryLevel);

// ── Cuenta atrás ──────────────────────────────────────────────────────
function updateCountdown() {
    const now      = new Date();

    // Si ya cambió el día, recargamos para que cargue el nivel nuevo
    const nowKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    if (nowKey !== dateKey) {
        location.reload();
        return;
    }

    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diff     = tomorrow.getTime() - now.getTime();

    const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');

    const timeSpan = document.getElementById('time-left');
    if (timeSpan) timeSpan.innerText = `${h}:${m}:${s}`;

    setTimeout(updateCountdown, 1000);
}

// Si ya hay un resultado guardado de hoy, mostrar el modal directamente
if (gameState === 'won' || gameState === 'lost') {
    const savedResult = gameState;
    setTimeout(() => showModal(savedResult), 300);
}

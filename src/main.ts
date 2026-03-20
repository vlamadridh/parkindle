import './style.css';
import { LEVELS, getLevelForDate, getLevelById } from './levels';
import { createCar, updateCar, isParked } from './car';
import {
  drawFrame,
  createCrashParticles,
  createWinParticles,
  updateParticles,
  setCrashAngleOffset,
  type Particle,
} from './renderer';

// ── Canvas ────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// ── Fecha y nivel del día ─────────────────────────────────────────────────────
const today = new Date();
const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
const dailyLevel = getLevelForDate(today);

// ── Estado persistente (localStorage) ────────────────────────────────────────
interface SavedDay { result: 'won' | 'lost'; levelId: number; attempts?: number; }

function loadHistory(): Record<string, SavedDay> {
  try { return JSON.parse(localStorage.getItem('parkindle_history') || '{}'); }
  catch { return {}; }
}
function saveHistory(h: Record<string, SavedDay>) {
  localStorage.setItem('parkindle_history', JSON.stringify(h));
}
function getStreak(history: Record<string, SavedDay>): number {
  let streak = 0;
  const d = new Date(today);
  while (true) {
    const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (history[k]?.result === 'won') { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

const history = loadHistory();
const todaySaved = history[dateKey];

// ── Estado del juego ──────────────────────────────────────────────────────────
type GameState = 'playing' | 'won' | 'lost';

let currentLevel = dailyLevel;
let car = createCar(currentLevel.carStart.x, currentLevel.carStart.y, currentLevel.carStart.angle);
let gameState: GameState = todaySaved ? todaySaved.result : 'playing';
let particles: Particle[] = [];
let lastTime = performance.now();
let finishTriggered = false;
let attemptCount = 0;        // maniobras (reinicios) en el nivel actual
let crashCount = 0;          // choques en el intento actual

// Si ya jugó hoy → mostrar modal inmediatamente
if (todaySaved) setTimeout(() => showModal(todaySaved.result), 200);

// ── Teclado ───────────────────────────────────────────────────────────────────
const keys: Record<string, boolean> = {};
const GAME_KEYS = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D']);
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (GAME_KEYS.has(e.key)) e.preventDefault();
  if (e.key === 'r' || e.key === 'R') retryLevel();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// ── Game loop ─────────────────────────────────────────────────────────────────
function loop(now: number) {
  const dt = Math.min((now - lastTime) / 16.67, 3); // normalizado a 60fps
  lastTime = now;

  if (gameState === 'playing') {
    const result = updateCar(car, keys, dt, canvas.width, canvas.height, currentLevel.walls, currentLevel.parkedCars);

    if (result === 'crashed' && !finishTriggered) {
      finishTriggered = true;
      crashCount++;
      setCrashAngleOffset((Math.random() - 0.5) * 0.2); // ángulo fijo al chocar
      particles = createCrashParticles(car.x, car.y);
      endGame('lost');
    } else if (result === 'ok' && isParked(car, currentLevel.parkingSpot) && !finishTriggered) {
      finishTriggered = true;
      particles = createWinParticles(car.x, car.y);
      endGame('won');
    }
  }

  particles = updateParticles(particles, dt);

  drawFrame(ctx, canvas, currentLevel, car, gameState, particles);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ── Reintentar nivel ──────────────────────────────────────────────────────────
function retryLevel() {
  if (gameState === 'won') return; // no reiniciar si ya ganó
  attemptCount++;
  car = createCar(currentLevel.carStart.x, currentLevel.carStart.y, currentLevel.carStart.angle);
  gameState = 'playing';
  particles = [];
  finishTriggered = false;
  setCrashAngleOffset(0);
  document.getElementById('result-modal')!.classList.add('hidden');
}

// ── Fin de partida ────────────────────────────────────────────────────────────
function endGame(result: GameState) {
  if (result === 'won' || result === 'lost') {
    gameState = result;
    // Solo guardamos el nivel del día
    if (currentLevel.id === dailyLevel.id) {
      history[dateKey] = { result, levelId: currentLevel.id, attempts: attemptCount + 1 };
      saveHistory(history);
    }
    setTimeout(() => showModal(result), result === 'won' ? 800 : 500);
  }
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function showModal(result: 'won' | 'lost') {
  const modal = document.getElementById('result-modal')!;
  const title = document.getElementById('modal-title')!;
  const desc = document.getElementById('modal-desc')!;
  const diffEl = document.getElementById('modal-diff')!;
  const streakEl = document.getElementById('streak-count')!;
  const histEl = document.getElementById('history-grid')!;
  const attemptsEl = document.getElementById('attempts-count')!;
  const retryBtn = document.getElementById('retry-btn')!;

  modal.classList.remove('hidden');

  const streak = getStreak(history);
  streakEl.innerText = streak.toString();
  attemptsEl.innerText = (attemptCount + 1).toString();
  diffEl.innerText = currentLevel.difficulty.toUpperCase();
  diffEl.className = `diff-badge diff-${currentLevel.difficulty.replace('í', 'i')}`;

  if (result === 'won') {
    title.innerText = '¡Aparcado! 🎉';
    title.className = 'win-text';
    const msgs = [
      'Perfecto. Eres un maestro del volante.',
      '¡Textbook! Sin un rasguño.',
      'Maniobra impecable. ¡Enhorabuena!',
      '¡Primera a la primera? Eso sí es nivel.',
    ];
    desc.innerText = attemptCount === 0 ? msgs[3] : msgs[Math.floor(Math.random() * 3)];
    retryBtn.classList.add('hidden');
  } else {
    title.innerText = '¡Choque! 💥';
    title.className = 'lose-text';
    desc.innerText = 'Has rayado la pintura. Pulsa Reintentar o espera al mañana.';
    retryBtn.classList.remove('hidden');
  }

  // Historial visual (últimos 7 días)
  histEl.innerHTML = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const saved = history[k];
    const cell = document.createElement('div');
    cell.className = 'hist-cell';
    cell.title = d.toLocaleDateString('es-ES');
    if (!saved) cell.innerHTML = '⬜';
    else if (saved.result === 'won') cell.innerHTML = '🟩';
    else cell.innerHTML = '🟥';
    histEl.appendChild(cell);
  }

  // Botones de niveles anteriores
  renderArchive();
  updateCountdown();
}

function renderArchive() {
  const archiveEl = document.getElementById('archive-list')!;
  archiveEl.innerHTML = '';

  LEVELS.forEach(lvl => {
    const saved = Object.values(history).find(h => h.levelId === lvl.id);
    const isToday = lvl.id === dailyLevel.id;
    const btn = document.createElement('button');
    btn.className = `archive-btn ${isToday ? 'today' : ''} ${saved?.result ?? ''}`;
    btn.innerHTML = `
      <span class="arc-num">${lvl.id}</span>
      <span class="arc-name">${lvl.name}</span>
      <span class="arc-diff">${lvl.difficulty}</span>
      <span class="arc-res">${saved?.result === 'won' ? '🟩' : saved?.result === 'lost' ? '🟥' : '⬜'}</span>
    `;
    if (isToday) {
      btn.disabled = true;
      btn.title = 'Nivel de hoy';
    } else {
      btn.addEventListener('click', () => loadLevel(lvl.id));
    }
    archiveEl.appendChild(btn);
  });
}

function loadLevel(id: number) {
  const lvl = getLevelById(id);
  if (!lvl) return;
  currentLevel = lvl;
  car = createCar(lvl.carStart.x, lvl.carStart.y, lvl.carStart.angle);
  gameState = 'playing';
  particles = [];
  finishTriggered = false;
  attemptCount = 0;
  crashCount = 0;
  setCrashAngleOffset(0);
  document.getElementById('result-modal')!.classList.add('hidden');
}

// ── Reintentar (botón modal) ──────────────────────────────────────────────────
document.getElementById('retry-btn')?.addEventListener('click', retryLevel);

// ── Compartir ─────────────────────────────────────────────────────────────────
document.getElementById('share-btn')?.addEventListener('click', () => {
  const streak = getStreak(history);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const s = history[k];
    return !s ? '⬜' : s.result === 'won' ? '🟩' : '🟥';
  }).join('');

  const text = `🚗 Parkindle — Nivel ${dailyLevel.id}\n${last7}\nRacha: ${streak} 🔥\n\nparkindle.com`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('share-btn')!;
    const orig = btn.innerText;
    btn.innerText = '¡Copiado! ✔️';
    setTimeout(() => (btn.innerText = orig), 2000);
  });
});

// ── Countdown ─────────────────────────────────────────────────────────────────
function updateCountdown() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = tomorrow.getTime() - now.getTime();
  const h = Math.floor(diff / 3_600_000).toString().padStart(2, '0');
  const m = Math.floor((diff % 3_600_000) / 60_000).toString().padStart(2, '0');
  const s = Math.floor((diff % 60_000) / 1000).toString().padStart(2, '0');
  const el = document.getElementById('time-left');
  if (el) el.innerText = `${h}:${m}:${s}`;
  setTimeout(updateCountdown, 1000);
}
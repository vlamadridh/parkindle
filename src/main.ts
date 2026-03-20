import './style.css';

// --- CONFIGURACIÓN E INTERFACES ---
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

interface SavedDay { result: 'won' | 'lost'; levelId: number; attempts: number; }

// --- SISTEMA DE FECHAS ---
const today = new Date();
const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
const dateString = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

// --- ESTADO PERSISTENTE ---
let history: Record<string, SavedDay> = JSON.parse(localStorage.getItem('parkindle_history') || '{}');
let streak = parseInt(localStorage.getItem('parkindle_streak') || '0');

// --- CARGA DE NIVEL ---
// Asegúrate de que estas funciones existan en tus otros archivos o imports
const dailyLevel = getLevelForDate(today);
let currentLevel = dailyLevel;

// --- ESTADO DEL JUEGO ---
let gameState: 'playing' | 'won' | 'lost' = history[dateKey]?.result || 'playing';
let attemptCount = 0;
let finishTriggered = false;
let particles: any[] = []; // Para efectos de choque si los tienes

// --- ENTIDADES Y CONTROLES ---
const keys: Record<string, boolean> = {};
const GAME_KEYS = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D']);

let car = createCar(currentLevel.carStart.x, currentLevel.carStart.y, currentLevel.carStart.angle);

window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (GAME_KEYS.has(e.key)) e.preventDefault();
    if (e.key === 'r' || e.key === 'R') retryLevel();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// --- LÓGICA DE ACTUALIZACIÓN ---
function update() {
    if (gameState !== 'playing') return;

    // Físicas
    if (keys.ArrowUp || keys.w || keys.W) car.speed += car.acceleration;
    if (keys.ArrowDown || keys.s || keys.S) car.speed -= car.acceleration;
    
    if (car.speed > 0) car.speed -= car.friction;
    if (car.speed < 0) car.speed += car.friction;
    if (Math.abs(car.speed) < car.friction) car.speed = 0;
    
    car.speed = Math.max(-car.maxSpeed / 2, Math.min(car.speed, car.maxSpeed));

    if (car.speed !== 0) {
        const direction = car.speed > 0 ? 1 : -1;
        if (keys.ArrowLeft || keys.a || keys.A) car.angle -= car.rotationSpeed * direction;
        if (keys.ArrowRight || keys.d || keys.D) car.angle += car.rotationSpeed * direction;
    }

    car.x += Math.cos(car.angle) * car.speed;
    car.y += Math.sin(car.angle) * car.speed;

    // Colisiones con bordes
    const margen = 15;
    if (car.x < margen || car.x > canvas.width - margen || car.y < margen || car.y > canvas.height - margen) {
        endGame('lost');
    }

    // Colisiones con obstáculos del nivel
    currentLevel.obstacles.forEach((obs: any) => {
        if (checkCollision(car, obs)) {
            endGame('lost');
        }
    });

    // Condición de Victoria (Parking Spot)
    const spot = currentLevel.parkingSpot;
    if (car.x > spot.x && car.x < spot.x + spot.width &&
        car.y > spot.y && car.y < spot.y + spot.height) {
        if (Math.abs(car.speed) < 0.2) endGame('won');
    }
}

// --- FIN DEL JUEGO ---
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
        history[dateKey] = { result, levelId: currentLevel.id, attempts: attemptCount + 1 };
        localStorage.setItem('parkindle_history', JSON.stringify(history));
        localStorage.setItem('parkindle_streak', streak.toString());
    }

    setTimeout(() => showModal(result), 800);
}

function retryLevel() {
    if (gameState === 'won' && currentLevel.id === dailyLevel.id) return;
    attemptCount++;
    car = createCar(currentLevel.carStart.x, currentLevel.carStart.y, currentLevel.carStart.angle);
    gameState = 'playing';
    finishTriggered = false;
    document.getElementById('result-modal')?.classList.add('hidden');
}

// --- INTERFAZ ---
function showModal(result: 'won' | 'lost') {
    const modal = document.getElementById('result-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    const streakSpan = document.getElementById('streak-count');
    const retryBtn = document.getElementById('retry-btn');

    if (streakSpan) streakSpan.innerText = streak.toString();

    if (result === 'won') {
        if (title) title.innerText = '¡Aparcado! 🎉';
        if (desc) desc.innerText = 'Perfecto. Eres un maestro del volante.';
        if (retryBtn) retryBtn.classList.add('hidden');
    } else {
        if (title) title.innerText = '¡Choque! 💥';
        if (desc) desc.innerText = 'Has rayado la pintura. Toca pagar el seguro.';
        if (retryBtn) retryBtn.classList.remove('hidden');
    }
    
    updateCountdown();
    if (typeof renderArchive === 'function') renderArchive();
}

// --- BUCLE PRINCIPAL ---
function gameLoop() {
    update();
    // Usamos drawFrame que es la función que renderiza todo el nivel
    drawFrame(ctx, canvas, currentLevel, car, gameState, particles);
    requestAnimationFrame(gameLoop);
}

gameLoop();

// --- UTILIDADES (COMPARTIR Y RELOJ) ---
document.getElementById('share-btn')?.addEventListener('click', () => {
    const emoji = gameState === 'won' ? '🟩' : '🟥';
    const shareText = `🚗 Parkindle - ${dateString}\nResultado: ${emoji}\nRacha: ${streak} 🔥\n\nJuega en: parkindle.com`;
    navigator.clipboard.writeText(shareText).then(() => {
        const btn = document.getElementById('share-btn')!;
        btn.innerText = '¡Copiado! ✔️';
        setTimeout(() => btn.innerText = 'Copiar Resultado 📋', 2000);
    });
});

function updateCountdown() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diff = tomorrow.getTime() - now.getTime();

    const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');

    const timeSpan = document.getElementById('time-left');
    if (timeSpan) timeSpan.innerText = `${h}:${m}:${s}`;

    setTimeout(updateCountdown, 1000);
}

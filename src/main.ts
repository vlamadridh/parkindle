import './style.css';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// --- SISTEMA DE FECHAS Y SEMILLA ---
const todayDate = new Date();
const dateString = `${todayDate.getDate()}/${todayDate.getMonth() + 1}/${todayDate.getFullYear()}`;
let dailySeed = todayDate.getFullYear() * 10000 + (todayDate.getMonth() + 1) * 100 + todayDate.getDate();

function random() {
  const x = Math.sin(dailySeed++) * 10000;
  return x - Math.floor(x);
}

// --- LOCAL STORAGE (GUARDADO) ---
let streak = parseInt(localStorage.getItem('parkindle_streak') || '0');
const lastPlayed = localStorage.getItem('parkindle_lastPlayed');
const lastResult = localStorage.getItem('parkindle_lastResult');

// --- ESTADO DEL JUEGO ---
// Si ya jugó hoy, bloqueamos la pantalla directamente
let gameState: 'playing' | 'won' | 'lost' = (lastPlayed === dateString) ? (lastResult as 'won' | 'lost') : 'playing';

// --- ENTIDADES ---
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, s: false, a: false, d: false };

const car = {
  x: canvas.width / 2, y: canvas.height - 50,
  width: 24, height: 44,
  speed: 0, acceleration: 0.1, maxSpeed: 2.5, friction: 0.05,
  angle: -Math.PI / 2, rotationSpeed: 0.04
};

const parkingSpot = {
  x: 100 + random() * (canvas.width - 200),
  y: 50 + random() * 200,
  width: 60, height: 80
};

const obstacles: { x: number, y: number, width: number, height: number }[] = [];
for (let i = 0; i < 6; i++) {
  obstacles.push({
    x: random() * (canvas.width - 100) + 50,
    y: random() * (canvas.height / 2) + 80,
    width: 40 + random() * 60, height: 30 + random() * 40
  });
}

// --- CONTROLES ---
window.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key as keyof typeof keys] = true; });
window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key)) keys[e.key as keyof typeof keys] = false; });

// --- LÓGICA DE ACTUALIZACIÓN ---
function update() {
  if (gameState !== 'playing') {
    showModal();
    return;
  }

  // Físicas
  if (keys.ArrowUp || keys.w) car.speed += car.acceleration;
  if (keys.ArrowDown || keys.s) car.speed -= car.acceleration;
  if (car.speed > 0) car.speed -= car.friction;
  if (car.speed < 0) car.speed += car.friction;
  if (Math.abs(car.speed) < car.friction) car.speed = 0;
  car.speed = Math.max(-car.maxSpeed / 2, Math.min(car.speed, car.maxSpeed));

  if (car.speed !== 0) {
    const direction = car.speed > 0 ? 1 : -1;
    if (keys.ArrowLeft || keys.a) car.angle -= car.rotationSpeed * direction;
    if (keys.ArrowRight || keys.d) car.angle += car.rotationSpeed * direction;
  }

  car.x += Math.cos(car.angle) * car.speed;
  car.y += Math.sin(car.angle) * car.speed;

  // Colisiones con bordes
  const margen = car.height / 2;
  if (car.x < margen || car.x > canvas.width - margen || car.y < margen || car.y > canvas.height - margen) {
    endGame('lost');
  }

  const carLeft = car.x - car.width / 2;
  const carRight = car.x + car.width / 2;
  const carTop = car.y - car.height / 2;
  const carBottom = car.y + car.height / 2;

  // Colisiones con obstáculos
  obstacles.forEach(obs => {
    if (carRight > obs.x && carLeft < obs.x + obs.width && carBottom > obs.y && carTop < obs.y + obs.height) {
      endGame('lost');
    }
  });

  // Condición de Victoria
  if (carLeft > parkingSpot.x && carRight < parkingSpot.x + parkingSpot.width &&
    carTop > parkingSpot.y && carBottom < parkingSpot.y + parkingSpot.height) {
    if (Math.abs(car.speed) < 0.1) endGame('won');
  }
}

// --- FIN DEL JUEGO Y GUARDADO ---
function endGame(result: 'won' | 'lost') {
  gameState = result;
  localStorage.setItem('parkindle_lastPlayed', dateString);
  localStorage.setItem('parkindle_lastResult', result);

  if (result === 'won') {
    streak++;
    localStorage.setItem('parkindle_streak', streak.toString());
  } else {
    streak = 0;
    localStorage.setItem('parkindle_streak', '0');
  }
  showModal();
}

// --- INTERFAZ (MODAL Y COMPARTIR) ---
function showModal() {
  const modal = document.getElementById('result-modal')!;
  const title = document.getElementById('modal-title')!;
  const desc = document.getElementById('modal-desc')!;
  const streakSpan = document.getElementById('streak-count')!;

  modal.classList.remove('hidden');
  streakSpan.innerText = streak.toString();

  if (gameState === 'won') {
    title.innerText = '¡Aparcado!';
    title.className = 'win-text';
    desc.innerText = 'Aparcamiento perfecto. Eres un as del volante.';
  } else {
    title.innerText = '¡Choque!';
    title.className = 'lose-text';
    desc.innerText = 'Has rayado la pintura. Toca pagar el seguro.';
  }

  updateCountdown();
}

// Lógica de Compartir
document.getElementById('share-btn')?.addEventListener('click', () => {
  const emoji = gameState === 'won' ? '🟩' : '🟥';
  const shareText = `🚗 Parkindle - ${dateString}\nResultado: ${emoji}\nRacha: ${streak} 🔥\n\nJuega en: parkindle.com`;

  navigator.clipboard.writeText(shareText).then(() => {
    const btn = document.getElementById('share-btn')!;
    btn.innerText = '¡Copiado! ✔️';
    setTimeout(() => btn.innerText = 'Copiar Resultado 📋', 2000);
  });
});

// Reloj hasta mañana
function updateCountdown() {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const diff = tomorrow.getTime() - now.getTime();

  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
  const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');

  const timeSpan = document.getElementById('time-left');
  if (timeSpan) timeSpan.innerText = `${h}:${m}:${s}`;

  setTimeout(updateCountdown, 1000);
}

// --- RENDERIZADO ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
  ctx.strokeStyle = '#2ecc71';
  ctx.lineWidth = 3;
  ctx.fillRect(parkingSpot.x, parkingSpot.y, parkingSpot.width, parkingSpot.height);
  ctx.strokeRect(parkingSpot.x, parkingSpot.y, parkingSpot.width, parkingSpot.height);

  ctx.fillStyle = '#444';
  obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));

  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(-car.height / 2, -car.width / 2, car.height, car.width);
  ctx.fillStyle = '#888';
  ctx.fillRect(car.height / 4, -car.width / 2 + 2, 6, car.width - 4);
  ctx.restore();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
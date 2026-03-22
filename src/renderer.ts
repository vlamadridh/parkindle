import type { Level } from './levels';
import { DIFFICULTY_COLORS } from './levels';
import type { CarState } from './car';
import { CAR_W, CAR_H } from './car';

// ── Constantes de render ─────────────────────────────────────────────────────
const GRID_CELL_SIZE        = 40;   // px entre líneas de la rejilla
const SPOT_PULSE_PERIOD     = 400;  // ms por ciclo del pulso de la plaza
const CRASH_PARTICLE_COUNT  = 22;
const WIN_PARTICLE_COUNT    = 30;

const ASPHALT = '#1a1a2e';
const LANE_MARK = 'rgba(255,255,255,0.18)';
const WALL_COL = '#2d2d4e';
const PARKED_COLORS = ['#2a4a6b', '#4a2a2a', '#2a4a2a', '#4a3a2a', '#3a2a4a', '#2a3a4a'];

export function drawFrame(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    level: Level,
    car: CarState,
    gameState: 'playing' | 'won' | 'lost',
    particles: Particle[],
) {
    const W = canvas.width;
    const H = canvas.height;

    // Fondo asfalto
    ctx.fillStyle = ASPHALT;
    ctx.fillRect(0, 0, W, H);

    // Rejilla sutil
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += GRID_CELL_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += GRID_CELL_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Marcas de carril
    ctx.setLineDash([30, 20]);
    ctx.strokeStyle = LANE_MARK;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    ctx.setLineDash([]);

    // Paredes
    for (const wall of level.walls) {
        // Sombra
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(wall.x + 4, wall.y + 4, wall.w, wall.h);
        // Cuerpo
        ctx.fillStyle = WALL_COL;
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        // Borde superior brillante
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(wall.x, wall.y, wall.w, 2);
    }

    // Coches aparcados
    level.parkedCars.forEach((pc, i) => {
        const col = PARKED_COLORS[i % PARKED_COLORS.length];
        drawStaticCar(ctx, pc.x + pc.w / 2, pc.y + pc.h / 2, -Math.PI / 2, col);
    });

    // Plaza de aparcamiento
    drawParkingSpot(ctx, level.parkingSpot, gameState);

    // Partículas
    for (const p of particles) drawParticle(ctx, p);

    // Coche del jugador
    if (gameState !== 'lost') {
        drawPlayerCar(ctx, car);
    } else {
        drawCrashedCar(ctx, car);
    }

    // HUD
    drawHUD(ctx, level);
}

function drawParkingSpot(
    ctx: CanvasRenderingContext2D,
    spot: Level['parkingSpot'],
    state: 'playing' | 'won' | 'lost',
) {
    ctx.save();
    ctx.translate(spot.x + spot.w / 2, spot.y + spot.h / 2);
    ctx.rotate(spot.angle);

    const hw = spot.w / 2;
    const hh = spot.h / 2;

    const pulse = (Math.sin(Date.now() / SPOT_PULSE_PERIOD) + 1) / 2;
    const alpha = state === 'playing' ? 0.15 + pulse * 0.1 : 0.35;

    if (state === 'won') ctx.fillStyle = `rgba(0,255,136,0.4)`;
    else if (state === 'lost') ctx.fillStyle = `rgba(255,68,68,0.2)`;
    else ctx.fillStyle = `rgba(0,229,255,${alpha})`;

    ctx.fillRect(-hw, -hh, spot.w, spot.h);

    // Líneas de la plaza
    ctx.strokeStyle = state === 'won' ? '#00ff88' : state === 'lost' ? '#ff4444' : '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.strokeRect(-hw, -hh, spot.w, spot.h);

    // Marca P
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.35 + pulse * 0.15;
    ctx.fillText('P', 0, 0);
    ctx.globalAlpha = 1;

    ctx.restore();
}

function drawPlayerCar(ctx: CanvasRenderingContext2D, car: CarState) {
    const wa = car.wheelAngle; // ángulo ruedas delanteras

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle + Math.PI / 2);

    const hw = CAR_W / 2;
    const hh = CAR_H / 2;

    // Sombra
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;

    // Carrocería principal
    ctx.fillStyle = '#c0392b';
    roundedRect(ctx, -hw, -hh, CAR_W, CAR_H, 5);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // Techo
    ctx.fillStyle = '#922b21';
    roundedRect(ctx, -hw + 3, -hh + 10, CAR_W - 6, CAR_H - 22, 3);
    ctx.fill();

    // Parabrisas delantero
    ctx.fillStyle = 'rgba(150,220,255,0.55)';
    roundedRect(ctx, -hw + 4, -hh + 8, CAR_W - 8, 12, 2);
    ctx.fill();

    // Luneta trasera
    ctx.fillStyle = 'rgba(150,220,255,0.35)';
    roundedRect(ctx, -hw + 4, hh - 18, CAR_W - 8, 10, 2);
    ctx.fill();

    // Faros delanteros
    ctx.fillStyle = '#fff9c4';
    ctx.shadowColor = 'rgba(255,250,180,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillRect(-hw + 2, -hh + 2, 7, 4);
    ctx.fillRect(hw - 9, -hh + 2, 7, 4);
    ctx.shadowColor = 'transparent';

    // Pilotos traseros
    ctx.fillStyle = '#ff1744';
    ctx.fillRect(-hw + 2, hh - 6, 7, 4);
    ctx.fillRect(hw - 9, hh - 6, 7, 4);

    // ── Ruedas traseras (fijas) ──
    ctx.fillStyle = '#111';
    ctx.fillRect(-hw - 4, hh - 17, 5, 11);
    ctx.fillRect(hw - 1,  hh - 17, 5, 11);

    // ── Ruedas delanteras (giradas según wheelAngle) ──
    const wheelW = 5;
    const wheelH = 11;
    for (const side of [-1, 1]) {
        const wx = side < 0 ? -hw - 4 : hw - 1;
        const wy = -hh + 6;
        ctx.save();
        ctx.translate(wx + wheelW / 2, wy + wheelH / 2);
        ctx.rotate(wa); // rueda gira con el volante
        ctx.fillStyle = '#111';
        ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
        // línea blanca en la rueda para ver el giro
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(-1, -wheelH / 2, 2, wheelH);
        ctx.restore();
    }

    ctx.restore();
}

// Ángulo de crash fijo (se calcula una sola vez al chocar, no en cada frame)
let _crashAngleOffset = 0;
export function setCrashAngleOffset(offset: number) { _crashAngleOffset = offset; }

function drawCrashedCar(ctx: CanvasRenderingContext2D, car: CarState) {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle + Math.PI / 2 + _crashAngleOffset);

    const hw = CAR_W / 2;
    const hh = CAR_H / 2;

    ctx.fillStyle = '#7f1d1d';
    roundedRect(ctx, -hw, -hh, CAR_W, CAR_H, 5);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,100,0,0.7)';
    ctx.fillRect(-hw + 2, -hh + 2, CAR_W - 4, 8);

    ctx.restore();
}

function drawStaticCar(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    angle: number,
    color: string,
) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI / 2);

    const hw = CAR_W / 2;
    const hh = CAR_H / 2;

    ctx.fillStyle = color;
    roundedRect(ctx, -hw, -hh, CAR_W, CAR_H, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(100,160,220,0.4)';
    roundedRect(ctx, -hw + 3, -hh + 8, CAR_W - 6, 10, 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,250,200,0.7)';
    ctx.fillRect(-hw + 1, -hh + 1, 5, 3);
    ctx.fillRect(hw - 6, -hh + 1, 5, 3);

    ctx.restore();
}

function drawHUD(ctx: CanvasRenderingContext2D, level: Level) {
    const col = DIFFICULTY_COLORS[level.difficulty] ?? '#fff';

    ctx.save();

    // Panel superior: nivel + dificultad
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundedRect(ctx, 12, 12, 220, 50, 8);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(`Nivel ${level.id} — ${level.name}`, 22, 18);

    ctx.fillStyle = col;
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(`● ${level.difficulty.toUpperCase()}`, 22, 36);

    // Panel inferior: pista
    const canvasH = ctx.canvas.height;
    const canvasW = ctx.canvas.width;
    const hintPadX = 16;
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    const hintW = Math.min(ctx.measureText(level.hint).width + hintPadX * 2, canvasW - 24);
    const hintX = (canvasW - hintW) / 2;
    const hintY = canvasH - 36;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    roundedRect(ctx, hintX, hintY, hintW, 24, 6);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(level.hint, canvasW / 2, hintY + 12);
    ctx.textAlign = 'left';

    ctx.restore();
}

// --- Partículas ---
export interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    life: number; maxLife: number;
    size: number;
    color: string;
}

export function createCrashParticles(x: number, y: number): Particle[] {
    const p: Particle[] = [];
    for (let i = 0; i < CRASH_PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        p.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1, maxLife: 1,
            size: 2 + Math.random() * 5,
            color: ['#ff6b35', '#ffd700', '#ff4444', '#fff'][Math.floor(Math.random() * 4)],
        });
    }
    return p;
}

export function createWinParticles(x: number, y: number): Particle[] {
    const p: Particle[] = [];
    for (let i = 0; i < WIN_PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 3;
        p.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1, maxLife: 1.5,
            size: 3 + Math.random() * 6,
            color: ['#00ff88', '#00e5ff', '#ffd700', '#fff'][Math.floor(Math.random() * 4)],
        });
    }
    return p;
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
    return particles
        .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + 0.1 * dt, life: p.life - 0.025 * dt }))
        .filter(p => p.life > 0);
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Utilidad
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}
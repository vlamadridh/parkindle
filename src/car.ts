import type { Rect, Vec2 } from './levels';

export interface CarState {
    x: number;
    y: number;
    angle: number;       // heading del coche (radianes)
    speed: number;       // velocidad escalar (px/frame@60fps)
    wheelAngle: number;  // ángulo de las ruedas delanteras (radianes)
    crashed: boolean;
}

/** Parámetros de transmisión manual pasados a updateCar */
export interface Transmission {
    maxFwd: number;    // velocidad máxima hacia delante (0 = neutral o marcha atrás)
    allowRev: boolean; // true si está en marcha atrás (R)
}

// ── Dimensiones del coche (px) ──────────────────────────────────────────────
export const CAR_W = 26;   // ancho visual
export const CAR_H = 46;   // alto visual

// Hitbox de colisión — más pequeño que el visual para ser más permisivo
export const HITBOX_W = 20;
export const HITBOX_H = 38;

// ── Parámetros de física ─────────────────────────────────────────────────────
const ACCEL          = 0.20;   // aceleración por frame
const BRAKE_ACCEL    = 0.28;   // frenada es más fuerte que aceleración
export const MAX_SPEED = 3.0;  // velocidad máxima hacia delante (px/frame)
const MAX_REV        = 1.8;    // velocidad máxima marcha atrás

const FRICTION_ROLL  = 0.04;  // rozamiento rodadura (cuando no se pisa gas)

// Modelo de bicicleta: el radio de giro depende de la distancia entre ejes
const WHEELBASE     = CAR_H * 0.62; // distancia entre ejes (px)
const MAX_WHEEL_ANG = 0.55;         // ángulo máximo de las ruedas delanteras (rad ~31°)
const WHEEL_TURN    = 0.065;        // velocidad de giro del volante (rad/frame)
const WHEEL_RETURN  = 0.18;         // velocidad de retorno al centro del volante

export function createCar(x: number, y: number, angle: number): CarState {
    return { x, y, angle, speed: 0, wheelAngle: 0, crashed: false };
}

export function updateCar(
    car: CarState,
    keys: Record<string, boolean>,
    dt: number,          // delta time normalizado (1 = 60fps)
    canvasW: number,
    canvasH: number,
    walls: Rect[],
    parkedCars: Rect[],
    transmission?: Transmission,
): 'ok' | 'crashed' {
    if (car.crashed) return 'crashed';

    const up    = keys['ArrowUp']    || keys['w'] || keys['W'];
    const down  = keys['ArrowDown']  || keys['s'] || keys['S'];
    const left  = keys['ArrowLeft']  || keys['a'] || keys['A'];
    const right = keys['ArrowRight'] || keys['d'] || keys['D'];

    // ── Aceleración / Frenada ──────────────────────────────────────────────
    if (transmission) {
        const { maxFwd, allowRev } = transmission;
        if (allowRev) {
            // Marcha atrás: ↓ = aceleración, ↑ = freno
            if (up)        car.speed = Math.min(0, car.speed + BRAKE_ACCEL * dt);
            else if (down) car.speed -= ACCEL * 0.7 * dt;
            else {
                if (car.speed > 0) car.speed = Math.max(0, car.speed - FRICTION_ROLL * dt);
                if (car.speed < 0) car.speed = Math.min(0, car.speed + FRICTION_ROLL * dt);
            }
            car.speed = Math.max(-MAX_REV, Math.min(car.speed, 0));
        } else if (maxFwd === 0) {
            // Punto muerto: solo rozamiento
            if (car.speed > 0) car.speed = Math.max(0, car.speed - FRICTION_ROLL * dt);
            if (car.speed < 0) car.speed = Math.min(0, car.speed + FRICTION_ROLL * dt);
        } else {
            // Marcha delantera: ↑ = acelerar hasta maxFwd, ↓ = solo frenar
            if (up) {
                if (car.speed < 0) car.speed = Math.min(0, car.speed + BRAKE_ACCEL * dt);
                else car.speed += ACCEL * dt;
            } else if (down) {
                car.speed = Math.max(0, car.speed - BRAKE_ACCEL * dt);
            } else {
                if (car.speed > 0) car.speed = Math.max(0, car.speed - FRICTION_ROLL * dt);
            }
            car.speed = Math.max(0, Math.min(car.speed, maxFwd));
        }
    } else {
        // Modo automático (comportamiento original)
        if (up) {
            if (car.speed < 0) {
                car.speed = Math.min(0, car.speed + BRAKE_ACCEL * dt);
            } else {
                car.speed += ACCEL * dt;
            }
        } else if (down) {
            if (car.speed > 0) {
                car.speed = Math.max(0, car.speed - BRAKE_ACCEL * dt);
            } else {
                car.speed -= ACCEL * 0.7 * dt;
            }
        } else {
            if (car.speed > 0) car.speed = Math.max(0, car.speed - FRICTION_ROLL * dt);
            if (car.speed < 0) car.speed = Math.min(0, car.speed + FRICTION_ROLL * dt);
        }
        // Clamp velocidad
        car.speed = Math.max(-MAX_REV, Math.min(car.speed, MAX_SPEED));
    }

    // ── Ángulo de ruedas delanteras ────────────────────────────────────────
    if (left)       car.wheelAngle -= WHEEL_TURN * dt;
    else if (right) car.wheelAngle += WHEEL_TURN * dt;
    else {
        // Retorno automático al centro cuando no se toca el volante
        if (Math.abs(car.wheelAngle) < WHEEL_RETURN * dt) {
            car.wheelAngle = 0;
        } else {
            car.wheelAngle -= Math.sign(car.wheelAngle) * WHEEL_RETURN * dt;
        }
    }
    car.wheelAngle = Math.max(-MAX_WHEEL_ANG, Math.min(MAX_WHEEL_ANG, car.wheelAngle));

    // ── Modelo de bicicleta ────────────────────────────────────────────────
    // El radio de giro es: R = wheelbase / tan(wheelAngle)
    // La variación de ángulo por distancia recorrida: dTheta = dist / R = dist * tan(wheelAngle) / wheelbase
    // Esto hace que a alta velocidad el coche gire igual de "fácil" pero
    // el arco sea más grande y visible, dando sensación natural de coche real.
    let newAngle = car.angle;
    const dist = car.speed * dt;

    if (Math.abs(car.wheelAngle) > 0.001 && Math.abs(dist) > 0.001) {
        const turnRadius = WHEELBASE / Math.tan(car.wheelAngle);
        const dTheta     = dist / turnRadius;
        newAngle         = car.angle + dTheta;
    }

    const newX = car.x + Math.cos(car.angle) * dist;
    const newY = car.y + Math.sin(car.angle) * dist;

    // ── Colisión con bordes del canvas ─────────────────────────────────────
    const corners = getCarCorners({ x: newX, y: newY, angle: newAngle });
    for (const c of corners) {
        if (c.x < 0 || c.x > canvasW || c.y < 0 || c.y > canvasH) {
            car.crashed = true;
            return 'crashed';
        }
    }

    // ── Colisión con obstáculos (SAT — OBB vs AABB) ────────────────────────
    const obstacles = [...walls, ...parkedCars];
    for (const obs of obstacles) {
        if (obbVsAabb(newX, newY, newAngle, HITBOX_W, HITBOX_H, obs)) {
            car.crashed = true;
            return 'crashed';
        }
    }

    car.x     = newX;
    car.y     = newY;
    car.angle = newAngle;
    return 'ok';
}

/** Devuelve true si todas las esquinas del coche están dentro de la plaza (sin comprobar velocidad ni ángulo) */
export function isCarInZone(
    car: CarState,
    spot: { x: number; y: number; w: number; h: number; angle: number },
): boolean {
    const sx  = spot.x + spot.w / 2;
    const sy  = spot.y + spot.h / 2;
    const cos = Math.cos(-spot.angle);
    const sin = Math.sin(-spot.angle);
    const hw  = spot.w / 2;
    const hh  = spot.h / 2;

    for (const c of getCarCorners(car)) {
        const dx     = c.x - sx;
        const dy     = c.y - sy;
        const localX = dx * cos - dy * sin;
        const localY = dx * sin + dy * cos;
        if (Math.abs(localX) > hw || Math.abs(localY) > hh) return false;
    }
    return true;
}

/** Devuelve las 4 esquinas del coche en coordenadas mundo */
export function getCarCorners(car: { x: number; y: number; angle: number }): Vec2[] {
    const hw  = CAR_W / 2;
    const hh  = CAR_H / 2;
    const cos = Math.cos(car.angle);
    const sin = Math.sin(car.angle);
    return [
        { x: car.x + cos * hh - sin * hw, y: car.y + sin * hh + cos * hw },
        { x: car.x + cos * hh + sin * hw, y: car.y + sin * hh - cos * hw },
        { x: car.x - cos * hh + sin * hw, y: car.y - sin * hh - cos * hw },
        { x: car.x - cos * hh - sin * hw, y: car.y - sin * hh + cos * hw },
    ];
}

/** OBB del coche vs AABB del obstáculo — SAT con 4 ejes */
function obbVsAabb(cx: number, cy: number, angle: number, cw: number, ch: number, rect: Rect): boolean {
    const hw  = cw / 2;
    const hh  = ch / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Esquinas del coche
    const corners: Vec2[] = [
        { x: cx + cos * hh - sin * hw, y: cy + sin * hh + cos * hw },
        { x: cx + cos * hh + sin * hw, y: cy + sin * hh - cos * hw },
        { x: cx - cos * hh + sin * hw, y: cy - sin * hh - cos * hw },
        { x: cx - cos * hh - sin * hw, y: cy - sin * hh + cos * hw },
    ];

    // Esquinas del rect (AABB)
    const rx = rect.x, ry = rect.y, rw = rect.w, rh = rect.h;
    const rCorners: Vec2[] = [
        { x: rx,      y: ry },
        { x: rx + rw, y: ry },
        { x: rx + rw, y: ry + rh },
        { x: rx,      y: ry + rh },
    ];

    // 4 ejes SAT: ejes del OBB y ejes del AABB
    const axes: Vec2[] = [
        { x: cos,  y: sin  },
        { x: -sin, y: cos  },
        { x: 1,    y: 0    },
        { x: 0,    y: 1    },
    ];

    for (const axis of axes) {
        const projCar  = corners.map(p   => p.x * axis.x + p.y * axis.y);
        const projRect = rCorners.map(p  => p.x * axis.x + p.y * axis.y);
        const minC = Math.min(...projCar),  maxC = Math.max(...projCar);
        const minR = Math.min(...projRect), maxR = Math.max(...projRect);
        if (maxC < minR || maxR < minC) return false; // gap → no colisión
    }
    return true; // solapan en todos los ejes → colisión
}

/** Calcula la puntuación del aparcamiento (1–10) según ángulo y posición */
export function computeParkingScore(
    car: CarState,
    spot: { x: number; y: number; w: number; h: number; angle: number },
): number {
    const sx = spot.x + spot.w / 2;
    const sy = spot.y + spot.h / 2;

    // Error de ángulo normalizado (0 = perfecto, 1 = al límite de tolerancia)
    const expectedAngle = spot.h > spot.w
        ? spot.angle + Math.PI / 2
        : spot.angle;
    let da = ((car.angle - expectedAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    if (da > Math.PI) da = Math.PI * 2 - da;
    const angle_frac = Math.min(1, Math.min(da, Math.abs(da - Math.PI)) / 0.50);

    // Error de posición normalizado (0 = centrado, 1 = en el borde)
    const dx = car.x - sx;
    const dy = car.y - sy;
    const cos = Math.cos(-spot.angle);
    const sin = Math.sin(-spot.angle);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    const roomX = Math.max(1, spot.w / 2 - CAR_W / 2);
    const roomY = Math.max(1, spot.h / 2 - CAR_H / 2);
    const pos_frac = Math.min(1,
        Math.sqrt((localX / roomX) ** 2 + (localY / roomY) ** 2) / Math.SQRT2
    );

    // Penalización por velocidad: entrar rápido resta hasta 2 puntos
    const speed_frac = Math.min(1, Math.abs(car.speed) / 1.5);

    return Math.max(1, Math.min(10,
        Math.round(10 * (1 - 0.4 * angle_frac - 0.4 * pos_frac - 0.2 * speed_frac))
    ));
}

/** Devuelve true si la posición de spawn no solapa ningún obstáculo (usa hitbox) */
export function isSpawnSafe(
    x: number, y: number, angle: number,
    walls: Rect[], parkedCars: Rect[],
): boolean {
    return ![...walls, ...parkedCars].some(obs => obbVsAabb(x, y, angle, HITBOX_W, HITBOX_H, obs));
}


export interface Vec2 { x: number; y: number; }
export interface Rect { x: number; y: number; w: number; h: number; }
export interface ParkingSpot { x: number; y: number; w: number; h: number; angle: number; }

export interface Level {
    id: number;
    name: string;
    difficulty: 'fácil' | 'medio' | 'difícil' | 'experto';
    carStart: { x: number; y: number; angle: number };
    parkingSpot: ParkingSpot;
    walls: Rect[];
    parkedCars: Rect[];
    hint: string;
}

// ── DIMENSIONES DE REFERENCIA ──────────────────────────────────────────────
// Canvas: 800 × 600  |  CAR_W=26  CAR_H=46
// Bordes (paredes externas): 20px de grosor
// Coches aparcados: w=52 h=82 (ligeramente más pequeños para dejar más espacio)
// Plaza de aparcamiento: w=62 h=90 (angulo:0 → aparcamiento en batería)
//                        w=92 h=52 con angle:PI/2 → aparcamiento en paralelo

export const LEVELS: Level[] = [
    // ── NIVEL 1: Introducción ──────────────────────────────────────────────
    {
        id: 1,
        name: 'Plaza libre',
        difficulty: 'fácil',
        // Coche empieza en el centro mirando hacia arriba
        carStart: { x: 400, y: 480, angle: -Math.PI / 2 },
        // Plaza centrada arriba, bien separada de los coches vecinos
        parkingSpot: { x: 374, y: 75, w: 62, h: 90, angle: 0 },
        walls: [
            { x: 0,   y: 0,   w: 800, h: 20 },
            { x: 0,   y: 580, w: 800, h: 20 },
            { x: 0,   y: 0,   w: 20,  h: 600 },
            { x: 780, y: 0,   w: 20,  h: 600 },
        ],
        parkedCars: [
            { x: 90,  y: 72, w: 52, h: 82 },
            { x: 200, y: 72, w: 52, h: 82 },
            { x: 310, y: 72, w: 52, h: 82 },
            // hueco en x:362..436 (+12 margen) para la plaza a x:374 w:62
            { x: 450, y: 72, w: 52, h: 82 },
            { x: 560, y: 72, w: 52, h: 82 },
            { x: 670, y: 72, w: 52, h: 82 },
        ],
        hint: 'Súbete al área de arriba y aparca en el hueco verde.',
    },

    // ── NIVEL 2: Batería con pared divisoria ───────────────────────────────
    {
        id: 2,
        name: 'Aparcamiento en batería',
        difficulty: 'fácil',
        carStart: { x: 400, y: 490, angle: -Math.PI / 2 },
        // Plaza a la derecha arriba — camino libre para llegar
        parkingSpot: { x: 654, y: 75, w: 62, h: 90, angle: 0 },
        walls: [
            { x: 0,   y: 0,   w: 800, h: 20 },
            { x: 0,   y: 580, w: 800, h: 20 },
            { x: 0,   y: 0,   w: 20,  h: 600 },
            { x: 780, y: 0,   w: 20,  h: 600 },
            // Separador horizontal — deja paso a la derecha
            { x: 20,  y: 210, w: 600, h: 18 },
        ],
        parkedCars: [
            { x: 90,  y: 72, w: 52, h: 82 },
            { x: 200, y: 72, w: 52, h: 82 },
            { x: 310, y: 72, w: 52, h: 82 },
            { x: 420, y: 72, w: 52, h: 82 },
            { x: 530, y: 72, w: 52, h: 82 },
            // hueco x:620..716 para la plaza x:654 w:62
            { x: 718, y: 72, w: 52, h: 82 },
        ],
        hint: 'Pasa por la derecha y aparca en la última plaza de arriba.',
    },

    // ── NIVEL 3: Calle estrecha ────────────────────────────────────────────
    {
        id: 3,
        name: 'Calle estrecha',
        difficulty: 'medio',
        // Coche empieza abajo a la izquierda
        carStart: { x: 150, y: 490, angle: -Math.PI / 2 },
        // Plaza en el pasillo central derecho (entre las dos paredes)
        parkingSpot: { x: 680, y: 220, w: 62, h: 90, angle: 0 },
        walls: [
            { x: 0,   y: 0,   w: 800, h: 20 },
            { x: 0,   y: 580, w: 800, h: 20 },
            { x: 0,   y: 0,   w: 20,  h: 600 },
            { x: 780, y: 0,   w: 20,  h: 600 },
            // Corredor horizontal arriba — deja paso a la derecha (>600)
            { x: 20,  y: 170, w: 580, h: 18 },
            // Corredor horizontal abajo
            { x: 20,  y: 360, w: 580, h: 18 },
        ],
        parkedCars: [
            // Zona derecha arriba — flanquean la plaza
            { x: 620, y: 170, w: 52, h: 82 },
            { x: 620, y: 355, w: 52, h: 82 },
            // Plaza libre en x:680 entre estos coches
            { x: 740, y: 170, w: 40, h: 82 },
            { x: 740, y: 355, w: 40, h: 82 },
        ],
        hint: 'El corredor de la derecha está abierto. La plaza está al fondo.',
    },

    // ── NIVEL 4: Parking subterráneo ───────────────────────────────────────
    {
        id: 4,
        name: 'Parking subterráneo',
        difficulty: 'medio',
        carStart: { x: 100, y: 490, angle: -Math.PI / 2 },
        // Plaza arriba a la derecha — hay que zigzaguear
        parkingSpot: { x: 590, y: 72, w: 62, h: 90, angle: 0 },
        walls: [
            { x: 0,   y: 0,   w: 800, h: 20 },
            { x: 0,   y: 580, w: 800, h: 20 },
            { x: 0,   y: 0,   w: 20,  h: 600 },
            { x: 780, y: 0,   w: 20,  h: 600 },
            // Separador superior: deja paso a la derecha (>530)
            { x: 20,  y: 200, w: 510, h: 18 },
            // Separador inferior: deja paso a la izquierda (<280)
            { x: 280, y: 360, w: 500, h: 18 },
            // Pilar vertical que une ambos
            { x: 510, y: 200, w: 18,  h: 160 },
        ],
        parkedCars: [
            // Fila arriba — sin solapamientos
            { x: 90,  y: 72, w: 52, h: 82 },
            { x: 160, y: 72, w: 52, h: 82 },
            { x: 230, y: 72, w: 52, h: 82 },
            { x: 300, y: 72, w: 52, h: 82 },
            { x: 370, y: 72, w: 52, h: 82 },
            { x: 440, y: 72, w: 52, h: 82 },
            { x: 510, y: 72, w: 52, h: 82 },
            // hueco x:562..652 para plaza x:590 w:62
            { x: 660, y: 72, w: 52, h: 82 },
            { x: 720, y: 72, w: 52, h: 82 },
        ],
        hint: 'Sube, pasa por la derecha, y baja por la izquierda para llegar arriba.',
    },

    // ── NIVEL 5: Aparcamiento en paralelo ─────────────────────────────────
    {
        id: 5,
        name: 'Paralelo imposible',
        difficulty: 'difícil',
        // Empieza a la derecha de la pared vertical, moviéndose a la derecha
        carStart: { x: 500, y: 300, angle: 0 },
        // Plaza en la franja izquierda — hay que meterse lateral
        // angle:PI/2 → el eje largo (h=90) queda vertical, aceptando coche vertical
        parkingSpot: { x: 45, y: 225, w: 90, h: 55, angle: Math.PI / 2 },
        walls: [
            { x: 0,   y: 0,   w: 800, h: 20 },
            { x: 0,   y: 580, w: 800, h: 20 },
            { x: 0,   y: 0,   w: 20,  h: 600 },
            { x: 780, y: 0,   w: 20,  h: 600 },
            // Pared vertical que separa la zona de aparcamiento del carril
            { x: 180, y: 20,  w: 18,  h: 430 },
        ],
        parkedCars: [
            // Coche arriba (hay 130px de hueco hasta el coche de abajo: 165..280)
            { x: 45, y: 85,  w: 88, h: 55 },
            // Plaza verde en y:140..195 (55px hueco para meterwe)
            // Ocupamos arriba hasta y:140, plaza en y:140, coche abajo en y:195
            { x: 45, y: 310, w: 88, h: 55 },
        ],
        hint: 'Gira a la izquierda, alinéate verticalmente y mete marcha atrás.',
    },

    // ── NIVEL 6: El laberinto ──────────────────────────────────────────────
    {
        id: 6,
        name: 'El laberinto',
        difficulty: 'difícil',
        // Empieza abajo a la derecha
        carStart: { x: 690, y: 500, angle: Math.PI },
        // Plaza arriba a la izquierda
        parkingSpot: { x: 60, y: 55, w: 62, h: 90, angle: 0 },
        walls: [
            { x: 0,   y: 0,   w: 800, h: 20 },
            { x: 0,   y: 580, w: 800, h: 20 },
            { x: 0,   y: 0,   w: 20,  h: 600 },
            { x: 780, y: 0,   w: 20,  h: 600 },
            // Muro 1: horizontal arriba, deja paso izq (<200) y derecho (>600)
            { x: 200, y: 170, w: 400, h: 18 },
            // Muro 2: vertical, deja paso abajo (>380)
            { x: 600, y: 170, w: 18,  h: 160 },
            // Muro 3: horizontal medio, deja paso izq (<200) 
            { x: 200, y: 330, w: 400, h: 18 },
            // Muro 4: vertical, cierra corredor a la derecha
            { x: 200, y: 330, w: 18,  h: 130 },
        ],
        parkedCars: [
            { x: 180, y: 55, w: 52, h: 82 },
            { x: 250, y: 55, w: 52, h: 82 },
            { x: 320, y: 55, w: 52, h: 82 },
        ],
        hint: 'Sigue la pared derecha hacia abajo, gira izquierda, y sube a la plaza.',
    },

    // ── NIVEL 7: Centro comercial ──────────────────────────────────────────
    {
        id: 7,
        name: 'Centro comercial',
        difficulty: 'experto',
        carStart: { x: 690, y: 510, angle: Math.PI },
        // Plaza abajo izquierda — entre el primer y segundo coche de la fila baja
        // Primer coche x:25..77, Plaza x:90..152, Segundo coche x:160..
        parkingSpot: { x: 90, y: 350, w: 62, h: 90, angle: 0 },
        walls: [
            { x: 0,   y: 0,   w: 800, h: 20 },
            { x: 0,   y: 580, w: 800, h: 20 },
            { x: 0,   y: 0,   w: 20,  h: 600 },
            { x: 780, y: 0,   w: 20,  h: 600 },
            // Separador superior
            { x: 20,  y: 165, w: 680, h: 18 },
            // Separador medio izq (deja paso derecho >420)
            { x: 20,  y: 328, w: 340, h: 18 },
            // Separador medio der (deja paso izq <390)
            { x: 420, y: 328, w: 360, h: 18 },
            // Columna central arriba
            { x: 380, y: 165, w: 18,  h: 163 },
        ],
        parkedCars: [
            // Fila arriba
            { x: 25,  y: 72, w: 52, h: 82 },
            { x: 95,  y: 72, w: 52, h: 82 },
            { x: 165, y: 72, w: 52, h: 82 },
            { x: 235, y: 72, w: 52, h: 82 },
            { x: 420, y: 72, w: 52, h: 82 },
            { x: 490, y: 72, w: 52, h: 82 },
            { x: 560, y: 72, w: 52, h: 82 },
            { x: 630, y: 72, w: 52, h: 82 },
            { x: 700, y: 72, w: 52, h: 82 },
            // Fila baja izq — deja hueco en x:78..160 para la plaza (x:90 w:62=152)
            { x: 25,  y: 338, w: 52, h: 82 },
            // plaza en x:90..152
            { x: 160, y: 338, w: 52, h: 82 },
            { x: 230, y: 338, w: 52, h: 82 },
            { x: 300, y: 338, w: 52, h: 82 },
            // Fila baja derecha
            { x: 435, y: 338, w: 52, h: 82 },
            { x: 505, y: 338, w: 52, h: 82 },
            { x: 575, y: 338, w: 52, h: 82 },
            { x: 645, y: 338, w: 52, h: 82 },
            { x: 715, y: 338, w: 52, h: 82 },
        ],
        hint: 'Navega por los pasillos. La plaza libre está en la fila baja izquierda.',
    },
];

export function getLevelForDate(date: Date): Level {
    const start = new Date(2025, 0, 1);
    const diff  = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return LEVELS[diff % LEVELS.length];
}

export function getLevelById(id: number): Level | undefined {
    return LEVELS.find(l => l.id === id);
}
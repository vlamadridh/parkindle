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

// Colores por dificultad — fuente única compartida entre main.ts y renderer.ts
export const DIFFICULTY_COLORS: Record<Level['difficulty'], string> = {
    'fácil':   '#00e676',
    'medio':   '#ffeb3b',
    'difícil': '#ff9800',
    'experto': '#f44336',
};

// ── DIMENSIONES DE REFERENCIA ──────────────────────────────────────────────
// Canvas: 800 × 600  |  CAR_W=26  CAR_H=46
// Bordes (paredes externas): 20px de grosor → zona jugable: x:20-780, y:20-580
// Coches aparcados estándar: w=52 h=82
// Plaza de batería:  w=50 h=74 angle=0   → coche entra vertical   (ángulo ≈ ±PI/2)
// Plaza de paralelo: w=74 h=44 angle=0   → coche entra horizontal  (ángulo ≈ 0 ó PI)

const B = [
    { x: 0,   y: 0,   w: 800, h: 20  },   // borde superior
    { x: 0,   y: 580, w: 800, h: 20  },   // borde inferior
    { x: 0,   y: 0,   w: 20,  h: 600 },   // borde izquierdo
    { x: 780, y: 0,   w: 20,  h: 600 },   // borde derecho
];

export const LEVELS: Level[] = [

    // ══════════════════════════════════════════════════════════════════════
    //  BLOQUE FÁCIL (ids 1-2 originales + 8-9-21-22 nuevos)
    // ══════════════════════════════════════════════════════════════════════

    // ── NIVEL 1: Introducción ──────────────────────────────────────────────
    {
        id: 1,
        name: 'Plaza libre',
        difficulty: 'fácil',
        carStart: { x: 400, y: 480, angle: -Math.PI / 2 },
        parkingSpot: { x: 380, y: 83, w: 50, h: 74, angle: 0 },
        walls: [...B],
        parkedCars: [
            { x: 90,  y: 72, w: 52, h: 82 },
            { x: 200, y: 72, w: 52, h: 82 },
            { x: 310, y: 72, w: 52, h: 82 },
            // hueco x:362-436 para la plaza x:374 w:62
            { x: 450, y: 72, w: 52, h: 82 },
            { x: 560, y: 72, w: 52, h: 82 },
            { x: 670, y: 72, w: 52, h: 82 },
        ],
        hint: 'Avanza hacia arriba y aparca en el hueco verde.',
    },

    // ── NIVEL 2: Batería con pared divisoria ───────────────────────────────
    {
        id: 2,
        name: 'Aparcamiento en batería',
        difficulty: 'fácil',
        carStart: { x: 400, y: 490, angle: -Math.PI / 2 },
        // Plaza a la derecha — camino libre por la derecha (x>620)
        parkingSpot: { x: 660, y: 83, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Separador horizontal — deja paso a la derecha (x:620-780)
            { x: 20, y: 210, w: 600, h: 18 },
        ],
        parkedCars: [
            { x: 90,  y: 72, w: 52, h: 82 },
            { x: 200, y: 72, w: 52, h: 82 },
            { x: 310, y: 72, w: 52, h: 82 },
            { x: 420, y: 72, w: 52, h: 82 },
            { x: 530, y: 72, w: 52, h: 82 },
            // hueco x:620-716 para la plaza x:654 w:62
            { x: 718, y: 72, w: 52, h: 82 },
        ],
        hint: 'Pasa por la derecha y aparca en la última plaza de arriba.',
    },

    // ── NIVEL 8: Desvío ────────────────────────────────────────────────────
    {
        id: 8,
        name: 'Desvío',
        difficulty: 'fácil',
        // Empieza izquierda abajo, plaza arriba derecha
        carStart: { x: 160, y: 490, angle: -Math.PI / 2 },
        // Plaza: x:620-682, center x:651. Coche aprox. desde y>165 hacia arriba.
        parkingSpot: { x: 626, y: 80, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Muro central — solo deja paso a la derecha (x:550-780)
            { x: 20, y: 270, w: 530, h: 18 },
        ],
        parkedCars: [
            { x: 90,  y: 72, w: 52, h: 82 },
            { x: 160, y: 72, w: 52, h: 82 },
            { x: 230, y: 72, w: 52, h: 82 },
            { x: 300, y: 72, w: 52, h: 82 },
            { x: 370, y: 72, w: 52, h: 82 },
            { x: 550, y: 72, w: 52, h: 82 },  // x:550-602
            // spot x:620-682
            { x: 700, y: 72, w: 52, h: 82 },
        ],
        hint: 'La pared bloquea el centro. Rodéala por la derecha y aparca.',
    },

    // ── NIVEL 9: Patio abierto ─────────────────────────────────────────────
    {
        id: 9,
        name: 'Patio abierto',
        difficulty: 'fácil',
        carStart: { x: 600, y: 480, angle: -Math.PI / 2 },
        parkingSpot: { x: 96, y: 80, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Dos pilares centrales — obligan a esquivar en lugar de ir recto
            { x: 340, y: 310, w: 70, h: 70 },  // pilar centro-izquierda
            { x: 510, y: 180, w: 70, h: 70 },  // pilar centro-derecha
        ],
        parkedCars: [
            // Fila superior (hueco a la izquierda para la plaza)
            { x: 170, y: 72, w: 52, h: 82 },
            { x: 250, y: 72, w: 52, h: 82 },
            { x: 350, y: 72, w: 52, h: 82 },
            { x: 450, y: 72, w: 52, h: 82 },
            { x: 560, y: 72, w: 52, h: 82 },
            { x: 660, y: 72, w: 52, h: 82 },
            // Coches en los lados
            { x: 22,  y: 240, w: 52, h: 82 },
            { x: 22,  y: 400, w: 52, h: 82 },
            { x: 726, y: 240, w: 52, h: 82 },
            { x: 726, y: 400, w: 52, h: 82 },
        ],
        hint: 'Esquiva los pilares centrales y aparca arriba a la izquierda.',
    },

    // ── NIVEL 21: Callejón ─────────────────────────────────────────────────
    {
        id: 21,
        name: 'Callejón',
        difficulty: 'fácil',
        carStart: { x: 400, y: 490, angle: -Math.PI / 2 },
        parkingSpot: { x: 375, y: 80, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Dos muros laterales — pasillo estrecho de 130px
            { x: 20,  y: 20, w: 310, h: 430 },   // muro izq (deja paso desde x:330)
            { x: 460, y: 20, w: 320, h: 430 },   // muro der (deja paso hasta x:460)
            // pasillo = x:330-460 = 130px de ancho
        ],
        parkedCars: [],
        hint: 'El pasillo es estrecho — entra recto y aparca arriba.',
    },

    // ── NIVEL 22: Curva larga ──────────────────────────────────────────────
    {
        id: 22,
        name: 'Curva larga',
        difficulty: 'fácil',
        // Coche arriba derecha, plaza abajo izquierda
        carStart: { x: 680, y: 100, angle: Math.PI / 2 },  // mirando abajo
        parkingSpot: { x: 96, y: 438, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Muro que obliga a dar la vuelta por abajo
            { x: 20, y: 300, w: 500, h: 18 },  // x:20-520, gap x:520-780
        ],
        parkedCars: [
            // Coches junto a la plaza (la flanquean)
            { x: 22,  y: 430, w: 52, h: 82 },   // x:22-74, justo antes de la plaza
            // spot x:90-152
            { x: 170, y: 430, w: 52, h: 82 },
            { x: 240, y: 430, w: 52, h: 82 },
            // Coches abajo derecha
            { x: 530, y: 400, w: 52, h: 82 },
            { x: 610, y: 400, w: 52, h: 82 },
            { x: 690, y: 400, w: 52, h: 82 },
        ],
        hint: 'Baja por la derecha, pasa el muro y ve a la plaza izquierda.',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  BLOQUE MEDIO (ids 3-4 originales + 10-11-12-23-24 nuevos)
    // ══════════════════════════════════════════════════════════════════════

    // ── NIVEL 3: Calle estrecha ────────────────────────────────────────────
    {
        id: 3,
        name: 'Calle estrecha',
        difficulty: 'medio',
        carStart: { x: 150, y: 490, angle: -Math.PI / 2 },
        // Plaza en el pasillo derecho, entre dos coches aparcados
        // Acceso: corredor x:600-780 (libre en ambos separadores)
        parkingSpot: { x: 686, y: 238, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Dos paredes horizontales — dejan corredor derecho (x:600-780)
            { x: 20, y: 170, w: 580, h: 18 },
            { x: 20, y: 360, w: 580, h: 18 },
        ],
        parkedCars: [
            // Corredor derecho: flanquean la plaza
            { x: 620, y: 170, w: 52, h: 82 },   // x:620-672
            { x: 740, y: 170, w: 38, h: 82 },   // x:740-778 (junto al borde)
            // spot x:680-742 — aprox. desde y>322 hacia arriba
            { x: 620, y: 360, w: 52, h: 82 },
            { x: 740, y: 360, w: 38, h: 82 },
        ],
        hint: 'El corredor derecho está abierto. La plaza está en el centro.',
    },

    // ── NIVEL 4: Parking subterráneo ───────────────────────────────────────
    {
        id: 4,
        name: 'Parking subterráneo',
        difficulty: 'medio',
        carStart: { x: 100, y: 490, angle: -Math.PI / 2 },
        // Plaza arriba derecha — hay que zigzaguear
        // Acceso: subir por izq (x<280), cruzar a x>528, subir por derecha
        parkingSpot: { x: 596, y: 80, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Separador sup: deja paso a la derecha (x:528-780)
            { x: 20,  y: 200, w: 508, h: 18 },
            // Separador inf: deja paso a la izquierda (x:20-280)
            { x: 280, y: 360, w: 500, h: 18 },
            // Pilar vertical que une ambos separadores
            { x: 510, y: 200, w: 18,  h: 160 },
        ],
        parkedCars: [
            // Fila arriba (hueco para la plaza x:590-652)
            { x: 90,  y: 72, w: 52, h: 82 },
            { x: 160, y: 72, w: 52, h: 82 },
            { x: 230, y: 72, w: 52, h: 82 },
            { x: 300, y: 72, w: 52, h: 82 },
            { x: 370, y: 72, w: 52, h: 82 },
            { x: 440, y: 72, w: 52, h: 82 },
            { x: 510, y: 72, w: 52, h: 82 },
            // plaza x:590-652
            { x: 660, y: 72, w: 52, h: 82 },
            { x: 720, y: 72, w: 52, h: 82 },
        ],
        hint: 'Sube por la izquierda, cruza al centro y sube por la derecha.',
    },

    // ── NIVEL 10: Doble hilera ─────────────────────────────────────────────
    {
        id: 10,
        name: 'Doble hilera',
        difficulty: 'medio',
        // Coche en pasillo central, plaza arriba derecha
        carStart: { x: 400, y: 480, angle: -Math.PI / 2 },
        // Plaza: x:680-742, y:55-145, center (711,100)
        // Acceso: corredor x:630-780 (entre fila sup y borde)
        parkingSpot: { x: 686, y: 63, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Dos separadores que crean tres zonas
            { x: 20, y: 185, w: 580, h: 18 },  // sep superior, gap x:600-780
            { x: 20, y: 370, w: 580, h: 18 },  // sep inferior, gap x:600-780
        ],
        parkedCars: [
            // Zona superior (hueco a la derecha para la plaza)
            { x: 25,  y: 55, w: 52, h: 82 },
            { x: 95,  y: 55, w: 52, h: 82 },
            { x: 165, y: 55, w: 52, h: 82 },
            { x: 235, y: 55, w: 52, h: 82 },
            { x: 305, y: 55, w: 52, h: 82 },
            { x: 375, y: 55, w: 52, h: 82 },
            { x: 445, y: 55, w: 52, h: 82 },
            { x: 610, y: 55, w: 52, h: 82 },   // x:610-662, spot en x:680
            // Zona inferior
            { x: 25,  y: 390, w: 52, h: 82 },
            { x: 95,  y: 390, w: 52, h: 82 },
            { x: 165, y: 390, w: 52, h: 82 },
            { x: 235, y: 390, w: 52, h: 82 },
        ],
        hint: 'Sube por el corredor derecho y aparca arriba a la derecha.',
    },

    // ── NIVEL 11: El corredor en L ─────────────────────────────────────────
    {
        id: 11,
        name: 'El corredor en L',
        difficulty: 'medio',
        // Coche abajo derecha, plaza arriba izquierda
        // Hay que hacer una L: bajar, cruzar, subir
        carStart: { x: 660, y: 470, angle: Math.PI },  // mirando izquierda
        parkingSpot: { x: 61, y: 63, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Muro vertical central — deja paso abajo (y:420-580)
            { x: 380, y: 20, w: 18, h: 400 },
        ],
        parkedCars: [
            // Lado izquierdo arriba
            { x: 145, y: 55, w: 52, h: 82 },
            { x: 215, y: 55, w: 52, h: 82 },
            { x: 285, y: 55, w: 52, h: 82 },
            // Lado derecho arriba (el coche no puede llegar directamente)
            { x: 430, y: 55, w: 52, h: 82 },
            { x: 510, y: 55, w: 52, h: 82 },
            { x: 600, y: 55, w: 52, h: 82 },
            { x: 690, y: 55, w: 52, h: 82 },
        ],
        hint: 'Pasa por debajo del muro central y sube por la izquierda.',
    },

    // ── NIVEL 12: La isla ──────────────────────────────────────────────────
    {
        id: 12,
        name: 'La isla',
        difficulty: 'medio',
        carStart: { x: 400, y: 490, angle: -Math.PI / 2 },
        // Plaza arriba izquierda — hay que rodear la isla central
        parkingSpot: { x: 61, y: 80, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Isla central (bloque sólido en el medio)
            { x: 250, y: 170, w: 300, h: 220 },
        ],
        parkedCars: [
            // Fila superior — flanquean la plaza y llenan la fila
            // spot x:55-117
            { x: 135, y: 72, w: 52, h: 82 },
            { x: 205, y: 72, w: 52, h: 82 },
            { x: 285, y: 72, w: 52, h: 82 },
            { x: 365, y: 72, w: 52, h: 82 },
            { x: 445, y: 72, w: 52, h: 82 },
            { x: 560, y: 72, w: 52, h: 82 },
            { x: 628, y: 72, w: 52, h: 82 },
            { x: 700, y: 72, w: 52, h: 82 },
            // Flancos de la isla — estrechan los pasillos laterales
            { x: 168, y: 200, w: 52, h: 82 },
            { x: 168, y: 310, w: 52, h: 82 },
            { x: 560, y: 200, w: 52, h: 82 },
            { x: 560, y: 310, w: 52, h: 82 },
            // Fila inferior — dan ambiente y reducen el espacio de maniobra
            { x: 22,  y: 450, w: 52, h: 82 },
            { x: 580, y: 450, w: 52, h: 82 },
            { x: 660, y: 450, w: 52, h: 82 },
            { x: 726, y: 450, w: 52, h: 82 },
        ],
        hint: 'Rodea la isla por la izquierda o la derecha — los pasillos son estrechos.',
    },

    // ── NIVEL 23: La bifurcación ───────────────────────────────────────────
    {
        id: 23,
        name: 'La bifurcación',
        difficulty: 'medio',
        carStart: { x: 400, y: 490, angle: -Math.PI / 2 },
        // Plaza arriba — hay un muro con dos pasos, solo el izquierdo lleva
        parkingSpot: { x: 86, y: 80, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Muro con dos pasos: izquierdo (x:20-190) y derecho (x:350-780)
            { x: 190, y: 240, w: 160, h: 18 },  // tramo central
            // Muro superior cierra el paso derecho
            { x: 350, y: 20,  w: 18,  h: 240 }, // pilar vertical derecho
        ],
        parkedCars: [
            // spot x:80-142
            { x: 160, y: 72, w: 52, h: 82 },
            { x: 230, y: 72, w: 52, h: 82 },
            { x: 380, y: 72, w: 52, h: 82 },
            { x: 470, y: 72, w: 52, h: 82 },
            { x: 560, y: 72, w: 52, h: 82 },
            { x: 650, y: 72, w: 52, h: 82 },
            { x: 720, y: 72, w: 52, h: 82 },
            // coches abajo flanqueando
            { x: 440, y: 380, w: 52, h: 82 },
            { x: 530, y: 380, w: 52, h: 82 },
            { x: 620, y: 380, w: 52, h: 82 },
            { x: 700, y: 380, w: 52, h: 82 },
        ],
        hint: 'Hay dos pasos — elige el de la izquierda para llegar a la plaza.',
    },

    // ── NIVEL 24: Pasillo estrecho ─────────────────────────────────────────
    {
        id: 24,
        name: 'Pasillo estrecho',
        difficulty: 'medio',
        carStart: { x: 680, y: 300, angle: Math.PI },  // derecha centro, mirando izq
        // Plaza izquierda — hay que atravesar un pasillo muy estrecho
        parkingSpot: { x: 46, y: 238, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Pasillo estrecho: dos paredes paralelas
            { x: 200, y: 20,  w: 18, h: 205 },  // pared superior pasillo
            { x: 200, y: 375, w: 18, h: 205 },  // pared inferior pasillo
            // pasillo entre y:225 y y:375 = 150px de altura (coche mide 46px)
        ],
        parkedCars: [
            // Derecha de las paredes del pasillo
            { x: 240, y: 72,  w: 52, h: 82 },
            { x: 320, y: 72,  w: 52, h: 82 },
            { x: 400, y: 72,  w: 52, h: 82 },
            { x: 500, y: 72,  w: 52, h: 82 },
            { x: 600, y: 72,  w: 52, h: 82 },
            { x: 700, y: 72,  w: 52, h: 82 },
            { x: 240, y: 430, w: 52, h: 82 },
            { x: 340, y: 430, w: 52, h: 82 },
            { x: 440, y: 430, w: 52, h: 82 },
            { x: 540, y: 430, w: 52, h: 82 },
            { x: 640, y: 430, w: 52, h: 82 },
        ],
        hint: 'Alinéate con el pasillo central y entra con cuidado.',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  BLOQUE DIFÍCIL (ids 5-6 originales + 13-14-15-16-25-26 nuevos)
    // ══════════════════════════════════════════════════════════════════════

    // ── NIVEL 5: Paralelo imposible ────────────────────────────────────────
    {
        id: 5,
        name: 'Paralelo imposible',
        difficulty: 'difícil',
        carStart: { x: 500, y: 300, angle: 0 },
        // Plaza paralela izquierda: w>h, el coche debe quedar vertical (angle≈±PI/2)
        parkingSpot: { x: 53, y: 230, w: 74, h: 46, angle: Math.PI / 2 },
        walls: [
            ...B,
            // Pared vertical que separa zona de aparcamiento del carril
            // El único paso es por debajo (y:450-580)
            { x: 180, y: 20, w: 18, h: 430 },
        ],
        parkedCars: [
            { x: 45, y: 85,  w: 88, h: 55 },   // coche arriba (y:85-140)
            // plaza y:225-280
            { x: 45, y: 310, w: 88, h: 55 },   // coche abajo (y:310-365)
        ],
        hint: 'Cruza por abajo del muro, sube al carril y mete marcha atrás.',
    },

    // ── NIVEL 6: El laberinto ──────────────────────────────────────────────
    {
        id: 6,
        name: 'El laberinto',
        difficulty: 'difícil',
        carStart: { x: 690, y: 500, angle: Math.PI },
        parkingSpot: { x: 66, y: 63, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Muro horizontal arriba — paso izq (<200) y der (>618)
            { x: 200, y: 170, w: 400, h: 18 },
            // Pilar vertical derecho
            { x: 600, y: 170, w: 18,  h: 160 },
            // Muro horizontal medio — paso izq (<200) y der (>600)
            { x: 200, y: 330, w: 400, h: 18 },
            // Pilar vertical izquierdo (cierra corredor por abajo-izq)
            { x: 200, y: 330, w: 18,  h: 130 },
        ],
        parkedCars: [
            { x: 180, y: 55, w: 52, h: 82 },
            { x: 250, y: 55, w: 52, h: 82 },
            { x: 320, y: 55, w: 52, h: 82 },
        ],
        hint: 'Ve hacia la izquierda, sube por el pasillo y aparca arriba.',
    },

    // ── NIVEL 13: Solo marcha atrás ────────────────────────────────────────
    {
        id: 13,
        name: 'Solo marcha atrás',
        difficulty: 'difícil',
        // Coche empieza mirando HACIA ABAJO — tiene que maniobrar en reversa
        carStart: { x: 400, y: 120, angle: Math.PI / 2 },
        // Plaza abajo izquierda — acceso desde y>440 (bajo la pared)
        parkingSpot: { x: 86, y: 438, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Muro que bloquea el acceso directo — obliga a bordear
            { x: 200, y: 350, w: 580, h: 18 },  // x:200-780, gap x:20-200
        ],
        parkedCars: [
            // Flanquean la plaza
            // spot x:80-142
            { x: 160, y: 430, w: 52, h: 82 },
            { x: 240, y: 430, w: 52, h: 82 },
            // Coches arriba que dificultan el giro
            { x: 500, y: 72,  w: 52, h: 82 },
            { x: 580, y: 72,  w: 52, h: 82 },
            { x: 660, y: 72,  w: 52, h: 82 },
            { x: 500, y: 160, w: 52, h: 82 },
            { x: 580, y: 160, w: 52, h: 82 },
            { x: 660, y: 160, w: 52, h: 82 },
        ],
        hint: 'Ve a la izquierda, pasa el hueco junto al borde y aparca abajo.',
    },

    // ── NIVEL 14: El caracol ───────────────────────────────────────────────
    {
        id: 14,
        name: 'El caracol',
        difficulty: 'difícil',
        carStart: { x: 680, y: 490, angle: Math.PI },  // abajo derecha, mirando izq
        // Plaza arriba izquierda — hay que serpentear
        parkingSpot: { x: 61, y: 63, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Muro exterior (largo, casi cierra el paso)
            { x: 180, y: 170, w: 580, h: 18 },  // gap izq: x:20-180
            // Muro interior (cortocircuita el paso, solo deja por la derecha)
            { x: 20,  y: 330, w: 580, h: 18 },  // gap der: x:600-780
            // Pilar que conecta los dos muros por la derecha
            { x: 600, y: 170, w: 18,  h: 160 },
        ],
        parkedCars: [
            // Arriba, rodean la plaza
            { x: 135, y: 55, w: 52, h: 82 },
            { x: 220, y: 55, w: 52, h: 82 },
            { x: 310, y: 55, w: 52, h: 82 },
            { x: 400, y: 55, w: 52, h: 82 },
            { x: 490, y: 55, w: 52, h: 82 },
            { x: 580, y: 55, w: 52, h: 82 },
            { x: 670, y: 55, w: 52, h: 82 },
        ],
        hint: 'Baja por la derecha, gira y sube por la izquierda hacia la plaza.',
    },

    // ── NIVEL 15: Paralelo en calle ────────────────────────────────────────
    {
        id: 15,
        name: 'Paralelo en calle',
        difficulty: 'difícil',
        // Coche en la carretera central, plaza en el bordillo izquierdo
        carStart: { x: 580, y: 300, angle: Math.PI },  // mirando izquierda
        // Plaza paralela: w>h → coche entra horizontal (ángulo ≈ 0 ó PI)
        parkingSpot: { x: 38, y: 244, w: 74, h: 44, angle: 0 },
        walls: [
            ...B,
            // Bordillo — separa el aparcamiento de la carretera (gap pequeño)
            { x: 160, y: 20, w: 18, h: 580 },  // bordillo vertical
        ],
        parkedCars: [
            // Coches aparcados en el bordillo
            { x: 30,  y: 72,  w: 82, h: 52 },   // x:30-112, y:72-124
            { x: 30,  y: 140, w: 82, h: 52 },   // y:140-192
            // hueco y:192-244 aprox → plaza y:240-292 (con algo de tolerancia)
            // spot y:240-292
            { x: 30,  y: 310, w: 82, h: 52 },   // y:310-362
            { x: 30,  y: 390, w: 82, h: 52 },   // y:390-442
            { x: 30,  y: 460, w: 82, h: 52 },   // y:460-512
            // Carretera: algunos coches de frente
            { x: 350, y: 72,  w: 52, h: 82 },
            { x: 600, y: 72,  w: 52, h: 82 },
            { x: 350, y: 430, w: 52, h: 82 },
            { x: 600, y: 430, w: 52, h: 82 },
        ],
        hint: 'Alinéate con el hueco del bordillo y entra de lado.',
    },

    // ── NIVEL 16: El cruce ─────────────────────────────────────────────────
    {
        id: 16,
        name: 'El cruce',
        difficulty: 'difícil',
        carStart: { x: 650, y: 460, angle: -Math.PI / 2 },
        // Plaza arriba izquierda — dos bloques crean un corredor en cruz
        // Zona abierta top-left: x:20-320, y:20-340  |  bot-right: x:480-780, y:340-580
        parkingSpot: { x: 61, y: 68, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            { x: 320, y: 20,  w: 460, h: 240 },  // bloque superior derecho
            { x: 20,  y: 340, w: 460, h: 240 },  // bloque inferior izquierdo
        ],
        parkedCars: [
            { x: 135, y: 60, w: 52, h: 82 },
            { x: 205, y: 60, w: 52, h: 82 },
            { x: 510, y: 360, w: 52, h: 82 },
            { x: 600, y: 360, w: 52, h: 82 },
            { x: 700, y: 360, w: 52, h: 82 },
        ],
        hint: 'Cruza el corredor central hacia la izquierda y aparca arriba.',
    },

    // ── NIVEL 25: Curva cerrada ────────────────────────────────────────────
    {
        id: 25,
        name: 'Curva cerrada',
        difficulty: 'difícil',
        carStart: { x: 680, y: 100, angle: Math.PI / 2 },  // arriba derecha, bajando
        // Plaza abajo izquierda — hay que dar una vuelta completa
        parkingSpot: { x: 86, y: 428, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Muro en U que obliga a rodear
            { x: 200, y: 200, w: 400, h: 18 },  // superior del U, gap x:20-200 y x:600-780
            { x: 200, y: 200, w: 18,  h: 180 }, // pilar izq
            { x: 580, y: 200, w: 18,  h: 180 }, // pilar der
        ],
        parkedCars: [
            // Flanquean la plaza
            { x: 22,  y: 420, w: 42, h: 82 },   // x:22-64 (junto al borde)
            // spot x:80-142
            { x: 160, y: 420, w: 52, h: 82 },
            { x: 240, y: 420, w: 52, h: 82 },
            // Arriba derecha donde empieza el coche
            { x: 560, y: 72,  w: 52, h: 82 },
            { x: 630, y: 72,  w: 52, h: 82 },
            { x: 700, y: 72,  w: 52, h: 82 },
        ],
        hint: 'Baja por la derecha, rodea el bloque central y aparca abajo izquierda.',
    },

    // ── NIVEL 26: Barrera doble ────────────────────────────────────────────
    {
        id: 26,
        name: 'Barrera doble',
        difficulty: 'difícil',
        carStart: { x: 390, y: 490, angle: -Math.PI / 2 },
        // Plaza arriba derecha — dos barreras con pasos alternos
        parkingSpot: { x: 646, y: 63, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Primera barrera: paso a la derecha (x:530-780)
            { x: 20,  y: 220, w: 510, h: 18 },
            // Segunda barrera: paso a la izquierda (x:20-240)
            { x: 240, y: 370, w: 540, h: 18 },
        ],
        parkedCars: [
            // Zona superior (hueco para la plaza)
            { x: 25,  y: 55, w: 52, h: 82 },
            { x: 95,  y: 55, w: 52, h: 82 },
            { x: 165, y: 55, w: 52, h: 82 },
            { x: 255, y: 55, w: 52, h: 82 },
            { x: 345, y: 55, w: 52, h: 82 },
            { x: 435, y: 55, w: 52, h: 82 },
            { x: 530, y: 55, w: 52, h: 82 },
            { x: 610, y: 55, w: 52, h: 82 },
            // spot x:640-702
            { x: 720, y: 55, w: 52, h: 82 },
        ],
        hint: 'Pasa por la izquierda abajo, luego por la derecha arriba.',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  BLOQUE EXPERTO (id 7 rediseñado + 17-18-19-20-27 nuevos)
    // ══════════════════════════════════════════════════════════════════════

    // ── NIVEL 7: Centro comercial (REDISEÑADO) ─────────────────────────────
    {
        id: 7,
        name: 'Centro comercial',
        difficulty: 'experto',
        // Coche abajo derecha, plaza arriba izquierda
        // Ruta: subir por la derecha (gap mid), cruzar a la izquierda en zona media,
        //        subir de nuevo por la izquierda (gap top), llegar a la plaza.
        carStart: { x: 700, y: 490, angle: -Math.PI / 2 },
        // Plaza: x:55-117, y:60-150, center(86,105). Acceso desde y>150 (abajo).
        parkingSpot: { x: 61, y: 68, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Divisor superior: x:160-780, gap izq x:20-160
            { x: 160, y: 225, w: 620, h: 18 },
            // Divisor medio: x:20-640, gap der x:640-780
            { x: 20,  y: 375, w: 620, h: 18 },
            // Pilar que une ambos por la derecha
            { x: 640, y: 225, w: 18,  h: 150 },
        ],
        parkedCars: [
            // Zona superior (y:20-225) — a la derecha de la plaza
            { x: 160, y: 60, w: 52, h: 82 },
            { x: 230, y: 60, w: 52, h: 82 },
            { x: 310, y: 60, w: 52, h: 82 },
            { x: 390, y: 60, w: 52, h: 82 },
            { x: 470, y: 60, w: 52, h: 82 },
            { x: 560, y: 60, w: 52, h: 82 },
            // Zona inferior (y:393-580) — obstáculos para la navegación
            { x: 25,  y: 400, w: 52, h: 82 },
            { x: 95,  y: 400, w: 52, h: 82 },
            { x: 165, y: 400, w: 52, h: 82 },
            { x: 235, y: 400, w: 52, h: 82 },
            { x: 305, y: 400, w: 52, h: 82 },
            { x: 375, y: 400, w: 52, h: 82 },
            { x: 445, y: 400, w: 52, h: 82 },
        ],
        hint: 'Sube por la derecha, cruza al centro y sube por la izquierda.',
    },

    // ── NIVEL 17: La serpiente ─────────────────────────────────────────────
    {
        id: 17,
        name: 'La serpiente',
        difficulty: 'experto',
        carStart: { x: 680, y: 490, angle: Math.PI },  // abajo derecha, mirando izq
        // Plaza arriba derecha — hay que serpentear por tres zonas
        parkingSpot: { x: 646, y: 63, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Tres barreras alternas — crean serpentina
            { x: 20,  y: 180, w: 560, h: 18 },  // primera: gap der x:580-780
            { x: 220, y: 320, w: 560, h: 18 },  // segunda: gap izq x:20-220
            { x: 20,  y: 440, w: 560, h: 18 },  // tercera: gap der x:580-780
        ],
        parkedCars: [
            // Zona 1 (arriba, y<180): flanquean la plaza
            { x: 25,  y: 55, w: 52, h: 82 },
            { x: 95,  y: 55, w: 52, h: 82 },
            { x: 165, y: 55, w: 52, h: 82 },
            { x: 255, y: 55, w: 52, h: 82 },
            { x: 345, y: 55, w: 52, h: 82 },
            { x: 435, y: 55, w: 52, h: 82 },
            { x: 545, y: 55, w: 52, h: 82 },
            // spot x:640-702
            { x: 720, y: 55, w: 52, h: 82 },
        ],
        hint: 'Pasa el primer muro por la derecha, el segundo por la izquierda, el tercero por la derecha.',
    },

    // ── NIVEL 18: El sótano ────────────────────────────────────────────────
    {
        id: 18,
        name: 'El sótano',
        difficulty: 'experto',
        carStart: { x: 100, y: 100, angle: Math.PI / 2 },  // arriba izq, mirando abajo
        // Plaza abajo derecha — ruta compleja con tres zonas
        parkingSpot: { x: 646, y: 428, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Barrera superior: deja paso izquierdo (x:20-180)
            { x: 180, y: 200, w: 600, h: 18 },
            // Barrera media: deja paso derecho (x:620-780)
            { x: 20,  y: 370, w: 600, h: 18 },
            // Pilar vertical conectando las barreras
            { x: 620, y: 200, w: 18,  h: 170 },
        ],
        parkedCars: [
            // Zona inferior derecha (flanquean la plaza)
            // spot x:640-702
            { x: 560, y: 420, w: 52, h: 82 },   // izq de la plaza
            { x: 720, y: 420, w: 52, h: 82 },   // der de la plaza
            // Zona superior izquierda donde empieza el coche
            { x: 180, y: 55, w: 52, h: 82 },
            { x: 260, y: 55, w: 52, h: 82 },
            { x: 340, y: 55, w: 52, h: 82 },
            { x: 430, y: 55, w: 52, h: 82 },
            { x: 520, y: 55, w: 52, h: 82 },
            { x: 620, y: 55, w: 52, h: 82 },
            { x: 700, y: 55, w: 52, h: 82 },
        ],
        hint: 'Baja por la izquierda, cruza a la derecha y aparca abajo.',
    },

    // ── NIVEL 19: Paralelo extremo ─────────────────────────────────────────
    {
        id: 19,
        name: 'Paralelo extremo',
        difficulty: 'experto',
        // Coche en el carril, debe hacer paralelo en hueco muy justo
        carStart: { x: 600, y: 290, angle: Math.PI },  // mirando izquierda
        // Plaza paralela estrecha — coche debe quedar horizontal
        parkingSpot: { x: 38, y: 242, w: 74, h: 44, angle: 0 },
        walls: [
            ...B,
            // Bordillo que separa aparcamiento de carretera
            { x: 165, y: 20, w: 18, h: 200 },  // tramo superior bordillo
            { x: 165, y: 360, w: 18, h: 220 }, // tramo inferior bordillo
            // El gap central (y:220-360) es el único acceso al aparcamiento
        ],
        parkedCars: [
            // Aparcamiento paralelo — hueco muy estrecho
            { x: 30,  y: 72,  w: 88, h: 52 },   // y:72-124
            { x: 30,  y: 140, w: 88, h: 52 },   // y:140-192
            // spot y:238-290 (center y:264) — gap = y:192-238 (46px) de margen de entrada
            { x: 30,  y: 308, w: 88, h: 52 },   // y:308-360
            { x: 30,  y: 378, w: 88, h: 52 },   // y:378-430
            { x: 30,  y: 446, w: 88, h: 52 },   // y:446-498
            // Carretera — coches de frente
            { x: 300, y: 72,  w: 52, h: 82 },
            { x: 450, y: 72,  w: 52, h: 82 },
            { x: 600, y: 72,  w: 52, h: 82 },
            { x: 700, y: 72,  w: 52, h: 82 },
            { x: 300, y: 430, w: 52, h: 82 },
            { x: 450, y: 430, w: 52, h: 82 },
            { x: 700, y: 430, w: 52, h: 82 },
        ],
        hint: 'Alinéate, entra por el hueco del bordillo y aparca de lado.',
    },

    // ── NIVEL 20: El cuadrado ──────────────────────────────────────────────
    {
        id: 20,
        name: 'El cuadrado',
        difficulty: 'experto',
        // Coche en el interior del cuadrado, plaza en el exterior (hay que salir)
        carStart: { x: 400, y: 340, angle: 0 },  // interior, mirando derecha
        // Plaza fuera del cuadrado — arriba izquierda
        parkingSpot: { x: 61, y: 63, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Cuadrado interior — solo una salida (abajo izquierda)
            { x: 220, y: 175, w: 340, h: 18 },  // lado superior del cuadrado
            { x: 540, y: 175, w: 18,  h: 230 }, // lado derecho
            { x: 220, y: 175, w: 18,  h: 130 }, // lado izquierdo (superior)
            // Salida: gap en lado izquierdo y:305-405 (sin pared)
            { x: 220, y: 405, w: 18,  h: 20  }, // lado izquierdo (inferior, pequeño)
            { x: 238, y: 385, w: 302, h: 18  }, // lado inferior del cuadrado
        ],
        parkedCars: [
            // Exterior del cuadrado
            { x: 55,  y: 200, w: 52, h: 82 },
            { x: 55,  y: 310, w: 52, h: 82 },
            { x: 55,  y: 420, w: 52, h: 82 },
            { x: 590, y: 200, w: 52, h: 82 },
            { x: 590, y: 310, w: 52, h: 82 },
            { x: 590, y: 420, w: 52, h: 82 },
            { x: 250, y: 430, w: 52, h: 82 },
            { x: 370, y: 430, w: 52, h: 82 },
            { x: 470, y: 430, w: 52, h: 82 },
        ],
        hint: 'Sal del cuadrado por la apertura izquierda y aparca arriba.',
    },

    // ── NIVEL 27: El maestro ───────────────────────────────────────────────
    {
        id: 27,
        name: 'El maestro',
        difficulty: 'experto',
        carStart: { x: 700, y: 490, angle: Math.PI },  // abajo derecha, izquierda
        // Plaza arriba derecha — ruta larga en Z
        parkingSpot: { x: 646, y: 63, w: 50, h: 74, angle: 0 },
        walls: [
            ...B,
            // Barrera 1: x:20-480, gap der x:480-780
            { x: 20,  y: 170, w: 460, h: 18 },
            // Barrera 2: x:300-780, gap izq x:20-300
            { x: 300, y: 320, w: 480, h: 18 },
            // Barrera 3: x:20-520, gap der x:520-780
            { x: 20,  y: 450, w: 500, h: 18 },
            // Pilares de conexión
            { x: 480, y: 170, w: 18,  h: 150 },  // pilar der barrera 1-2
            { x: 300, y: 320, w: 18,  h: 130 },  // pilar izq barrera 2-3
        ],
        parkedCars: [
            // Zona superior (y<170): flanquean la plaza
            { x: 25,  y: 55, w: 52, h: 82 },
            { x: 95,  y: 55, w: 52, h: 82 },
            { x: 165, y: 55, w: 52, h: 82 },
            { x: 255, y: 55, w: 52, h: 82 },
            { x: 345, y: 55, w: 52, h: 82 },
            { x: 435, y: 55, w: 52, h: 82 },
            { x: 545, y: 55, w: 52, h: 82 },
            // spot x:640-702
            { x: 720, y: 55, w: 52, h: 82 },
            // Zona media (y:338-450)
            { x: 25,  y: 350, w: 52, h: 82 },
            { x: 95,  y: 350, w: 52, h: 82 },
            { x: 165, y: 350, w: 52, h: 82 },
            // Zona baja (y>468)
            { x: 540, y: 470, w: 52, h: 82 },
            { x: 610, y: 470, w: 52, h: 82 },
        ],
        hint: 'Serpentea por las tres barreras: derecha, izquierda, derecha.',
    },
];

// ── Orden diario: progresión de dificultad entremezclada ─────────────────────
// F-F-M-F-M-D-F-M-D-F-M-D-E-F-M-D-E-M-D-E-M-D-E-D-E-D-E
const _DAILY_ORDER = [1, 2, 3, 8, 4, 5, 9, 10, 6, 21, 11, 13, 7, 22, 12, 14, 17, 23, 15, 18, 24, 16, 19, 25, 20, 26, 27];
LEVELS.sort((a, b) => _DAILY_ORDER.indexOf(a.id) - _DAILY_ORDER.indexOf(b.id));

export function getLevelForDate(date: Date): Level {
    // Usamos UTC para que todos los jugadores reciban el mismo nivel,
    // independientemente de su zona horaria.
    const startMs = Date.UTC(2025, 0, 1);
    const dateMs  = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const diff    = Math.floor((dateMs - startMs) / 86_400_000);
    // El módulo positivo evita índices negativos si diff < 0
    return LEVELS[((diff % LEVELS.length) + LEVELS.length) % LEVELS.length];
}

export function getLevelById(id: number): Level | undefined {
    return LEVELS.find(l => l.id === id);
}

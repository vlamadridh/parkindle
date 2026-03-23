import { LEVELS, DIFFICULTY_COLORS, type Level } from './levels';
import { initFeedbackModal } from './feedback';

// ── Constantes ──────────────────────────────────────────────────────────────
const EPOCH_MS = Date.UTC(2025, 0, 1); // 2025-01-01 — mismo que getLevelForDate

// ── Helpers de fecha ────────────────────────────────────────────────────────
function getLevelForDay(dayOffset: number): Level {
    const idx = ((dayOffset % LEVELS.length) + LEVELS.length) % LEVELS.length;
    return LEVELS[idx];
}

function dayOffsetFromMs(ms: number): number {
    return Math.floor((ms - EPOCH_MS) / 86_400_000);
}

function utcMidnight(d: Date): number {
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function dateKey(ms: number): string {
    const d = new Date(ms);
    return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function formatDate(ms: number): string {
    const d = new Date(ms);
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

// ── Tipos ───────────────────────────────────────────────────────────────────
interface SavedDay { result: 'won' | 'lost'; levelId: number; attempts: number; }

function loadHistory(): Record<string, SavedDay> {
    try {
        const raw = localStorage.getItem('parkindle_history');
        if (!raw) return {};
        return JSON.parse(raw) ?? {};
    } catch { return {}; }
}

// ── Tema ────────────────────────────────────────────────────────────────────
(function initTheme() {
    const theme = localStorage.getItem('parkindle_theme') || 'dark';
    const html = document.documentElement;
    const icon = document.getElementById('theme-icon') as HTMLElement;
    if (theme === 'light') {
        html.classList.remove('dark');
        if (icon) icon.textContent = '☀️';
    } else {
        html.classList.add('dark');
        if (icon) icon.textContent = '🌙';
    }

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        const isDark = html.classList.contains('dark');
        const next = isDark ? 'light' : 'dark';
        localStorage.setItem('parkindle_theme', next);
        html.classList.toggle('dark', !isDark);
        if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    });
})();

// ── Render ──────────────────────────────────────────────────────────────────
const DIFF_LABEL: Record<string, string> = {
    'fácil': 'Fácil', 'medio': 'Medio', 'difícil': 'Difícil', 'experto': 'Experto',
};

function render() {
    const history = loadHistory();

    const today = new Date();
    const todayMs = utcMidnight(today);
    const todayOffset = dayOffsetFromMs(todayMs);

    // Mostramos solo un ciclo completo (LEVELS.length días más recientes).
    // Más allá son los mismos niveles repetidos.
    const maxDays = Math.min(todayOffset + 1, LEVELS.length);

    const days: Array<{
        dayNum: number;
        ms: number;
        level: Level;
        saved: SavedDay | undefined;
        isToday: boolean;
    }> = [];

    for (let i = todayOffset; i > todayOffset - maxDays; i--) {
        const ms = EPOCH_MS + i * 86_400_000;
        const key = dateKey(ms);
        days.push({
            dayNum: maxDays - (todayOffset - i),
            ms,
            level: getLevelForDay(i),
            saved: history[key],
            isToday: i === todayOffset,
        });
    }

    // ── Stats rápidas ────────────────────────────────────────────────────────
    const played = days.filter(d => d.saved).length;
    const won = days.filter(d => d.saved?.result === 'won').length;
    const streak = parseInt(localStorage.getItem('parkindle_streak') ?? '0', 10);

    const statPlayed = document.getElementById('stat-played');
    const statWon = document.getElementById('stat-won');
    const statStreak = document.getElementById('stat-streak');
    if (statPlayed) statPlayed.textContent = String(played);
    if (statWon) statWon.textContent = String(won);
    if (statStreak) statStreak.textContent = String(streak);

    // ── Filtros ──────────────────────────────────────────────────────────────
    let activeFilter: 'all' | 'won' | 'lost' | 'unplayed' = 'all';
    let activeDiff: string = 'all';

    // ── Lista ────────────────────────────────────────────────────────────────
    const list = document.getElementById('levels-list');
    if (!list) return;

    function applyFilters() {
        list!.innerHTML = '';
        const filtered = days.filter(d => {
            if (activeFilter === 'won' && d.saved?.result !== 'won') return false;
            if (activeFilter === 'lost' && d.saved?.result !== 'lost') return false;
            if (activeFilter === 'unplayed' && d.saved) return false;
            if (activeDiff !== 'all' && d.level.difficulty !== activeDiff) return false;
            return true;
        });

        if (filtered.length === 0) {
            list!.innerHTML = '<p class="text-slate-500 text-center py-12">No hay niveles con ese filtro.</p>';
            return;
        }

        for (const d of filtered) {
            const card = document.createElement('div');
            card.className = 'day-card';

            // Lado izquierdo: número + fecha + nombre
            const left = document.createElement('div');
            left.className = 'day-card-left';

            const dayNum = document.createElement('span');
            dayNum.className = 'day-num';
            dayNum.textContent = `Día #${d.dayNum}`;
            if (d.isToday) {
                dayNum.textContent += ' ★';
                card.classList.add('is-today');
            }

            const lvlName = document.createElement('span');
            lvlName.className = 'day-name';
            lvlName.textContent = d.level.name;

            const dateStr = document.createElement('span');
            dateStr.className = 'day-date';
            dateStr.textContent = formatDate(d.ms);

            left.append(dayNum, lvlName, dateStr);

            // Centro: badge dificultad
            const diffBadge = document.createElement('span');
            diffBadge.className = 'diff-pill';
            diffBadge.textContent = DIFF_LABEL[d.level.difficulty] ?? d.level.difficulty;
            diffBadge.style.background = DIFFICULTY_COLORS[d.level.difficulty] ?? '#555';
            diffBadge.style.color = d.level.difficulty === 'medio' ? '#000' : '#fff';

            // Lado derecho: resultado + botón
            const right = document.createElement('div');
            right.className = 'day-card-right';

            const resultEl = document.createElement('span');
            resultEl.className = 'day-result';
            if (d.saved?.result === 'won') {
                resultEl.textContent = `✅ Aparcado`;
                resultEl.classList.add('result-won');
                if (d.saved.attempts) {
                    const att = document.createElement('span');
                    att.className = 'day-attempts';
                    att.textContent = `${d.saved.attempts} intento${d.saved.attempts === 1 ? '' : 's'}`;
                    right.appendChild(att);
                }
            } else if (d.saved?.result === 'lost') {
                resultEl.textContent = `❌ Choque`;
                resultEl.classList.add('result-lost');
            } else {
                resultEl.textContent = `— Sin jugar`;
                resultEl.classList.add('result-unplayed');
            }

            const playBtn = document.createElement('a');
            playBtn.className = 'play-level-btn';
            playBtn.textContent = d.isToday ? 'Jugar' : 'Rejugar';
            playBtn.href = `/game.html?level=${d.level.id}`;

            right.prepend(resultEl);
            right.appendChild(playBtn);

            card.append(left, diffBadge, right);
            list!.appendChild(card);
        }
    }

    // ── Event listeners filtros ──────────────────────────────────────────────
    document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            activeFilter = btn.dataset.filter as typeof activeFilter;
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    document.querySelectorAll<HTMLButtonElement>('[data-diff]').forEach(btn => {
        btn.addEventListener('click', () => {
            activeDiff = btn.dataset.diff!;
            document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
    });

    applyFilters();
}

// ── Redes sociales en footer ────────────────────────────────────────────────
function initFooterShare() {
    const shareText = encodeURIComponent('🚗 Parkindle — El reto diario de aparcamiento. ¿Cuántos intentos necesitas? parkindle.com');
    const shareUrl = encodeURIComponent('https://parkindle.com');
    document.getElementById('niv-share-twitter')?.setAttribute('href',
        `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`);
    document.getElementById('niv-share-whatsapp')?.setAttribute('href',
        `https://wa.me/?text=${encodeURIComponent('🚗 Parkindle — El reto diario de aparcamiento. ¿Cuántos intentos necesitas?\nhttps://parkindle.com')}`);
    document.getElementById('niv-share-telegram')?.setAttribute('href',
        `https://t.me/share/url?url=${shareUrl}&text=${shareText}`);
}

// Esperamos a que el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    render();
    initFooterShare();
    initFeedbackModal({
        modalId:          'feedback-modal-niv',
        closeId:          'feedback-close-niv',
        sendId:           'feedback-send-niv',
        textId:           'feedback-text-niv',
        nameId:           'feedback-name-niv',
        triggerSelectors: ['#feedback-btn-niveles', '#niv-feedback-btn'],
    });
});

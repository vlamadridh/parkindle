// ── Formspree endpoint ────────────────────────────────────────────────────────
// 1. Ve a https://formspree.io → regístrate gratis → crea un formulario
// 2. Copia la URL que te dan (ej: https://formspree.io/f/xyzabcde)
// 3. Sustitúyela aquí:
export const FORMSPREE_URL = 'https://formspree.io/f/mjgpkgnp';

// ── Lógica del modal de feedback ──────────────────────────────────────────────
export function initFeedbackModal(opts: {
    modalId: string;
    closeId: string;
    sendId: string;
    textId: string;
    nameId: string;
    triggerSelectors: string[];
}) {
    const modal = document.getElementById(opts.modalId);
    if (!modal) return;

    const open = () => modal.classList.remove('hidden');
    const close = () => {
        modal.classList.add('hidden');
        resetForm();
    };

    opts.triggerSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el =>
            el.addEventListener('click', open)
        );
    });

    document.getElementById(opts.closeId)?.addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });

    // Cerrar con Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
    });

    function resetForm() {
        const txt = document.getElementById(opts.textId) as HTMLTextAreaElement | null;
        const name = document.getElementById(opts.nameId) as HTMLInputElement | null;
        const btn = document.getElementById(opts.sendId) as HTMLButtonElement | null;
        if (txt) txt.value = '';
        if (name) name.value = '';
        if (btn) { btn.textContent = 'Enviar →'; btn.disabled = false; }
        modal!.querySelector('.feedback-status')?.remove();
    }

    function showStatus(msg: string, ok: boolean) {
        modal!.querySelector('.feedback-status')?.remove();
        const p = document.createElement('p');
        p.className = 'feedback-status';
        p.textContent = msg;
        p.style.cssText = `margin:10px 0 0;font-size:0.8rem;font-weight:600;text-align:center;color:${ok ? '#2ecc71' : '#e74c3c'}`;
        document.getElementById(opts.sendId)?.insertAdjacentElement('afterend', p);
    }

    document.getElementById(opts.sendId)?.addEventListener('click', async () => {
        const txt = (document.getElementById(opts.textId) as HTMLTextAreaElement)?.value?.trim();
        const name = (document.getElementById(opts.nameId) as HTMLInputElement)?.value?.trim();
        if (!txt) {
            showStatus('Escribe algo antes de enviar.', false);
            return;
        }

        const btn = document.getElementById(opts.sendId) as HTMLButtonElement;
        btn.textContent = 'Enviando…';
        btn.disabled = true;

        try {
            const res = await fetch(FORMSPREE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ name: name || 'Anónimo', message: txt }),
            });

            if (res.ok) {
                showStatus('✅ ¡Enviado! Gracias por tu feedback.', true);
                btn.textContent = '¡Enviado!';
                setTimeout(close, 2000);
            } else {
                throw new Error('error');
            }
        } catch {
            showStatus('❌ Error al enviar. Inténtalo de nuevo.', false);
            btn.textContent = 'Enviar →';
            btn.disabled = false;
        }
    });
}

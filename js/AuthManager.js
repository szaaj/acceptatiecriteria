// ============================================================
//  AuthManager.js — Toegangs- en wachtwoordbeheer
//  Beheert docent- en studenttoegang per fase
// ============================================================

class AuthManager {

    constructor(codes) {
        this._codes          = codes;        // { docent, bughunt, theorie, ... }
        this._isDocent       = sessionStorage.getItem('docent') === 'true';
        this._ontgrendeldSet = new Set();    // set van ontgrendelde fase-id's
        this._onUnlock       = null;         // callback bij ontgrendeling
        // Herstel ontgrendeling als docent al ingelogd is
        if (this._isDocent) {
            Object.keys(this._codes).forEach(k => {
                if (k !== 'docent') this._ontgrendeldSet.add(k);
            });
        }
    }

    // ── PUBLIEKE METHODEN ──────────────────────────────────

    /** Verwerk een ingevoerde code. Geeft terug wat er ontgrendeld werd. */
    probeerCode(input) {
        const code = input.trim().toUpperCase();

        // Docentcode — alles ontgrendelen
        if (code === this._codes.docent.toUpperCase()) {
            this._isDocent = true;
            sessionStorage.setItem('docent', 'true');
            this._ontgrendelAlles();
            return { succes: true, type: 'docent', bericht: 'Docenttoegang verleend — alle fasen ontgrendeld.' };
        }

        // Fase-codes doorzoeken
        for (const [sleutel, waarde] of Object.entries(this._codes)) {
            if (sleutel === 'docent') continue;
            if (code === waarde.toUpperCase()) {
                this._ontgrendelFase(sleutel);
                return { succes: true, type: 'fase', sleutel, bericht: `Fase ontgrendeld!` };
            }
        }

        return { succes: false, bericht: 'Ongeldige code. Probeer het opnieuw.' };
    }

    isDocent()           { return this._isDocent; }
    isOntgrendeld(id)    { return this._isDocent || this._ontgrendeldSet.has(id); }

    /** Stel callback in die wordt aangeroepen bij ontgrendeling */
    onUnlock(fn)         { this._onUnlock = fn; }

    // ── PRIVÉ ──────────────────────────────────────────────

    _ontgrendelFase(sleutel) {
        this._ontgrendeldSet.add(sleutel);
        if (this._onUnlock) this._onUnlock(sleutel);
    }

    _ontgrendelAlles() {
        // Haal alle sleutels uit codes behalve 'docent'
        Object.keys(this._codes).forEach(sleutel => {
            if (sleutel !== 'docent') this._ontgrendeldSet.add(sleutel);
        });
        if (this._onUnlock) this._onUnlock('*');
    }

    // ── MODAL HELPER ──────────────────────────────────────

    /** Toon de code-modal en verwerk de invoer */
    toonModal(onResultaat) {
        const modal = document.getElementById('modal-auth');
        const input = document.getElementById('modal-input');
        const fout  = document.getElementById('modal-fout');
        const btnOk = document.getElementById('modal-ok');
        const btnX  = document.getElementById('modal-sluit');

        if (!modal) return;

        // Reset
        input.value = '';
        fout.textContent = '';
        fout.style.display = 'none';
        modal.classList.add('zichtbaar');
        input.focus();

        const verwerk = () => {
            const resultaat = this.probeerCode(input.value);
            if (resultaat.succes) {
                modal.classList.remove('zichtbaar');
                if (onResultaat) onResultaat(resultaat);
            } else {
                fout.textContent = resultaat.bericht;
                fout.style.display = 'block';
                input.value = '';
                input.focus();
                // Schudanimatie
                input.classList.add('schud');
                setTimeout(() => input.classList.remove('schud'), 400);
            }
        };

        // Events — verwijder oude listeners met cloneNode-truc
        const nieuweOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(nieuweOk, btnOk);
        nieuweOk.addEventListener('click', verwerk);

        input.addEventListener('keydown', function handler(e) {
            if (e.key === 'Enter') { verwerk(); }
            if (e.key === 'Escape') { modal.classList.remove('zichtbaar'); input.removeEventListener('keydown', handler); }
        });

        btnX.addEventListener('click', () => modal.classList.remove('zichtbaar'));
    }
}

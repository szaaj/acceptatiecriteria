// ============================================================
//  Fase.js — OOP klasse voor een lesfase
//  Elke fase is een zelfstandig object met eigen staat
// ============================================================

class Fase {

    constructor(data) {
        this.id           = data.id;
        this.nummer       = data.nummer;
        this.emoji        = data.emoji;
        this.titel        = data.titel;
        this.omschrijving = data.omschrijving;
        this.werkvorm     = data.werkvorm;
        this.wvKlasse     = data.wvKlasse;
        this.tijdLabel    = data.tijdLabel;
        this.duurMin      = data.duurMin;
        this.url          = data.url;
        this.codeSleutel  = data.codeSleutel;
        this.kleur        = data.kleur;

        // Staat
        this._ontgrendeld = false;
        this._gedaan      = false;
        this._actief      = false;

        // DOM element — wordt ingesteld door LesSchema
        this.element = null;
    }

    // ── GETTERS ───────────────────────────────────────────

    get ontgrendeld() { return this._ontgrendeld; }
    get gedaan()      { return this._gedaan; }
    get actief()      { return this._actief; }

    // ── STAAT METHODEN ────────────────────────────────────

    ontgrendel() {
        this._ontgrendeld = true;
        this._updateDOM();
    }

    setActief(actief) {
        this._actief = actief;
        this._updateDOM();
    }

    setGedaan(gedaan) {
        this._gedaan = gedaan;
        this._updateDOM();
    }

    setAlarm(alarm) {
        if (!this.element) return;
        this.element.classList.toggle('alarm', alarm);
    }

    // ── NAVIGATIE ─────────────────────────────────────────

    open() {
        if (this.url) {
            window.location.href = this.url;
        }
    }

    // ── DOM ───────────────────────────────────────────────

    /** Bouw het HTML-element voor deze fase */
    render() {
        const el = document.createElement('div');
        el.className = 'fase-kaart';
        el.dataset.id = this.id;
        el.style.setProperty('--fase-kleur', this.kleur);

        el.innerHTML = `
            <div class="fase-nummer">${this.nummer}</div>
            <div class="fase-slot">
                <span class="fase-slot-icoon">🔒</span>
            </div>
            <div class="fase-inhoud">
                <div class="fase-emoji">${this.emoji}</div>
                <h2>${this.titel}</h2>
                <p>${this.omschrijving}</p>
                <div class="werkvorm-badge ${this.wvKlasse}">${this.werkvorm}</div>
            </div>
            <div class="fase-tijd">
                <span class="tijd-label">${this.tijdLabel}</span>
                <div class="timer-ring">
                    <svg viewBox="0 0 60 60">
                        <circle class="ring-bg" cx="30" cy="30" r="24"/>
                        <circle class="ring-prog" cx="30" cy="30" r="24" id="ring-${this.id}"/>
                    </svg>
                    <span class="timer-tekst" id="timer-${this.id}">${Timer.formatTijd(this.duurMin * 60)}</span>
                </div>
            </div>
        `;

        this.element = el;
        this._updateDOM();
        return el;
    }

    /** Update visuele staat op basis van huidige flags */
    _updateDOM() {
        if (!this.element) return;

        this.element.classList.toggle('ontgrendeld', this._ontgrendeld);
        this.element.classList.toggle('vergrendeld',  !this._ontgrendeld);
        this.element.classList.toggle('actief',        this._actief);
        this.element.classList.toggle('gedaan',        this._gedaan);

        // Slotje verbergen als ontgrendeld
        const slot = this.element.querySelector('.fase-slot');
        if (slot) slot.style.display = this._ontgrendeld ? 'none' : 'flex';
    }

    /** Update de timer-ring en tijdstekst */
    updateTimer(resterend, voortgang) {
        const timerEl = document.getElementById(`timer-${this.id}`);
        const ringEl  = document.getElementById(`ring-${this.id}`);
        if (!timerEl || !ringEl) return;

        const CIRCUMFERENCE = 2 * Math.PI * 24; // r=24
        timerEl.textContent = Timer.formatTijd(resterend);
        ringEl.style.strokeDasharray  = CIRCUMFERENCE;
        ringEl.style.strokeDashoffset = CIRCUMFERENCE * (1 - voortgang);
    }

    resetTimer() {
        const timerEl = document.getElementById(`timer-${this.id}`);
        const ringEl  = document.getElementById(`ring-${this.id}`);
        if (timerEl) timerEl.textContent = Timer.formatTijd(this.duurMin * 60);
        if (ringEl)  {
            const CIRCUMFERENCE = 2 * Math.PI * 24;
            ringEl.style.strokeDasharray  = CIRCUMFERENCE;
            ringEl.style.strokeDashoffset = 0;
        }
    }

    gedaanTimer() {
        const timerEl = document.getElementById(`timer-${this.id}`);
        if (timerEl) timerEl.textContent = '✓';
    }
}

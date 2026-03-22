// ============================================================
//  LesSchema.js — Hoofdcontroller (orkestrator)
//  Verbindt Fase, Timer en AuthManager
// ============================================================

class LesSchema {

    constructor(config) {
        this._config   = config;
        this._fasen    = [];
        this._huidig   = 0;
        this._timer    = null;
        this._auth     = null;

        // DOM referenties
        this._grid     = document.getElementById('fasen-grid');
        this._btnStart = document.getElementById('btn-start');
        this._btnPrev  = document.getElementById('btn-prev');
        this._btnNext  = document.getElementById('btn-next');
        this._btnReset = document.getElementById('btn-reset');
        this._btnCode  = document.getElementById('btn-code');
        this._klok     = document.getElementById('klok');
        this._actiefBalk  = document.getElementById('actieve-balk');
        this._actiefLabel = document.getElementById('actieve-label');
        this._actiefTimer = document.getElementById('actieve-timer');
    }

    // ── INITIALISATIE ─────────────────────────────────────

    init() {
        this._bouwFasen();
        this._bouwAuth();
        this._bouwTimer();
        this._bindControls();
        this._bindKeyboard();
        this._update();
    }

    _bouwFasen() {
        this._fasen = this._config.fasen.map(data => new Fase(data));
        this._fasen.forEach(fase => {
            const el = fase.render();
            el.addEventListener('click', () => this._klikFase(fase));
            this._grid.appendChild(el);
        });
    }

    _bouwAuth() {
        this._auth = new AuthManager(this._config.codes);

        // Herstel sessie — al ingelogd als docent?
        if (this._auth.isDocent()) {
            this._fasen.forEach(f => f.ontgrendel());
            const bel = document.getElementById('btn-bel');
            if (bel) bel.classList.add('zichtbaar');
        }

        this._auth.onUnlock(sleutel => {
            if (sleutel === '*') {
                this._fasen.forEach(f => f.ontgrendel());
                const bel = document.getElementById('btn-bel');
                if (bel) bel.classList.add('zichtbaar');
                this._toonMelding('🔓 Docenttoegang — alle fasen ontgrendeld', 'succes');
            } else {
                const fase = this._fasen.find(f => f.codeSleutel === sleutel);
                if (fase) { fase.ontgrendel(); this._toonMelding(`🔓 ${fase.titel} ontgrendeld!`, 'succes'); }
            }
        });
    }

    _bouwTimer() {
        this._timer = new Timer({
            onTick: ({ resterend, voortgang, secTotaal }) => {
                // Update actieve fase ring
                this._huidigeFase().updateTimer(resterend, voortgang);
                // Update totale klok
                if (this._klok) this._klok.textContent = Timer.formatTijd(secTotaal);
                // Update actieve balk
                this._updateActiefBalk(resterend);
            },
            onAlarm: () => {
                this._huidigeFase().setAlarm(true);
                this._toonMelding('⏰ Tijd is om! Ga naar de volgende fase.', 'alarm');
            },
            onComplete: () => {},
        });
    }

    _bindControls() {
        this._btnStart?.addEventListener('click', () => this._toggleTimer());
        this._btnPrev?.addEventListener('click',  () => this._gaNaar(this._huidig - 1));
        this._btnNext?.addEventListener('click',  () => this._gaNaar(this._huidig + 1));
        this._btnReset?.addEventListener('click', () => this._reset());
        this._btnCode?.addEventListener('click',  () => {
            this._auth.toonModal(resultaat => {
                console.log('Ingelogd:', resultaat);
            });
        });
    }

    _bindKeyboard() {
        window.addEventListener('keydown', e => {
            if (e.target.tagName === 'INPUT') return;
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this._toggleTimer(); }
            if (e.key === 'ArrowRight') this._gaNaar(this._huidig + 1);
            if (e.key === 'ArrowLeft')  this._gaNaar(this._huidig - 1);
            if (e.key === 'r' || e.key === 'R') this._reset();
        });
    }

    // ── NAVIGATIE ─────────────────────────────────────────

    _gaNaar(idx) {
        if (idx < 0 || idx >= this._fasen.length) return;
        this._timer.stop();
        this._updateBtnStart(false);

        // Huidige als gedaan markeren als we vooruit gaan
        if (idx > this._huidig) {
            this._huidigeFase().setGedaan(true);
            this._huidigeFase().setActief(false);
            this._huidigeFase().gedaanTimer();
        } else {
            this._huidigeFase().setActief(false);
        }

        this._huidig = idx;
        this._timer.setFase(this._huidigeFase().duurMin);
        this._huidigeFase().setActief(true);
        this._huidigeFase().setAlarm(false);
        this._update();

        // Scroll in beeld
        this._huidigeFase().element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    _klikFase(fase) {
        if (!fase.ontgrendeld) {
            // Vergrendeld — toon auth modal
            this._auth.toonModal(resultaat => {
                if (resultaat.sleutel === fase.codeSleutel || resultaat.type === 'docent') {
                    fase.open();
                }
            });
        } else {
            // Ontgrendeld — open direct in nieuw tabblad
            fase.open();
        }
    }

    // ── TIMER CONTROLS ────────────────────────────────────

    _toggleTimer() {
        if (this._timer.running) {
            this._timer.pause();
            this._updateBtnStart(false);
            if (this._actiefBalk) this._actiefBalk.style.display = 'none';
        } else {
            this._timer.start();
            this._updateBtnStart(true);
            if (this._actiefBalk) this._actiefBalk.style.display = 'flex';
        }
    }

    _reset() {
        this._timer.reset();
        this._updateBtnStart(false);
        this._fasen.forEach(f => {
            f.setActief(false);
            f.setGedaan(false);
            f.setAlarm(false);
            f.resetTimer();
        });
        this._huidig = 0;
        this._huidigeFase().setActief(true);
        if (this._klok) this._klok.textContent = '00:00';
        if (this._actiefBalk) this._actiefBalk.style.display = 'none';
        this._update();
    }

    // ── UPDATE ────────────────────────────────────────────

    _update() {
        this._huidigeFase().setActief(true);
        this._timer.setFase(this._huidigeFase().duurMin);

        // Knoppen
        if (this._btnPrev) {
            this._btnPrev.disabled = this._huidig === 0;
            this._btnPrev.style.opacity = this._huidig === 0 ? '0.3' : '1';
        }
        if (this._btnNext) {
            this._btnNext.disabled = this._huidig === this._fasen.length - 1;
            this._btnNext.style.opacity = this._huidig === this._fasen.length - 1 ? '0.3' : '1';
        }
    }

    _updateBtnStart(running) {
        if (!this._btnStart) return;
        if (running) {
            this._btnStart.textContent = '⏸ Pauzeer';
            this._btnStart.classList.add('running');
        } else {
            this._btnStart.textContent = '▶ Start fase';
            this._btnStart.classList.remove('running');
        }
    }

    _updateActiefBalk(resterend) {
        if (!this._actiefLabel || !this._actiefTimer) return;
        const fase = this._huidigeFase();
        this._actiefLabel.textContent = `Fase ${this._huidig + 1} — ${fase.titel}`;
        this._actiefTimer.textContent = `${Timer.formatTijd(resterend)} resterend`;
    }

    _toonMelding(tekst, type = 'succes') {
        const el = document.getElementById('melding');
        if (!el) return;
        el.textContent = tekst;
        el.className = `melding melding-${type} zichtbaar`;
        clearTimeout(this._meldingRef);
        this._meldingRef = setTimeout(() => el.classList.remove('zichtbaar'), 3500);
    }

    // ── HELPERS ───────────────────────────────────────────

    _speelBel() {
        const btn = document.getElementById('btn-bel');
        try {
            // AudioContext aanmaken of hergebruiken
            if (!this._audioCtx) {
                this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            // Resume als gesuspendeerd (browser vereist gebruikersinteractie)
            if (this._audioCtx.state === 'suspended') {
                this._audioCtx.resume();
            }
            const ctx = this._audioCtx;
            const speel = (freq, start, duur) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.7, ctx.currentTime + start);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duur);
                osc.start(ctx.currentTime + start);
                osc.stop(ctx.currentTime + start + duur + 0.1);
            };
            // Drie tonen — helder belgeluid
            speel(880,  0,    0.35);
            speel(1100, 0.25, 0.35);
            speel(880,  0.5,  0.6);
        } catch(e) {
            console.warn('Geluid niet beschikbaar:', e);
        }
        // Knop animatie altijd
        if (btn) {
            btn.classList.add('rinkelt');
            setTimeout(() => btn.classList.remove('rinkelt'), 1400);
        }
    }

    _huidigeFase() { return this._fasen[this._huidig]; }
}

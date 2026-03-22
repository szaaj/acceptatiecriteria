// ============================================================
//  Timer.js — OOP timer klasse
//  Beheert aftellen per fase + totale lestijd
// ============================================================

class Timer {

    constructor({ onTick, onAlarm, onComplete }) {
        this._secFase    = 0;   // seconden verstreken in huidige fase
        this._secTotaal  = 0;   // totale seconden verstreken
        this._duurSec    = 0;   // duur huidige fase in seconden
        this._interval   = null;
        this._running    = false;
        this._alarm      = false;

        // Callbacks
        this.onTick     = onTick     || (() => {});
        this.onAlarm    = onAlarm    || (() => {});
        this.onComplete = onComplete || (() => {});
    }

    // ── PUBLIEKE METHODEN ──────────────────────────────────

    /** Stel een nieuwe faseduur in en reset de fasetimer */
    setFase(duurMinuten) {
        this._duurSec = duurMinuten * 60;
        this._secFase = 0;
        this._alarm   = false;
    }

    start() {
        if (this._running) return;
        this._running = true;
        this._interval = setInterval(() => this._tick(), 1000);
    }

    pause() {
        this._running = false;
        clearInterval(this._interval);
        this._interval = null;
    }

    stop() {
        this.pause();
        this._secFase = 0;
        this._alarm   = false;
    }

    reset() {
        this.stop();
        this._secTotaal = 0;
    }

    get running()    { return this._running; }
    get secFase()    { return this._secFase; }
    get secTotaal()  { return this._secTotaal; }
    get duurSec()    { return this._duurSec; }
    get resterend()  { return Math.max(0, this._duurSec - this._secFase); }
    get voortgang()  { return this._duurSec > 0 ? Math.min(this._secFase / this._duurSec, 1) : 0; }
    get isAlarm()    { return this._alarm; }

    // ── PRIVÉ ──────────────────────────────────────────────

    _tick() {
        this._secFase++;
        this._secTotaal++;

        // Alarm als fase voorbij is
        if (!this._alarm && this._secFase >= this._duurSec) {
            this._alarm = true;
            this.onAlarm();
        }

        // Complete als laatste seconde
        if (this._secFase >= this._duurSec) {
            this.onComplete();
        }

        this.onTick({
            secFase:   this._secFase,
            secTotaal: this._secTotaal,
            resterend: this.resterend,
            voortgang: this.voortgang,
            alarm:     this._alarm,
        });
    }

    // ── STATISCHE HELPERS ──────────────────────────────────

    static formatTijd(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
}

// ============================================================
//  sidebar.js — Lesvoortgang zijbalk met leerdoel indicator
// ============================================================

const LesZijbalk = {

    fasen: [
        { id: 'bughunt',      nr: '01', emoji: '🎮', titel: 'Bug Hunt',                   tijd: '0–5',     bloom: 'begrijpen',  kleur: '#4facfe' },
        { id: 'lesoverzicht', nr: '02', emoji: '🗺️', titel: 'Lesoverzicht & Leerdoelen',   tijd: '5–8',     bloom: 'begrijpen',  kleur: '#00c07a' },
        { id: 'theorie',      nr: '03', emoji: '📖', titel: 'Theorie',                    tijd: '8–16',    bloom: 'begrijpen',  kleur: '#4facfe' },
        { id: 'schrijven',    nr: '04', emoji: '✍️', titel: 'Opdracht 1: AC schrijven',   tijd: '16–25',   bloom: 'toepassen',  kleur: '#a78bfa' },
        { id: 'testen',       nr: '05', emoji: '🧮', titel: 'Opdracht 2: AC testen',      tijd: '25–35',   bloom: 'toepassen',  kleur: '#fbbf24' },
        { id: 'vergelijk',    nr: '06', emoji: '⚖️', titel: 'Nabespreking',               tijd: '35–43',   bloom: 'analyseren', kleur: '#ff6b35' },
        { id: 'exit',         nr: '07', emoji: '🏷️', titel: 'Afsluiting',                tijd: '43–45',   bloom: null,         kleur: '#00c07a' },
    ],

    bloomKleuren: {
        'begrijpen':  { kleur: '#4facfe', bg: 'rgba(79,172,254,0.12)'  },
        'toepassen':  { kleur: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
        'analyseren': { kleur: '#ff6b35', bg: 'rgba(255,107,53,0.12)'  },
    },

    init(actiefId) {
        this._actiefId = actiefId;
        this._injectCSS();
        this._render();
    },

    _render() {
        const actiefIdx = this.fasen.findIndex(f => f.id === this._actiefId);
        const actiefFase = this.fasen[actiefIdx];

        const sidebar = document.createElement('div');
        sidebar.className = 'les-sidebar';
        sidebar.id = 'les-sidebar';

        // Header met timer
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <span class="sidebar-label">LES</span>
                <div class="sidebar-timer" id="sidebar-timer">00:00</div>
            </div>`;

        // Actief leerdoel badge bovenaan — alleen als er een bloom is
        if (actiefFase && actiefFase.bloom) {
            const bk = this.bloomKleuren[actiefFase.bloom];
            sidebar.innerHTML += `
                <div class="sidebar-bloom-badge" style="--bloom-kleur:${bk.kleur};--bloom-bg:${bk.bg};">
                    <span class="sidebar-bloom-label">Leerdoel</span>
                    <span class="sidebar-bloom-naam">${actiefFase.bloom.toUpperCase()}</span>
                </div>`;
        }

        // Fasen lijst
        this.fasen.forEach((fase, idx) => {
            const isActief   = fase.id === this._actiefId;
            const isGedaan   = idx < actiefIdx;
            const isToekomst = idx > actiefIdx;

            const item = document.createElement('div');
            item.className = `sidebar-item${isActief ? ' actief' : ''}${isGedaan ? ' gedaan' : ''}${isToekomst ? ' toekomst' : ''}`;
            item.style.setProperty('--item-kleur', fase.kleur);

            // Bloom badge naast de titel als actief
            const bloomHtml = isActief && fase.bloom
                ? `<span class="sidebar-item-bloom" style="color:${this.bloomKleuren[fase.bloom].kleur};background:${this.bloomKleuren[fase.bloom].bg};">${fase.bloom}</span>`
                : '';

            item.innerHTML = `
                <div class="sidebar-nr">${isGedaan ? '✓' : fase.nr}</div>
                <div class="sidebar-info">
                    <div class="sidebar-titel">${fase.emoji} ${fase.titel}</div>
                    ${bloomHtml}
                    <div class="sidebar-tijd">${fase.tijd} min</div>
                </div>`;

            sidebar.appendChild(item);
        });

        // Leerdoelen onderaan sidebar
        sidebar.innerHTML += `
            <div class="sidebar-leerdoelen">
                <div class="sidebar-ld-titel">LEERDOELEN</div>
                <div class="sidebar-ld-item blauw">
                    <span class="sidebar-ld-bloom">BEGRIJPEN</span>
                    <span class="sidebar-ld-tekst">Je legt uit wat acceptatiecriteria zijn en wat hun functie is bij een user story.</span>
                </div>
                <div class="sidebar-ld-item goud">
                    <span class="sidebar-ld-bloom">TOEPASSEN</span>
                    <span class="sidebar-ld-tekst">Je schrijft acceptatiecriteria in het Als/Dan-format.</span>
                </div>
                <div class="sidebar-ld-item oranje">
                    <span class="sidebar-ld-bloom">ANALYSEREN</span>
                    <span class="sidebar-ld-tekst">Je beoordeelt of een criterium concreet, meetbaar en testbaar is.</span>
                </div>
            </div>`;

        document.body.prepend(sidebar);

        // Pas body padding aan voor sidebar en top-balk
        document.body.style.paddingLeft = 'calc(220px + 32px)';
        // Voeg extra padding-top toe als top-balk aanwezig is
        const topBalk = document.querySelector('.top-balk');
        if (topBalk && !document.body.style.paddingTop) {
            document.body.style.paddingTop = '80px';
        }

        // ── PERSISTENTE LES TIMER ─────────────────────────
        (function() {
            const TOTAAL  = 45 * 60;
            const SLEUTEL = 'les_timer_start';
            const el      = document.getElementById('sidebar-timer');
            if (!el) return;

            if (!localStorage.getItem(SLEUTEL)) {
                localStorage.setItem(SLEUTEL, Date.now());
            }

            function update() {
                const start    = parseInt(localStorage.getItem(SLEUTEL));
                const verlopen = Math.floor((Date.now() - start) / 1000);
                const m = Math.floor(verlopen / 60);
                const s = verlopen % 60;
                el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
                const pct = verlopen / TOTAAL;
                if (pct < 0.6)       el.className = 'sidebar-timer';
                else if (pct < 0.85) el.className = 'sidebar-timer oranje';
                else                 el.className = 'sidebar-timer rood';
            }
            update();
            setInterval(update, 1000);
        })();
    },

    _injectCSS() {
        const style = document.createElement('style');
        style.textContent = `
            .les-sidebar {
                position: fixed;
                top: 0; left: 0; bottom: 0;
                width: 220px;
                background: #0d0f16;
                border-right: 1px solid #1e2330;
                display: flex;
                flex-direction: column;
                z-index: 150;
                overflow-y: auto;
                overflow-x: hidden;
            }

            .sidebar-header {
                padding: 16px 18px 10px;
                border-bottom: 1px solid #1e2330;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .sidebar-label {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.65rem;
                font-weight: 700;
                letter-spacing: 4px;
                color: #5a6278;
            }

            .sidebar-timer {
                font-family: 'JetBrains Mono', monospace;
                font-size: 1rem;
                font-weight: 700;
                color: #00c07a;
                letter-spacing: 1px;
                transition: color 0.5s;
            }
            .sidebar-timer.oranje { color: #fbbf24; }
            .sidebar-timer.rood   { color: #ff4757; animation: sb-pulse 1s ease infinite alternate; }
            @keyframes sb-pulse   { from { opacity:1; } to { opacity:0.4; } }

            /* Actief leerdoel badge */
            .sidebar-bloom-badge {
                margin: 10px 12px;
                padding: 10px 14px;
                border-radius: 10px;
                background: var(--bloom-bg);
                border: 1px solid var(--bloom-kleur);
                flex-shrink: 0;
            }

            .sidebar-bloom-label {
                display: block;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.6rem;
                letter-spacing: 2px;
                color: #5a6278;
                margin-bottom: 4px;
            }

            .sidebar-bloom-naam {
                display: block;
                font-family: 'Syne', sans-serif;
                font-size: 0.9rem;
                font-weight: 800;
                color: var(--bloom-kleur);
                letter-spacing: 1px;
            }

            /* Fase items */
            .sidebar-item {
                display: flex;
                align-items: flex-start;
                gap: 10px;
                padding: 11px 14px;
                border-left: 3px solid transparent;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .sidebar-item.actief {
                border-left-color: var(--item-kleur);
                background: rgba(255,255,255,0.04);
            }

            .sidebar-item.gedaan  { opacity: 0.38; }
            .sidebar-item.toekomst { opacity: 0.28; }

            .sidebar-item.actief::before {
                content: '';
                position: absolute;
                left: 0;
                width: 3px;
                height: 100%;
                background: var(--item-kleur);
                animation: sidebar-puls 2s ease-in-out infinite;
            }

            @keyframes sidebar-puls {
                0%, 100% { opacity: 1; }
                50%       { opacity: 0.4; }
            }

            .sidebar-nr {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.7rem;
                font-weight: 700;
                color: var(--item-kleur, #5a6278);
                min-width: 22px;
                margin-top: 3px;
                flex-shrink: 0;
            }

            .sidebar-item.gedaan .sidebar-nr { color: #5a6278; }

            .sidebar-info { flex: 1; min-width: 0; }

            .sidebar-titel {
                font-family: 'Syne', sans-serif;
                font-size: 0.82rem;
                font-weight: 700;
                color: #eef0f6;
                line-height: 1.3;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .sidebar-item.actief .sidebar-titel { color: var(--item-kleur); }
            .sidebar-item.toekomst .sidebar-titel { color: #5a6278; }

            /* Bloom badge naast titel */
            .sidebar-item-bloom {
                display: inline-block;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.6rem;
                font-weight: 700;
                letter-spacing: 1px;
                padding: 2px 8px;
                border-radius: 10px;
                margin-top: 4px;
            }

            .sidebar-tijd {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.6rem;
                color: #5a6278;
                margin-top: 3px;
            }

            /* Leerdoelen blok onderaan */
            .sidebar-leerdoelen {
                margin: 12px 10px 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .sidebar-ld-titel {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.62rem;
                font-weight: 700;
                letter-spacing: 3px;
                color: #3a4258;
                padding: 0 4px;
                margin-bottom: 2px;
            }
            .sidebar-ld-item {
                padding: 8px 12px;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .sidebar-ld-item.blauw  { background: rgba(79,172,254,0.07);  border-left: 3px solid #4facfe; }
            .sidebar-ld-item.goud   { background: rgba(251,191,36,0.07);  border-left: 3px solid #fbbf24; }
            .sidebar-ld-item.oranje { background: rgba(255,107,53,0.07);  border-left: 3px solid #ff6b35; }
            .sidebar-ld-bloom {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.6rem;
                font-weight: 700;
                letter-spacing: 2px;
            }
            .sidebar-ld-item.blauw  .sidebar-ld-bloom { color: #4facfe; }
            .sidebar-ld-item.goud   .sidebar-ld-bloom { color: #fbbf24; }
            .sidebar-ld-item.oranje .sidebar-ld-bloom { color: #ff6b35; }
            .sidebar-ld-tekst {
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.72rem;
                color: #8892a4;
                line-height: 1.4;
            }
                margin-top: auto;
                padding: 14px 16px;
                border-top: 1px solid #1e2330;
                display: flex;
                flex-direction: column;
                gap: 7px;
                flex-shrink: 0;
            }

            .sidebar-legenda-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.65rem;
                color: #5a6278;
            }

            .sidebar-legenda-item span {
                width: 8px; height: 8px;
                border-radius: 50%;
                display: inline-block;
                flex-shrink: 0;
            }

            /* Top balk en nav-balk starten rechts van sidebar */
            .top-balk { left: 220px !important; z-index: 300 !important; }
            .nav-balk { left: 220px !important; }

            /* Responsive */
            @media (max-width: 1024px) {
                .les-sidebar { width: 180px; }
                .top-balk { left: 180px !important; }
                .nav-balk { left: 180px !important; }
                body { padding-left: calc(180px + 24px) !important; }
            }

            @media (max-width: 768px) {
                .les-sidebar { display: none; }
                .top-balk { left: 0 !important; }
                .nav-balk { left: 0 !important; }
                body { padding-left: 24px !important; }
            }
        `;
        document.head.appendChild(style);
    }
};

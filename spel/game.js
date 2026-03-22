// ============================================================
//  BUG HUNT — Kapotte controls game
//  Doel: studenten ervaren zelf wat er mis gaat zonder testen
// ============================================================

const TILE = 40;

// ---- LEVEL DEFINITIONS ----
// Elk level heeft een eigen "bug" in de controls
const LEVELS = [
    {
        id: 1,
        title: "Level 1",
        // De controls zijn gewoon... omgekeerd
        bugDescription: "De pijltoetsen deden precies het TEGENOVERGESTELDE van wat je verwachtte.",
        bugExplain: "↑ ging naar beneden, ↓ ging naar boven, ← ging rechts, → ging links.\nDat voelde raar, toch? Dit is een klassieke bug.",
        criteria: [
            "De omhoog-toets beweegt de speler omhoog (y neemt af)",
            "De omlaag-toets beweegt de speler omlaag (y neemt toe)",
            "De linker-toets beweegt de speler naar links (x neemt af)",
            "De rechter-toets beweegt de speler naar rechts (x neemt toe)"
        ],
        // controlMap: [originele richting] → [daadwerkelijke beweging]
        controlMap: { up: 'down', down: 'up', left: 'right', right: 'left' },
        hint: "Hmm... dat voelt raar? 🤔",
        hintDelay: 6000,
        map: [
            "###########",
            "#P        #",
            "#  #####  #",
            "#  #   #  #",
            "#  # # #  #",
            "#    #    #",
            "#  #####  #",
            "#         #",
            "#########E#",
        ]
    },
    {
        id: 2,
        title: "Level 2",
        bugDescription: "Links en rechts waren verwisseld — maar boven en onder werkten normaal.",
        bugExplain: "↑ en ↓ werkten correct.\nMaar ← ging naar rechts en → ging naar links.\nEen gedeeltelijke bug is soms moeilijker te vinden!",
        criteria: [
            "Elke toets beweegt de speler in precies één richting",
            "De richting van een toets verandert niet tussendoor",
            "Het gedrag is consistent op elk moment in het spel",
            "Links en rechts zijn niet verwisseld"
        ],
        controlMap: { up: 'up', down: 'down', left: 'right', right: 'left' },
        hint: "Boven/onder werkt wel... maar links/rechts? 🤨",
        hintDelay: 8000,
        map: [
            "#########E#",
            "#         #",
            "# ####### #",
            "# #     # #",
            "# # ### # #",
            "# # # # # #",
            "# #   # # #",
            "#   ###   #",
            "#P        #",
        ]
    },
    {
        id: 3,
        title: "Level 3",
        bugDescription: "Na elke 3 stappen roteerden de controls 90 graden.",
        bugExplain: "Stap 1-3: normaal.\nStap 4-6: ↑=rechts, →=neer, ↓=links, ←=omhoog.\nStap 7-9: normaal. Enzovoort...\nEen bug die zichzelf verstopt — de moeilijkste soort!",
        criteria: [
            "Het gedrag van de controls verandert nooit tijdens het spel",
            "De speler kan op elk moment voorspellen wat een toets doet",
            "Controls zijn niet afhankelijk van het aantal stappen",
            "Er is geen verborgen 'state' die het gedrag beïnvloedt"
        ],
        controlMap: 'rotating', // special case
        hint: "Wacht... werkte het net nog anders? 😵",
        hintDelay: 10000,
        map: [
            "#P#########",
            "# #       #",
            "#   #####E#",
            "##### #   #",
            "#     # # #",
            "# ### # # #",
            "# #   # # #",
            "# # ### # #",
            "#         #",
        ]
    }
];

// ---- ROTATING CONTROL MAPS ----
const ROTATE_MAPS = [
    { up: 'up',    down: 'down',  left: 'left',  right: 'right' }, // normaal
    { up: 'right', down: 'left',  left: 'up',    right: 'down'  }, // gedraaid
];

// ---- DIRECTION VECTORS ----
const DIR = {
    up:    { x: 0, y: -1 },
    down:  { x: 0, y:  1 },
    left:  { x: -1, y: 0 },
    right: { x: 1, y:  0 },
};

// ---- GAME STATE ----
let state = {
    levelIndex: 0,
    moves: 0,
    seconds: 0,
    timerRef: null,
    hintRef: null,
    player: { x: 0, y: 0 },
    exit: { x: 0, y: 0 },
    grid: [],
    canvas: null,
    ctx: null,
    cols: 0,
    rows: 0,
    gameActive: false,
};

// ---- INIT ----
window.addEventListener('DOMContentLoaded', () => {
    state.canvas = document.getElementById('gameCanvas');
    state.ctx = state.canvas.getContext('2d');

    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-next').addEventListener('click', nextLevel);
    document.getElementById('btn-restart').addEventListener('click', restartLevel);
    document.getElementById('btn-class').addEventListener('click', goToNextRevealOrDone);
    document.getElementById('btn-home').addEventListener('click', goHome);

    window.addEventListener('keydown', handleKey);
});

function startGame() {
    state.levelIndex = 0;
    showScreen('screen-game');
    loadLevel(state.levelIndex);
}

function loadLevel(idx) {
    const level = LEVELS[idx];
    state.moves = 0;
    state.seconds = 0;
    state.gameActive = true;

    // Parse map
    const rows = level.map;
    state.rows = rows.length;
    state.cols = rows[0].length;
    state.grid = [];

    for (let r = 0; r < state.rows; r++) {
        state.grid[r] = [];
        for (let c = 0; c < state.cols; c++) {
            const ch = rows[r][c];
            state.grid[r][c] = ch === '#' ? 'wall' : 'floor';
            if (ch === 'P') { state.player = { x: c, y: r }; }
            if (ch === 'E') { state.exit = { x: c, y: r }; }
        }
    }

    // Resize canvas
    const maxW = Math.min(window.innerWidth - 40, 700);
    const scale = Math.floor(maxW / (state.cols * TILE));
    const tileSize = Math.max(TILE * scale, 28);
    state.tileSize = tileSize;
    state.canvas.width = state.cols * tileSize;
    state.canvas.height = state.rows * tileSize;

    // HUD
    document.getElementById('level-display').textContent = level.id;
    updateHUD();

    // Timer
    clearInterval(state.timerRef);
    state.timerRef = setInterval(() => {
        state.seconds++;
        updateHUD();
    }, 1000);

    // Hint
    clearTimeout(state.hintRef);
    const hint = document.getElementById('control-hint');
    hint.textContent = level.hint;
    hint.classList.remove('visible');
    state.hintRef = setTimeout(() => {
        hint.classList.add('visible');
        setTimeout(() => hint.classList.remove('visible'), 4000);
    }, level.hintDelay);

    draw();
}

// ---- INPUT ----
function handleKey(e) {
    if (!state.gameActive) return;

    const keyMap = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
    };

    const intended = keyMap[e.key];
    if (!intended) return;
    e.preventDefault();

    const level = LEVELS[state.levelIndex];
    let actual;

    if (level.controlMap === 'rotating') {
        const rotatePhase = Math.floor(state.moves / 3) % 2;
        actual = ROTATE_MAPS[rotatePhase][intended];
    } else {
        actual = level.controlMap[intended];
    }

    const delta = DIR[actual];
    const nx = state.player.x + delta.x;
    const ny = state.player.y + delta.y;

    // Bounds + wall check
    if (ny < 0 || ny >= state.rows || nx < 0 || nx >= state.cols) return;
    if (state.grid[ny][nx] === 'wall') return;

    state.player.x = nx;
    state.player.y = ny;
    state.moves++;
    updateHUD();
    draw();

    // Check win
    if (nx === state.exit.x && ny === state.exit.y) {
        winLevel();
    }
}

// ---- WIN ----
function winLevel() {
    clearInterval(state.timerRef);
    clearTimeout(state.hintRef);
    state.gameActive = false;

    const level = LEVELS[state.levelIndex];

    document.getElementById('final-moves').textContent = state.moves;
    document.getElementById('final-time').textContent = state.seconds + 's';

    const messages = [
        "Dat voelde raar, toch? Er klopte iets niet met de controls... maar wat precies?",
        "Je hebt het gehaald! Maar viel je op dat links en rechts verwisseld waren?",
        "Gefeliciteerd! Maar merkte je dat de controls soms anders reageerden dan verwacht?"
    ];
    document.getElementById('win-message').textContent = messages[state.levelIndex];

    const nextBtn = document.getElementById('btn-next');
    if (state.levelIndex < LEVELS.length - 1) {
        nextBtn.textContent = 'VOLGENDE LEVEL ▶';
        nextBtn.style.display = '';
    } else {
        nextBtn.textContent = 'WAT GING ER MIS? ▶';
        nextBtn.style.display = '';
    }

    showScreen('screen-win');
}

// ---- NEXT LEVEL ----
function nextLevel() {
    if (state.levelIndex < LEVELS.length - 1) {
        state.levelIndex++;
        showScreen('screen-game');
        loadLevel(state.levelIndex);
    } else {
        showReveal(0);
    }
}

// ---- REVEAL ----
let revealIndex = 0;

function showReveal(idx) {
    revealIndex = idx;
    const level = LEVELS[idx];

    document.getElementById('reveal-content').innerHTML =
        `<strong style="color:var(--accent2)">Level ${level.id} bug:</strong><br><br>${level.bugExplain.replace(/\n/g, '<br>')}`;

    const ul = document.getElementById('criteria-list');
    ul.innerHTML = '';
    level.criteria.forEach(c => {
        const li = document.createElement('li');
        li.textContent = c;
        ul.appendChild(li);
    });

    const btn = document.getElementById('btn-class');
    if (revealIndex < LEVELS.length - 1) {
        btn.textContent = 'VOLGENDE BUG ▶';
    } else {
        btn.textContent = 'AFRONDEN ▶';
    }

    showScreen('screen-reveal');
}

function goToNextRevealOrDone() {
    if (revealIndex < LEVELS.length - 1) {
        showReveal(revealIndex + 1);
    } else {
        showScreen('screen-done');
    }
}

function restartLevel() {
    showScreen('screen-game');
    loadLevel(state.levelIndex);
}

function goHome() {
    showScreen('screen-start');
}

// ---- HUD ----
function updateHUD() {
    document.getElementById('moves').textContent = state.moves;
    document.getElementById('timer').textContent = state.seconds;
}

// ---- DRAW ----
function draw() {
    const ctx = state.ctx;
    const T = state.tileSize;
    const { cols, rows, grid, player, exit } = state;

    ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);

    // Background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = c * T;
            const y = r * T;
            const cell = grid[r][c];

            if (cell === 'wall') {
                // Wall
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(x, y, T, T);
                ctx.strokeStyle = '#2a2a4a';
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 0.5, y + 0.5, T - 1, T - 1);
                // Pixel detail
                ctx.fillStyle = '#2a2a4e';
                ctx.fillRect(x + 2, y + 2, 4, 4);
                ctx.fillRect(x + T - 6, y + T - 6, 4, 4);
            } else {
                // Floor
                ctx.fillStyle = '#0d0d18';
                ctx.fillRect(x, y, T, T);
                // subtle grid
                ctx.strokeStyle = 'rgba(42,42,58,0.5)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, T, T);
            }

            // Exit
            if (c === exit.x && r === exit.y) {
                // Glow
                const grd = ctx.createRadialGradient(
                    x + T/2, y + T/2, 2,
                    x + T/2, y + T/2, T * 0.8
                );
                grd.addColorStop(0, 'rgba(0,255,136,0.4)');
                grd.addColorStop(1, 'rgba(0,255,136,0)');
                ctx.fillStyle = grd;
                ctx.fillRect(x, y, T, T);

                ctx.font = `${T * 0.6}px serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🚪', x + T/2, y + T/2);
            }
        }
    }

    // Player
    const px = player.x * T;
    const py = player.y * T;

    // Player glow
    const pgrd = ctx.createRadialGradient(
        px + T/2, py + T/2, 2,
        px + T/2, py + T/2, T
    );
    pgrd.addColorStop(0, 'rgba(0,255,136,0.3)');
    pgrd.addColorStop(1, 'rgba(0,255,136,0)');
    ctx.fillStyle = pgrd;
    ctx.fillRect(px - T/2, py - T/2, T*2, T*2);

    ctx.font = `${T * 0.7}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐛', px + T/2, py + T/2);
}

// ---- SCREEN MANAGER ----
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

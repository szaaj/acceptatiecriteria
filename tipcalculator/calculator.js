// ============================================================
//  TipSplit — Calculator met bewuste bugs voor testoefening
//
//  BUG OVERZICHT (voor de docent):
//
//  BUG 1 — Rekenkundige bug (subtiel):
//    Fooi wordt berekend OVER het totaal inclusief fooi
//    in plaats van over het originele bedrag.
//    Voorbeeld: €100 + 10% fooi = €110 ipv €110 ✓
//    Maar: de fooi-berekening gebruikt (amount * tip / (1 - tip/100))
//    Dit geeft bij 10%: €100 * 0.1 / 0.9 = €11.11 ipv €10.00
//    → Groep A (functionaliteit) zal dit ontdekken
//
//  BUG 2 — Randgeval bug:
//    Bij 0 personen deelt het programma door nul → toont "Infinity"
//    of NaN in plaats van een foutmelding.
//    → Groep B (randgevallen) zal dit ontdekken
//
//  BUG 3 — UI/UX bug:
//    De "Anders" knop toont het custom-invoerveld,
//    maar als je daarna een andere % kiest,
//    verdwijnt het veld NIET — het staat er nog steeds.
//    → Groep B (UX) zal dit opmerken
//
//  BUG 4 — Logische bug (voor discussie):
//    Bij negatief bedrag (bv. -10) rekent het gewoon door
//    en toont een negatief resultaat zonder foutmelding.
//    → Beide groepen kunnen dit ontdekken afhankelijk van criteria
// ============================================================

// ---- STATE ----
let selectedTip = 10;
let peopleCount = 2;
let isCustomTip = false;

// ---- DOM REFS ----
const inputAmount    = document.getElementById('input-amount');
const inputCustomTip = document.getElementById('input-custom-tip');
const customTipRow   = document.getElementById('custom-tip-row');
const peopleDisplay  = document.getElementById('people-count');
const btnMinus       = document.getElementById('btn-minus');
const btnPlus        = document.getElementById('btn-plus');
const btnCalculate   = document.getElementById('btn-calculate');
const btnReset       = document.getElementById('btn-reset');
const resultCard     = document.getElementById('result-card');

// ---- TIP BUTTONS ----
document.querySelectorAll('.tip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (btn.dataset.tip === 'custom') {
            isCustomTip = true;
            // BUG 3: customTipRow wordt getoond maar bij wisselen naar andere knop
            // wordt het hieronder NIET verborgen — zie ontbrekende reset hieronder
            customTipRow.style.display = 'flex';
        } else {
            isCustomTip = false;
            selectedTip = parseInt(btn.dataset.tip);
            // BUG 3: de volgende regel ontbreekt → customTipRow blijft zichtbaar
            // customTipRow.style.display = 'none';
        }
    });
});

// ---- PEOPLE COUNTER ----
btnMinus.addEventListener('click', () => {
    if (peopleCount > 0) {
        peopleCount--;
        // BUG 2: minimum is 0, niet 1 — bij 0 personen wordt er gedeeld door nul
        peopleDisplay.textContent = peopleCount;
    }
});

btnPlus.addEventListener('click', () => {
    if (peopleCount < 20) {
        peopleCount++;
        peopleDisplay.textContent = peopleCount;
    }
});

// ---- CALCULATE ----
btnCalculate.addEventListener('click', () => {
    const amountRaw = parseFloat(inputAmount.value);

    // Validatie — bedrag
    if (isNaN(amountRaw) || inputAmount.value === '') {
        showError(inputAmount.closest('.input-row'), 'Voer een geldig bedrag in');
        return;
    }

    // BUG 4: negatieve bedragen worden niet afgevangen
    // Correcte code zou zijn:
    // if (amountRaw < 0) { showError(...); return; }

    clearErrors();

    // Bepaal fooi %
    let tipPct = selectedTip;
    if (isCustomTip) {
        tipPct = parseFloat(inputCustomTip.value) || 0;
    }

    // BUG 1: Fooi berekening is incorrect
    // Correct: tipAmount = amountRaw * (tipPct / 100)
    // Fout: tipAmount wordt berekend alsof het percentage over het totaal gaat
    const tipAmount = amountRaw * tipPct / (100 - tipPct) * 100 / 100;
    // Dit geeft bij €100 + 10%: 100 * 10 / 90 = €11.11 in plaats van €10.00

    const total = amountRaw + tipAmount;

    // BUG 2: Geen controle op peopleCount === 0 → deelt door nul
    const perPerson = total / peopleCount;
    // Bij peopleCount = 0: toont Infinity

    // Toon resultaat
    document.getElementById('res-bill').textContent       = formatEuro(amountRaw);
    document.getElementById('res-tip-pct').textContent    = tipPct;
    document.getElementById('res-tip').textContent        = formatEuro(tipAmount);
    document.getElementById('res-total').textContent      = formatEuro(total);
    document.getElementById('res-per-person').textContent = formatEuro(perPerson);

    // Notitie
    const note = document.getElementById('result-note');
    if (peopleCount === 1) {
        note.textContent = 'Je betaalt alles zelf 😅';
    } else {
        note.textContent = `Verdeeld over ${peopleCount} personen`;
    }

    resultCard.style.display = 'flex';
    btnReset.style.display = 'block';

    // Scroll naar resultaat
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

// ---- RESET ----
btnReset.addEventListener('click', () => {
    inputAmount.value = '';
    inputCustomTip.value = '';
    peopleCount = 2;
    selectedTip = 10;
    isCustomTip = false;
    peopleDisplay.textContent = peopleCount;

    document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tip="10"]').classList.add('active');
    customTipRow.style.display = 'none';

    resultCard.style.display = 'none';
    btnReset.style.display = 'none';
    clearErrors();
});

// ---- HELPERS ----
function formatEuro(value) {
    if (!isFinite(value)) return '∞ (fout!)';
    if (isNaN(value)) return 'fout';
    return '€' + value.toFixed(2);
}

function showError(element, message) {
    element.classList.add('error');
    const existing = element.parentNode.querySelector('.error-msg');
    if (!existing) {
        const msg = document.createElement('p');
        msg.className = 'error-msg';
        msg.textContent = message;
        element.parentNode.insertBefore(msg, element.nextSibling);
    }
}

function clearErrors() {
    document.querySelectorAll('.input-row.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-msg').forEach(el => el.remove());
}

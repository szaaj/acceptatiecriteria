// ============================================================
//  main.js — Initialisatie
//  Start de applicatie zodra de DOM geladen is
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const schema = new LesSchema(LesConfig);
    schema.init();
});

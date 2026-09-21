// Tema chiaro / scuro / automatico.
// La scelta si ricorda sul dispositivo (localStorage) e si applica con l'attributo data-theme su <html>;
// i colori veri stanno in index.css.

const CHIAVE = 'tema';
export const TEMI = ['auto', 'chiaro', 'scuro'];

export function temaSalvato() {
    try {
        const t = localStorage.getItem(CHIAVE);
        return TEMI.includes(t) ? t : 'auto';
    } catch {
        return 'auto'; // localStorage può non essere disponibile (navigazione privata...)
    }
}

const sistemaScuro = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

export function applicaTema(tema) {
    const scuro = tema === 'scuro' || (tema === 'auto' && sistemaScuro());
    document.documentElement.dataset.theme = scuro ? 'dark' : 'light';
}

// Salva la scelta e la applica subito
export function impostaTema(tema) {
    try { localStorage.setItem(CHIAVE, tema); } catch { /* si applica lo stesso, ma non si ricorda */ }
    applicaTema(tema);
}

// Da chiamare all'avvio: applica il tema salvato e, in modalità automatica, segue il cambio del sistema
export function avviaTema() {
    applicaTema(temaSalvato());
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
        if (temaSalvato() === 'auto') applicaTema('auto');
    });
}

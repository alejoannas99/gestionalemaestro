// Servizi Open-Meteo (gratuiti, senza chiave; per uso non commerciale).
// Si chiamano direttamente dal browser: non passano dal nostro backend.

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Cerca una località per nome e restituisce fino a 5 risultati con le coordinate.
// "Sestriere" -> [{ name: 'Sestriere, Piemonte, Italia', latitude: 44.96, longitude: 6.88 }, ...]
export async function cercaLocalita(testo) {
    const q = testo.trim();
    if (q.length < 2) return [];
    const res = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=5&language=it&format=json`);
    if (!res.ok) throw new Error('Ricerca non disponibile');
    const data = await res.json();
    return (data.results || []).map(r => ({
        // nome + regione + paese, senza ripetizioni e senza campi vuoti
        name: [r.name, r.admin1, r.country].filter((v, i, a) => v && a.indexOf(v) === i).join(', '),
        latitude: r.latitude,
        longitude: r.longitude,
    }));
}

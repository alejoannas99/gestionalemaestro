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

// ── Previsioni ───────────────────────────────────────────────────────────────
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const DURATA_CACHE_MS = 15 * 60 * 1000;
const cache = new Map(); // "44.96,6.88" -> { ts, promessa }

// Scarica (o riusa dalla memoria) le previsioni di una località: adesso, giorni e ore, fino a 16 giorni.
export function getPrevisioni(latitude, longitude) {
    const chiave = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const salvata = cache.get(chiave);
    if (salvata && Date.now() - salvata.ts < DURATA_CACHE_MS) return salvata.promessa;

    const url = `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}`
        + '&current=temperature_2m,weather_code,wind_speed_10m'
        + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
        + '&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m'
        + '&timezone=auto&forecast_days=16';
    const promessa = fetch(url).then(res => {
        if (!res.ok) throw new Error('Meteo non disponibile');
        return res.json();
    });
    cache.set(chiave, { ts: Date.now(), promessa });
    promessa.catch(() => cache.delete(chiave)); // un errore non deve restare in memoria
    return promessa;
}

// Codici meteo WMO (quelli usati da Open-Meteo) -> icona e descrizione
export function descriviCodice(codice) {
    if (codice === 0) return { icona: '☀️', testo: 'Sereno' };
    if (codice === 1) return { icona: '🌤️', testo: 'Quasi sereno' };
    if (codice === 2) return { icona: '⛅', testo: 'Parzialmente nuvoloso' };
    if (codice === 3) return { icona: '☁️', testo: 'Coperto' };
    if (codice === 45 || codice === 48) return { icona: '🌫️', testo: 'Nebbia' };
    if (codice >= 51 && codice <= 55) return { icona: '🌦️', testo: 'Pioggerella' };
    if (codice === 56 || codice === 57) return { icona: '🌧️', testo: 'Pioggia gelata' };
    if (codice >= 61 && codice <= 65) return { icona: '🌧️', testo: 'Pioggia' };
    if (codice === 66 || codice === 67) return { icona: '🌧️', testo: 'Pioggia gelata' };
    if (codice >= 71 && codice <= 77) return { icona: '🌨️', testo: 'Neve' };
    if (codice >= 80 && codice <= 82) return { icona: '🌦️', testo: 'Rovesci' };
    if (codice === 85 || codice === 86) return { icona: '🌨️', testo: 'Rovesci di neve' };
    if (codice >= 95) return { icona: '⛈️', testo: 'Temporale' };
    return { icona: '❔', testo: 'Non disponibile' };
}

// Le previsioni di un giorno "YYYY-MM-DD": codice, minima, massima, probabilità di pioggia. null se non coperto (oltre 16 giorni o passato).
export function giornoMeteo(previsioni, data) {
    const i = previsioni.daily.time.indexOf(data);
    if (i < 0) return null;
    return {
        codice: previsioni.daily.weather_code[i],
        min: Math.round(previsioni.daily.temperature_2m_min[i]),
        max: Math.round(previsioni.daily.temperature_2m_max[i]),
        pioggia: previsioni.daily.precipitation_probability_max[i],
    };
}

// Le ore di un giorno "YYYY-MM-DD": [{ ora: '09:00', codice, temperatura, pioggia, vento }]
export function oreMeteo(previsioni, data) {
    const h = previsioni.hourly;
    const ore = [];
    h.time.forEach((t, i) => {
        if (t.startsWith(data)) {
            ore.push({
                ora: t.substring(11, 16),
                codice: h.weather_code[i],
                temperatura: Math.round(h.temperature_2m[i]),
                pioggia: h.precipitation_probability[i],
                vento: Math.round(h.wind_speed_10m[i]),
            });
        }
    });
    return ore;
}

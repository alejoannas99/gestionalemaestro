import { useState, useEffect } from 'react';
import { getPrevisioni } from '../services/meteo';

// Scarica le previsioni di una località { latitude, longitude } (null = nessuna località).
// Restituisce { dati, errore }: dati è null finché non arrivano.
export default function usePrevisioni(localita) {
    const lat = localita?.latitude ?? null;
    const lon = localita?.longitude ?? null;
    const chiave = lat !== null && lon !== null ? `${lat},${lon}` : null;
    const [stato, setStato] = useState({ chiave: null, dati: null, errore: false });

    useEffect(() => {
        if (chiave === null) return;
        let annullato = false;
        getPrevisioni(lat, lon)
            .then(dati => { if (!annullato) setStato({ chiave, dati, errore: false }); })
            .catch(() => { if (!annullato) setStato({ chiave, dati: null, errore: true }); });
        return () => { annullato = true; };
    }, [chiave, lat, lon]);

    // Se la località è cambiata, i dati in memoria sono di un altro posto: non si mostrano
    return stato.chiave === chiave ? stato : { dati: null, errore: false };
}

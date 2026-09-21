import { useState } from 'react';
import { cercaLocalita } from '../services/meteo';

// Casella di ricerca di una località: si scrive, si preme Cerca e si sceglie dai risultati.
// onSeleziona riceve { name, latitude, longitude }.
export default function SelettoreLocalita({ onSeleziona }) {
    const [testo, setTesto] = useState('');
    const [risultati, setRisultati] = useState([]);
    const [errore, setErrore] = useState('');
    const [cercando, setCercando] = useState(false);

    const cerca = async (e) => {
        e.preventDefault();
        setErrore('');
        setCercando(true);
        try {
            const trovati = await cercaLocalita(testo);
            setRisultati(trovati);
            if (trovati.length === 0) setErrore('Nessuna località trovata');
        } catch {
            setErrore('Ricerca non disponibile, riprova');
        }
        setCercando(false);
    };

    const scegli = (r) => {
        onSeleziona(r);
        setRisultati([]);
        setTesto('');
    };

    return (
        <div>
            {/* Niente <form>: questo componente sta anche dentro il modale della lezione, che ha già il suo form */}
            <div style={s.riga}>
                <input style={s.input} placeholder="Cerca una località (es. Sestriere)"
                    value={testo} onChange={e => setTesto(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') cerca(e); }} />
                <button style={s.bottone} type="button" onClick={cerca} disabled={cercando || testo.trim().length < 2}>
                    {cercando ? '…' : 'Cerca'}
                </button>
            </div>
            {errore && <p style={s.errore}>{errore}</p>}
            {risultati.map(r => (
                <div key={`${r.latitude},${r.longitude}`} style={s.risultato} onClick={() => scegli(r)}>
                    📍 {r.name}
                </div>
            ))}
        </div>
    );
}

const s = {
    riga: { display: 'flex', gap: '8px' },
    input: { flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', backgroundColor: 'var(--surface)', color: 'var(--text)', outline: 'none' },
    bottone: { padding: '10px 14px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
    errore: { color: 'var(--danger)', fontSize: '13px', margin: '8px 0 0' },
    risultato: { padding: '10px 12px', marginTop: '6px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', color: 'var(--text)', backgroundColor: 'var(--surface)', cursor: 'pointer' },
};

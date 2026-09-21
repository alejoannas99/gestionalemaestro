import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRichieste, approvaRichiesta, rifiutaRichiesta } from '../services/api';

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

// "2026-03-05" -> "mar 2026"
function fmtMese(iso) {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00`);
    return `${MESI[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtOre(n) { return `${(Math.round(n * 10) / 10).toString().replace('.', ',')} h`; }
function periodo(r) {
    if (!r.from) return 'nessuna lezione già fatta';
    const a = fmtMese(r.from);
    const b = fmtMese(r.to);
    return a === b ? a : `${a} – ${b}`;
}

export default function RichiestePage({ onLogout }) {
    const navigate = useNavigate();
    const [richieste, setRichieste] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errore, setErrore] = useState('');

    const carica = () => {
        getRichieste()
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(data => { setRichieste(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { setErrore('Impossibile caricare le richieste'); setLoading(false); });
    };
    useEffect(() => { carica(); }, []);

    const decidi = async (azione, id) => {
        setErrore('');
        try {
            const res = await azione(id);
            if (res.ok) carica();
            else setErrore(await res.text());
        } catch {
            setErrore('Errore di connessione');
        }
    };

    return (
        <div style={s.page}>
            <div style={s.header}>
                <button style={s.indietro} onClick={() => navigate('/dashboard')}>← Dashboard</button>
                <button style={s.logoutBtn} onClick={onLogout}>Esci</button>
            </div>

            <div style={s.content}>
                <h1 style={s.titolo}>Richieste di collegamento</h1>
                <p style={s.sotto}>
                    Persone che si sono registrate e dicono di essere tuoi allievi. Approva solo se le riconosci:
                    potranno vedere le lezioni fatte con te.
                </p>

                {loading && <p style={s.testo}>Caricamento...</p>}
                {errore && <p style={s.errore}>{errore}</p>}
                {!loading && richieste.length === 0 && <p style={s.vuoto}>Nessuna richiesta in attesa.</p>}

                <div style={s.griglia}>
                    {richieste.map(r => (
                        <div key={r.id} style={s.scheda}>
                            <div style={s.nome}>{r.name} {r.surname}</div>
                            <div style={s.dettaglio}>Account: {r.maskedEmail}</div>
                            <div style={s.dettaglio}>
                                {r.lessons} {r.lessons === 1 ? 'lezione' : 'lezioni'} · {fmtOre(r.hours)} insieme · {periodo(r)}
                            </div>
                            <div style={s.bottoni}>
                                <button style={s.approva} onClick={() => decidi(approvaRichiesta, r.id)}>Approva</button>
                                <button style={s.rifiuta} onClick={() => decidi(rifiutaRichiesta, r.id)}>Rifiuta</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const s = {
    page: { minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: "'Segoe UI', sans-serif", textAlign: 'left' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', backgroundColor: 'var(--header-bg)', color: 'white' },
    indietro: { padding: '6px 12px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    logoutBtn: { padding: '6px 14px', backgroundColor: 'rgba(231,76,60,0.8)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    content: { padding: '20px 24px', maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' },
    titolo: { fontSize: '22px', fontWeight: '700', color: 'var(--text)', margin: '0 0 6px' },
    sotto: { fontSize: '14px', color: 'var(--muted)', margin: '0 0 16px' },
    testo: { color: 'var(--muted)', fontSize: '14px' },
    vuoto: { color: 'var(--muted)', fontSize: '14px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px' },
    errore: { color: 'var(--danger)', fontSize: '13px' },
    griglia: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' },
    scheda: { backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '16px', boxShadow: 'var(--shadow)' },
    nome: { fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' },
    dettaglio: { fontSize: '13px', color: 'var(--muted)', marginBottom: '3px' },
    bottoni: { display: 'flex', gap: '10px', marginTop: '12px' },
    approva: { flex: 1, padding: '9px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    rifiuta: { flex: 1, padding: '9px', backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--danger-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImpostazioni, salvaImpostazioni } from '../services/api';
import SelettoreLocalita from '../components/SelettoreLocalita';
import ClientShell from '../components/ClientShell';
import { temaSalvato, impostaTema } from '../theme';

const OPZIONI_TEMA = [
    { valore: 'auto', etichetta: '🖥️ Automatico' },
    { valore: 'chiaro', etichetta: '☀️ Chiaro' },
    { valore: 'scuro', etichetta: '🌙 Scuro' },
];

// home: dove torna il pulsante indietro (dashboard per l'istruttore, /me per il cliente)
export default function ImpostazioniPage({ onLogout, isInstructor, home }) {
    const navigate = useNavigate();
    const [localita, setLocalita] = useState(null); // { name, latitude, longitude } oppure null
    const [fissa, setFissa] = useState(false);
    const [loading, setLoading] = useState(true);
    const [messaggio, setMessaggio] = useState({ tipo: '', testo: '' });
    const [tema, setTema] = useState(temaSalvato);

    const scegliTema = (valore) => {
        impostaTema(valore); // salva sul dispositivo e applica subito
        setTema(valore);
    };

    useEffect(() => {
        getImpostazioni()
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(d => {
                if (d.locationName) setLocalita({ name: d.locationName, latitude: d.latitude, longitude: d.longitude });
                setFissa(d.fixedLocation);
                setLoading(false);
            })
            .catch(() => { setMessaggio({ tipo: 'errore', testo: 'Impossibile caricare le impostazioni' }); setLoading(false); });
    }, []);

    const salva = async () => {
        setMessaggio({ tipo: '', testo: '' });
        try {
            const res = await salvaImpostazioni({
                locationName: localita?.name ?? null,
                latitude: localita?.latitude ?? null,
                longitude: localita?.longitude ?? null,
                fixedLocation: fissa,
            });
            if (res.ok) setMessaggio({ tipo: 'ok', testo: 'Impostazioni salvate' });
            else setMessaggio({ tipo: 'errore', testo: await res.text() });
        } catch {
            setMessaggio({ tipo: 'errore', testo: 'Errore di connessione' });
        }
    };

    const contenuto = (
        <>
                <h1 style={s.titolo}>Impostazioni</h1>

                <div style={s.card}>
                    <div style={s.cardTitolo}>Aspetto</div>
                    <p style={s.aiuto}>“Automatico” segue il tema del telefono o del computer. La scelta vale per questo dispositivo.</p>
                    <div style={s.opzioni}>
                        {OPZIONI_TEMA.map(o => (
                            <button key={o.valore} type="button"
                                style={{ ...s.opzione, ...(tema === o.valore ? s.opzioneOn : {}) }}
                                onClick={() => scegliTema(o.valore)}>
                                {o.etichetta}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && <p style={s.testo}>Caricamento...</p>}

                {!loading && isInstructor && (
                    <div style={s.card}>
                        <div style={s.cardTitolo}>Dove fai lezione</div>
                        <p style={s.aiuto}>
                            Serve per il meteo. Ogni lezione userà questa località, a meno che tu non ne scelga un’altra
                            (se non attivi “località fissa”).
                        </p>

                        <div style={s.attuale}>
                            {localita ? <>📍 {localita.name}</> : <span style={{ color: 'var(--muted)' }}>Nessuna località impostata</span>}
                        </div>

                        <SelettoreLocalita onSeleziona={setLocalita} />

                        <label style={s.checkRiga}>
                            <input type="checkbox" checked={fissa} onChange={e => setFissa(e.target.checked)} />
                            <span>Località fissa: uso sempre questa per tutte le lezioni</span>
                        </label>

                        <button style={s.salva} onClick={salva}>Salva</button>
                        {messaggio.testo && (
                            <p style={messaggio.tipo === 'ok' ? s.ok : s.errore}>{messaggio.testo}</p>
                        )}
                    </div>
                )}

                {!loading && (
                    <div style={s.card}>
                        <div style={s.cardTitolo}>In arrivo</div>
                        <ul style={s.lista}>
                            <li>Notifiche</li>
                            <li>Messaggi con il maestro</li>
                        </ul>
                    </div>
                )}
        </>
    );

    // Il cliente usa la struttura con la navigazione in basso; l'istruttore la sua barra con il pulsante indietro
    if (!isInstructor) return <ClientShell onLogout={onLogout}>{contenuto}</ClientShell>;
    return (
        <div style={s.page}>
            <div style={s.header}>
                <button style={s.indietro} onClick={() => navigate(home)}>← Indietro</button>
                <button style={s.logoutBtn} onClick={onLogout}>Esci</button>
            </div>
            <div style={s.content}>{contenuto}</div>
        </div>
    );
}

const s = {
    page: { minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: "'Segoe UI', sans-serif", textAlign: 'left' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', backgroundColor: 'var(--header-bg)', color: 'white' },
    indietro: { padding: '6px 12px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.85)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    logoutBtn: { padding: '6px 14px', backgroundColor: 'rgba(231,76,60,0.8)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    content: { padding: '20px 24px', maxWidth: '640px', margin: '0 auto', width: '100%', boxSizing: 'border-box' },
    titolo: { fontSize: '22px', fontWeight: '700', color: 'var(--text)', margin: '0 0 16px' },
    testo: { color: 'var(--muted)', fontSize: '14px' },
    card: { backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '16px', marginBottom: '16px', boxShadow: 'var(--shadow)' },
    cardTitolo: { fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' },
    aiuto: { fontSize: '13px', color: 'var(--muted)', margin: '0 0 12px' },
    attuale: { fontSize: '16px', fontWeight: '600', color: 'var(--text)', margin: '0 0 12px' },
    checkRiga: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text)', margin: '14px 0' },
    salva: { padding: '10px 18px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    ok: { color: 'var(--success)', fontSize: '13px', margin: '10px 0 0' },
    errore: { color: 'var(--danger)', fontSize: '13px', margin: '10px 0 0' },
    opzioni: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    opzione: { flex: 1, minWidth: '110px', padding: '10px 12px', backgroundColor: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' },
    opzioneOn: { backgroundColor: 'var(--brand)', color: 'white', borderColor: 'var(--brand)', fontWeight: '600' },
    lista: { margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--muted)', lineHeight: 1.8 },
};

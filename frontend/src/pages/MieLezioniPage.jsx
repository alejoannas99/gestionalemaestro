import { useState, useEffect } from 'react';
import { getMieLezioni, getMioRiepilogo } from '../services/api';

const GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

function oggiISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fmtOra(t) { return t ? t.substring(0, 5) : ''; }
// 6.5 -> "6,5 h", 12 -> "12 h"
function fmtOre(n) { return `${(Math.round(n * 10) / 10).toString().replace('.', ',')} h`; }
function fmtData(iso) {
    // "T00:00" fa interpretare la data come locale (senza, JS la leggerebbe in UTC e potrebbe slittare di giorno)
    const d = new Date(`${iso}T00:00`);
    return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`;
}
// Le date arrivano come "YYYY-MM-DD" e le ore come "HH:mm:ss": si confrontano bene anche come stringhe
function perData(a, b) {
    return (a.date + a.start).localeCompare(b.date + b.start);
}

export default function MieLezioniPage({ onLogout }) {
    const [lezioni, setLezioni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errore, setErrore] = useState('');
    const [riepilogo, setRiepilogo] = useState(null);

    // Il riepilogo è un extra: se fallisce la pagina funziona lo stesso, senza il riquadro
    useEffect(() => {
        getMioRiepilogo()
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(setRiepilogo)
            .catch(() => {});
    }, []);

    useEffect(() => {
        getMieLezioni()
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(data => { setLezioni(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { setErrore('Impossibile caricare le lezioni'); setLoading(false); });
    }, []);

    const oggi = oggiISO();
    const prossime = lezioni.filter(l => l.date >= oggi).sort(perData);
    const passate = lezioni.filter(l => l.date < oggi).sort(perData).reverse();

    return (
        <div style={styles.pagina}>
            <div style={styles.header}>
                <h1 style={styles.titolo}>Le mie lezioni</h1>
                <button style={styles.esci} onClick={onLogout}>Esci</button>
            </div>

            {riepilogo && riepilogo.lessons > 0 && <RiquadroRiepilogo riepilogo={riepilogo} />}

            {loading && <p style={styles.testo}>Caricamento...</p>}
            {errore && <p style={styles.errore}>{errore}</p>}

            {!loading && !errore && lezioni.length === 0 && (
                <p style={styles.vuoto}>
                    Non ci sono lezioni a tuo nome. Il maestro ti collega tramite nome e cognome:
                    controlla che coincidano con quelli con cui sei registrato da lui.
                </p>
            )}

            {prossime.length > 0 && (
                <>
                    <h2 style={styles.sezione}>Prossime</h2>
                    <div style={styles.griglia}>
                        {prossime.map(l => <Scheda key={l.id} lezione={l} />)}
                    </div>
                </>
            )}
            {passate.length > 0 && (
                <>
                    <h2 style={styles.sezione}>Passate</h2>
                    <div style={styles.griglia}>
                        {passate.map(l => <Scheda key={l.id} lezione={l} passata />)}
                    </div>
                </>
            )}
        </div>
    );
}

function RiquadroRiepilogo({ riepilogo }) {
    return (
        <div style={styles.riquadro}>
            <div style={styles.riquadroTitolo}>Lezioni fatte</div>
            <div style={styles.totale}>
                {riepilogo.lessons} {riepilogo.lessons === 1 ? 'lezione' : 'lezioni'} · {fmtOre(riepilogo.hours)}
            </div>
            {riepilogo.perInstructor.map(i => (
                <div key={`${i.instructorName}-${i.instructorSurname}`} style={styles.rigaIstruttore}>
                    <span>{i.instructorName} {i.instructorSurname}</span>
                    <span>{i.lessons} · {fmtOre(i.hours)}</span>
                </div>
            ))}
        </div>
    );
}

function Scheda({ lezione, passata }) {
    return (
        <div style={{ ...styles.scheda, opacity: passata ? 0.6 : 1 }}>
            <div style={styles.data}>{fmtData(lezione.date)}</div>
            <div style={styles.dettaglio}>
                {fmtOra(lezione.start)} – {fmtOra(lezione.finish)} · con {lezione.instructorName} {lezione.instructorSurname}
            </div>
        </div>
    );
}

const styles = {
    pagina: { width: '100%', padding: '16px 24px', minHeight: '100vh', backgroundColor: '#f0f2f5', boxSizing: 'border-box', textAlign: 'left' },
    // Tante colonne quante ne entrano da almeno 280px: 1 sul telefono, 2-3 sul computer
    griglia: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    titolo: { fontSize: '22px', color: '#1a1a2e', margin: 0 },
    esci: { padding: '8px 14px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
    riquadro: { backgroundColor: 'white', borderRadius: '12px', padding: '16px', marginBottom: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    riquadroTitolo: { fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
    totale: { fontSize: '20px', fontWeight: 'bold', color: '#1a1a2e', margin: '4px 0 10px' },
    rigaIstruttore: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#444', padding: '6px 0', borderTop: '1px solid #eee' },
    sezione: { fontSize: '14px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '20px 0 8px' },
    scheda: { backgroundColor: 'white', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    data: { fontSize: '15px', fontWeight: 'bold', color: '#1a1a2e' },
    dettaglio: { fontSize: '13px', color: '#666', marginTop: '4px' },
    testo: { color: '#666', fontSize: '14px' },
    vuoto: { color: '#666', fontSize: '14px', backgroundColor: 'white', padding: '16px', borderRadius: '12px' },
    errore: { color: 'red', fontSize: '13px' },
};

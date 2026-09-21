import { useState, useEffect } from 'react';
import { getMieLezioni, getMioRiepilogo, getIstruttori, getMieRichieste, inviaRichiesta } from '../services/api';
import { IconaMeteo, MeteoOggi, DettaglioMeteo } from '../components/Meteo';
import ClientShell from '../components/ClientShell';

const GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const MESI_BREVI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
const PASSATE_VISIBILI = 5;

const due = (n) => String(n).padStart(2, '0');
function oggiISO() {
    const d = new Date();
    return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;
}
// Adesso come "YYYY-MM-DDTHH:mm:ss" nello stesso formato di data + ora fine della lezione (si confrontano come stringhe)
function adessoISO() {
    const d = new Date();
    return `${oggiISO()}${due(d.getHours())}:${due(d.getMinutes())}:00`;
}
function fmtOra(t) { return t ? t.substring(0, 5) : ''; }
// 6.5 -> "6,5 h", 12 -> "12 h"
function fmtOre(n) { return `${(Math.round(n * 10) / 10).toString().replace('.', ',')} h`; }
// "T00:00" fa interpretare la data come locale (senza, JS la leggerebbe in UTC e potrebbe slittare di giorno)
function dataLocale(iso) { return new Date(`${iso}T00:00`); }
function fmtDataLunga(iso) {
    const d = dataLocale(iso);
    return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`;
}
function giorniA(iso) {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);
    return Math.round((dataLocale(iso) - oggi) / 86400000);
}
function quando(iso) {
    const n = giorniA(iso);
    if (n === 0) return 'Oggi';
    if (n === 1) return 'Domani';
    return n > 1 ? `Tra ${n} giorni` : '';
}
// La lezione finisce dopo (data + ora fine) di adesso? Le date sono "YYYY-MM-DD", le ore "HH:mm:ss".
function inCorso(l, adesso) { return (l.date + 'T' + l.finish) >= adesso; }
function perData(a, b) { return (a.date + a.start).localeCompare(b.date + b.start); }
// La località di una lezione, o null se non è stata indicata
function localitaDi(lezione) {
    return lezione.latitude != null
        ? { name: lezione.locationName, latitude: lezione.latitude, longitude: lezione.longitude }
        : null;
}

export default function MieLezioniPage({ onLogout }) {
    const [lezioni, setLezioni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errore, setErrore] = useState('');
    const [riepilogo, setRiepilogo] = useState(null);
    const [dettaglioMeteo, setDettaglioMeteo] = useState(null); // { localita, data } oppure null
    const [tuttePassate, setTuttePassate] = useState(false);

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
    const adesso = adessoISO();
    const prossime = lezioni.filter(l => inCorso(l, adesso)).sort(perData);
    const passate = lezioni.filter(l => !inCorso(l, adesso)).sort(perData).reverse();
    const prossima = prossime[0] ?? null;
    const altre = prossime.slice(1);
    const passateMostrate = tuttePassate ? passate : passate.slice(0, PASSATE_VISIBILI);

    // Meteo di oggi: dove si svolge la lezione di oggi o, altrimenti, la prossima che ha una località
    const conLuogo = prossime.filter(l => localitaDi(l));
    const lezioneMeteo = conLuogo.find(l => l.date === oggi) || conLuogo[0];
    const localitaOggi = lezioneMeteo ? localitaDi(lezioneMeteo) : null;

    const senzaLezioni = !loading && !errore && lezioni.length === 0;
    const apriMeteo = (localita, data) => setDettaglioMeteo({ localita, data });

    return (
        <ClientShell onLogout={onLogout}>
            <h1 style={s.titolo}>Le mie lezioni</h1>

            {loading && <p style={s.testo}>Caricamento...</p>}
            {errore && <p style={s.errore}>{errore}</p>}

            {senzaLezioni && (
                <div style={s.vuoto}>
                    <div style={s.emoji}>🎿</div>
                    <div style={s.vuotoTitolo}>Non vedi ancora nessuna lezione</div>
                    <p style={s.vuotoTesto}>
                        Se hai già fatto lezione con un istruttore, chiedi il collegamento qui sotto: lo approverà lui
                        e vedrai le tue lezioni.
                    </p>
                </div>
            )}
            {senzaLezioni && <CollegaIstruttore />}

            {!loading && !senzaLezioni && !errore && (
                <>
                    {prossima
                        ? <Prossima lezione={prossima} onMeteo={apriMeteo} />
                        : <div style={s.vuotoPiccolo}>Nessuna lezione in programma. 🌤️</div>}

                    {localitaOggi && (
                        <MeteoOggi localita={localitaOggi} onDettaglio={data => apriMeteo(localitaOggi, data)} />
                    )}

                    {riepilogo && riepilogo.lessons > 0 && <Riepilogo riepilogo={riepilogo} />}

                    {altre.length > 0 && (
                        <>
                            <h2 style={s.sezione}>Prossime lezioni</h2>
                            <div style={s.lista}>
                                {altre.map(l => <Riga key={l.id} lezione={l} onMeteo={apriMeteo} />)}
                            </div>
                        </>
                    )}

                    {passate.length > 0 && (
                        <>
                            <h2 style={s.sezione}>Lezioni passate</h2>
                            <div style={s.lista}>
                                {passateMostrate.map(l => <Riga key={l.id} lezione={l} passata />)}
                            </div>
                            {passate.length > PASSATE_VISIBILI && (
                                <button type="button" style={s.mostraAltre} onClick={() => setTuttePassate(v => !v)}>
                                    {tuttePassate ? 'Mostra meno' : `Mostra tutte (${passate.length})`}
                                </button>
                            )}
                        </>
                    )}

                    <h2 style={s.sezione}>Collegamento</h2>
                    <CollegaIstruttore />
                </>
            )}

            {dettaglioMeteo && (
                <DettaglioMeteo localita={dettaglioMeteo.localita} data={dettaglioMeteo.data}
                    onChiudi={() => setDettaglioMeteo(null)} />
            )}
        </ClientShell>
    );
}

// La prossima lezione, in grande
function Prossima({ lezione, onMeteo }) {
    const localita = localitaDi(lezione);
    return (
        <div style={s.hero}>
            <div style={s.heroEtichetta}>Prossima lezione · {quando(lezione.date)}</div>
            <div style={s.heroData}>{fmtDataLunga(lezione.date)}</div>
            <div style={s.heroOra}>{fmtOra(lezione.start)} – {fmtOra(lezione.finish)}</div>
            <div style={s.heroRiga}>con {lezione.instructorName} {lezione.instructorSurname}</div>
            {localita && <div style={s.heroRiga}>📍 {localita.name}</div>}
            {localita && (
                <div style={{ marginTop: '14px' }}>
                    <IconaMeteo localita={localita} data={lezione.date} onClick={() => onMeteo(localita, lezione.date)} />
                </div>
            )}
        </div>
    );
}

// Una lezione nell'elenco: il giorno a sinistra, i dettagli a destra
function Riga({ lezione, passata, onMeteo }) {
    const d = dataLocale(lezione.date);
    const localita = localitaDi(lezione);
    return (
        <div style={{ ...s.riga, opacity: passata ? 0.65 : 1 }}>
            <div style={s.giorno}>
                <div style={s.giornoNum}>{d.getDate()}</div>
                <div style={s.giornoMese}>{MESI_BREVI[d.getMonth()]}</div>
            </div>
            <div style={s.rigaCorpo}>
                <div style={s.rigaTitolo}>{GIORNI[d.getDay()]} · {fmtOra(lezione.start)}–{fmtOra(lezione.finish)}</div>
                <div style={s.rigaDettaglio}>con {lezione.instructorName} {lezione.instructorSurname}</div>
                {localita && <div style={s.rigaDettaglio}>📍 {localita.name}</div>}
            </div>
            {onMeteo && localita && (
                <IconaMeteo localita={localita} data={lezione.date} onClick={() => onMeteo(localita, lezione.date)} />
            )}
        </div>
    );
}

// Lezioni e ore fatte: numeri grandi e dettaglio per istruttore
function Riepilogo({ riepilogo }) {
    return (
        <>
            <h2 style={s.sezione}>Il tuo percorso</h2>
            <div style={s.numeri}>
                <div style={s.numero}>
                    <div style={s.numeroValore}>{riepilogo.lessons}</div>
                    <div style={s.numeroEtichetta}>{riepilogo.lessons === 1 ? 'lezione fatta' : 'lezioni fatte'}</div>
                </div>
                <div style={s.numero}>
                    <div style={s.numeroValore}>{fmtOre(riepilogo.hours)}</div>
                    <div style={s.numeroEtichetta}>sugli sci</div>
                </div>
                <div style={s.numero}>
                    <div style={s.numeroValore}>{riepilogo.perInstructor.length}</div>
                    <div style={s.numeroEtichetta}>{riepilogo.perInstructor.length === 1 ? 'istruttore' : 'istruttori'}</div>
                </div>
            </div>
            <div style={s.scheda}>
                {riepilogo.perInstructor.map(i => (
                    <div key={`${i.instructorName}-${i.instructorSurname}`} style={s.rigaIstruttore}>
                        <span>{i.instructorName} {i.instructorSurname}</span>
                        <span style={s.rigaIstruttoreValori}>{i.lessons} {i.lessons === 1 ? 'lezione' : 'lezioni'} · {fmtOre(i.hours)}</span>
                    </div>
                ))}
            </div>
        </>
    );
}

const STATO = { PENDING: 'In attesa', APPROVED: 'Approvata', REJECTED: 'Rifiutata' };

// Il cliente dice "ho fatto lezione con questo istruttore" e l'istruttore decide se collegarlo
function CollegaIstruttore() {
    const [istruttori, setIstruttori] = useState([]);
    const [richieste, setRichieste] = useState([]);
    const [scelto, setScelto] = useState('');
    const [messaggio, setMessaggio] = useState({ tipo: '', testo: '' });

    const caricaRichieste = () =>
        getMieRichieste()
            .then(r => (r.ok ? r.json() : []))
            .then(d => setRichieste(Array.isArray(d) ? d : []))
            .catch(() => {});

    useEffect(() => {
        getIstruttori()
            .then(r => (r.ok ? r.json() : []))
            .then(d => setIstruttori(Array.isArray(d) ? d : []))
            .catch(() => {});
        caricaRichieste();
    }, []);

    const invia = async () => {
        if (!scelto) return;
        setMessaggio({ tipo: '', testo: '' });
        try {
            const res = await inviaRichiesta(Number(scelto));
            if (res.ok) {
                setMessaggio({ tipo: 'ok', testo: 'Richiesta inviata. Quando l’istruttore la approva vedrai le tue lezioni.' });
                caricaRichieste();
            } else {
                setMessaggio({ tipo: 'errore', testo: await res.text() });
            }
        } catch {
            setMessaggio({ tipo: 'errore', testo: 'Errore di connessione' });
        }
    };

    return (
        <div style={s.scheda}>
            <div style={s.schedaTitolo}>Collegati a un istruttore</div>
            <p style={s.aiuto}>
                Hai già fatto lezione con un istruttore? Sceglilo: riceverà la tua richiesta e, se ti riconosce, vedrai le tue lezioni.
            </p>
            <div style={s.rigaForm}>
                <select style={s.select} value={scelto} onChange={e => setScelto(e.target.value)}>
                    <option value="">Scegli l’istruttore…</option>
                    {istruttori.map(i => <option key={i.id} value={i.id}>{i.name} {i.surname}</option>)}
                </select>
                <button type="button" style={{ ...s.invia, opacity: scelto ? 1 : 0.5 }} onClick={invia} disabled={!scelto}>
                    Invia richiesta
                </button>
            </div>
            {messaggio.testo && (
                <p style={messaggio.tipo === 'ok' ? s.ok : s.errore}>{messaggio.testo}</p>
            )}
            {richieste.map(r => (
                <div key={r.id} style={s.rigaIstruttore}>
                    <span>{r.instructorName} {r.instructorSurname}</span>
                    <span style={s.rigaIstruttoreValori}>{STATO[r.status] || r.status}</span>
                </div>
            ))}
        </div>
    );
}

const s = {
    titolo: { fontSize: '26px', fontWeight: '700', margin: '0 0 16px' },
    sezione: { fontSize: '13px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '28px 0 10px' },
    testo: { color: 'var(--muted)', fontSize: '14px' },
    errore: { color: 'var(--danger)', fontSize: '13px', margin: '10px 0 0' },
    ok: { color: 'var(--success)', fontSize: '13px', margin: '10px 0 0' },

    // prossima lezione
    hero: { background: 'linear-gradient(135deg, #4361ee, #6d83ff)', color: 'white', borderRadius: '20px', padding: '22px 20px', marginBottom: '14px', boxShadow: 'var(--shadow-lg)' },
    heroEtichetta: { fontSize: '13px', opacity: 0.85, marginBottom: '6px' },
    heroData: { fontSize: '24px', fontWeight: '700', lineHeight: 1.2 },
    heroOra: { fontSize: '30px', fontWeight: '700', margin: '4px 0 10px' },
    heroRiga: { fontSize: '15px', opacity: 0.95, marginTop: '3px' },
    vuotoPiccolo: { backgroundColor: 'var(--surface)', color: 'var(--muted)', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '14px', boxShadow: 'var(--shadow)' },

    // nessuna lezione
    vuoto: { backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '32px 22px', textAlign: 'center', marginBottom: '14px', boxShadow: 'var(--shadow)' },
    emoji: { fontSize: '44px', marginBottom: '10px' },
    vuotoTitolo: { fontSize: '17px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' },
    vuotoTesto: { fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5 },

    // elenco lezioni
    lista: { display: 'flex', flexDirection: 'column', gap: '10px' },
    riga: { display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '12px 14px', boxShadow: 'var(--shadow)' },
    giorno: { flexShrink: 0, width: '52px', textAlign: 'center', backgroundColor: 'var(--accent-soft)', borderRadius: '12px', padding: '8px 0' },
    giornoNum: { fontSize: '20px', fontWeight: '700', color: 'var(--accent)', lineHeight: 1 },
    giornoMese: { fontSize: '11px', fontWeight: '600', color: 'var(--accent)', textTransform: 'uppercase', marginTop: '3px' },
    rigaCorpo: { flex: 1, minWidth: 0 },
    rigaTitolo: { fontSize: '15px', fontWeight: '600', color: 'var(--text)' },
    rigaDettaglio: { fontSize: '13px', color: 'var(--muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    mostraAltre: { display: 'block', margin: '12px auto 0', padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--accent)', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },

    // riepilogo
    numeri: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' },
    numero: { backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '16px 8px', textAlign: 'center', boxShadow: 'var(--shadow)' },
    numeroValore: { fontSize: '26px', fontWeight: '700', color: 'var(--text)', lineHeight: 1.1 },
    numeroEtichetta: { fontSize: '12px', color: 'var(--muted)', marginTop: '4px' },

    // scheda generica e collegamento
    scheda: { backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '6px 16px', boxShadow: 'var(--shadow)' },
    schedaTitolo: { fontSize: '16px', fontWeight: '600', color: 'var(--text)', padding: '12px 0 0' },
    aiuto: { fontSize: '13px', color: 'var(--muted)', margin: '6px 0 12px', lineHeight: 1.5 },
    rigaForm: { display: 'flex', gap: '10px', flexWrap: 'wrap', paddingBottom: '12px' },
    select: { flex: 1, minWidth: '180px', padding: '11px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '15px', backgroundColor: 'var(--surface)', color: 'var(--text)' },
    invia: { padding: '11px 18px', backgroundColor: 'var(--brand)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    rigaIstruttore: { display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '14px', color: 'var(--text)', padding: '11px 0', borderTop: '1px solid var(--border)' },
    rigaIstruttoreValori: { color: 'var(--muted)', whiteSpace: 'nowrap' },
};

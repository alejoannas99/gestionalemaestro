// AdminPage.jsx — visibile in menu solo all'account con l'email in app.admin-email
// (AppShell mostra la voce solo a lui). Il backend rifiuta comunque chiunque altro con 403.
// In più, prima di vedere qualunque cosa, serve un PIN separato dalla password di login
// (sessionStorage: si chiede di nuovo ad ogni nuova sessione del browser, non resta salvato
// per sempre). Protegge da un click per sbaglio mentre si lavora come istruttore.
// Pensata soprattutto per schermo largo (più colonne affiancate), ma resta usabile da telefono:
// uso AppShell in modalità "piena" per non essere limitato alla larghezza stretta delle altre
// pagine, e gestisco io la larghezza massima qui dentro.
import { useState, useEffect } from 'react';
import {
    getStatoApp, getIstruttoriInAttesa, approvaIstruttore, rifiutaIstruttore, getErroriRecenti,
} from '../services/api';
import AppShell from '../components/AppShell';

function pinSalvato() {
    try { return sessionStorage.getItem('adminPin') || ''; } catch { return ''; }
}

// "2026-09-30T18:23:11.123" -> "30/09 18:23"
function fmtQuando(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const due = (n) => String(n).padStart(2, '0');
    return `${due(d.getDate())}/${due(d.getMonth() + 1)} ${due(d.getHours())}:${due(d.getMinutes())}`;
}

export default function AdminPage({ onLogout }) {
    const [pin, setPin] = useState(pinSalvato);
    const [pinInserito, setPinInserito] = useState('');
    const [errorePin, setErrorePin] = useState('');
    const [verificando, setVerificando] = useState(false);

    const [stato, setStato] = useState(null);
    const [erroreStato, setErroreStato] = useState('');

    const [istruttori, setIstruttori] = useState([]);
    const [loadingIstruttori, setLoadingIstruttori] = useState(true);
    const [erroreIstruttori, setErroreIstruttori] = useState('');

    const [errori, setErrori] = useState([]);
    const [loadingErrori, setLoadingErrori] = useState(true);
    const [erroreErrori, setErroreErrori] = useState('');

    // Se il PIN salvato non è (più) valido, si torna alla schermata di richiesta.
    const pinNonValido = () => {
        try { sessionStorage.removeItem('adminPin'); } catch { /* niente da fare */ }
        setPin('');
    };

    const caricaStato = (pinUsato) => {
        getStatoApp(pinUsato)
            .then(r => {
                if (r.status === 401) { pinNonValido(); return Promise.reject(null); }
                return r.ok ? r.json() : Promise.reject(r);
            })
            .then(setStato)
            .catch(async (r) => {
                if (r === null) return; // già gestito da pinNonValido
                setErroreStato(r?.status === 403 ? 'Non sei autorizzato' : 'Impossibile leggere lo stato dell\'app');
            });
    };

    const caricaIstruttori = (pinUsato) => {
        getIstruttoriInAttesa(pinUsato)
            .then(r => {
                if (r.status === 401) { pinNonValido(); return Promise.reject(null); }
                return r.ok ? r.json() : Promise.reject(r);
            })
            .then(data => { setIstruttori(Array.isArray(data) ? data : []); setLoadingIstruttori(false); })
            .catch((r) => {
                if (r === null) return;
                setErroreIstruttori('Impossibile caricare le richieste');
                setLoadingIstruttori(false);
            });
    };

    const caricaErrori = (pinUsato) => {
        getErroriRecenti(pinUsato)
            .then(r => {
                if (r.status === 401) { pinNonValido(); return Promise.reject(null); }
                return r.ok ? r.json() : Promise.reject(r);
            })
            .then(data => { setErrori(Array.isArray(data) ? data : []); setLoadingErrori(false); })
            .catch((r) => {
                if (r === null) return;
                setErroreErrori('Impossibile caricare gli errori recenti');
                setLoadingErrori(false);
            });
    };

    useEffect(() => {
        if (!pin) return;
        caricaStato(pin);
        caricaIstruttori(pin);
        caricaErrori(pin);
        // caricaStato/caricaIstruttori/caricaErrori si ridefiniscono ad ogni render (non sono
        // useCallback): metterle tra le dipendenze farebbe ripartire il caricamento di continuo.
        // Deve ripartire solo quando cambia il pin, che è già in dipendenza.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pin]);

    const provaPin = async (e) => {
        e.preventDefault();
        setErrorePin('');
        setVerificando(true);
        try {
            const res = await getStatoApp(pinInserito);
            if (res.ok) {
                try { sessionStorage.setItem('adminPin', pinInserito); } catch { /* niente da fare */ }
                setPin(pinInserito);
            } else if (res.status === 401) {
                setErrorePin('PIN errato');
            } else {
                setErrorePin('Non sei autorizzato');
            }
        } catch {
            setErrorePin('Errore di connessione');
        }
        setVerificando(false);
    };

    const decidi = async (azione, id) => {
        setErroreIstruttori('');
        try {
            const res = await azione(id, pin);
            if (res.status === 401) { pinNonValido(); return; }
            if (res.ok) {
                caricaIstruttori(pin);
                caricaStato(pin); // il conteggio istruttori approvati/in attesa cambia
            } else {
                setErroreIstruttori(await res.text());
            }
        } catch {
            setErroreIstruttori('Errore di connessione');
        }
    };

    if (!pin) {
        return (
            <AppShell ruolo="INSTRUCTOR" onLogout={onLogout}>
                <div style={s.gate}>
                    <h1 style={s.titolo}>Sezione amministrazione</h1>
                    <p style={s.sotto}>Inserisci il PIN per entrare.</p>
                    <form onSubmit={provaPin} style={s.formPin}>
                        <input
                            style={s.inputPin}
                            type="password"
                            inputMode="numeric"
                            placeholder="PIN"
                            value={pinInserito}
                            onChange={(e) => setPinInserito(e.target.value)}
                            autoFocus
                        />
                        {errorePin && <p style={s.errore}>{errorePin}</p>}
                        <button style={s.approva} type="submit" disabled={verificando}>
                            {verificando ? 'Verifica...' : 'Entra'}
                        </button>
                    </form>
                </div>
            </AppShell>
        );
    }

    const carte = stato ? [
        { etichetta: 'Istruttori approvati', valore: stato.istruttoriApprovati },
        { etichetta: 'Istruttori in attesa', valore: stato.istruttoriInAttesa, avviso: stato.istruttoriInAttesa > 0 },
        { etichetta: 'Account clienti', valore: stato.accountClienti },
        { etichetta: 'Schede clienti', valore: stato.schedeClienti },
        { etichetta: 'Lezioni totali', valore: stato.lezioni },
    ] : [];

    return (
        <AppShell ruolo="INSTRUCTOR" onLogout={onLogout} piena>
            <div style={s.content}>
                <h1 style={s.titolo}>Pannello di amministrazione</h1>

                <section>
                    <h2 style={s.titoloSezione}>Stato generale</h2>
                    {erroreStato && <p style={s.errore}>{erroreStato}</p>}
                    {!stato && !erroreStato && <p style={s.testo}>Caricamento...</p>}
                    {stato && (
                        <div style={s.grigliaCarte}>
                            {carte.map(c => (
                                <div key={c.etichetta} style={{ ...s.carta, ...(c.avviso ? s.cartaAvviso : {}) }}>
                                    <div style={s.numeroCarta}>{c.valore}</div>
                                    <div style={s.etichettaCarta}>{c.etichetta}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section style={s.sezione}>
                    <h2 style={s.titoloSezione}>Registrazioni istruttore in attesa</h2>
                    <p style={s.sotto}>Approva solo chi conosci davvero come maestro.</p>

                    {loadingIstruttori && <p style={s.testo}>Caricamento...</p>}
                    {erroreIstruttori && <p style={s.errore}>{erroreIstruttori}</p>}
                    {!loadingIstruttori && istruttori.length === 0 && <p style={s.vuoto}>Nessuna richiesta in attesa.</p>}

                    <div style={s.griglia}>
                        {istruttori.map(i => (
                            <div key={i.id} style={s.scheda}>
                                <div style={s.nome}>{i.name} {i.surname}</div>
                                <div style={s.dettaglio}>{i.email}</div>
                                <div style={s.bottoni}>
                                    <button style={s.approva} onClick={() => decidi(approvaIstruttore, i.id)}>Approva</button>
                                    <button style={s.rifiuta} onClick={() => decidi(rifiutaIstruttore, i.id)}>Rifiuta</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section style={s.sezione}>
                    <div style={s.intestazioneErrori}>
                        <h2 style={s.titoloSezione}>Errori recenti</h2>
                        <button style={s.aggiorna} onClick={() => caricaErrori(pin)}>Aggiorna</button>
                    </div>
                    <p style={s.sotto}>Eccezioni impreviste del backend, dall'ultimo riavvio (le più recenti prima).</p>

                    {loadingErrori && <p style={s.testo}>Caricamento...</p>}
                    {erroreErrori && <p style={s.errore}>{erroreErrori}</p>}
                    {!loadingErrori && errori.length === 0 && <p style={s.vuoto}>Nessun errore registrato.</p>}

                    <div style={s.listaErrori}>
                        {errori.map((e, i) => (
                            <div key={i} style={s.rigaErrore}>
                                <div style={s.rigaErroreIntestazione}>
                                    <span style={s.tipoErrore}>{e.tipo}</span>
                                    <span style={s.quandoErrore}>{fmtQuando(e.quando)}</span>
                                </div>
                                <div style={s.dettaglio}>{e.metodo} {e.percorso}</div>
                                {e.messaggio && <div style={s.messaggioErrore}>{e.messaggio}</div>}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AppShell>
    );
}

const s = {
    content: { padding: '24px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' },
    gate: { padding: '20px 16px', maxWidth: '360px', margin: '60px auto 0', textAlign: 'center' },
    formPin: { display: 'flex', flexDirection: 'column', gap: '10px' },
    inputPin: { padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '16px', textAlign: 'center', letterSpacing: '4px', outline: 'none' },
    titolo: { fontSize: '26px', fontWeight: '700', color: 'var(--text)', margin: '0 0 20px' },
    titoloSezione: { fontSize: '18px', fontWeight: '700', color: 'var(--text)', margin: '0 0 10px' },
    sezione: { marginTop: '32px' },
    sotto: { fontSize: '14px', color: 'var(--muted)', margin: '0 0 16px' },
    testo: { color: 'var(--muted)', fontSize: '14px' },
    vuoto: { color: 'var(--muted)', fontSize: '14px', backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '12px' },
    errore: { color: 'var(--danger)', fontSize: '13px' },
    grigliaCarte: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' },
    carta: { backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '18px', boxShadow: 'var(--shadow)' },
    cartaAvviso: { border: '1px solid var(--danger-border)' },
    numeroCarta: { fontSize: '28px', fontWeight: '700', color: 'var(--text)' },
    etichettaCarta: { fontSize: '13px', color: 'var(--muted)', marginTop: '4px' },
    griglia: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
    scheda: { backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '16px', boxShadow: 'var(--shadow)' },
    nome: { fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px' },
    dettaglio: { fontSize: '13px', color: 'var(--muted)', marginBottom: '3px' },
    bottoni: { display: 'flex', gap: '10px', marginTop: '12px' },
    approva: { flex: 1, padding: '9px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    rifiuta: { flex: 1, padding: '9px', backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--danger-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    intestazioneErrori: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' },
    aggiorna: { padding: '7px 14px', backgroundColor: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
    listaErrori: { display: 'flex', flexDirection: 'column', gap: '8px' },
    rigaErrore: { backgroundColor: 'var(--surface)', borderRadius: '10px', padding: '12px 14px', boxShadow: 'var(--shadow)', borderLeft: '3px solid var(--danger)' },
    rigaErroreIntestazione: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' },
    tipoErrore: { fontSize: '14px', fontWeight: '700', color: 'var(--danger)' },
    quandoErrore: { fontSize: '12px', color: 'var(--muted)' },
    messaggioErrore: { fontSize: '13px', color: 'var(--text)', marginTop: '4px' },
};

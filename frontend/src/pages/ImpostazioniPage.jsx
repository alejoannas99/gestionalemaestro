import { useState, useEffect } from 'react';
import { getImpostazioni, salvaImpostazioni, caricaFoto, rimuoviFoto } from '../services/api';
import SelettoreLocalita from '../components/SelettoreLocalita';
import Avatar from '../components/Avatar';
import RitagliaFoto from '../components/RitagliaFoto';
import AppShell from '../components/AppShell';
import { temaSalvato, impostaTema } from '../theme';

const OPZIONI_TEMA = [
    { valore: 'auto', etichetta: '🖥️ Automatico' },
    { valore: 'chiaro', etichetta: '☀️ Chiaro' },
    { valore: 'scuro', etichetta: '🌙 Scuro' },
];

const OPZIONI_DISCIPLINA = [
    { valore: 'SCI', etichetta: '⛷️ Sci' },
    { valore: 'SNOWBOARD', etichetta: '🏂 Snowboard' },
];

export default function ImpostazioniPage({ onLogout, isInstructor }) {
    const [localita, setLocalita] = useState(null); // { name, latitude, longitude } oppure null
    const [fissa, setFissa] = useState(false);
    const [discipline, setDiscipline] = useState([]); // es. ['SCI'] oppure ['SCI', 'SNOWBOARD']
    const [loading, setLoading] = useState(true);
    const [messaggio, setMessaggio] = useState({ tipo: '', testo: '' });
    const [tema, setTema] = useState(temaSalvato);
    const [caricandoFoto, setCaricandoFoto] = useState(false);
    const [erroreFoto, setErroreFoto] = useState('');
    // Cambia ad ogni foto caricata o rimossa: forza l'Avatar a riscaricarla invece di mostrare quella vecchia
    const [versioneFoto, setVersioneFoto] = useState(0);
    const [fileScelto, setFileScelto] = useState(null); // il file appena scelto, in attesa di essere ritagliato

    const scegliTema = (valore) => {
        impostaTema(valore); // salva sul dispositivo e applica subito
        setTema(valore);
    };

    // Scegliere il file apre solo la finestra di ritaglio: l'upload vero parte da confermaRitaglio
    const scegliFile = (e) => {
        const file = e.target.files[0];
        e.target.value = ''; // permette di scegliere di nuovo lo stesso file in seguito
        if (file) setFileScelto(file);
    };

    const confermaRitaglio = async (blob) => {
        setFileScelto(null);
        setErroreFoto('');
        setCaricandoFoto(true);
        try {
            const res = await caricaFoto(blob);
            if (res.ok) setVersioneFoto(v => v + 1);
            else setErroreFoto(await res.text());
        } catch {
            setErroreFoto('Errore di connessione');
        }
        setCaricandoFoto(false);
    };

    const togliFoto = async () => {
        setErroreFoto('');
        const res = await rimuoviFoto();
        if (res.ok) setVersioneFoto(v => v + 1);
        else setErroreFoto('Errore di connessione');
    };

    const toggleDisciplina = (valore) => {
        setDiscipline(prev => prev.includes(valore)
            ? prev.filter(d => d !== valore)
            : [...prev, valore]);
    };

    useEffect(() => {
        getImpostazioni()
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(d => {
                if (d.locationName) setLocalita({ name: d.locationName, latitude: d.latitude, longitude: d.longitude });
                setFissa(d.fixedLocation);
                setDiscipline(d.disciplines ?? []);
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
                disciplines: discipline,
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
                    <div style={s.cardTitolo}>Foto profilo</div>
                    <p style={s.aiuto}>
                        {isInstructor
                            ? 'La vedono tutti i clienti.'
                            : 'La vede solo l’istruttore a cui sei collegato.'}
                    </p>
                    <div style={s.fotoRiga}>
                        <Avatar userId="me" size={72} refreshKey={versioneFoto} />
                        <div style={s.fotoAzioni}>
                            <label style={s.fotoBottone}>
                                {caricandoFoto ? 'Caricamento…' : 'Cambia foto'}
                                <input type="file" accept="image/*" style={s.fotoInput}
                                    onChange={scegliFile} disabled={caricandoFoto} />
                            </label>
                            <button type="button" style={s.fotoRimuovi} onClick={togliFoto} disabled={caricandoFoto}>
                                Rimuovi
                            </button>
                        </div>
                    </div>
                    {erroreFoto && <p style={s.errore}>{erroreFoto}</p>}
                </div>

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
                        <div style={s.cardTitolo}>Cosa insegni</div>
                        <p style={s.aiuto}>Visibile ai clienti. Puoi selezionare anche entrambe.</p>
                        <div style={s.opzioni}>
                            {OPZIONI_DISCIPLINA.map(o => (
                                <button key={o.valore} type="button"
                                    style={{ ...s.opzione, ...(discipline.includes(o.valore) ? s.opzioneOn : {}) }}
                                    onClick={() => toggleDisciplina(o.valore)}>
                                    {o.etichetta}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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

    return (
        <>
            <AppShell ruolo={isInstructor ? 'INSTRUCTOR' : 'USER'} onLogout={onLogout}>{contenuto}</AppShell>
            {fileScelto && (
                <RitagliaFoto file={fileScelto} onConferma={confermaRitaglio} onAnnulla={() => setFileScelto(null)} />
            )}
        </>
    );
}

const s = {
    titolo: { fontSize: '24px', fontWeight: '700', color: 'var(--text)', margin: '0 0 16px' },
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
    fotoRiga: { display: 'flex', alignItems: 'center', gap: '16px' },
    fotoAzioni: { display: 'flex', flexDirection: 'column', gap: '8px' },
    // <input type="file"> di suo è brutto da vedere: si nasconde e il suo posto lo prende il <label>, cliccabile allo stesso modo
    fotoInput: { position: 'absolute', width: '1px', height: '1px', opacity: 0, overflow: 'hidden' },
    fotoBottone: { padding: '9px 16px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'center', position: 'relative' },
    fotoRimuovi: { padding: '9px 16px', backgroundColor: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
};

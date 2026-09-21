import usePrevisioni from '../hooks/usePrevisioni';
import { giornoMeteo, oreMeteo, descriviCodice } from '../services/meteo';

const GIORNI = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

function fmtDataLunga(iso) {
    const d = new Date(`${iso}T00:00`);
    return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`;
}

// Piccola icona con la temperatura massima di un giorno. Non compare se la data è fuori dalle previsioni.
export function IconaMeteo({ localita, data, onClick }) {
    const { dati } = usePrevisioni(localita);
    if (!dati) return null;
    const g = giornoMeteo(dati, data);
    if (!g) return null;
    const { icona, testo } = descriviCodice(g.codice);
    const titolo = `${testo}, ${g.min}° / ${g.max}°`;
    const contenuto = <>{icona} <span style={s.gradi}>{g.max}°</span></>;
    return onClick
        ? <button type="button" title={titolo} style={{ ...s.icona, cursor: 'pointer' }}
            onClick={e => { e.stopPropagation(); onClick(); }}>{contenuto}</button>
        : <span title={titolo} style={s.icona}>{contenuto}</span>;
}

// Riquadro con il meteo di oggi nella località
export function MeteoOggi({ localita, onDettaglio }) {
    const { dati, errore } = usePrevisioni(localita);
    if (!localita) return null;
    if (errore) return <div style={s.riquadro}><span style={s.piccolo}>Meteo non disponibile al momento</span></div>;
    if (!dati) return <div style={s.riquadro}><span style={s.piccolo}>Caricamento meteo…</span></div>;

    const oggi = dati.daily.time[0]; // il primo giorno è oggi, nel fuso della località
    const g = giornoMeteo(dati, oggi);
    const ora = descriviCodice(dati.current.weather_code);
    return (
        <div style={s.riquadro}>
            <div style={s.riga}>
                <div style={s.grande}>{ora.icona}</div>
                <div style={{ flex: 1 }}>
                    <div style={s.temp}>{Math.round(dati.current.temperature_2m)}° <span style={s.testo}>{ora.testo}</span></div>
                    <div style={s.piccolo}>📍 {localita.name} · oggi {g.min}° / {g.max}° · pioggia {g.pioggia ?? 0}% · vento {Math.round(dati.current.wind_speed_10m)} km/h</div>
                </div>
                {onDettaglio && (
                    <button type="button" style={s.link} onClick={() => onDettaglio(oggi)}>Dettaglio</button>
                )}
            </div>
        </div>
    );
}

// Finestra con il meteo ora per ora di un giorno
export function DettaglioMeteo({ localita, data, onChiudi }) {
    const { dati, errore } = usePrevisioni(localita);
    const ore = dati ? oreMeteo(dati, data).filter(o => o.ora >= '06:00' && o.ora <= '21:00') : [];
    const g = dati ? giornoMeteo(dati, data) : null;
    const riassunto = g ? descriviCodice(g.codice) : null;

    return (
        <div style={s.overlay} onClick={onChiudi}>
            <div style={s.modale} onClick={e => e.stopPropagation()}>
                <div style={s.testata}>
                    <div>
                        <div style={s.titolo}>{fmtDataLunga(data)}</div>
                        <div style={s.piccolo}>📍 {localita.name}</div>
                    </div>
                    <button type="button" style={s.chiudi} onClick={onChiudi}>✕</button>
                </div>

                {errore && <p style={s.piccolo}>Meteo non disponibile al momento</p>}
                {!dati && !errore && <p style={s.piccolo}>Caricamento…</p>}
                {dati && !g && <p style={s.piccolo}>Previsioni non ancora disponibili per questo giorno.</p>}

                {g && (
                    <div style={s.sintesi}>
                        <span style={s.grande}>{riassunto.icona}</span>
                        <div>
                            <div style={s.temp}>{g.min}° / {g.max}° <span style={s.testo}>{riassunto.testo}</span></div>
                            <div style={s.piccolo}>Probabilità di pioggia {g.pioggia ?? 0}%</div>
                        </div>
                    </div>
                )}

                {ore.map(o => {
                    const d = descriviCodice(o.codice);
                    return (
                        <div key={o.ora} style={s.rigaOra}>
                            <span style={s.ora}>{o.ora}</span>
                            <span style={s.iconaOra}>{d.icona}</span>
                            <span style={s.tempOra}>{o.temperatura}°</span>
                            <span style={s.piccolo}>💧 {o.pioggia ?? 0}%</span>
                            <span style={s.piccolo}>💨 {o.vento} km/h</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const s = {
    icona: { display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 8px', backgroundColor: 'var(--info-bg)', border: '1px solid var(--info-border)', borderRadius: '14px', fontSize: '13px', color: 'var(--text)', fontFamily: 'inherit' },
    gradi: { fontWeight: '600', fontSize: '12px' },
    riquadro: { backgroundColor: 'var(--surface)', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px', boxShadow: 'var(--shadow)', textAlign: 'left' },
    riga: { display: 'flex', alignItems: 'center', gap: '14px' },
    grande: { fontSize: '38px', lineHeight: 1 },
    temp: { fontSize: '20px', fontWeight: '700', color: 'var(--text)' },
    testo: { fontSize: '14px', fontWeight: '400', color: 'var(--muted)' },
    piccolo: { fontSize: '13px', color: 'var(--muted)' },
    link: { padding: 0, background: 'none', border: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px', boxSizing: 'border-box' },
    modale: { backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '20px', width: '420px', maxWidth: '100%', maxHeight: '85vh', overflowY: 'auto', boxSizing: 'border-box', textAlign: 'left' },
    testata: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
    titolo: { fontSize: '18px', fontWeight: '700', color: 'var(--text)' },
    chiudi: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--muted)' },
    sintesi: { display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0 14px', borderBottom: '1px solid var(--border)', marginBottom: '6px' },
    rigaOra: { display: 'grid', gridTemplateColumns: '48px 30px 40px 1fr 1fr', alignItems: 'center', gap: '6px', padding: '7px 0', borderBottom: '1px solid var(--border)' },
    ora: { fontSize: '14px', fontWeight: '600', color: 'var(--text)' },
    iconaOra: { fontSize: '20px' },
    tempOra: { fontSize: '14px', fontWeight: '600', color: 'var(--text)' },
};

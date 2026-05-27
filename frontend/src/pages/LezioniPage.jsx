import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLezioni, getClienti, addLezione, updateLezione, deleteLezione } from '../services/api';

// ── Hook responsività ────────────────────────────────────────────────────────
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

// ── Costanti ─────────────────────────────────────────────────────────────────
const SLOT_HOURS = [];
for (let h = 9; h <= 17; h++) {
    SLOT_HOURS.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 17) SLOT_HOURS.push(`${String(h).padStart(2, '0')}:30`);
}

const SLOT_H = 48;
const GRID_START = 9 * 60;
const GRID_HEIGHT = SLOT_H * (SLOT_HOURS.length - 1);
const GIORNI_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const GIORNI_LONG = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
               'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toMin(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}
function calcTop(hhmm) {
    return ((toMin(hhmm) - GRID_START) / 30) * SLOT_H;
}
function calcHeight(start, finish) {
    return ((toMin(finish) - toMin(start)) / 30) * SLOT_H;
}
function lunediDi(data) {
    const d = new Date(data);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
function settimana(lun) {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(lun);
        d.setDate(lun.getDate() + i);
        return d;
    });
}
function toISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function slotEnd(start) {
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + 60;
    return `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
}
function oraFromY(y) {
    const slotIndex = Math.floor(y / SLOT_H);
    return SLOT_HOURS[Math.min(slotIndex, SLOT_HOURS.length - 2)];
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTA AGENDA (mobile) — mostra le lezioni di un giorno alla volta
// ══════════════════════════════════════════════════════════════════════════════
function VistaAgenda({ giorno, lezioni, clienti, onApriForm, onDelete }) {
    const iso = toISO(giorno);
    const lezioniGiorno = lezioni
        .filter(l => l.date === iso)
        .sort((a, b) => a.start.localeCompare(b.start));

    const oggi_iso = toISO(new Date());
    const isOggi = iso === oggi_iso;

    // nome giorno della settimana (0=dom, 1=lun...)
    const dayIndex = giorno.getDay();
    const nomeGiorno = GIORNI_LONG[dayIndex === 0 ? 6 : dayIndex - 1];

    return (
        <div style={ag.wrapper}>
            {/* intestazione giorno */}
            <div style={{ ...ag.dayHeader, ...(isOggi ? ag.dayHeaderOggi : {}) }}>
                <div>
                    <p style={ag.dayName}>{nomeGiorno}</p>
                    <p style={ag.dayDate}>
                        {giorno.getDate()} {MESI[giorno.getMonth()]} {giorno.getFullYear()}
                        {isOggi && <span style={ag.oggiTag}> • Oggi</span>}
                    </p>
                </div>
                {/* pulsante aggiungi lezione per questo giorno */}
                <button style={ag.addBtn} onClick={() => onApriForm(giorno, '09:00')}>
                    + Lezione
                </button>
            </div>

            {/* lista lezioni del giorno */}
            {lezioniGiorno.length === 0 ? (
                <div style={ag.empty}>
                    <p style={ag.emptyIcon}>📭</p>
                    <p style={ag.emptyTesto}>Nessuna lezione</p>
                </div>
            ) : (
                <div style={ag.lista}>
                    {lezioniGiorno.map(l => (
                        <div key={l.id} style={ag.card} onClick={() => onApriForm(null, null, l)}>
                            {/* barra colorata sinistra */}
                            <div style={ag.colorBar} />
                            <div style={ag.cardBody}>
                                <div style={ag.cardTop}>
                                    <span style={ag.orario}>
                                        {l.start.substring(0,5)} – {l.finish.substring(0,5)}
                                    </span>
                                    <span style={ag.durata}>
                                        {toMin(l.finish.substring(0,5)) - toMin(l.start.substring(0,5))} min
                                    </span>
                                </div>
                                <p style={ag.clienti}>
                                    {l.clients.map(c => `${c.name} ${c.surname}`).join(', ')}
                                </p>
                            </div>
                            <button style={ag.delBtn} onClick={e => { e.stopPropagation(); onDelete(e, l.id); }}>
                                🗑️
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const ag = {
    wrapper: { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' },
    dayHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#fafafa', borderBottom: '1px solid #f0f0f0' },
    dayHeaderOggi: { backgroundColor: '#eef2ff' },
    dayName: { fontSize: '16px', fontWeight: '700', color: '#1a1a2e' },
    dayDate: { fontSize: '13px', color: '#888', marginTop: '2px' },
    oggiTag: { color: '#4361ee', fontWeight: '600' },
    addBtn: { padding: '8px 14px', backgroundColor: '#4361ee', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' },
    empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px', gap: '8px' },
    emptyIcon: { fontSize: '32px' },
    emptyTesto: { color: '#aaa', fontSize: '14px' },
    lista: { display: 'flex', flexDirection: 'column' },
    card: { display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', gap: '12px' },
    colorBar: { width: '4px', height: '48px', backgroundColor: '#4361ee', borderRadius: '2px', flexShrink: 0 },
    cardBody: { flex: 1 },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' },
    orario: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e' },
    durata: { fontSize: '12px', color: '#888', backgroundColor: '#f4f5f7', padding: '2px 8px', borderRadius: '6px' },
    clienti: { fontSize: '13px', color: '#666' },
    delBtn: { padding: '6px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' },
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function LezioniPage({ onLogout }) {
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const [lezioni, setLezioni] = useState([]);
    const [clienti, setClienti] = useState([]);
    const [loading, setLoading] = useState(true);

    // navigazione desktop (settimana) e mobile (giorno)
    const [lunedi, setLunedi] = useState(() => lunediDi(new Date()));
    const [giornoMobile, setGiornoMobile] = useState(() => new Date());

    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
    const [pickerMonth, setPickerMonth] = useState(new Date().getMonth());

    const [showForm, setShowForm] = useState(false);
    const [lezioneSelezionata, setLezioneSelezionata] = useState(null);
    const [formData, setFormData] = useState({ data: '', inizio: '', fine: '', codici: [] });
    const [errore, setErrore] = useState('');

    useEffect(() => {
        Promise.all([
            getLezioni().then(r => r.json()),
            getClienti().then(r => r.json())
        ]).then(([lez, cli]) => {
            setLezioni(Array.isArray(lez) ? lez : []);
            setClienti(Array.isArray(cli) ? cli : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const ricarica = () => getLezioni().then(r => r.json()).then(l => setLezioni(Array.isArray(l) ? l : []));

    // ── navigazione desktop ──────────────────────────────────────────────────
    const settPrecedente = () => { const d = new Date(lunedi); d.setDate(d.getDate() - 7); setLunedi(d); };
    const settSuccessiva = () => { const d = new Date(lunedi); d.setDate(d.getDate() + 7); setLunedi(d); };
    const tornaOggi = () => {
        setLunedi(lunediDi(new Date()));
        setGiornoMobile(new Date());
    };
    const saltaMese = (anno, mese) => {
        const d = new Date(anno, mese, 1);
        setLunedi(lunediDi(d));
        setGiornoMobile(d);
        setShowMonthPicker(false);
    };

    // ── navigazione mobile (giorno per giorno) ───────────────────────────────
    const giornoPrecedente = () => {
        const d = new Date(giornoMobile);
        d.setDate(d.getDate() - 1);
        setGiornoMobile(d);
    };
    const giornoSuccessivo = () => {
        const d = new Date(giornoMobile);
        d.setDate(d.getDate() + 1);
        setGiornoMobile(d);
    };

    // ── gestione form ────────────────────────────────────────────────────────
    // apriSlot usato dal calendario desktop (click su colonna)
    const apriSlot = (e, giorno) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const ora = oraFromY(y);
        setLezioneSelezionata(null);
        setFormData({ data: toISO(giorno), inizio: ora, fine: slotEnd(ora), codici: [] });
        setErrore('');
        setShowForm(true);
    };

    // apriFormAgenda usato dalla vista agenda mobile
    const apriFormAgenda = (giorno, ora, lezione = null) => {
        if (lezione) {
            setLezioneSelezionata(lezione);
            setFormData({
                data: lezione.date,
                inizio: lezione.start.substring(0, 5),
                fine: lezione.finish.substring(0, 5),
                codici: lezione.clients.map(c => c.code)
            });
        } else {
            setLezioneSelezionata(null);
            setFormData({ data: toISO(giorno), inizio: ora, fine: slotEnd(ora), codici: [] });
        }
        setErrore('');
        setShowForm(true);
    };

    const apriModifica = (e, lezione) => {
        e.stopPropagation();
        setLezioneSelezionata(lezione);
        setFormData({
            data: lezione.date,
            inizio: lezione.start.substring(0, 5),
            fine: lezione.finish.substring(0, 5),
            codici: lezione.clients.map(c => c.code)
        });
        setErrore('');
        setShowForm(true);
    };

    const toggleCliente = (code) => {
        setFormData(prev => ({
            ...prev,
            codici: prev.codici.includes(code)
                ? prev.codici.filter(c => c !== code)
                : [...prev.codici, code]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrore('');
        if (formData.codici.length === 0) { setErrore('Seleziona almeno un cliente'); return; }
        try {
            const res = lezioneSelezionata
                ? await updateLezione(lezioneSelezionata.id, formData.data, formData.inizio, formData.fine, formData.codici)
                : await addLezione(formData.data, formData.inizio, formData.fine, formData.codici);
            if (res.ok) { setShowForm(false); ricarica(); }
            else setErrore(await res.text());
        } catch { setErrore('Errore di connessione'); }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Eliminare questa lezione?')) return;
        const res = await deleteLezione(id);
        if (res.ok) ricarica();
    };

    // ── dati derivati ────────────────────────────────────────────────────────
    const giorni = settimana(lunedi);
    const oggi_iso = toISO(new Date());
    const domenica = giorni[6];
    const label = lunedi.getMonth() === domenica.getMonth()
        ? `${MESI[lunedi.getMonth()]} ${lunedi.getFullYear()}`
        : `${MESI[lunedi.getMonth()]} – ${MESI[domenica.getMonth()]} ${domenica.getFullYear()}`;

    // label mobile: nome giorno + data
    const dayIndex = giornoMobile.getDay();
    const labelMobile = `${GIORNI_LONG[dayIndex === 0 ? 6 : dayIndex - 1]} ${giornoMobile.getDate()} ${MESI[giornoMobile.getMonth()]}`;

    const lezioniPerGiorno = {};
    lezioni.forEach(l => {
        if (!lezioniPerGiorno[l.date]) lezioniPerGiorno[l.date] = [];
        lezioniPerGiorno[l.date].push(l);
    });

    if (loading) return <div style={s.loading}>Caricamento...</div>;

    return (
        <div style={s.page}>

            {/* ── HEADER ── */}
            <div style={s.header}>
                <span style={s.brand}>GestionaleMaestro</span>
                <div style={s.nav}>
                    <button style={s.navBtn} onClick={() => navigate('/dashboard')}>
                        {isMobile ? '🏠' : 'Dashboard'}
                    </button>
                    <button style={s.navBtn} onClick={() => navigate('/clienti')}>
                        {isMobile ? '👥' : 'Clienti'}
                    </button>
                    <button style={{ ...s.navBtn, ...s.navActive }}>
                        {isMobile ? '📅' : 'Lezioni'}
                    </button>
                </div>
                <button style={s.logoutBtn} onClick={onLogout}>
                    {isMobile ? '↩' : 'Esci'}
                </button>
            </div>

            {/* ── TOOLBAR ── */}
            <div style={{ ...s.toolbar, padding: isMobile ? '12px 16px' : '16px 24px' }}>
                <div style={s.navCal}>
                    <button style={s.arrowBtn} onClick={isMobile ? giornoPrecedente : settPrecedente}>‹</button>
                    <button style={s.labelMese} onClick={() => {
                        setPickerYear((isMobile ? giornoMobile : lunedi).getFullYear());
                        setPickerMonth((isMobile ? giornoMobile : lunedi).getMonth());
                        setShowMonthPicker(true);
                    }}>
                        {isMobile ? labelMobile : label} ▾
                    </button>
                    <button style={s.arrowBtn} onClick={isMobile ? giornoSuccessivo : settSuccessiva}>›</button>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button style={s.oggiBtn} onClick={tornaOggi}>Oggi</button>
                    {/* su mobile, pulsante aggiungi nella toolbar */}
                    {isMobile && (
                        <button style={s.addBtnMobile} onClick={() => apriFormAgenda(giornoMobile, '09:00')}>
                            +
                        </button>
                    )}
                </div>
            </div>

            {/* ── MONTH PICKER ── */}
            {showMonthPicker && (
                <div style={s.pickerOverlay} onClick={() => setShowMonthPicker(false)}>
                    <div style={s.pickerBox} onClick={e => e.stopPropagation()}>
                        <div style={s.pickerHeader}>
                            <button style={s.arrowBtn} onClick={() => setPickerYear(y => y - 1)}>‹</button>
                            <span style={s.pickerYear}>{pickerYear}</span>
                            <button style={s.arrowBtn} onClick={() => setPickerYear(y => y + 1)}>›</button>
                        </div>
                        <div style={s.mesGrid}>
                            {MESI.map((m, i) => (
                                <button key={i}
                                    style={{ ...s.meseBtn, ...(i === pickerMonth ? s.meseBtnActive : {}) }}
                                    onClick={() => saltaMese(pickerYear, i)}>
                                    {m.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                VISTA MOBILE → agenda giornaliera
                VISTA DESKTOP → calendario settimanale a colonne
            ══════════════════════════════════════════════════════════════ */}
            {isMobile ? (
                <div style={{ padding: '0 16px 24px' }}>
                    <VistaAgenda
                        giorno={giornoMobile}
                        lezioni={lezioni}
                        clienti={clienti}
                        onApriForm={apriFormAgenda}
                        onDelete={handleDelete}
                    />
                </div>
            ) : (
                /* ── CALENDARIO DESKTOP ── */
                <div style={{ ...s.calWrapper, margin: '0 24px 24px' }}>
                    {/* intestazione giorni */}
                    <div style={s.headerRow}>
                        <div style={s.timeColHeader} />
                        {giorni.map((g, i) => {
                            const iso = toISO(g);
                            const isOggi = iso === oggi_iso;
                            return (
                                <div key={i} style={{ ...s.dayHeader, ...(isOggi ? s.dayHeaderOggi : {}) }}>
                                    <span style={s.dayShort}>{GIORNI_SHORT[i]}</span>
                                    <span style={{ ...s.dayNum, ...(isOggi ? s.dayNumOggi : {}) }}>{g.getDate()}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* corpo scrollabile */}
                    <div style={s.calBody}>
                        <div style={s.calBodyInner}>
                            <div style={s.timeCol}>
                                {SLOT_HOURS.map(ora => (
                                    <div key={ora} style={s.timeLabel}>{ora}</div>
                                ))}
                            </div>
                            {giorni.map((g, i) => {
                                const iso = toISO(g);
                                const lez = lezioniPerGiorno[iso] || [];
                                return (
                                    <div key={i} style={s.dayCol} onClick={e => apriSlot(e, g)}>
                                        {SLOT_HOURS.map((ora, si) => (
                                            <div key={ora} style={{
                                                ...s.slotLine,
                                                top: si * SLOT_H,
                                                borderTop: ora.endsWith(':00') ? '1px solid #e8e8e8' : '1px dashed #f0f0f0'
                                            }} />
                                        ))}
                                        {lez.map(l => {
                                            const top = calcTop(l.start.substring(0, 5));
                                            const height = calcHeight(l.start.substring(0, 5), l.finish.substring(0, 5));
                                            return (
                                                <div key={l.id}
                                                    style={{ ...s.lezBlock, top, height }}
                                                    onClick={e => apriModifica(e, l)}>
                                                    <span style={s.blockOra}>{l.start.substring(0,5)}–{l.finish.substring(0,5)}</span>
                                                    <span style={s.blockClienti}>{l.clients.map(c => c.name).join(', ')}</span>
                                                    <button style={s.blockDel} onClick={e => handleDelete(e, l.id)}>×</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* ── FORM MODALE ── */}
            {showForm && (
                <div style={{ ...s.overlay, ...(isMobile ? { alignItems: 'flex-end' } : {}) }} onClick={() => setShowForm(false)}>
                    <div style={{
                        ...s.modal,
                        ...(isMobile ? {
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            borderRadius: '20px 20px 0 0',
                            width: '100%', maxWidth: '100%',
                            padding: '24px 20px 32px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                        } : {})
                    }} onClick={e => e.stopPropagation()}>
                        {isMobile && <div style={s.handle} />}
                        <h3 style={s.modalTitolo}>
                            {lezioneSelezionata ? 'Modifica lezione' : 'Nuova lezione'}
                        </h3>
                        <form onSubmit={handleSubmit} style={{ ...s.form, overflowY: 'auto', flex: 1 }}>
                            <label style={s.formLabel}>Data</label>
                            <input style={s.input} type="date" value={formData.data}
                                onChange={e => setFormData(p => ({ ...p, data: e.target.value }))} required />

                            <label style={s.formLabel}>Orario</label>
                            <div style={s.row}>
                                <select style={s.select} value={formData.inizio}
                                    onChange={e => setFormData(p => ({ ...p, inizio: e.target.value, fine: slotEnd(e.target.value) }))}>
                                    <option value="">Inizio</option>
                                    {SLOT_HOURS.filter(h => h !== '17:00').map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <select style={s.select} value={formData.fine}
                                    onChange={e => setFormData(p => ({ ...p, fine: e.target.value }))}>
                                    <option value="">Fine</option>
                                    {SLOT_HOURS.filter(h => h > formData.inizio).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                            </div>

                            <label style={s.formLabel}>Clienti</label>
                            <div style={s.chipGrid}>
                                {clienti.map(c => (
                                    <div key={c.code}
                                        style={{ ...s.clientChip, ...(formData.codici.includes(c.code) ? s.clientChipOn : {}) }}
                                        onClick={() => toggleCliente(c.code)}>
                                        {c.name} {c.surname}
                                    </div>
                                ))}
                            </div>

                            {errore && <p style={s.errore}>{errore}</p>}

                            <div style={s.row}>
                                <button style={s.submitBtn} type="submit">
                                    {lezioneSelezionata ? 'Salva' : 'Aggiungi'}
                                </button>
                                <button style={s.cancelBtn} type="button" onClick={() => setShowForm(false)}>
                                    Annulla
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const s = {
    page: { minHeight: '100vh', backgroundColor: '#f4f5f7', fontFamily: "'Segoe UI', sans-serif" },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#666' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', backgroundColor: '#1a1a2e', color: 'white' },
    brand: { fontWeight: '700', fontSize: '16px', letterSpacing: '0.5px' },
    nav: { display: 'flex', gap: '4px' },
    navBtn: { padding: '6px 16px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    navActive: { backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: '600' },
    logoutBtn: { padding: '6px 14px', backgroundColor: 'rgba(231,76,60,0.8)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    navCal: { display: 'flex', alignItems: 'center', gap: '8px' },
    arrowBtn: { width: '32px', height: '32px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', lineHeight: 1, color: '#1a1a2e' },
    labelMese: { padding: '6px 14px', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#1a1a2e', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    oggiBtn: { padding: '7px 16px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
    addBtnMobile: { width: '36px', height: '36px', backgroundColor: '#4361ee', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '22px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    pickerOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    pickerBox: { backgroundColor: 'white', borderRadius: '16px', padding: '24px', width: '280px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
    pickerHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' },
    pickerYear: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e' },
    mesGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' },
    meseBtn: { padding: '10px', backgroundColor: '#f4f5f7', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#1a1a2e' },
    meseBtnActive: { backgroundColor: '#1a1a2e', color: 'white' },
    calWrapper: { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
    headerRow: { display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '2px solid #f0f0f0', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 },
    timeColHeader: { backgroundColor: '#fafafa' },
    dayHeader: { padding: '12px 4px', textAlign: 'center', borderLeft: '1px solid #f0f0f0' },
    dayHeaderOggi: { backgroundColor: '#eef2ff' },
    dayShort: { display: 'block', fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
    dayNum: { display: 'block', fontSize: '18px', fontWeight: '600', color: '#1a1a2e', marginTop: '2px' },
    dayNumOggi: { backgroundColor: '#4361ee', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' },
    calBody: { overflowY: 'auto', maxHeight: 'calc(100vh - 210px)' },
    calBodyInner: { display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)' },
    timeCol: { backgroundColor: '#fafafa', borderRight: '1px solid #f0f0f0' },
    timeLabel: { height: SLOT_H, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '8px', paddingTop: '4px', fontSize: '11px', color: '#aaa', boxSizing: 'border-box' },
    dayCol: { position: 'relative', height: GRID_HEIGHT, borderLeft: '1px solid #f0f0f0', cursor: 'pointer' },
    slotLine: { position: 'absolute', left: 0, right: 0, height: 0, pointerEvents: 'none' },
    lezBlock: { position: 'absolute', left: '3px', right: '3px', backgroundColor: '#4361ee', color: 'white', borderRadius: '6px', padding: '4px 6px', overflow: 'hidden', cursor: 'pointer', boxSizing: 'border-box', boxShadow: '0 2px 6px rgba(67,97,238,0.3)' },
    blockOra: { display: 'block', fontWeight: '700', fontSize: '10px', opacity: 0.85 },
    blockClienti: { display: 'block', fontSize: '11px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    blockDel: { position: 'absolute', top: '3px', right: '5px', backgroundColor: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
    modal: { backgroundColor: 'white', borderRadius: '16px', padding: '28px', width: '400px', maxWidth: '90vw', boxSizing: 'border-box' , boxShadow: '0 16px 48px rgba(0,0,0,0.2)'},
    handle: { width: '40px', height: '4px', backgroundColor: '#ddd', borderRadius: '2px', margin: '0 auto 20px' },
    modalTitolo: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    formLabel: { fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', color: '#1a1a2e' },
    select: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white', color: '#1a1a2e', outline: 'none', boxSizing: 'border-box', minWidth: 0 },
    row: { display: 'flex', gap: '12px' },
    chipGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%' },
    clientChip: { padding: '6px 14px', borderRadius: '20px', backgroundColor: '#f0f0f0', cursor: 'pointer', fontSize: '13px', userSelect: 'none', boxSizing: 'border-box' },
    clientChipOn: { backgroundColor: '#1a1a2e', color: 'white' },
    errore: { color: '#e74c3c', fontSize: '13px' },
    submitBtn: { flex: 1, padding: '11px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    cancelBtn: { flex: 1, padding: '11px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
};


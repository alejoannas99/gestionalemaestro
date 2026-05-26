import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatsClienti, getStatsLezioni, getTopCliente, getLezioni, getOreMese, getOreAnno} from '../services/api';

const MESI_BREVI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const GIORNI_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const SLOT_H = 40;
const GRID_START = 9 * 60;

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

function toMin(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
function calcTop(hhmm) { return ((toMin(hhmm) - GRID_START) / 30) * SLOT_H; }
function calcHeight(st, fi) { return ((toMin(fi) - toMin(st)) / 30) * SLOT_H; }
function toISO(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function fmtOra(t) { return t ? t.substring(0, 5) : ''; }
function lunediDi(data) {
    const d = new Date(data); const day = d.getDay();
    d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day)); d.setHours(0,0,0,0); return d;
}
function settimana(lun) {
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(lun); d.setDate(lun.getDate()+i); return d; });
}

// ── GRAFICO ORE PER MESE ──────────────────────────────────────────────────────
function GraficoLezioni({ isMobile }) {
    const oggi = new Date();
    const numMesi = isMobile ? 3 : 6;
    const mesi = Array.from({ length: numMesi }, (_, i) => {
        const d = new Date(oggi.getFullYear(), oggi.getMonth() - (numMesi - 1) + i, 1);
        return { anno: d.getFullYear(), mese: d.getMonth() + 1, label: MESI_BREVI[d.getMonth()] };
    });

    const [conteggi, setConteggi] = useState([]);

    useEffect(() => {
        // chiama il backend per ogni mese in parallelo
        Promise.all(mesi.map(({ mese, anno }) => getOreMese(mese, anno).then(r => r.json())))
            .then(setConteggi);
    }, []);

    const totale = conteggi.reduce((a, b) => a + b, 0);
    const media = conteggi.length > 0 ? totale / conteggi.length : 0;
    const max = Math.max(...conteggi, 1);
    const W = 480; const H = 120;
    const barW = isMobile ? 72 : 48;
    const gap = (W - barW * numMesi) / (numMesi + 1);

    // finché i dati non arrivano non renderizza nulla
    if (conteggi.length === 0) return null;

    return (
        <div>
            <div style={s.graficoStats}>
                <div>
                    <div style={s.graficoLabel}>Totale ore</div>
                    <div style={s.graficoValTot}>{Math.round(totale * 10) / 10}h</div>
                </div>
                <div>
                    <div style={s.graficoLabel}>Media mensile</div>
                    <div style={s.graficoValMedia}>{Math.round(media * 10) / 10}h</div>
                </div>
            </div>
            <svg viewBox={`0 0 ${W} ${H + 44}`} style={{ width: '100%', height: 'auto' }}>
                {conteggi.map((val, i) => {
                    const barH = val === 0 ? 4 : (val / max) * H;
                    const x = gap + i * (barW + gap);
                    const y = H - barH;
                    const isOggi = mesi[i].mese - 1 === oggi.getMonth() && mesi[i].anno === oggi.getFullYear();
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={barW} height={barH} rx={6} fill={isOggi ? '#4361ee' : '#c7d2fe'} />
                            <text x={x+barW/2} y={H+16} textAnchor="middle" fontSize="11"
                                fill={isOggi ? '#4361ee' : '#aaa'} fontWeight={isOggi ? '700' : '400'}>
                                {mesi[i].label}
                            </text>
                            <text x={x+barW/2} y={H+30} textAnchor="middle" fontSize="10" fill={isOggi ? '#4361ee' : '#bbb'}>
                                {Math.round(val * 10) / 10}h
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// ── MINI CALENDARIO ───────────────────────────────────────────────────────────
function MiniCalendario({ lezioni, onNavigate, isMobile }) {
    const lunedi = lunediDi(new Date());
    const giorni = isMobile ? settimana(lunedi).slice(0, 5) : settimana(lunedi);
    const oggi_iso = toISO(new Date());
    const ORE = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
    const MINI_H = SLOT_H * 2;
    const GRID_H = SLOT_H * 16;
    const lezioniPerGiorno = {};
    lezioni.forEach(l => {
        if (!lezioniPerGiorno[l.date]) lezioniPerGiorno[l.date] = [];
        lezioniPerGiorno[l.date].push(l);
    });
    const n = giorni.length;
    const cols = `36px repeat(${n}, 1fr)`;

    return (
        <div style={s.mcWrapper} onClick={() => onNavigate('/lezioni')}>
            <div style={{ ...s.mcHeaderRow, gridTemplateColumns: cols }}>
                <div style={s.mcTimeColH} />
                {giorni.map((g, i) => {
                    const isOggi = toISO(g) === oggi_iso;
                    return (
                        <div key={i} style={{ ...s.mcDayH, ...(isOggi ? s.mcDayHOggi : {}) }}>
                            <span style={s.mcDayShort}>{GIORNI_SHORT[i]}</span>
                            <span style={{ ...s.mcDayNum, ...(isOggi ? s.mcDayNumOggi : {}) }}>
                                {g.getDate()}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div style={s.mcBody}>
                <div style={{ display: 'grid', gridTemplateColumns: cols }}>
                    <div style={s.mcTimeCol}>
                        {ORE.map(ora => (
                            <div key={ora} style={{ ...s.mcTimeLabel, height: MINI_H }}>{ora}</div>
                        ))}
                    </div>
                    {giorni.map((g, i) => {
                        const lez = lezioniPerGiorno[toISO(g)] || [];
                        return (
                            <div key={i} style={{ ...s.mcDayCol, height: GRID_H }}>
                                {ORE.map((_, si) => (
                                    <div key={si} style={{ ...s.mcSlotLine, top: si * MINI_H }} />
                                ))}
                                {lez.map(l => (
                                    <div key={l.id} style={{
                                        ...s.mcLezBlock,
                                        top: calcTop(fmtOra(l.start)),
                                        height: Math.max(calcHeight(fmtOra(l.start), fmtOra(l.finish)), 8)
                                    }} />
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div style={s.mcFooter}>Apri calendario completo →</div>
        </div>
    );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export default function DashboardPage({ onLogout }) {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [statsClienti, setStatsClienti] = useState(0);
    const [oreTotali, setOreTotali] = useState(0);
    const [topCliente, setTopCliente] = useState(null);
    const [lezioni, setLezioni] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getStatsClienti().then(r => r.json()),
            getOreAnno(new Date().getFullYear()).then(r => r.json()),
            getTopCliente().then(r => r.ok ? r.json() : null),
            getLezioni().then(r => r.json()),
        ]).then(([clienti, oreAnno, top, tutteLeLezioni]) => {
            setStatsClienti(clienti);
            setOreTotali(oreAnno);
            setTopCliente(top);
            setLezioni(Array.isArray(tutteLeLezioni) ? tutteLeLezioni : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const oggi_iso = toISO(new Date());
    const lezioniOggi = lezioni.filter(l => l.date === oggi_iso).sort((a, b) => a.start.localeCompare(b.start));
    const lun = lunediDi(new Date());
    const dom = new Date(lun); dom.setDate(lun.getDate() + 6);
    const lezioniSettimana = lezioni.filter(l => { const d = new Date(l.date); return d >= lun && d <= dom; }).length;

    if (loading) return <div style={s.loading}>Caricamento...</div>;

    const statCards = [
        { icon: '👥', bg: '#eef2ff', label: 'Clienti', value: statsClienti, onClick: () => navigate('/clienti') },
        { icon: '📅', bg: '#ecfdf5', label: 'Ore totali', value: oreTotali, onClick: () => navigate('/lezioni') },
        { icon: '🏆', bg: '#fff7ed', label: 'Top cliente', value: topCliente ? `${topCliente.name} ${topCliente.surname}` : '—' },
        { icon: '⏰', bg: '#f0f9ff', label: 'Oggi', value: lezioniOggi.length, highlight: lezioniOggi.length > 0 },
    ];

    return (
        <div style={s.page}>
            {/* HEADER */}
            <div style={s.header}>
                <span style={s.brand}>GestionaleMaestro</span>
                <div style={s.nav}>
                    {[['Dashboard','🏠','/dashboard',true],['Clienti','👥','/clienti'],['Lezioni','📅','/lezioni']].map(([label, icon, path, active]) => (
                        <button key={path} onClick={() => navigate(path)}
                            style={{ ...s.navBtn, ...(active ? s.navActive : {}) }}>
                            {isMobile ? icon : label}
                        </button>
                    ))}
                </div>
                <button style={s.logoutBtn} onClick={onLogout}>{isMobile ? '↩' : 'Esci'}</button>
            </div>

            <div style={{ ...s.content, padding: isMobile ? '16px' : '20px 24px' }}>
                {/* STAT CARDS */}
                <div style={{ ...s.statsRow, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '16px' }}>
                    {statCards.map(({ icon, bg, label, value, onClick, highlight }) => (
                        <div key={label} onClick={onClick}
                            style={{ ...s.statCard, ...(highlight ? s.statCardOggi : {}), cursor: onClick ? 'pointer' : 'default' }}>
                            <div style={{ ...s.statIcon, backgroundColor: bg }}>{icon}</div>
                            <div>
                                <p style={s.statLabel}>{label}</p>
                                <p style={{ ...s.statValue, fontSize: typeof value === 'string' && value.length > 6 ? '16px' : '22px' }}>
                                    {value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* OGGI + MINI CALENDARIO */}
                <div style={{ ...s.row2, gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: isMobile ? '12px' : '16px' }}>
                    <div style={s.card}>
                        <div style={s.cardHeader}>
                            <span style={s.cardTitolo}>Oggi</span>
                            <span style={s.cardData}>{new Date().toLocaleDateString('it-IT', { weekday: isMobile ? 'short' : 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                        {lezioniOggi.length === 0 ? (
                            <div style={s.emptyOggi}>
                                <span style={{ fontSize: '32px' }}>☀️</span>
                                <p style={s.emptyOggiTesto}>Nessuna lezione oggi</p>
                            </div>
                        ) : (
                            <div style={s.lezioniOggiLista}>
                                {lezioniOggi.map(l => (
                                    <div key={l.id} style={s.lezioneOggiCard}>
                                        <div style={s.lezioneOra}>
                                            <span style={s.lezioneOraText}>{fmtOra(l.start)}</span>
                                            <span style={s.lezioneOraSep}>|</span>
                                            <span style={s.lezioneOraText}>{fmtOra(l.finish)}</span>
                                        </div>
                                        <div style={s.lezioneInfo}>
                                            <p style={s.lezioneClienti}>{l.clients.map(c => `${c.name} ${c.surname}`).join(', ')}</p>
                                            <p style={s.lezioneDurata}>{toMin(fmtOra(l.finish)) - toMin(fmtOra(l.start))} min</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={s.miniCalCard}>
                        <div style={s.cardHeader}>
                            <span style={s.cardTitolo}>Questa settimana</span>
                            <span style={s.cardData}>{lezioniSettimana} lezioni</span>
                        </div>
                        <MiniCalendario lezioni={lezioni} onNavigate={navigate} isMobile={isMobile} />
                    </div>
                </div>

                {/* GRAFICO */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <span style={s.cardTitolo}>{isMobile ? 'Ore ultimi 3 mesi' : 'Ore negli ultimi 6 mesi'}</span>
                    </div>
                    <GraficoLezioni isMobile={isMobile} />
                </div>
            </div>
        </div>
    );
}

// ── STILI ─────────────────────────────────────────────────────────────────────
const s = {
    // layout
    page: { minHeight: '100vh', backgroundColor: '#f4f5f7', fontFamily: "'Segoe UI', sans-serif" },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#666' },
    content: { display: 'flex', flexDirection: 'column', gap: '16px' },
    // header
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', backgroundColor: '#1a1a2e', color: 'white' },
    brand: { fontWeight: '700', fontSize: '16px', letterSpacing: '0.5px' },
    nav: { display: 'flex', gap: '4px' },
    navBtn: { padding: '6px 16px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    navActive: { backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: '600' },
    logoutBtn: { padding: '6px 14px', backgroundColor: 'rgba(231,76,60,0.8)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    // stat cards
    statsRow: { display: 'grid' },
    statCard: { backgroundColor: 'white', borderRadius: '14px', padding: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px' },
    statCardOggi: { borderLeft: '3px solid #4361ee' },
    statIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 },
    statLabel: { fontSize: '11px', color: '#888', marginBottom: '3px', fontWeight: '500' },
    statValue: { fontWeight: '700', color: '#1a1a2e', lineHeight: 1 },
    // card generica
    card: { backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    cardTitolo: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e' },
    cardData: { fontSize: '12px', color: '#888' },
    // row oggi + calendario
    row2: { display: 'grid' },
    miniCalCard: { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' },
    // lezioni oggi
    emptyOggi: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '8px' },
    emptyOggiTesto: { color: '#aaa', fontSize: '13px' },
    lezioniOggiLista: { display: 'flex', flexDirection: 'column', gap: '8px' },
    lezioneOggiCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', backgroundColor: '#f8f9ff', borderRadius: '10px', borderLeft: '3px solid #4361ee' },
    lezioneOra: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '40px' },
    lezioneOraText: { fontSize: '11px', fontWeight: '700', color: '#4361ee' },
    lezioneOraSep: { fontSize: '8px', color: '#ccc' },
    lezioneInfo: { flex: 1 },
    lezioneClienti: { fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginBottom: '2px' },
    lezioneDurata: { fontSize: '11px', color: '#888' },
    // grafico
    graficoStats: { display: 'flex', gap: '24px', marginBottom: '12px' },
    graficoLabel: { fontSize: '11px', color: '#888' },
    graficoValTot: { fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
    graficoValMedia: { fontSize: '22px', fontWeight: '700', color: '#4361ee' },
    // mini calendario
    mcWrapper: { backgroundColor: 'white', overflow: 'hidden', cursor: 'pointer' },
    mcHeaderRow: { display: 'grid', borderBottom: '1px solid #f0f0f0', backgroundColor: 'white' },
    mcTimeColH: { backgroundColor: '#fafafa' },
    mcDayH: { padding: '8px 2px', textAlign: 'center', borderLeft: '1px solid #f5f5f5' },
    mcDayHOggi: { backgroundColor: '#eef2ff' },
    mcDayShort: { display: 'block', fontSize: '9px', color: '#aaa', textTransform: 'uppercase' },
    mcDayNum: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#1a1a2e', marginTop: '1px' },
    mcDayNumOggi: { backgroundColor: '#4361ee', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' },
    mcBody: { overflowY: 'hidden', maxHeight: '200px', overflowX: 'hidden' },
    mcTimeCol: { backgroundColor: '#fafafa', borderRight: '1px solid #f0f0f0' },
    mcTimeLabel: { display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '4px', paddingTop: '2px', fontSize: '9px', color: '#ccc', boxSizing: 'border-box' },
    mcDayCol: { position: 'relative', borderLeft: '1px solid #f5f5f5' },
    mcSlotLine: { position: 'absolute', left: 0, right: 0, height: 0, borderTop: '1px solid #f0f0f0', pointerEvents: 'none' },
    mcLezBlock: { position: 'absolute', left: '1px', right: '1px', backgroundColor: '#4361ee', borderRadius: '3px', minHeight: '4px' },
    mcFooter: { padding: '8px', textAlign: 'center', fontSize: '12px', color: '#4361ee', fontWeight: '600', borderTop: '1px solid #f0f0f0', backgroundColor: '#fafeff' },
};
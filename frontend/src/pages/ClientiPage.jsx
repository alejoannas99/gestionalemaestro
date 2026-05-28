import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClienti, addCliente, updateCliente, deleteCliente } from '../services/api';

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

// ── Helper colore avatar ─────────────────────────────────────────────────────
const AVATAR_COLORS = ['#4361ee', '#e63946', '#2a9d8f', '#e76f51', '#8338ec', '#3a86ff'];
function avatarColor(name) {
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function ClientiPage({ onLogout }) {
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const [clienti, setClienti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cerca, setCerca] = useState('');
    const [ordine, setOrdine] = useState('nome');
    const [showForm, setShowForm] = useState(false);
    const [clienteSelezionato, setClienteSelezionato] = useState(null);
    const [formData, setFormData] = useState({ nome: '', cognome: '', telefono: '' });
    const [errore, setErrore] = useState('');

    useEffect(() => { caricaClienti(); }, []);

    const caricaClienti = () => {
        getClienti()
            .then(r => r.json())
            .then(data => { setClienti(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    const clientiFiltrati = clienti
        .filter(c => {
            const q = cerca.toLowerCase();
            return c.name.toLowerCase().includes(q) || c.surname.toLowerCase().includes(q);
        })
        .sort((a, b) => ordine === 'lezioni'
            ? b.lessonsAttended - a.lessonsAttended
            : a.name.localeCompare(b.name)
        );

    const apriFormNuovo = () => {
        setClienteSelezionato(null);
        setFormData({ nome: '', cognome: '', telefono: '' });
        setErrore('');
        setShowForm(true);
    };

    const apriFormModifica = (cliente) => {
        setClienteSelezionato(cliente);
        setFormData({ nome: cliente.name, cognome: cliente.surname, telefono: cliente.numTel || '' });
        setErrore('');
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrore('');
        try {
            const res = clienteSelezionato
                ? await updateCliente(clienteSelezionato.code, formData.nome, formData.cognome, formData.telefono || null)
                : await addCliente(formData.nome, formData.cognome, formData.telefono || null);
            if (res.ok) { setShowForm(false); caricaClienti(); }
            else setErrore(await res.text());
        } catch { setErrore('Errore di connessione'); }
    };

    const handleDelete = async (code) => {
        if (!window.confirm('Eliminare questo cliente?')) return;
        const res = await deleteCliente(code);
        if (res.ok) caricaClienti();
    };

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
                    <button style={{ ...s.navBtn, ...s.navActive }}>
                        {isMobile ? '👥' : 'Clienti'}
                    </button>
                    <button style={s.navBtn} onClick={() => navigate('/lezioni')}>
                        {isMobile ? '📅' : 'Lezioni'}
                    </button>
                </div>
                <button style={s.logoutBtn} onClick={onLogout}>
                    {isMobile ? '↩' : 'Esci'}
                </button>
            </div>

            {/* ── TOOLBAR ──
                Desktop: tutto su una riga
                Mobile: titolo+badge sopra, ricerca+filtri+aggiungi sotto */}
            <div style={{ ...s.toolbar, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '10px' : '0', padding: isMobile ? '14px 16px' : '20px 24px' }}>
                <div style={s.toolbarLeft}>
                    <span style={s.titoloPagina}>Clienti</span>
                    <span style={s.badge}>{clientiFiltrati.length}</span>
                </div>
                <div style={{ ...s.toolbarRight, width: isMobile ? '100%' : 'auto', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                    <input
                        style={{ ...s.searchInput, flex: isMobile ? 1 : 'none', minWidth: isMobile ? '0' : '200px' }}
                        placeholder="🔍  Cerca cliente..."
                        value={cerca}
                        onChange={e => setCerca(e.target.value)}
                    />
                    <div style={s.ordineGroup}>
                        <button style={{ ...s.ordineBtn, ...(ordine === 'nome' ? s.ordineBtnActive : {}) }}
                            onClick={() => setOrdine('nome')}>A–Z</button>
                        <button style={{ ...s.ordineBtn, ...(ordine === 'lezioni' ? s.ordineBtnActive : {}) }}
                            onClick={() => setOrdine('lezioni')}>Lezioni ↓</button>
                    </div>
                    <button style={s.addBtn} onClick={apriFormNuovo}>+ Aggiungi</button>
                </div>
            </div>

            {/* ── LISTA ── */}
            <div style={{ padding: isMobile ? '0 16px 24px' : '0 24px 24px' }}>
                {clientiFiltrati.length === 0 ? (
                    <div style={s.empty}>
                        <p style={{ fontSize: '48px', marginBottom: '16px' }}>👤</p>
                        <p style={s.emptyTesto}>
                            {cerca ? `Nessun cliente trovato per "${cerca}"` : 'Nessun cliente ancora. Aggiungine uno!'}
                        </p>
                    </div>
                ) : (
                    <div style={s.lista}>
                        {clientiFiltrati.map(cliente => (
                            <div key={cliente.code} style={s.card}>
                                <div style={s.cardLeft}>
                                    <div style={{ ...s.avatar, backgroundColor: avatarColor(cliente.name) }}>
                                        {cliente.name[0]}{cliente.surname[0]}
                                    </div>
                                    <div>
                                        <p style={s.cardNome}>{cliente.name} {cliente.surname}</p>
                                        <p style={s.cardDettaglio}>
                                            {cliente.numTel
                                                ? <span>📞 {cliente.numTel}</span>
                                                : <span style={{ color: '#bbb' }}>Nessun telefono</span>}
                                        </p>
                                    </div>
                                </div>
                                <div style={s.cardRight}>
                                    {/* Badge lezioni — nascosto su mobile piccolo per spazio */}
                                    {!isMobile && (
                                        <div style={s.lezioniBadge}>
                                            <span style={s.lezioniNum}>{cliente.lessonsAttended}</span>
                                            <span style={s.lezioniLabel}>lezioni</span>
                                        </div>
                                    )}
                                    {isMobile && (
                                        <span style={s.lezioniMobile}>{cliente.lessonsAttended} lez.</span>
                                    )}
                                    <button style={s.editBtn} onClick={() => apriFormModifica(cliente)}>
                                        {isMobile ? '✏️' : 'Modifica'}
                                    </button>
                                    <button style={s.deleteBtn} onClick={() => handleDelete(cliente.code)}>
                                        {isMobile ? '🗑️' : 'Elimina'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── FORM MODALE ── */}
            {showForm && (
                <div style={s.overlay} onClick={() => setShowForm(false)}>
                    <div style={{
                        ...s.modal,
                        // su mobile il modale occupa quasi tutto lo schermo dal basso
                        ...(isMobile ? {
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            borderRadius: '20px 20px 0 0',
                            width: '100%', maxWidth: '100%',
                            padding: '24px 20px 32px'
                        } : {})
                    }} onClick={e => e.stopPropagation()}>
                        {/* maniglia visiva su mobile (stile bottom sheet) */}
                        {isMobile && <div style={s.handle} />}
                        <h3 style={s.modalTitolo}>
                            {clienteSelezionato ? 'Modifica cliente' : 'Nuovo cliente'}
                        </h3>
                        <form onSubmit={handleSubmit} style={s.form}>
                            <label style={s.formLabel}>Nome</label>
                            <input style={s.input} placeholder="Es. Marco"
                                value={formData.nome}
                                onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} required />
                            <label style={s.formLabel}>Cognome</label>
                            <input style={s.input} placeholder="Es. Rossi"
                                value={formData.cognome}
                                onChange={e => setFormData(p => ({ ...p, cognome: e.target.value }))} required />
                            <label style={s.formLabel}>
                                Telefono <span style={s.opzionale}>(opzionale)</span>
                            </label>
                            <input style={s.input} placeholder="Es. 333 1234567"
                                value={formData.telefono}
                                onChange={e => setFormData(p => ({ ...p, telefono: e.target.value }))} />
                            {errore && <p style={s.errore}>{errore}</p>}
                            <div style={s.formBtns}>
                                <button style={s.submitBtn} type="submit">
                                    {clienteSelezionato ? 'Salva' : 'Aggiungi'}
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
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6c6767' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', backgroundColor: '#1a1a2e', color: 'white' },
    brand: { fontWeight: '700', fontSize: '16px', letterSpacing: '0.5px' },
    nav: { display: 'flex', gap: '4px' },
    navBtn: { padding: '6px 16px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    navActive: { backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: '600' },
    logoutBtn: { padding: '6px 14px', backgroundColor: 'rgba(231,76,60,0.8)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    toolbarLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    titoloPagina: { fontSize: '22px', fontWeight: '700', color: '#1a1a2e' },
    badge: { backgroundColor: '#4361ee', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: '600' },
    toolbarRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    searchInput: { padding: '8px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white', color: '#1a1a2e', outline: 'none' },
    ordineGroup: { display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' },
    ordineBtn: { padding: '8px 12px', backgroundColor: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#555' },
    ordineBtnActive: { backgroundColor: '#1a1a2e', color: 'white' },
    addBtn: { padding: '8px 16px', backgroundColor: '#4361ee', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' },
    empty: { textAlign: 'center', marginTop: '80px' },
    emptyTesto: { color: '#888', fontSize: '15px' },
    lista: { display: 'flex', flexDirection: 'column', gap: '10px' },
    card: { backgroundColor: 'white', padding: '14px 16px', borderRadius: '12px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardLeft: { display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 },
    avatar: { width: '44px', height: '44px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 },
    cardNome: { fontWeight: '600', color: '#1a1a2e', marginBottom: '3px', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    cardDettaglio: { fontSize: '13px', color: '#666' },
    cardRight: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
    lezioniBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f0f4ff', borderRadius: '10px', padding: '6px 12px', minWidth: '56px' },
    lezioniNum: { fontSize: '18px', fontWeight: '700', color: '#4361ee', lineHeight: 1 },
    lezioniLabel: { fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' },
    lezioniMobile: { fontSize: '12px', fontWeight: '600', color: '#4361ee', backgroundColor: '#f0f4ff', padding: '4px 8px', borderRadius: '8px' },
    editBtn: { padding: '6px 12px', backgroundColor: '#f0f4ff', color: '#4361ee', border: '1px solid #d0d9ff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
    deleteBtn: { padding: '6px 12px', backgroundColor: '#fff0f0', color: '#e74c3c', border: '1px solid #ffd0d0', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
    modal: { backgroundColor: 'white', borderRadius: '16px', padding: '28px', width: '380px', maxWidth: '90vw',boxSizing: 'border-box', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' },
    handle: { width: '40px', height: '4px', backgroundColor: '#ddd', borderRadius: '2px', margin: '0 auto 20px' },
    modalTitolo: { fontSize: '18px', fontWeight: '700', color: '#1a1a2e', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    formLabel: { fontSize: '12px', fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' },
    opzionale: { fontWeight: '400', textTransform: 'none', color: '#aaa', fontSize: '11px' },
    input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', color: '#1a1a2e' },
    errore: { color: '#e74c3c', fontSize: '13px' },
    formBtns: { display: 'flex', gap: '12px', marginTop: '4px' },
    submitBtn: { flex: 1, padding: '11px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    cancelBtn: { flex: 1, padding: '11px', backgroundColor: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
};

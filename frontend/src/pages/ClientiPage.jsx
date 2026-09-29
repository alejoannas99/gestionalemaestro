import { useState, useEffect } from 'react';
import { getClienti, addCliente, updateCliente, deleteCliente } from '../services/api';
import AppShell from '../components/AppShell';
import Avatar from '../components/Avatar';

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

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function ClientiPage({ onLogout }) {
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
        <AppShell ruolo="INSTRUCTOR" onLogout={onLogout} piena>

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
                                    <Avatar userId={cliente.accountId} nome={cliente.name} cognome={cliente.surname} size={44} />
                                    <div>
                                        <p style={s.cardNome}>{cliente.name} {cliente.surname}</p>
                                        <p style={s.cardDettaglio}>
                                            {cliente.numTel
                                                ? <span>📞 {cliente.numTel}</span>
                                                : <span style={{ color: 'var(--faint)' }}>Nessun telefono</span>}
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
        </AppShell>
    );
}

const s = {
    page: { minHeight: '100vh', backgroundColor: 'var(--bg)', fontFamily: "'Segoe UI', sans-serif" },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '56px', backgroundColor: 'var(--header-bg)', color: 'white' },
    brand: { fontWeight: '700', fontSize: '16px', letterSpacing: '0.5px' },
    nav: { display: 'flex', gap: '4px' },
    navBtn: { padding: '6px 16px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
    navActive: { backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: '600' },
    logoutBtn: { padding: '6px 14px', backgroundColor: 'rgba(231,76,60,0.8)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
    toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    toolbarLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    titoloPagina: { fontSize: '22px', fontWeight: '700', color: 'var(--text)' },
    badge: { backgroundColor: 'var(--brand)', color: 'white', borderRadius: '20px', padding: '2px 10px', fontSize: '13px', fontWeight: '600' },
    toolbarRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    searchInput: { padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', backgroundColor: 'var(--surface)', color: 'var(--text)', outline: 'none' },
    ordineGroup: { display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' },
    ordineBtn: { padding: '8px 12px', backgroundColor: 'var(--surface)', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--muted)' },
    ordineBtnActive: { backgroundColor: 'var(--primary)', color: 'white' },
    addBtn: { padding: '8px 16px', backgroundColor: 'var(--brand)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' },
    empty: { textAlign: 'center', marginTop: '80px' },
    emptyTesto: { color: 'var(--muted)', fontSize: '15px' },
    lista: { display: 'flex', flexDirection: 'column', gap: '10px' },
    card: { backgroundColor: 'var(--surface)', padding: '14px 16px', borderRadius: '12px', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardLeft: { display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 },
    cardNome: { fontWeight: '600', color: 'var(--text)', marginBottom: '3px', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    cardDettaglio: { fontSize: '13px', color: 'var(--muted)' },
    cardRight: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
    lezioniBadge: { display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--accent-soft)', borderRadius: '10px', padding: '6px 12px', minWidth: '56px' },
    lezioniNum: { fontSize: '18px', fontWeight: '700', color: 'var(--accent)', lineHeight: 1 },
    lezioniLabel: { fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' },
    lezioniMobile: { fontSize: '12px', fontWeight: '600', color: 'var(--accent)', backgroundColor: 'var(--accent-soft)', padding: '4px 8px', borderRadius: '8px' },
    editBtn: { padding: '6px 12px', backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
    deleteBtn: { padding: '6px 12px', backgroundColor: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--danger-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
    modal: { backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '28px', width: '380px', maxWidth: '90vw',boxSizing: 'border-box', boxShadow: 'var(--shadow-lg)' },
    handle: { width: '40px', height: '4px', backgroundColor: 'var(--border)', borderRadius: '2px', margin: '0 auto 20px' },
    modalTitolo: { fontSize: '18px', fontWeight: '700', color: 'var(--text)', marginBottom: '20px' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    formLabel: { fontSize: '12px', fontWeight: '600', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
    opzionale: { fontWeight: '400', textTransform: 'none', color: 'var(--faint)', fontSize: '11px' },
    input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none', color: 'var(--text)', backgroundColor: 'var(--surface)' },
    errore: { color: 'var(--danger)', fontSize: '13px' },
    formBtns: { display: 'flex', gap: '12px', marginTop: '4px' },
    submitBtn: { flex: 1, padding: '11px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
    cancelBtn: { flex: 1, padding: '11px', backgroundColor: 'var(--surface-2)', color: 'var(--text)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
};

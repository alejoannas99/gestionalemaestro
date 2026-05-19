import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLezioni, getClienti, addLezione, updateLezione, deleteLezione } from '../services/api';

function LezioniPage({ onLogout }) {
    const [lezioni, setLezioni] = useState([]);
    const [clienti, setClienti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [lezioneSelezionata, setLezioneSelezionata] = useState(null);
    const [data, setData] = useState('');
    const [inizio, setInizio] = useState('');
    const [fine, setFine] = useState('');
    const [codiciSelezionati, setCodiciSelezionati] = useState([]);
    const [errore, setErrore] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            getLezioni().then(r => r.json()),
            getClienti().then(r => r.json())
        ]).then(([lez, cli]) => {
            setLezioni(lez);
            setClienti(cli);
            setLoading(false);
        });
    }, []);

    const caricaLezioni = () => {
        getLezioni().then(r => r.json()).then(setLezioni);
    };

    const apriFormNuovo = () => {
        setLezioneSelezionata(null);
        setData('');
        setInizio('');
        setFine('');
        setCodiciSelezionati([]);
        setErrore('');
        setShowForm(true);
    };

    const apriFormModifica = (lezione) => {
        setLezioneSelezionata(lezione);
        setData(lezione.date);
        setInizio(lezione.start.substring(0, 5));
        setFine(lezione.finish.substring(0, 5));
        setCodiciSelezionati(lezione.clients.map(c => c.code));
        setErrore('');
        setShowForm(true);
    };

    const chiudiForm = () => {
        setShowForm(false);
        setLezioneSelezionata(null);
    };

    const toggleCliente = (code) => {
        setCodiciSelezionati(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrore('');
        if (codiciSelezionati.length === 0) {
            setErrore('Seleziona almeno un cliente');
            return;
        }
        try {
            let res;
            if (lezioneSelezionata) {
                res = await updateLezione(lezioneSelezionata.id, data, inizio, fine, codiciSelezionati);
            } else {
                res = await addLezione(data, inizio, fine, codiciSelezionati);
            }
            if (res.ok) {
                chiudiForm();
                caricaLezioni();
            } else {
                const msg = await res.text();
                setErrore(msg);
            }
        } catch (err) {
            setErrore('Errore di connessione');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questa lezione?')) return;
        const res = await deleteLezione(id);
        if (res.ok) {
            caricaLezioni();
        } else {
            alert('Errore durante l\'eliminazione');
        }
    };

    if (loading) return <p style={{ padding: '24px' }}>Caricamento...</p>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.titolo}>GestionaleMaestro</h1>
                <button style={styles.logoutBtn} onClick={onLogout}>Esci</button>
            </div>

            <div style={styles.nav}>
                <button style={styles.navBtn} onClick={() => navigate('/dashboard')}>Dashboard</button>
                <button style={styles.navBtn} onClick={() => navigate('/clienti')}>Clienti</button>
                <button style={styles.navBtnActive}>Lezioni</button>
            </div>

            <div style={styles.toolbar}>
                <h2 style={styles.sezione}>Le tue lezioni ({lezioni.length})</h2>
                <button style={styles.addBtn} onClick={apriFormNuovo}>+ Aggiungi lezione</button>
            </div>

            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitolo}>
                        {lezioneSelezionata ? 'Modifica lezione' : 'Nuova lezione'}
                    </h3>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <input
                            style={styles.input}
                            type="date"
                            value={data}
                            onChange={e => setData(e.target.value)}
                            required
                        />
                        <div style={styles.orari}>
                            <input
                                style={styles.input}
                                type="time"
                                value={inizio}
                                onChange={e => setInizio(e.target.value)}
                                required
                            />
                            <input
                                style={styles.input}
                                type="time"
                                value={fine}
                                onChange={e => setFine(e.target.value)}
                                required
                            />
                        </div>
                        <p style={styles.label}>Seleziona clienti:</p>
                        <div style={styles.clientiGrid}>
                            {clienti.map(c => (
                                <div
                                    key={c.code}
                                    style={{
                                        ...styles.clienteChip,
                                        ...(codiciSelezionati.includes(c.code) ? styles.clienteChipSelezionato : {})
                                    }}
                                    onClick={() => toggleCliente(c.code)}
                                >
                                    {c.name} {c.surname}
                                </div>
                            ))}
                        </div>
                        {errore && <p style={styles.errore}>{errore}</p>}
                        <div style={styles.formBtns}>
                            <button style={styles.submitBtn} type="submit">
                                {lezioneSelezionata ? 'Salva modifiche' : 'Aggiungi'}
                            </button>
                            <button style={styles.cancelBtn} type="button" onClick={chiudiForm}>Annulla</button>
                        </div>
                    </form>
                </div>
            )}

            {lezioni.length === 0 ? (
                <p style={styles.empty}>Nessuna lezione ancora. Aggiungine una!</p>
            ) : (
                <div style={styles.lista}>
                    {lezioni.map(lezione => (
                        <div key={lezione.id} style={styles.card}>
                            <div style={styles.cardInfo}>
                                <div style={styles.dataBox}>
                                    <p style={styles.dataGiorno}>{new Date(lezione.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</p>
                                </div>
                                <div>
                                    <p style={styles.cardOrario}>
                                        {lezione.start.substring(0, 5)} — {lezione.finish.substring(0, 5)}
                                    </p>
                                    <p style={styles.cardClienti}>
                                        {lezione.clients.map(c => `${c.name} ${c.surname}`).join(', ')}
                                    </p>
                                </div>
                            </div>
                            <div style={styles.cardBtns}>
                                <button style={styles.editBtn} onClick={() => apriFormModifica(lezione)}>Modifica</button>
                                <button style={styles.deleteBtn} onClick={() => handleDelete(lezione.id)}>Elimina</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titolo: { fontSize: '22px', color: '#1a1a2e' },
    logoutBtn: { padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    nav: { display: 'flex', gap: '12px', marginBottom: '32px' },
    navBtn: { padding: '10px 24px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    navBtnActive: { padding: '10px 24px', backgroundColor: '#e8e8e8', color: '#1a1a2e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    sezione: { fontSize: '18px', color: '#333' },
    addBtn: { padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    formCard: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '24px' },
    formTitolo: { fontSize: '16px', color: '#1a1a2e', marginBottom: '16px' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', flex: 1 },
    orari: { display: 'flex', gap: '12px' },
    label: { fontSize: '13px', color: '#555', marginBottom: '4px' },
    clientiGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
    clienteChip: { padding: '6px 14px', borderRadius: '20px', backgroundColor: '#f0f0f0', cursor: 'pointer', fontSize: '13px', userSelect: 'none' },
    clienteChipSelezionato: { backgroundColor: '#1a1a2e', color: 'white' },
    errore: { color: 'red', fontSize: '13px' },
    formBtns: { display: 'flex', gap: '12px' },
    submitBtn: { padding: '10px 24px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    cancelBtn: { padding: '10px 24px', backgroundColor: '#e8e8e8', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    empty: { color: '#888', textAlign: 'center', marginTop: '48px' },
    lista: { display: 'flex', flexDirection: 'column', gap: '12px' },
    card: { backgroundColor: 'white', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
    dataBox: { width: '52px', height: '52px', borderRadius: '10px', backgroundColor: '#1a1a2e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    dataGiorno: { fontSize: '12px', fontWeight: 'bold', lineHeight: '1.3' },
    cardOrario: { fontWeight: 'bold', color: '#1a1a2e', marginBottom: '4px' },
    cardClienti: { fontSize: '13px', color: '#888' },
    cardBtns: { display: 'flex', gap: '8px' },
    editBtn: { padding: '6px 14px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    deleteBtn: { padding: '6px 14px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};

export default LezioniPage;
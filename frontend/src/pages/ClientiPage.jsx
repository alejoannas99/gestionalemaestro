import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClienti, addCliente, updateCliente, deleteCliente } from '../services/api';

function ClientiPage({ onLogout }) {
    const [clienti, setClienti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [clienteSelezionato, setClienteSelezionato] = useState(null);
    const [nome, setNome] = useState('');
    const [cognome, setCognome] = useState('');
    const [telefono, setTelefono] = useState('');
    const [errore, setErrore] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        caricaClienti();
    }, []);

    const caricaClienti = () => {
        getClienti()
            .then(r => r.json())
            .then(data => {
                setClienti(data);
                setLoading(false);
            });
    };

    const apriFormNuovo = () => {
        setClienteSelezionato(null);
        setNome('');
        setCognome('');
        setTelefono('');
        setErrore('');
        setShowForm(true);
    };

    const apriFormModifica = (cliente) => {
        setClienteSelezionato(cliente);
        setNome(cliente.name);
        setCognome(cliente.surname);
        setTelefono(cliente.numTel || '');
        setErrore('');
        setShowForm(true);
    };

    const chiudiForm = () => {
        setShowForm(false);
        setClienteSelezionato(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrore('');
        try {
            let res;
            if (clienteSelezionato) {
                res = await updateCliente(clienteSelezionato.code, nome, cognome, telefono || null);
            } else {
                res = await addCliente(nome, cognome, telefono || null);
            }
            if (res.ok) {
                chiudiForm();
                caricaClienti();
            } else {
                const msg = await res.text();
                setErrore(msg);
            }
        } catch (err) {
            setErrore('Errore di connessione');
        }
    };

    const handleDelete = async (code) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo cliente?')) return;
        const res = await deleteCliente(code);
        if (res.ok) {
            caricaClienti();
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
                <button style={styles.navBtnActive}>Clienti</button>
                <button style={styles.navBtn} onClick={() => navigate('/lezioni')}>Lezioni</button>
            </div>

            <div style={styles.toolbar}>
                <h2 style={styles.sezione}>I tuoi clienti ({clienti.length})</h2>
                <button style={styles.addBtn} onClick={apriFormNuovo}>+ Aggiungi cliente</button>
            </div>

            {showForm && (
                <div style={styles.formCard}>
                    <h3 style={styles.formTitolo}>
                        {clienteSelezionato ? 'Modifica cliente' : 'Nuovo cliente'}
                    </h3>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <input style={styles.input} placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} required />
                        <input style={styles.input} placeholder="Cognome" value={cognome} onChange={e => setCognome(e.target.value)} required />
                        <input style={styles.input} placeholder="Telefono (opzionale)" value={telefono} onChange={e => setTelefono(e.target.value)} />
                        {errore && <p style={styles.errore}>{errore}</p>}
                        <div style={styles.formBtns}>
                            <button style={styles.submitBtn} type="submit">
                                {clienteSelezionato ? 'Salva modifiche' : 'Aggiungi'}
                            </button>
                            <button style={styles.cancelBtn} type="button" onClick={chiudiForm}>Annulla</button>
                        </div>
                    </form>
                </div>
            )}

            {clienti.length === 0 ? (
                <p style={styles.empty}>Nessun cliente ancora. Aggiungine uno!</p>
            ) : (
                <div style={styles.lista}>
                    {clienti.map(cliente => (
                        <div key={cliente.code} style={styles.card}>
                            <div style={styles.cardInfo}>
                                <div style={styles.avatar}>
                                    {cliente.name[0]}{cliente.surname[0]}
                                </div>
                                <div>
                                    <p style={styles.cardNome}>{cliente.name} {cliente.surname}</p>
                                    <p style={styles.cardDettaglio}>
                                        {cliente.numTel || 'Nessun telefono'} · {cliente.lessonsAttended} lezioni
                                    </p>
                                </div>
                            </div>
                            <div style={styles.cardBtns}>
                                <button style={styles.editBtn} onClick={() => apriFormModifica(cliente)}>Modifica</button>
                                <button style={styles.deleteBtn} onClick={() => handleDelete(cliente.code)}>Elimina</button>
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
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
    errore: { color: 'red', fontSize: '13px' },
    formBtns: { display: 'flex', gap: '12px' },
    submitBtn: { padding: '10px 24px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    cancelBtn: { padding: '10px 24px', backgroundColor: '#e8e8e8', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    empty: { color: '#888', textAlign: 'center', marginTop: '48px' },
    lista: { display: 'flex', flexDirection: 'column', gap: '12px' },
    card: { backgroundColor: 'white', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardInfo: { display: 'flex', alignItems: 'center', gap: '16px' },
    avatar: { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#1a1a2e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' },
    cardNome: { fontWeight: 'bold', color: '#1a1a2e', marginBottom: '4px' },
    cardDettaglio: { fontSize: '13px', color: '#888' },
    cardBtns: { display: 'flex', gap: '8px' },
    editBtn: { padding: '6px 14px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    deleteBtn: { padding: '6px 14px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};

export default ClientiPage;
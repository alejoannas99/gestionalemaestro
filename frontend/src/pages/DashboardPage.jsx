import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatsClienti, getStatsLezioni, getTopCliente } from '../services/api';

function DashboardPage({ onLogout }) {
    const [statsClienti, setStatsClienti] = useState(0);
    const [statsLezioni, setStatsLezioni] = useState(0);
    const [topCliente, setTopCliente] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            getStatsClienti().then(r => r.json()),
            getStatsLezioni().then(r => r.json()),
            getTopCliente().then(r => r.ok ? r.json() : null)
        ]).then(([clienti, lezioni, top]) => {
            setStatsClienti(clienti);
            setStatsLezioni(lezioni);
            setTopCliente(top);
            setLoading(false);
        });
    }, []);

    if (loading) return <p style={{ padding: '24px' }}>Caricamento...</p>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.titolo}>GestionaleMaestro</h1>
                <button style={styles.logoutBtn} onClick={onLogout}>Esci</button>
            </div>

            <div style={styles.nav}>
                <button style={styles.navBtnActive}>Dashboard</button>
                <button style={styles.navBtn} onClick={() => navigate('/clienti')}>Clienti</button>
                <button style={styles.navBtn} onClick={() => navigate('/lezioni')}>Lezioni</button>
            </div>

            <h2 style={styles.sezione}>Dashboard</h2>

            <div style={styles.cards}>
                <div style={styles.card}>
                    <p style={styles.cardLabel}>Clienti totali</p>
                    <p style={styles.cardValue}>{statsClienti}</p>
                </div>
                <div style={styles.card}>
                    <p style={styles.cardLabel}>Lezioni totali</p>
                    <p style={styles.cardValue}>{statsLezioni}</p>
                </div>
                <div style={styles.card}>
                    <p style={styles.cardLabel}>Top cliente</p>
                    <p style={styles.cardValue}>
                        {topCliente ? `${topCliente.name} ${topCliente.surname}` : 'Nessuno'}
                    </p>
                </div>
            </div>
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
    sezione: { fontSize: '18px', color: '#333', marginBottom: '16px' },
    cards: { display: 'flex', gap: '16px' },
    card: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', flex: 1, textAlign: 'center' },
    cardLabel: { fontSize: '13px', color: '#888', marginBottom: '8px' },
    cardValue: { fontSize: '28px', fontWeight: 'bold', color: '#1a1a2e' },
};

export default DashboardPage;
// LoginPage.jsx — modificata rispetto all'originale
// Unica aggiunta: il Link "Non hai un account? Registrati" in fondo alla card.

import { useState } from 'react';
import { Link } from 'react-router-dom';
// Link importato da react-router-dom: navigazione interna senza ricaricare la pagina
import { login } from '../services/api';

function LoginPage({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errore, setErrore] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrore('');
        try {
            const res = await login(email, password);
            if (res.ok) {
                const token = await res.text();
                onLogin(token);
            } else if (res.status === 403) {
                // Password corretta ma account istruttore non ancora approvato: qui va bene
                // mostrare il messaggio vero, perché per vederlo bisogna già sapere la password.
                setErrore(await res.text());
            } else {
                setErrore('Email o password errati');
            }
        } catch (err) {
            setErrore('Errore di connessione al server');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.titolo}>GestionaleMaestro</h1>
                <h2 style={styles.sottotitolo}>Accedi al tuo account</h2>
                <form onSubmit={handleLogin} style={styles.form}>
                    <input
                        style={styles.input}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        style={styles.input}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {errore && <p style={styles.errore}>{errore}</p>}
                    <button style={styles.button} type="submit">
                        Accedi
                    </button>
                </form>

                {/* *** AGGIUNTA *** — fuori dal form, dentro la card.
                    Link (non <a>) perché siamo in una SPA React:
                    non vogliamo che il browser ricarichi tutta la pagina. */}
                <p style={styles.linkTesto}>
                    Non hai un account?{' '}
                    <Link to="/register" style={styles.link}>Registrati</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg)' },
    card: { backgroundColor: 'var(--surface)', padding: '40px', borderRadius: '12px', boxShadow: 'var(--shadow)', width: '360px' },
    titolo: { fontSize: '24px', color: 'var(--text)', marginBottom: '8px', textAlign: 'center' },
    sottotitolo: { fontSize: '14px', color: 'var(--muted)', marginBottom: '24px', textAlign: 'center', fontWeight: 'normal' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none' },
    button: { padding: '12px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', marginTop: '8px' },
    errore: { color: 'var(--danger)', fontSize: '13px', textAlign: 'center' },
    linkTesto: { textAlign: 'center', marginTop: '16px', fontSize: '13px', color: 'var(--muted)' },
    link: { color: 'var(--text)', fontWeight: 'bold', textDecoration: 'none' },
};

export default LoginPage;

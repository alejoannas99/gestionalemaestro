import { useState } from 'react';
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
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    card: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '360px' },
    titolo: { fontSize: '24px', color: '#1a1a2e', marginBottom: '8px', textAlign: 'center' },
    sottotitolo: { fontSize: '14px', color: '#666', marginBottom: '24px', textAlign: 'center', fontWeight: 'normal' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
    button: { padding: '12px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', marginTop: '8px' },
    errore: { color: 'red', fontSize: '13px', textAlign: 'center' },
};

export default LoginPage;
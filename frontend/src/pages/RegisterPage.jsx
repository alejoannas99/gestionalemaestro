// RegisterPage.jsx
// Questa pagina gestisce la registrazione di un nuovo istruttore.
// È molto simile alla LoginPage, ma ha più campi e chiama un endpoint diverso.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// useNavigate è un hook di React Router che ti dà una funzione per
// navigare da codice (non da click su un Link). Lo usiamo dopo la
// registrazione per mandare l'utente al login.
import { register } from '../services/api';

function RegisterPage() {
    // Un useState per ogni campo del form.
    // Corrispondono esattamente ai campi che si aspetta il backend:
    // RegisterRequest(String email, String password, String name, String surname)
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');

    // Per i messaggi di feedback all'utente
    const [errore, setErrore] = useState('');
    const [successo, setSuccesso] = useState('');

    // navigate è la funzione che ci permette di cambiare pagina da codice
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault(); // Blocca il comportamento default del form (ricarica pagina)
        setErrore('');
        setSuccesso('');

        try {
            const res = await register(email, password, name, surname);

            if (res.ok) {
                // 201 Created: registrazione riuscita.
                // Non facciamo login automatico: mandiamo al login così
                // l'utente capisce il flusso separato registrazione → login.
                setSuccesso('Account creato! Ora puoi accedere.');
                setTimeout(() => navigate('/login'), 1500);
                // setTimeout: aspettiamo 1.5s così l'utente legge il messaggio
            } else if (res.status === 409) {
                // 409 Conflict: il backend risponde così se l'email è già usata
                setErrore('Email già registrata');
            } else {
                setErrore('Errore durante la registrazione');
            }
        } catch (err) {
            // Questo catch scatta solo se la richiesta non parte proprio
            // (es. server spento, nessuna connessione)
            setErrore('Errore di connessione al server');
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.titolo}>GestionaleMaestro</h1>
                <h2 style={styles.sottotitolo}>Crea il tuo account</h2>

                <form onSubmit={handleRegister} style={styles.form}>
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        style={styles.input}
                        type="text"
                        placeholder="Cognome"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        required
                    />
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

                    {/* Mostriamo errore O successo, mai entrambi insieme */}
                    {errore && <p style={styles.errore}>{errore}</p>}
                    {successo && <p style={styles.successo}>{successo}</p>}

                    <button style={styles.button} type="submit">
                        Registrati
                    </button>
                </form>

                {/* Link verso il login — fuori dal form, dentro la card */}
                <p style={styles.linkTesto}>
                    Hai già un account?{' '}
                    <Link to="/login" style={styles.link}>Accedi</Link>
                </p>
            </div>
        </div>
    );
}

// Gli stili sono identici alla LoginPage per coerenza visiva.
// In un progetto più grande si estraggono in un file condiviso.
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    card: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '360px' },
    titolo: { fontSize: '24px', color: '#1a1a2e', marginBottom: '8px', textAlign: 'center' },
    sottotitolo: { fontSize: '14px', color: '#666', marginBottom: '24px', textAlign: 'center', fontWeight: 'normal' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
    button: { padding: '12px', backgroundColor: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', marginTop: '8px' },
    errore: { color: 'red', fontSize: '13px', textAlign: 'center' },
    successo: { color: 'green', fontSize: '13px', textAlign: 'center' },
    linkTesto: { textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#666' },
    link: { color: '#1a1a2e', fontWeight: 'bold', textDecoration: 'none' },
};

export default RegisterPage;
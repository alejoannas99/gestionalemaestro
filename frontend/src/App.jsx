// App.jsx — modificato rispetto all'originale
// Aggiunte: import RegisterPage + route /register

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // *** AGGIUNTO ***
import DashboardPage from './pages/DashboardPage';
import ClientiPage from './pages/ClientiPage';
import LezioniPage from './pages/LezioniPage';
import MieLezioniPage from './pages/MieLezioniPage';
import RichiestePage from './pages/RichiestePage';
import AdminPage from './pages/AdminPage';
import ImpostazioniPage from './pages/ImpostazioniPage';
import MessaggiPage from './pages/MessaggiPage';

// Il ruolo sta nel payload del JWT (la parte centrale, in base64url).
// Serve solo a decidere quali pagine mostrare: i permessi veri li controlla il backend.
// Se il token è assente, malformato o vecchio (senza ruolo) torna null = "non loggato".
function getRole(token) {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(payload)).role ?? null;
    } catch {
        return null;
    }
}

function App() {
    const [role, setRole] = useState(() => getRole(localStorage.getItem('token') || ''));
    const isLoggedIn = role !== null;
    const isInstructor = role === 'INSTRUCTOR';
    // Pagina di partenza dopo il login, in base al ruolo
    const home = isInstructor ? '/dashboard' : '/me';

    const handleLogin = (token) => {
        localStorage.setItem('token', token);
        setRole(getRole(token));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setRole(null);
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={
                    isLoggedIn ? <Navigate to={home} /> : <LoginPage onLogin={handleLogin} />
                } />

                {/* *** AGGIUNTO ***
                    /register segue la stessa logica di /login:
                    se sei già loggato non ha senso registrarsi, vai alla dashboard.
                    Se non sei loggato, mostri la pagina di registrazione.
                    RegisterPage non riceve onLogin perché dopo la registrazione
                    mandiamo al login — non facciamo login automatico. */}
                <Route path="/register" element={
                    isLoggedIn ? <Navigate to={home} /> : <RegisterPage />
                } />

                {/* Pagine da istruttore: un USER che le apre a mano nell'URL
                    viene rimandato alla sua area (o al login se non è loggato) */}
                <Route path="/dashboard" element={
                    isInstructor ? <DashboardPage onLogout={handleLogout} /> : <Navigate to={isLoggedIn ? home : "/login"} />
                } />
                <Route path="/clienti" element={
                    isInstructor ? <ClientiPage onLogout={handleLogout} /> : <Navigate to={isLoggedIn ? home : "/login"} />
                } />
                <Route path="/lezioni" element={
                    isInstructor ? <LezioniPage onLogout={handleLogout} /> : <Navigate to={isLoggedIn ? home : "/login"} />
                } />

                <Route path="/richieste" element={
                    isInstructor ? <RichiestePage onLogout={handleLogout} /> : <Navigate to={isLoggedIn ? home : "/login"} />
                } />

                {/* AppShell mostra la voce "Admin" nel menu solo all'account giusto; chiunque
                    altro la apra a mano viene comunque rifiutato dal backend con 403. */}
                <Route path="/admin" element={
                    isInstructor ? <AdminPage onLogout={handleLogout} /> : <Navigate to={isLoggedIn ? home : "/login"} />
                } />

                {/* Impostazioni: per tutti i ruoli, ma la sezione località compare solo agli istruttori */}
                <Route path="/impostazioni" element={
                    isLoggedIn
                        ? <ImpostazioniPage onLogout={handleLogout} isInstructor={isInstructor} />
                        : <Navigate to="/login" />
                } />

                {/* Area cliente (ruolo USER) */}
                <Route path="/me" element={
                    role === 'USER' ? <MieLezioniPage onLogout={handleLogout} /> : <Navigate to={isLoggedIn ? home : "/login"} />
                } />
                <Route path="/messaggi" element={
                    role === 'USER' ? <MessaggiPage onLogout={handleLogout} /> : <Navigate to={isLoggedIn ? home : "/login"} />
                } />
                <Route path="*" element={<Navigate to={isLoggedIn ? home : "/login"} />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

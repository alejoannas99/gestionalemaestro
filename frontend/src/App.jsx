// App.jsx — modificato rispetto all'originale
// Aggiunte: import RegisterPage + route /register

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // *** AGGIUNTO ***
import DashboardPage from './pages/DashboardPage';
import ClientiPage from './pages/ClientiPage';
import LezioniPage from './pages/LezioniPage';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    const handleLogin = (token) => {
        localStorage.setItem('token', token);
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={
                    isLoggedIn ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />
                } />

                {/* *** AGGIUNTO ***
                    /register segue la stessa logica di /login:
                    se sei già loggato non ha senso registrarsi, vai alla dashboard.
                    Se non sei loggato, mostri la pagina di registrazione.
                    RegisterPage non riceve onLogin perché dopo la registrazione
                    mandiamo al login — non facciamo login automatico. */}
                <Route path="/register" element={
                    isLoggedIn ? <Navigate to="/dashboard" /> : <RegisterPage />
                } />

                <Route path="/dashboard" element={
                    isLoggedIn ? <DashboardPage onLogout={handleLogout} /> : <Navigate to="/login" />
                } />
                <Route path="/clienti" element={
                    isLoggedIn ? <ClientiPage onLogout={handleLogout} /> : <Navigate to="/login" />
                } />
                <Route path="/lezioni" element={
                    isLoggedIn ? <LezioniPage onLogout={handleLogout} /> : <Navigate to="/login" />
                } />
                <Route path="*" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

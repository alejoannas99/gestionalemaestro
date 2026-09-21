import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';
import { getRichieste } from '../services/api';
import { RICHIESTE_CAMBIATE } from '../events';

// Le voci di navigazione cambiano con il ruolo
const SCHEDE = {
    INSTRUCTOR: [
        { path: '/dashboard', icona: '🏠', etichetta: 'Home' },
        { path: '/clienti', icona: '👥', etichetta: 'Clienti' },
        { path: '/lezioni', icona: '📅', etichetta: 'Lezioni' },
        { path: '/richieste', icona: '🔔', etichetta: 'Richieste', conteggio: true },
        { path: '/impostazioni', icona: '⚙️', etichetta: 'Impostazioni' },
    ],
    USER: [
        { path: '/me', icona: '🎿', etichetta: 'Lezioni' },
        { path: '/messaggi', icona: '💬', etichetta: 'Messaggi' },
        { path: '/impostazioni', icona: '⚙️', etichetta: 'Impostazioni' },
    ],
};

// Struttura di tutte le pagine dopo il login: barra in alto e navigazione.
// Su telefono la navigazione sta in basso (raggiungibile col pollice), sul computer in alto.
// piena: il contenuto non ha margini né larghezza massima (per calendari e pagine che gestiscono già il proprio spazio).
export default function AppShell({ ruolo = 'USER', onLogout, piena = false, children }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isMobile = useIsMobile();
    const schede = SCHEDE[ruolo];
    const [richieste, setRichieste] = useState(0);

    // Solo per l'istruttore: quante richieste di collegamento aspettano una risposta. È un extra, se fallisce non si mostra.
    // Si ricalcola cambiando pagina e quando una pagina avvisa che una richiesta è stata decisa.
    useEffect(() => {
        if (ruolo !== 'INSTRUCTOR') return;
        const carica = () =>
            getRichieste()
                .then(r => (r.ok ? r.json() : []))
                .then(d => setRichieste(Array.isArray(d) ? d.length : 0))
                .catch(() => {});
        carica();
        window.addEventListener(RICHIESTE_CAMBIATE, carica);
        return () => window.removeEventListener(RICHIESTE_CAMBIATE, carica);
    }, [ruolo, pathname]);

    const numero = (t) => (t.conteggio && richieste > 0 ? richieste : null);

    return (
        <div style={s.page}>
            <header style={s.top}>
                <span style={s.brand}>GestionaleMaestro</span>
                {!isMobile && (
                    <nav style={s.navAlto}>
                        {schede.map(t => (
                            <button key={t.path} type="button"
                                style={{ ...s.voceAlto, ...(pathname === t.path ? s.voceAltoOn : {}) }}
                                onClick={() => navigate(t.path)}>
                                {t.icona} {t.etichetta}
                                {numero(t) && <span style={s.badge}>{numero(t)}</span>}
                            </button>
                        ))}
                    </nav>
                )}
                <button type="button" style={s.esci} onClick={onLogout}>Esci</button>
            </header>

            {/* Su telefono si lascia spazio in fondo perché la barra fissa non copra il contenuto */}
            <main style={{ ...(piena ? s.mainPiena : s.main), paddingBottom: isMobile ? '84px' : '40px' }}>
                {children}
            </main>

            {isMobile && (
                <nav style={s.navBasso}>
                    {schede.map(t => (
                        <button key={t.path} type="button"
                            style={{ ...s.voceBasso, ...(pathname === t.path ? s.voceBassoOn : {}) }}
                            onClick={() => navigate(t.path)}>
                            <span style={s.iconaBasso}>
                                {t.icona}
                                {numero(t) && <span style={s.badgeBasso}>{numero(t)}</span>}
                            </span>
                            <span>{t.etichetta}</span>
                        </button>
                    ))}
                </nav>
            )}
        </div>
    );
}

const s = {
    page: { minHeight: '100vh', backgroundColor: 'var(--bg)', textAlign: 'left' },
    top: { position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', gap: '16px', padding: '0 16px', height: '56px', backgroundColor: 'var(--header-bg)', color: 'white' },
    brand: { fontWeight: '700', fontSize: '16px', letterSpacing: '0.2px', marginRight: 'auto' },
    navAlto: { display: 'flex', gap: '4px', marginRight: 'auto' },
    voceAlto: { position: 'relative', padding: '7px 14px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
    voceAltoOn: { backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: '600' },
    badge: { marginLeft: '6px', backgroundColor: 'var(--danger)', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' },
    esci: { padding: '6px 14px', backgroundColor: 'rgba(231,76,60,0.8)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
    main: { width: '100%', maxWidth: '760px', margin: '0 auto', padding: '20px 16px 0', boxSizing: 'border-box' },
    mainPiena: { width: '100%', margin: '0 auto', padding: 0, boxSizing: 'border-box' },
    navBasso: { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, display: 'flex', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' },
    voceBasso: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '9px 2px 8px', backgroundColor: 'transparent', color: 'var(--muted)', border: 'none', fontSize: '11px', cursor: 'pointer' },
    voceBassoOn: { color: 'var(--accent)', fontWeight: '700' },
    iconaBasso: { position: 'relative', fontSize: '22px', lineHeight: 1 },
    badgeBasso: { position: 'absolute', top: '-6px', right: '-12px', backgroundColor: 'var(--danger)', color: 'white', borderRadius: '9px', padding: '1px 5px', fontSize: '10px', fontWeight: '700', lineHeight: 1.3 },
};

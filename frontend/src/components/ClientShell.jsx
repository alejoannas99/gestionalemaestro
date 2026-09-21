import { useNavigate, useLocation } from 'react-router-dom';
import useIsMobile from '../hooks/useIsMobile';

const SCHEDE = [
    { path: '/me', icona: '🎿', etichetta: 'Lezioni' },
    { path: '/messaggi', icona: '💬', etichetta: 'Messaggi' },
    { path: '/impostazioni', icona: '⚙️', etichetta: 'Impostazioni' },
];

// Struttura delle pagine del cliente: barra in alto e navigazione.
// Su telefono la navigazione sta in basso (raggiungibile col pollice), sul computer in alto.
export default function ClientShell({ onLogout, children }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isMobile = useIsMobile();

    return (
        <div style={s.page}>
            <header style={s.top}>
                <span style={s.brand}>GestionaleMaestro</span>
                {!isMobile && (
                    <nav style={s.navAlto}>
                        {SCHEDE.map(t => (
                            <button key={t.path} type="button"
                                style={{ ...s.voceAlto, ...(pathname === t.path ? s.voceAltoOn : {}) }}
                                onClick={() => navigate(t.path)}>
                                {t.icona} {t.etichetta}
                            </button>
                        ))}
                    </nav>
                )}
                <button type="button" style={s.esci} onClick={onLogout}>Esci</button>
            </header>

            {/* Su telefono si lascia spazio in fondo perché la barra fissa non copra il contenuto */}
            <main style={{ ...s.main, paddingBottom: isMobile ? '96px' : '40px' }}>
                {children}
            </main>

            {isMobile && (
                <nav style={s.navBasso}>
                    {SCHEDE.map(t => (
                        <button key={t.path} type="button"
                            style={{ ...s.voceBasso, ...(pathname === t.path ? s.voceBassoOn : {}) }}
                            onClick={() => navigate(t.path)}>
                            <span style={s.iconaBasso}>{t.icona}</span>
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
    voceAlto: { padding: '7px 14px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
    voceAltoOn: { backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: '600' },
    esci: { padding: '6px 14px', backgroundColor: 'rgba(231,76,60,0.8)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
    main: { width: '100%', maxWidth: '760px', margin: '0 auto', padding: '20px 16px 0', boxSizing: 'border-box' },
    navBasso: { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, display: 'flex', backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)' },
    voceBasso: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '9px 4px 8px', backgroundColor: 'transparent', color: 'var(--muted)', border: 'none', fontSize: '11px', cursor: 'pointer' },
    voceBassoOn: { color: 'var(--accent)', fontWeight: '700' },
    iconaBasso: { fontSize: '22px', lineHeight: 1 },
};

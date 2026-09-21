import AppShell from '../components/AppShell';

// Segnaposto: la messaggistica con il maestro arriverà più avanti
export default function MessaggiPage({ onLogout }) {
    return (
        <AppShell ruolo="USER" onLogout={onLogout}>
            <h1 style={s.titolo}>Messaggi</h1>
            <div style={s.vuoto}>
                <div style={s.emoji}>💬</div>
                <div style={s.testoGrande}>Presto potrai scrivere al tuo maestro</div>
                <p style={s.testo}>
                    Qui troverai le conversazioni con i tuoi istruttori: potrete organizzarvi per le lezioni
                    e avvisarvi se arrivate in ritardo.
                </p>
            </div>
        </AppShell>
    );
}

const s = {
    titolo: { fontSize: '24px', fontWeight: '700', margin: '0 0 16px' },
    vuoto: { backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '40px 24px', textAlign: 'center', boxShadow: 'var(--shadow)' },
    emoji: { fontSize: '48px', marginBottom: '12px' },
    testoGrande: { fontSize: '17px', fontWeight: '600', color: 'var(--text)', marginBottom: '8px' },
    testo: { fontSize: '14px', color: 'var(--muted)', lineHeight: 1.5, maxWidth: '360px', margin: '0 auto' },
};

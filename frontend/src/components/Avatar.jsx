import useFoto from '../hooks/useFoto';

// Tavolozza fissa: la stessa persona ha sempre lo stesso colore di sfondo (utile per riconoscerla al volo)
const PALETTE = ['#4361ee', '#e76f51', '#2a9d8f', '#e9c46a', '#8338ec', '#ef476f', '#219ebc', '#fb8500'];
function coloreDi(testo) {
    let hash = 0;
    for (const c of testo) hash = (hash * 31 + c.charCodeAt(0)) % PALETTE.length;
    return PALETTE[Math.abs(hash) % PALETTE.length];
}

// Cerchio con la foto profilo, o le iniziali su uno sfondo colorato se non c'è (o non è visibile a chi guarda).
// userId: 'me' per la propria foto, altrimenti l'id dell'utente.
export default function Avatar({ userId, nome, cognome, size = 40, refreshKey }) {
    const url = useFoto(userId, refreshKey);
    const iniziali = `${nome?.[0] ?? ''}${cognome?.[0] ?? ''}`.toUpperCase();

    if (url) {
        return <img src={url} alt="" style={{ ...s.base, width: size, height: size, objectFit: 'cover' }} />;
    }
    return (
        <div style={{
            ...s.base, ...s.iniziali, width: size, height: size,
            fontSize: size * 0.4, backgroundColor: coloreDi(`${nome ?? ''}${cognome ?? ''}`),
        }}>
            {iniziali || '?'}
        </div>
    );
}

const s = {
    base: { borderRadius: '50%', flexShrink: 0 },
    iniziali: { display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700' },
};

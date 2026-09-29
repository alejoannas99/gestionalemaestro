import { useState, useRef, useEffect } from 'react';

const RIQUADRO = 260; // dimensione a schermo del quadrato di ritaglio (px CSS)
const EXPORT = 256;   // dimensione dell'immagine esportata (px reali)
const ZOOM_MAX = 3;

// Finestra modale: l'utente trascina e ingrandisce la foto scelta per decidere quale parte diventa
// il quadrato del profilo. "Usa questa foto" esporta esattamente quello che si vede nel riquadro.
export default function RitagliaFoto({ file, onConferma, onAnnulla }) {
    const [url, setUrl] = useState(null);
    const [dimensioni, setDimensioni] = useState(null); // { largo, alto } dell'immagine originale
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [errore, setErrore] = useState('');
    const imgRef = useRef(null);
    const trascino = useRef(null); // punto e offset di partenza, mentre si trascina

    // L'indirizzo temporaneo si crea QUI, dentro l'effetto: se React lo esegue due volte (StrictMode,
    // in sviluppo, monta-smonta-rimonta per scovare bug come questo) se ne crea uno nuovo la seconda
    // volta, invece di continuare a usare un URL già "revocato" dalla pulizia della prima esecuzione.
    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        // Voluto: deve girare a ogni esecuzione dell'effetto (anche la seconda, di StrictMode)
        // per creare un URL nuovo, non riusare uno già revocato dalla pulizia precedente.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    // La scala minima perché l'immagine copra sempre l'intero quadrato, come CSS "object-fit: cover"
    const scalaBase = dimensioni ? RIQUADRO / Math.min(dimensioni.largo, dimensioni.alto) : 1;
    const scala = scalaBase * zoom;
    const largoMostrato = dimensioni ? dimensioni.largo * scala : 0;
    const altoMostrato = dimensioni ? dimensioni.alto * scala : 0;

    // L'immagine non deve mai lasciare spazi vuoti nel quadrato: l'offset resta dentro questi limiti
    const limita = (o, w, h) => ({
        x: Math.min(0, Math.max(RIQUADRO - w, o.x)),
        y: Math.min(0, Math.max(RIQUADRO - h, o.y)),
    });

    const alCaricamento = () => {
        const img = imgRef.current;
        const largo = img.naturalWidth, alto = img.naturalHeight;
        const sb = RIQUADRO / Math.min(largo, alto);
        setDimensioni({ largo, alto });
        setOffset({ x: (RIQUADRO - largo * sb) / 2, y: (RIQUADRO - alto * sb) / 2 }); // parte centrata
    };

    // Cambiando lo zoom l'immagine mostrata cambia misura: si ricontrollano subito i limiti sulla posizione attuale
    const cambiaZoom = (nuovoZoom) => {
        setZoom(nuovoZoom);
        if (!dimensioni) return;
        const nuovaScala = scalaBase * nuovoZoom;
        setOffset(o => limita(o, dimensioni.largo * nuovaScala, dimensioni.alto * nuovaScala));
    };

    const iniziaTrascino = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId); // così il trascinamento continua anche fuori dal riquadro
        trascino.current = { x: e.clientX, y: e.clientY, offset };
    };
    const muoviTrascino = (e) => {
        if (!trascino.current) return;
        const dx = e.clientX - trascino.current.x;
        const dy = e.clientY - trascino.current.y;
        setOffset(limita(
            { x: trascino.current.offset.x + dx, y: trascino.current.offset.y + dy },
            largoMostrato, altoMostrato
        ));
    };
    const fineTrascino = () => { trascino.current = null; };

    const conferma = () => {
        const canvas = document.createElement('canvas');
        canvas.width = EXPORT;
        canvas.height = EXPORT;
        canvas.getContext('2d').drawImage(imgRef.current,
            -offset.x / scala, -offset.y / scala,   // angolo, nell'immagine originale, da cui parte il ritaglio
            RIQUADRO / scala, RIQUADRO / scala,      // quanta immagine originale è visibile nel riquadro
            0, 0, EXPORT, EXPORT
        );
        canvas.toBlob(blob => onConferma(blob), 'image/jpeg', 0.85);
    };

    return (
        <div style={s.overlay} onClick={onAnnulla}>
            <div style={s.modale} onClick={e => e.stopPropagation()}>
                <h3 style={s.titolo}>Posiziona la foto</h3>
                {errore && <p style={s.errore}>{errore}</p>}
                <div style={s.riquadro}
                    onPointerDown={iniziaTrascino} onPointerMove={muoviTrascino}
                    onPointerUp={fineTrascino} onPointerCancel={fineTrascino}>
                    {url && (
                        <img ref={imgRef} src={url} alt="" draggable={false} onLoad={alCaricamento}
                            onError={() => setErrore('File non valido')}
                            style={{
                                position: 'absolute', left: offset.x, top: offset.y,
                                width: largoMostrato || 'auto', height: altoMostrato || 'auto',
                                maxWidth: 'none', touchAction: 'none', userSelect: 'none',
                            }} />
                    )}
                </div>
                {dimensioni && (
                    <>
                        <input type="range" min="1" max={ZOOM_MAX} step="0.01" value={zoom}
                            onChange={e => cambiaZoom(Number(e.target.value))} style={s.slider} />
                        <div style={s.bottoni}>
                            <button type="button" style={s.annulla} onClick={onAnnulla}>Annulla</button>
                            <button type="button" style={s.conferma} onClick={conferma}>Usa questa foto</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const s = {
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'var(--overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 },
    modale: { backgroundColor: 'var(--surface)', borderRadius: '16px', padding: '20px', width: `${RIQUADRO + 40}px`, maxWidth: '92vw', boxShadow: 'var(--shadow-lg)', boxSizing: 'border-box' },
    titolo: { fontSize: '16px', fontWeight: '700', color: 'var(--text)', margin: '0 0 14px' },
    errore: { color: 'var(--danger)', fontSize: '13px', margin: '0 0 10px' },
    riquadro: { position: 'relative', width: RIQUADRO, height: RIQUADRO, margin: '0 auto', overflow: 'hidden', borderRadius: '50%', backgroundColor: 'var(--surface-2)', cursor: 'grab', touchAction: 'none' },
    slider: { width: '100%', marginTop: '16px' },
    bottoni: { display: 'flex', gap: '12px', marginTop: '16px' },
    annulla: { flex: 1, padding: '11px', backgroundColor: 'var(--surface-2)', color: 'var(--text)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
    conferma: { flex: 1, padding: '11px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};

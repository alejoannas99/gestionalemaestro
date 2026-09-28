import { useState } from 'react';

// Toglie accenti e maiuscole: "Nicolò" e "nicolo" diventano uguali per la ricerca
const semplifica = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Scelta dei clienti di una lezione: si scrive nella casella e l'elenco si restringe mentre digiti.
// selezionati = array dei code dei clienti scelti; onChange riceve il nuovo array.
export default function SelettoreClienti({ clienti, selezionati, onChange }) {
    const [testo, setTesto] = useState('');
    const [aperto, setAperto] = useState(false);
    const [evidenziato, setEvidenziato] = useState(0);

    // Ogni parola scritta deve comparire nel nome completo: "rossi mar" trova "Mario Rossi"
    const parole = semplifica(testo).split(/\s+/).filter(Boolean);
    const suggerimenti = clienti.filter(c =>
        !selezionati.includes(c.code) &&
        parole.every(p => semplifica(`${c.name} ${c.surname}`).includes(p))
    );
    const indice = Math.min(evidenziato, suggerimenti.length - 1);

    const aggiungi = (code) => {
        onChange([...selezionati, code]);
        setTesto('');
        setEvidenziato(0);
    };
    const togli = (code) => onChange(selezionati.filter(c => c !== code));

    const tasto = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAperto(true);
            setEvidenziato(Math.min(indice + 1, suggerimenti.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setEvidenziato(Math.max(indice - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault(); // altrimenti Invio invierebbe l'intero form della lezione
            if (aperto && suggerimenti[indice]) aggiungi(suggerimenti[indice].code);
        } else if (e.key === 'Escape') {
            setAperto(false);
        }
    };

    return (
        <div>
            {selezionati.length > 0 && (
                <div style={s.scelti}>
                    {selezionati.map(code => {
                        const c = clienti.find(x => x.code === code);
                        return (
                            <span key={code} style={s.chip}>
                                {c ? `${c.name} ${c.surname}` : '…'}
                                <button type="button" style={s.togli} onClick={() => togli(code)}
                                    aria-label="Rimuovi cliente">×</button>
                            </span>
                        );
                    })}
                </div>
            )}

            <input style={s.input} placeholder="Cerca un cliente per nome o cognome"
                value={testo}
                onChange={e => { setTesto(e.target.value); setEvidenziato(0); setAperto(true); }}
                onFocus={() => setAperto(true)}
                onBlur={() => setAperto(false)}
                onKeyDown={tasto} />

            {aperto && (
                <div style={s.elenco}>
                    {suggerimenti.length === 0 && (
                        <div style={s.vuoto}>
                            {clienti.length === 0 ? 'Non hai ancora clienti' : 'Nessun cliente trovato'}
                        </div>
                    )}
                    {suggerimenti.map((c, i) => (
                        <div key={c.code}
                            style={{ ...s.voce, ...(i === indice ? s.voceOn : {}) }}
                            // mousedown + preventDefault: evita che la casella perda il focus prima del click
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => aggiungi(c.code)}>
                            {c.name} {c.surname}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const s = {
    scelti: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' },
    chip: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 6px 6px 14px', borderRadius: '20px', backgroundColor: 'var(--primary)', color: 'var(--on-primary)', fontSize: '13px' },
    togli: { width: '20px', height: '20px', padding: 0, border: 'none', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.25)', color: 'inherit', fontSize: '14px', lineHeight: 1, cursor: 'pointer' },
    input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '14px', backgroundColor: 'var(--surface)', color: 'var(--text)', outline: 'none' },
    elenco: { marginTop: '6px', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--surface)' },
    voce: { padding: '10px 12px', fontSize: '14px', color: 'var(--text)', cursor: 'pointer' },
    voceOn: { backgroundColor: 'var(--surface-2)' },
    vuoto: { padding: '10px 12px', fontSize: '13px', color: 'var(--muted)' },
};

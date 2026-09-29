import { useState, useEffect } from 'react';
import { getFotoMia, getFotoDi } from '../services/api';

// Scarica una foto profilo e la trasforma in un URL usabile in <img>.
// userId === 'me' per la propria, altrimenti l'id dell'utente. null finché non è pronta,
// o se non ha foto, o se chi guarda non ha diritto di vederla (il server risponde 404 in entrambi i casi).
// Serve un hook e non un semplice <img src="..."> perché la richiesta va autenticata con il token.
// refreshKey: facoltativo, per ricaricarla anche se userId resta lo stesso (es. dopo aver caricato una foto nuova)
export default function useFoto(userId, refreshKey) {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        if (!userId) return;
        let objectUrl = null;
        let annullato = false;

        const richiesta = userId === 'me' ? getFotoMia() : getFotoDi(userId);
        richiesta
            .then(r => (r.ok ? r.blob() : null))
            .then(blob => {
                if (annullato || !blob) return;
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            })
            .catch(() => {});

        // Alla prossima foto (o quando il componente sparisce) si libera la memoria del browser
        return () => {
            annullato = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [userId, refreshKey]);

    return url;
}

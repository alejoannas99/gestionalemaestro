import { useState, useEffect } from 'react';

// Vero se la finestra è stretta come un telefono (meno di 768 px); si aggiorna se si ridimensiona o si ruota lo schermo
export default function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);
    return isMobile;
}

const BASE_URL = import.meta.env.VITE_API_URL;

// Funzione helper per fare richieste autenticate
const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('token');
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
};

// AUTH
export const login = (email, password) =>
    fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

export const register = (email, password, name, surname) =>
    fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, surname }),
    });

// CLIENTI
export const getClienti = () =>
    authFetch(`${BASE_URL}/clienti`);

export const addCliente = (nome, cognome, telefono) =>
    authFetch(`${BASE_URL}/clienti`, {
        method: 'POST',
        body: JSON.stringify({ nome, cognome, telefono }),
    });

export const updateCliente = (code, nome, cognome, telefono) =>
    authFetch(`${BASE_URL}/clienti/${code}`, {
        method: 'PUT',
        body: JSON.stringify({ nome, cognome, telefono }),
    });

export const deleteCliente = (code) =>
    authFetch(`${BASE_URL}/clienti/${code}`, {
        method: 'DELETE',
    });

// LEZIONI
export const getLezioni = () =>
    authFetch(`${BASE_URL}/lezioni`);

export const addLezione = (data, inizio, fine, codiciClienti) =>
    authFetch(`${BASE_URL}/lezioni`, {
        method: 'POST',
        body: JSON.stringify({ data, inizio, fine, codiciClienti }),
    });

export const updateLezione = (id, data, inizio, fine, codiciClienti) =>
    authFetch(`${BASE_URL}/lezioni/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ data, inizio, fine, codiciClienti }),
    });

export const deleteLezione = (id) =>
    authFetch(`${BASE_URL}/lezioni/${id}`, {
        method: 'DELETE',
    });

// STATS
export const getStatsClienti = () =>
    authFetch(`${BASE_URL}/stats/clienti`);

export const getStatsLezioni = () =>
    authFetch(`${BASE_URL}/stats/lezioni`);

export const getTopCliente = () =>
    authFetch(`${BASE_URL}/stats/top-cliente`);

export const getLezioniPerData = (data) =>
    authFetch(`${BASE_URL}/stats/lezioni-per-data?data=${data}`);

export const getOreMese = (mese, anno) =>
    authFetch(`${BASE_URL}/stats/ore-mese?mese=${mese}&anno=${anno}`);

export const getOreAnno = (anno) =>
    authFetch(`${BASE_URL}/stats/ore-anno?anno=${anno}`);
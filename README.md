# ⛷️ GestionaleMaestro

**Gestionale per maestri di sci e snowboard, con un'area dedicata ai clienti.**

L'istruttore organizza clienti, lezioni e ore lavorate. Il cliente vede le sue lezioni, il meteo del giorno e quante ore ha fatto con ciascun maestro. È pensato per il telefono, perché è lì che lo si usa davvero, sulle piste.

> 🚧 Progetto personale in sviluppo attivo, nato da un'esigenza reale del mondo delle scuole sci.

## Cosa fa

### Per l'istruttore
- **Dashboard**: ore della stagione e del mese, grafico dell'attività, cliente con più lezioni
- **Clienti**: schede con lo storico delle lezioni
- **Lezioni**: calendario, creazione e modifica con **controllo delle sovrapposizioni**, località e **previsioni meteo** per ogni giorno
- **Richieste**: approva o rifiuta i clienti che chiedono di collegarsi a lui

### Per il cliente
- **Prossima lezione** con meteo previsto, riepilogo delle ore **totali e per istruttore**, lezioni passate e future
- **Collegamento a un istruttore** tramite richiesta da lui approvata
- Tema chiaro/scuro e interfaccia mobile-first con barra di navigazione in basso

## Scelte di progetto interessanti

- **Un cliente non appartiene a un solo istruttore.** Può fare lezioni con più maestri. Ogni istruttore vede solo le ore fatte con lui, il cliente vede il totale e il dettaglio per maestro.
- **Collegamento account-scheda con approvazione.** Chi si registra non può leggere lo storico di un nome qualsiasi: chiede il collegamento e l'istruttore verifica. Vede le ore e il periodo dichiarati e un'email oscurata.
- **Ore "fatte" = solo lezioni concluse.** Una lezione futura non entra nei conteggi. Il numero di lezioni per cliente è calcolato, non salvato.
- **Permessi per ruolo** (`INSTRUCTOR` / `USER`) applicati sia sulle rotte del backend sia sulle pagine del frontend.
- **Meteo senza chiave API**, con cache di 15 minuti per non ripetere le stesse chiamate.

## Architettura

```
React (Vite)  ──JWT──▶  Spring Boot REST  ──JPA──▶  PostgreSQL
     │
     └──────────▶  Open-Meteo (previsioni e ricerca località)
```

Il backend è a strati: **controller → service → store → database**, con DTO separati dalle entità e regole di dominio nei service. Gli errori di business diventano risposte 400/409.

| Parte | Tecnologie |
|---|---|
| Backend (`app/`) | Java 21, Spring Boot 3.4, Spring Security + JWT, JPA/Hibernate, PostgreSQL, Gradle |
| Frontend (`frontend/`) | React 19, Vite, React Router, CSS con variabili per il tema chiaro/scuro |
| Servizi esterni | [Open-Meteo](https://open-meteo.com/) (dati meteo) |

## Come provarlo in locale

Servono JDK 21, Node 20.19 o superiore e PostgreSQL.

**1. Database.** Crea un database vuoto chiamato `Gestionale` e inserisci utente e password del tuo PostgreSQL in `app/src/main/resources/application.properties`. Le tabelle si creano da sole al primo avvio.

**2. Backend** (porta 8080), dalla cartella principale del progetto:
```bash
./gradlew :app:bootRun
```

**3. Frontend** (porta 5173):
```bash
cd frontend
echo "VITE_API_URL=http://localhost:8080" > .env
npm install
npm run dev
```

Poi apri `http://localhost:5173`, registrati come cliente dalla pagina di registrazione e provalo.

## Stato e prossimi passi

**Fatto:** ruoli e autenticazione JWT, area cliente, collegamento con approvazione, lezioni con località e meteo, statistiche, tema chiaro/scuro, interfaccia mobile.

**In arrivo:** foto profilo e disciplina dell'istruttore (sci, snowboard o entrambe), prenotazioni, messaggistica, gestione di più figli per un genitore, versione desktop, test automatici.

**Prima di un uso reale** vanno spostati i segreti (chiave JWT, credenziali DB) in variabili d'ambiente e aggiunta la verifica email alla registrazione.

## Crediti

Dati meteo da [Open-Meteo.com](https://open-meteo.com/) (licenza CC BY 4.0, uso non commerciale).

---
Sviluppato da **Alessandro Joannas**

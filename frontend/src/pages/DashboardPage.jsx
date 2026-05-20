import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStatsClienti, getStatsLezioni, getTopCliente, getLezioni } from "../services/api";

// ══════════════════════════════════════════════════════════════════════════════
// HOOK — rileva se lo schermo è mobile (larghezza < 768px)
// Si aggiorna automaticamente quando si ridimensiona la finestra
// ══════════════════════════════════════════════════════════════════════════════
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler); // cleanup
  }, []);
  return isMobile;
}

// ══════════════════════════════════════════════════════════════════════════════
// COSTANTI E HELPERS
// ══════════════════════════════════════════════════════════════════════════════
const MESI_BREVI = [
  "Gen",
  "Feb",
  "Mar",
  "Apr",
  "Mag",
  "Giu",
  "Lug",
  "Ago",
  "Set",
  "Ott",
  "Nov",
  "Dic",
];
const GIORNI_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const SLOT_H = 40;
const GRID_START = 9 * 60;

function toMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function calcTop(hhmm) {
  return ((toMin(hhmm) - GRID_START) / 30) * SLOT_H;
}
function calcHeight(start, finish) {
  return ((toMin(finish) - toMin(start)) / 30) * SLOT_H;
}
function lunediDi(data) {
  const d = new Date(data);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function settimana(lun) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lun);
    d.setDate(lun.getDate() + i);
    return d;
  });
}
function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtOra(t) {
  return t ? t.substring(0, 5) : "";
}

// ══════════════════════════════════════════════════════════════════════════════
// GRAFICO LEZIONI PER MESE
// Su mobile mostra solo 3 mesi invece di 6 per non stringere troppo le barre
// ══════════════════════════════════════════════════════════════════════════════
function GraficoLezioni({ lezioni, isMobile }) {
  const oggi = new Date();
  const numMesi = isMobile ? 3 : 6;

  const mesi = Array.from({ length: numMesi }, (_, i) => {
    const d = new Date(
      oggi.getFullYear(),
      oggi.getMonth() - (numMesi - 1) + i,
      1,
    );

    return {
      anno: d.getFullYear(),
      mese: d.getMonth(),
      label: MESI_BREVI[d.getMonth()],
    };
  });

  const conteggi = mesi.map(({ anno, mese }) =>
    lezioni.filter(l => {
      const d = new Date(l.date);
      return d.getFullYear() === anno && d.getMonth() === mese;
    }).length,
  );

  const totale = conteggi.reduce((a, b) => a + b, 0);
  const media = Math.round(totale / numMesi);

  const max = Math.max(...conteggi, 1);
  const W = 480;
  const H = 120;
  const barW = isMobile ? 72 : 48;
  const gap = (W - barW * numMesi) / (numMesi + 1);

  return (
    <div>
      <div style={{ display: "flex", gap: "24px", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "11px", color: "#888" }}>
            Totale lezioni
          </div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a2e" }}>
            {totale}
          </div>
        </div>

        <div>
          <div style={{ fontSize: "11px", color: "#888" }}>
            Media mensile
          </div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#4361ee" }}>
            {media}
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H + 32}`} style={{ width: "100%", height: "auto" }}>
        {conteggi.map((val, i) => {
          const barH = val === 0 ? 4 : (val / max) * H;
          const x = gap + i * (barW + gap);
          const y = H - barH;

          const isOggi =
            mesi[i].mese === oggi.getMonth() &&
            mesi[i].anno === oggi.getFullYear();

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={6}
                fill={isOggi ? "#4361ee" : "#c7d2fe"}
              />

              {val > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fill={isOggi ? "#4361ee" : "#888"}
                  fontWeight="600"
                >
                  {val}
                </text>
              )}

              <text
                x={x + barW / 2}
                y={H + 20}
                textAnchor="middle"
                fontSize="11"
                fill={isOggi ? "#4361ee" : "#aaa"}
                fontWeight={isOggi ? "700" : "400"}
              >
                {mesi[i].label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MINI CALENDARIO
// Su mobile mostra solo lun-ven (5 giorni) per avere colonne più larghe
// ══════════════════════════════════════════════════════════════════════════════
function MiniCalendario({ lezioni, onNavigate, isMobile }) {
  const lunedi = lunediDi(new Date());
  const tuttiGiorni = settimana(lunedi);
  // mobile → solo lun-ven, desktop → lun-dom
  const giorni = isMobile ? tuttiGiorni.slice(0, 5) : tuttiGiorni;
  const oggi_iso = toISO(new Date());

  const ORE = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
  const MINI_H = SLOT_H * 2;
  const GRID_H = SLOT_H * 16;

  const lezioniPerGiorno = {};
  lezioni.forEach(l => {
    if (!lezioniPerGiorno[l.date]) lezioniPerGiorno[l.date] = [];
    lezioniPerGiorno[l.date].push(l);
  });

  const numGiorni = giorni.length; // 5 su mobile, 7 su desktop

  return (
    <div style={mc.wrapper} onClick={() => onNavigate("/lezioni")}>
      {/* intestazione giorni */}
      <div
        style={{
          ...mc.headerRow,
          gridTemplateColumns: `36px repeat(${numGiorni}, 1fr)`,
        }}
      >
        <div style={mc.timeColH} />
        {giorni.map((g, i) => {
          const iso = toISO(g);
          const isOggi = iso === oggi_iso;
          return (
            <div key={i} style={{ ...mc.dayH, ...(isOggi ? mc.dayHOggi : {}) }}>
              <span style={mc.dayShort}>{GIORNI_SHORT[i]}</span>
              <span style={{ ...mc.dayNum, ...(isOggi ? mc.dayNumOggi : {}) }}>{g.getDate()}</span>
            </div>
          );
        })}
      </div>

      {/* corpo */}
      <div style={mc.body}>
        <div
          style={{
            ...mc.inner,
            gridTemplateColumns: `36px repeat(${numGiorni}, 1fr)`,
          }}
        >
          <div style={mc.timeCol}>
            {ORE.map(ora => (
              <div key={ora} style={{ ...mc.timeLabel, height: MINI_H }}>
                {ora}
              </div>
            ))}
          </div>
          {giorni.map((g, i) => {
            const iso = toISO(g);
            const lez = lezioniPerGiorno[iso] || [];
            return (
              <div key={i} style={{ ...mc.dayCol, height: GRID_H }}>
                {ORE.map((ora, si) => (
                  <div
                    key={ora}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: 0,
                      top: si * MINI_H,
                      borderTop: "1px solid #f0f0f0",
                      pointerEvents: "none",
                    }}
                  />
                ))}
                {lez.map(l => {
                  const top = calcTop(fmtOra(l.start));
                  const height = Math.max(calcHeight(fmtOra(l.start), fmtOra(l.finish)), 8);
                  return <div key={l.id} style={{ ...mc.lezBlock, top, height }} />;
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div style={mc.footer}>Apri calendario completo →</div>
    </div>
  );
}

const mc = {
  wrapper: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    overflow: "hidden",
    cursor: "pointer",
  },
  headerRow: {
    display: "grid",
    borderBottom: "1px solid #f0f0f0",
    backgroundColor: "white",
  },
  timeColH: { backgroundColor: "#fafafa" },
  dayH: {
    padding: "8px 2px",
    textAlign: "center",
    borderLeft: "1px solid #f5f5f5",
  },
  dayHOggi: { backgroundColor: "#eef2ff" },
  dayShort: {
    display: "block",
    fontSize: "9px",
    color: "#aaa",
    textTransform: "uppercase",
  },
  dayNum: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginTop: "1px",
  },
  dayNumOggi: {
    backgroundColor: "#4361ee",
    color: "white",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
  },
  body: { overflowY: "hidden", maxHeight: "200px", overflowX: "hidden" },
  inner: { display: "grid" },
  timeCol: { backgroundColor: "#fafafa", borderRight: "1px solid #f0f0f0" },
  timeLabel: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-end",
    paddingRight: "4px",
    paddingTop: "2px",
    fontSize: "9px",
    color: "#ccc",
    boxSizing: "border-box",
  },
  dayCol: { position: "relative", borderLeft: "1px solid #f5f5f5" },
  lezBlock: {
    position: "absolute",
    left: "1px",
    right: "1px",
    backgroundColor: "#4361ee",
    borderRadius: "3px",
    minHeight: "4px",
  },
  footer: {
    padding: "8px",
    textAlign: "center",
    fontSize: "12px",
    color: "#4361ee",
    fontWeight: "600",
    borderTop: "1px solid #f0f0f0",
    backgroundColor: "#fafeff",
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function DashboardPage({ onLogout }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile(); // hook responsività

  const [statsClienti, setStatsClienti] = useState(0);
  const [statsLezioni, setStatsLezioni] = useState(0);
  const [topCliente, setTopCliente] = useState(null);
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStatsClienti().then(r => r.json()),
      getStatsLezioni().then(r => r.json()),
      getTopCliente().then(r => (r.ok ? r.json() : null)),
      getLezioni().then(r => r.json()),
    ])
      .then(([clienti, totLezioni, top, tutteLeLezioni]) => {
        setStatsClienti(clienti);
        setStatsLezioni(totLezioni);
        setTopCliente(top);
        setLezioni(Array.isArray(tutteLeLezioni) ? tutteLeLezioni : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const oggi_iso = toISO(new Date());
  const lezioniOggi = lezioni
    .filter(l => l.date === oggi_iso)
    .sort((a, b) => a.start.localeCompare(b.start));

  const lezioniSettimana = lezioni.filter(l => {
    const lun = lunediDi(new Date());
    const dom = new Date(lun);
    dom.setDate(lun.getDate() + 6);
    const d = new Date(l.date);
    return d >= lun && d <= dom;
  }).length;

  if (loading) return <div style={s.loading}>Caricamento...</div>;

  return (
    <div style={s.page}>
      {/* ── HEADER ── */}
      <div style={s.header}>
        <span style={s.brand}>GestionaleMaestro</span>
        {/* Su mobile la nav nasconde le etichette e mostra solo icone */}
        <div style={s.nav}>
          <button style={{ ...s.navBtn, ...s.navActive }}>{isMobile ? "🏠" : "Dashboard"}</button>
          <button style={s.navBtn} onClick={() => navigate("/clienti")}>
            {isMobile ? "👥" : "Clienti"}
          </button>
          <button style={s.navBtn} onClick={() => navigate("/lezioni")}>
            {isMobile ? "📅" : "Lezioni"}
          </button>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>
          {isMobile ? "↩" : "Esci"}
        </button>
      </div>

      <div style={{ ...s.content, padding: isMobile ? "16px" : "20px 24px" }}>
        {/* ── STAT CARD ──
                    Desktop: 4 colonne su una riga
                    Mobile: 2 colonne su due righe */}
        <div
          style={{
            ...s.statsRow,
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: isMobile ? "10px" : "16px",
          }}
        >
          <div style={s.statCard} onClick={() => navigate("/clienti")}>
            <div style={{ ...s.statIcon, backgroundColor: "#eef2ff" }}>👥</div>
            <div>
              <p style={s.statLabel}>Clienti</p>
              <p style={s.statValue}>{statsClienti}</p>
            </div>
          </div>
          <div style={s.statCard} onClick={() => navigate("/lezioni")}>
            <div style={{ ...s.statIcon, backgroundColor: "#ecfdf5" }}>📅</div>
            <div>
              <p style={s.statLabel}>Lezioni totali</p>
              <p style={s.statValue}>{statsLezioni}</p>
            </div>
          </div>
          <div style={s.statCard}>
            <div style={{ ...s.statIcon, backgroundColor: "#fff7ed" }}>🏆</div>
            <div>
              <p style={s.statLabel}>Top cliente</p>
              <p
                style={{
                  ...s.statValue,
                  fontSize: topCliente ? "16px" : "14px",
                }}
              >
                {topCliente ? `${topCliente.name} ${topCliente.surname}` : "—"}
              </p>
            </div>
          </div>
          <div
            style={{
              ...s.statCard,
              ...(lezioniOggi.length > 0 ? s.statCardOggi : {}),
            }}
          >
            <div style={{ ...s.statIcon, backgroundColor: "#f0f9ff" }}>⏰</div>
            <div>
              <p style={s.statLabel}>Oggi</p>
              <p style={s.statValue}>{lezioniOggi.length}</p>
            </div>
          </div>
        </div>

        {/* ── LEZIONI OGGI + MINI CALENDARIO ──
                    Desktop: affiancati (1fr 2fr)
                    Mobile: in colonna (uno sotto l'altro) */}
        <div
          style={{
            ...s.row2,
            gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr",
            gap: isMobile ? "12px" : "16px",
          }}
        >
          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardTitolo}>Oggi</span>
              <span style={s.cardData}>
                {new Date().toLocaleDateString("it-IT", {
                  weekday: isMobile ? "short" : "long",
                  day: "numeric",
                  month: "long",
                })}
              </span>
            </div>
            {lezioniOggi.length === 0 ? (
              <div style={s.emptyOggi}>
                <span style={{ fontSize: "32px" }}>☀️</span>
                <p style={s.emptyOggiTesto}>Nessuna lezione oggi</p>
              </div>
            ) : (
              <div style={s.lezioniOggiLista}>
                {lezioniOggi.map(l => (
                  <div key={l.id} style={s.lezioneOggiCard}>
                    <div style={s.lezioneOra}>
                      <span style={s.lezioneOraText}>{fmtOra(l.start)}</span>
                      <span style={s.lezioneOraSep}>|</span>
                      <span style={s.lezioneOraText}>{fmtOra(l.finish)}</span>
                    </div>
                    <div style={s.lezioneInfo}>
                      <p style={s.lezioneClienti}>
                        {l.clients.map(c => `${c.name} ${c.surname}`).join(", ")}
                      </p>
                      <p style={s.lezioneDurata}>
                        {toMin(fmtOra(l.finish)) - toMin(fmtOra(l.start))} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={s.miniCalCard}>
            <div style={s.cardHeader}>
              <span style={s.cardTitolo}>Questa settimana</span>
              <span style={s.cardData}>{lezioniSettimana} lezioni</span>
            </div>
            <MiniCalendario lezioni={lezioni} onNavigate={navigate} isMobile={isMobile} />
          </div>
        </div>

        {/* ── GRAFICO ── */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitolo}>
              {isMobile ? "Ultimi 3 mesi" : "Lezioni negli ultimi 6 mesi"}
            </span>
          </div>
          <GraficoLezioni lezioni={lezioni} isMobile={isMobile} />
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// STILI
// ══════════════════════════════════════════════════════════════════════════════
const s = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f4f5f7",
    fontFamily: "'Segoe UI', sans-serif",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    color: "#666",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    height: "56px",
    backgroundColor: "#1a1a2e",
    color: "white",
  },
  brand: { fontWeight: "700", fontSize: "16px", letterSpacing: "0.5px" },
  nav: { display: "flex", gap: "4px" },
  navBtn: {
    padding: "6px 16px",
    backgroundColor: "transparent",
    color: "rgba(255,255,255,0.7)",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  navActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "white",
    fontWeight: "600",
  },
  logoutBtn: {
    padding: "6px 14px",
    backgroundColor: "rgba(231,76,60,0.8)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  content: { display: "flex", flexDirection: "column", gap: "16px" },
  statsRow: { display: "grid" },
  statCard: {
    backgroundColor: "white",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
  },
  statCardOggi: { borderLeft: "3px solid #4361ee" },
  statIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  },
  statLabel: {
    fontSize: "11px",
    color: "#888",
    marginBottom: "3px",
    fontWeight: "500",
  },
  statValue: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1a1a2e",
    lineHeight: 1,
  },
  row2: { display: "grid" },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
  },
  miniCalCard: { borderRadius: "16px", overflow: "hidden" },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  cardTitolo: { fontSize: "15px", fontWeight: "700", color: "#1a1a2e" },
  cardData: { fontSize: "12px", color: "#888" },
  emptyOggi: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px 0",
    gap: "8px",
  },
  emptyOggiTesto: { color: "#aaa", fontSize: "13px" },
  lezioniOggiLista: { display: "flex", flexDirection: "column", gap: "8px" },
  lezioneOggiCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    backgroundColor: "#f8f9ff",
    borderRadius: "10px",
    borderLeft: "3px solid #4361ee",
  },
  lezioneOra: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "40px",
  },
  lezioneOraText: { fontSize: "11px", fontWeight: "700", color: "#4361ee" },
  lezioneOraSep: { fontSize: "8px", color: "#ccc" },
  lezioneInfo: { flex: 1 },
  lezioneClienti: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "2px",
  },
  lezioneDurata: { fontSize: "11px", color: "#888" },
};

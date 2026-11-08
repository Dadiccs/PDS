/* ==========================================================
   La Parola della Settimana — v2
   Per aggiungere una parola: aggiungila in fondo a PAROLE.
   La posizione nell'elenco = numero della settimana.
   ========================================================== */

// Lunedì della settimana 1 (AAAA-MM-GG)
const START_DATE = "2026-09-28";

const PAROLE = [
  "Pioda",
  "Trofie",
  "Patacca",
  "Granciporro",
  "Mellifluo",
  "Pappardella"
];

/* ========================================================== */

const DAY_MS = 86400000;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FLIP_MS = REDUCED ? 20 : 900;

const pad = n => String(n).padStart(2, "0");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const [sy, sm, sd] = START_DATE.split("-").map(Number);
const START = new Date(sy, sm - 1, sd);
const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
const fmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" });

function rangeLabel(w) {
  const a = addDays(START, (w - 1) * 7);
  const b = addDays(a, 6);
  const from = a.getMonth() === b.getMonth() ? a.getDate() : fmt.format(a);
  return `${from} – ${fmt.format(b)} ${b.getFullYear()}`;
}

const today = new Date(); today.setHours(0, 0, 0, 0);
const NOW = Math.floor(Math.round((today - START) / DAY_MS) / 7) + 1;
const N = PAROLE.length;

/* ---------- pagine ---------- */

const meta = w => `<p class="meta"><b>N° ${pad(w)}</b><br>${rangeLabel(w)}</p>`;

const leftPage = w => `<div class="pg">${meta(w)}</div>`;

function wordPage(w, word) {
  const soon = word == null;
  const text = soon ? "…" : esc(word);
  const len = soon ? 8 : Math.max(7, [...word].length);
  return `
    <div class="pg word-pg">
      ${meta(w)}
      <h2 class="word${soon ? " soon" : ""}" style="--len:${len}">${text}</h2>
    </div>`;
}

const coverPage = `
  <div class="pg cover-pg">
    <h1 class="cover-title">La Parola<br><em>della Settimana</em></h1>
    <p class="meta">Vol. I</p>
  </div>`;

const backCoverPage = `
  <div class="pg cover-pg">
    <p class="meta">CV3 26/27</p>
  </div>`;

/* spread = coppia di pagine visibili insieme */
const spreads = [{ id: "", left: null, right: { cls: "cover", html: coverPage } }];
PAROLE.forEach((word, i) => {
  const w = i + 1;
  spreads.push({
    id: `n${w}`, week: w, label: `N° ${pad(w)}: ${word}`,
    left: { cls: "paper", html: leftPage(w) },
    right: { cls: "paper", html: wordPage(w, word) }
  });
});
spreads.push({
  id: `n${N + 1}`, week: N + 1, soon: true, label: `N° ${pad(N + 1)}: in arrivo`,
  left: { cls: "paper", html: leftPage(N + 1) },
  right: { cls: "paper", html: wordPage(N + 1, null) }
});

const L = spreads.length;
const backCover = { cls: "cover", html: backCoverPage };

/* ---------- DOM ---------- */

const book = document.getElementById("book");
const indexNav = document.getElementById("index");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const statusEl = document.getElementById("status");

const leaves = spreads.map((s, i) => {
  const back = spreads[i + 1] ? spreads[i + 1].left : backCover;
  const leaf = document.createElement("div");
  leaf.className = "leaf";
  leaf.innerHTML = `
    <div class="face front ${s.right.cls}">${s.right.html}</div>
    <div class="face back ${back.cls}">${back.html}</div>`;
  book.appendChild(leaf);
  return leaf;
});
leaves.forEach((_, i) => settle(i));

const dots = [];
spreads.forEach((s, i) => {
  if (!s.week) return;
  const b = document.createElement("button");
  b.className = "dot" + (s.soon ? " soon" : "");
  b.textContent = pad(s.week);
  b.title = s.label;
  b.addEventListener("click", () => goTo(i));
  indexNav.appendChild(b);
  dots[i] = b;
});

/* ---------- sfogliare ----------
   Lo z-index di un foglio in movimento cambia a metà giro:
   finché sta a destra resta sotto ai fogli che lo precedono,
   quando passa a sinistra va sopra. Così non si vedono mai
   pagine "attraverso" la copertina. */

let pos = 0; // fogli girati = spread visibile

function settle(i) {
  const leaf = leaves[i];
  leaf.style.zIndex = leaf.classList.contains("flipped") ? i + 1 : L - i;
}

function goTo(target, { instant = false } = {}) {
  target = Math.max(0, Math.min(L, target));
  if (target === pos) return;

  const forward = target > pos;
  const idxs = [];
  if (forward) for (let i = pos; i < target; i++) idxs.push(i);
  else for (let i = pos - 1; i >= target; i--) idxs.push(i);

  if (instant || REDUCED) {
    book.classList.add("no-anim");
    idxs.forEach(i => { leaves[i].classList.toggle("flipped", forward); settle(i); });
    void book.offsetWidth;
    book.classList.remove("no-anim");
  } else {
    const stagger = Math.min(160, 1200 / idxs.length);
    idxs.forEach((i, k) => {
      const leaf = leaves[i];
      [leaf._t1, leaf._t2, leaf._t3].forEach(clearTimeout);
      leaf._t1 = setTimeout(() => {
        // prima metà del giro: ordine del lato di partenza
        leaf.style.zIndex = forward ? 1000 + (L - i) : 1000 + i;
        leaf.classList.toggle("flipped", forward);
        // seconda metà: ordine del lato di arrivo
        leaf._t2 = setTimeout(() => {
          leaf.style.zIndex = forward ? 2000 + i : 2000 + (L - i);
        }, FLIP_MS / 2);
        leaf._t3 = setTimeout(() => settle(i), FLIP_MS + 20);
      }, k * stagger);
    });
  }

  pos = target;
  updateUI();
}

const next = () => goTo(pos + 1);
const prev = () => goTo(pos - 1);

function updateUI() {
  book.classList.toggle("closed", pos === 0);
  book.classList.toggle("at-end", pos === L);
  prevBtn.disabled = pos === 0;
  nextBtn.disabled = pos === L;

  dots.forEach((d, i) => d && d.classList.toggle("active", i === pos));
  const d = dots[pos];
  if (d) indexNav.scrollTo({ left: d.offsetLeft - indexNav.clientWidth / 2 + d.clientWidth / 2, behavior: "smooth" });

  const s = spreads[pos];
  statusEl.textContent = s && s.label ? s.label : (pos === 0 ? "Copertina" : "Retro");
  history.replaceState(null, "", location.pathname + location.search + (s && s.id ? "#" + s.id : ""));
}

/* ---------- interazioni ---------- */

prevBtn.addEventListener("click", prev);
nextBtn.addEventListener("click", next);

let lastSwipe = 0;
book.addEventListener("click", e => {
  if (Date.now() - lastSwipe < 500) return;
  if (pos === 0) return next();
  if (pos === L) return prev();
  const r = book.getBoundingClientRect();
  e.clientX > r.left + r.width / 2 ? next() : prev();
});

let tx = 0, ty = 0;
book.addEventListener("touchstart", e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
book.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
    lastSwipe = Date.now();
    dx < 0 ? next() : prev();
  }
});

const dialog = document.getElementById("infoDialog");
document.getElementById("infoBtn").addEventListener("click", () => dialog.showModal());
document.getElementById("closeInfo").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });

document.addEventListener("keydown", e => {
  if (dialog.open) return;
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
});

window.addEventListener("hashchange", () => {
  const i = spreads.findIndex(s => s.id && "#" + s.id === location.hash);
  if (i >= 0) goTo(i);
});

/* ---------- apertura ---------- */

function startSpread() {
  const fromHash = spreads.findIndex(s => s.id && "#" + s.id === location.hash);
  if (fromHash > 0) return fromHash;
  return Math.max(1, Math.min(NOW, N + 1)); // settimana corrente o "in arrivo"
}

updateUI();
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
fontsReady.then(() => setTimeout(() => goTo(startSpread()), REDUCED ? 0 : 800));

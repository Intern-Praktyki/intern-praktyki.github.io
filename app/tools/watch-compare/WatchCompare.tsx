'use client';

import React, { useState, useEffect } from 'react';

// ═══════════════════════════════════════════════════════════════════
// TYPES — schemat bazy. Dodanie modelu = jeden obiekt w WATCHES.
// ═══════════════════════════════════════════════════════════════════

type Severity = 'high' | 'med' | 'low';

interface RiskPoint { label: string; detail: string; severity: Severity }
interface AuthPoint { label: string; detail: string }
interface WatchModel {
  id: string;
  name: string;       // krótka etykieta zakładki
  full: string;       // pełna nazwa
  era: string;
  spec: string;       // mechanizm / materiał — jedna linia
  q: string;          // fraza do wyszukiwarki
  chrono: string;     // gotowy deep-link Chrono24 z TWARDYMI filtrami w URL
  feedToken: string;  // token modelu do filtra feedu (np. „tank")
  budget: { entry: string; reality: string };
  calc: { service: number; buyback: number }; // kalkulator spreadu (PLN, stan idealny)
  risks: RiskPoint[];
  auth: AuthPoint[];
  liquidity: { score: number; speed: string; loss: string };
  acks: string[];     // potwierdzenia ryzyka — bramka przed wyjściem
}

interface FeedItem { title: string; link: string; date: string; price: string | null }

// ── Feed client-side (statyczny hosting — brak backendu) ──
// Publiczny RSS Google News przez proxy CORS. Zasada uczciwości:
// tylko publiczne kanały, brak omijania zabezpieczeń, graceful fallback.
function extractPrice(title: string): string | null {
  const m = title.match(/(\d[\d\s.]{2,})\s?(zł|zl|pln)\b/i);
  if (!m) return null;
  return `${m[1].replace(/[\s.]/g, '')} PLN`;
}

async function fetchWatchFeed(q: string, token: string): Promise<FeedItem[]> {
  const rss = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=pl&gl=PL&ceid=PL:pl`;
  const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(rss)}`;
  const res = await fetch(proxy);
  if (!res.ok) throw new Error('feed niedostępny');
  const xml = await res.text();
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const needle = token.toLowerCase();
  const out: FeedItem[] = [];
  for (const it of Array.from(doc.querySelectorAll('item'))) {
    const title = it.querySelector('title')?.textContent?.trim() ?? '';
    if (!title) continue;
    const t = title.toLowerCase();
    if (!t.includes('cartier') || !t.includes(needle)) continue;
    const pub = it.querySelector('pubDate')?.textContent?.trim() ?? '';
    out.push({
      title,
      link: it.querySelector('link')?.textContent?.trim() ?? '',
      date: pub ? new Date(pub).toISOString() : '',
      price: extractPrice(title),
    });
  }
  return out.sort((a, b) => (b.date > a.date ? 1 : -1)).slice(0, 6);
}

// ═══════════════════════════════════════════════════════════════════
// HELPERS — twarde filtry rynkowe (dyscyplina finansowa)
// ═══════════════════════════════════════════════════════════════════

const E = encodeURIComponent;

// Ścieżka 1 — Chrono24 deep-link z filtrami ZASZYTYMI w adresie:
//   export=EU         → WYŁĄCZNIE UE (blokada cła + 23% VAT spoza UE)
//   currency=PLN      → ceny w złotówkach
//   maxPrice=10000    → twardy budżet ≤ 10 000 PLN
//   sortorder=1       → od najtańszych
//   status=1&status=2 → stan: nienoszony / bardzo dobry
//   facets=condition&facets=scopeOfDelivery → wymusza panel Full Set
const chrono24Search = (q: string) =>
  `https://www.chrono24.pl/search/index.htm?query=${E(q)}` +
  `&currency=PLN&dosearch=true&export=EU&maxPrice=10000&sortorder=1` +
  `&status=1&status=2&facets=condition&facets=scopeOfDelivery` +
  `&accessoriesTypes=ORIGINAL_BOX_AND_PAPERS`;

// Ścieżka 2 — Giełda KMZiZ: zamiast gołego wyszukania → Google DORK.
//   site:        → tylko działy giełdowe polskich forów zegarkowych
//   ("sprzedam"…) → wymuszone frazy sprzedażowe (też skrót „FS:")
//   "<model>"    → dokładna fraza modelu
//   -"kupię"…    → odcina ogłoszenia „kupię/poszukuję/zamienię"
const kmzizGielda = (q: string) =>
  `https://www.google.com/search?q=${E(
    `("sprzedam" OR "na sprzedaż" OR "FS:") "${q}" ` +
    `(site:forum.kmziz.pl OR site:zegarkiipasja.com OR site:watch.pl) ` +
    `-"kupię" -"poszukuję" -"zamienię"`,
  )}`;

// Mapy — wyszukiwarka miejsc
const maps = (q: string) => `https://www.google.com/maps/search/${E(q)}`;

// ═══════════════════════════════════════════════════════════════════
// WARSZAWA OFFLINE — renomowane domy aukcyjne / komisy (Śródmieście)
// ═══════════════════════════════════════════════════════════════════

interface Komis { name: string; addr: string; note: string; url: string }

const KOMISY: Komis[] = [
  {
    name: 'DESA Unicum',
    addr: 'ul. Piękna 1A',
    note: 'Dom aukcyjny — zegarki na aukcjach „Sztuka Użytkowa i Design".',
    url: 'https://desa.pl',
  },
  {
    name: 'Rempex',
    addr: 'ul. Karowa 31',
    note: 'Dom aukcyjny — biżuteria i zegarki vintage, katalogi online.',
    url: 'https://www.rempex.com.pl',
  },
  {
    name: 'Komisy Nowy Świat / Pl. Trzech Krzyży',
    addr: 'Śródmieście Płn.',
    note: 'Skupisko jubilerów i antykwariatów — oględziny „z ręki".',
    url: maps('komis zegarków vintage Plac Trzech Krzyży Warszawa'),
  },
];

// Kalkulator spreadu — modyfikatory stanu (anty-iluzja okazji)
const CONDS: { label: string; addService: number; buyMult: number }[] = [
  { label: 'Idealny — pełny set', addService: 0,   buyMult: 1.0 },
  { label: 'Przetarcia / ślady',  addService: 800, buyMult: 0.82 },
  { label: 'Brak dokumentów',     addService: 0,   buyMult: 0.70 },
];

// ═══════════════════════════════════════════════════════════════════
// BAZA DANYCH — twarde dane analityczne
// ═══════════════════════════════════════════════════════════════════

const WATCHES: WatchModel[] = [
  {
    id: 'must-tank-vermeil',
    name: 'Must Tank',
    full: 'Must de Cartier Tank — Vermeil',
    era: '1977 – lata 90.',
    spec: 'Vermeil = srebro 925 platerowane złotem 20µ · kwarc lub manual',
    q: 'Cartier Must de Cartier Tank Vermeil',
    // Deep-link do strony modelu (mod1648) z twardymi filtrami w URL
    chrono:
      'https://www.chrono24.pl/cartier/must-de-cartier-tank--mod1648.htm' +
      '?currency=PLN&dosearch=true&export=EU&facets=condition&facets=scopeOfDelivery' +
      '&maxPrice=10000&sortorder=1&status=1&status=2',
    feedToken: 'tank',
    budget: {
      entry: '4 000 – 8 000 PLN',
      reality:
        'Kwarcowy Vermeil w dobrym stanie, często z burgundowym lub czarnym dialem. ' +
        'Pełny set to rzadkość — większość ofert to „watch only". Manual zwykle +20–30%.',
    },
    calc: { service: 700, buyback: 4500 },
    risks: [
      { label: 'Stan złocenia (vermeil)', severity: 'high',
        detail: 'Plater ściera się na uszach i dekslu. Przetarcia do srebra tną wartość; replating zabija oryginalność.' },
      { label: 'Dial i druk', severity: 'med',
        detail: 'Krawędzie cyfr muszą być ostre, lakier bez bąbli. Repainty częste.' },
      { label: 'Kaboszon koronki', severity: 'med',
        detail: 'Oryginalnie syntetyczny spinel. Plastik lub wymiana = czerwona flaga.' },
    ],
    auth: [
      { label: 'Secret signature', detail: 'Ukryty „Cartier" w cyfrze rzymskiej VII (godz. 7) — pod lupą.' },
      { label: 'Punce vermeil', detail: 'Oznaczenie 925 + symbol vermeil na dekslu lub uchu koperty.' },
    ],
    liquidity: { score: 3, speed: '2–6 tyg.', loss: '15–25%' },
    acks: [
      'Rozumiem ryzyko przetarć złocenia (vermeil) i koszt replatingu',
      'Rozumiem, że repaint tarczy lub wymiana kaboszonu zabijają wartość',
    ],
  },

  {
    id: 'santos-vintage',
    name: 'Santos',
    full: 'Santos de Cartier / Galbée — Vintage',
    era: 'lata 80. – 90.',
    spec: 'Stal lub dwukolor (stal/złoto 18k) · kwarc lub automat · śruby na bezelu',
    q: 'Cartier Santos Galbee vintage',
    chrono: chrono24Search('Cartier Santos Galbee'),
    feedToken: 'santos',
    budget: {
      entry: '5 000 – 9 000 PLN',
      reality:
        'Dwukolorowy Santos Galbée (kwarc) w średnim/dobrym stanie. Automat i pełna stal +15–25%. ' +
        'Zużyta bransoleta to główny czynnik ceny.',
    },
    calc: { service: 900, buyback: 5500 },
    risks: [
      { label: 'Stretch bransolety', severity: 'high',
        detail: 'Złóż w literę „U" — jeśli faluje jak wąż, ogniwa zużyte. Wymiana bardzo droga.' },
      { label: 'Zużycie złotego capa', severity: 'high',
        detail: 'Cienki cap złota przeciera się do stali. Sprawdź narożniki bezela i środkowe ogniwa.' },
      { label: 'Śruby bezela', severity: 'med',
        detail: 'Muszą być prawdziwymi śrubami, równo licowane. Rozjechane rowki = amatorski serwis.' },
    ],
    auth: [
      { label: 'Oryginalne śruby', detail: 'Pasują do śrubokręta, nie są odlewem — na bezelu i bransolecie.' },
      { label: 'Koronka', detail: 'Ośmiokątna, z syntetycznym niebieskim kaboszonem (spinel).' },
    ],
    liquidity: { score: 4, speed: '1–4 tyg.', loss: '10–20%' },
    acks: [
      'Rozumiem ryzyko luzów (stretch) bransolety i kosztownej wymiany',
      'Rozumiem zużycie złotego capa w wersji dwukolorowej',
    ],
  },

  {
    id: 'pasha-c',
    name: 'Pasha C',
    full: 'Pasha C de Cartier',
    era: 'lata 90. – 2000s',
    spec: 'Stal 35 mm · automat · zakręcana koronka z łańcuszkiem + kaboszon · kratka',
    q: 'Cartier Pasha C automatic',
    chrono: chrono24Search('Cartier Pasha C automatic'),
    feedToken: 'pasha',
    budget: {
      entry: '6 000 – 10 000 PLN',
      reality:
        'Stalowy Pasha C automatic 35 mm, często z pełnym setem. W budżecie realnie dobry egzemplarz z pudełkiem. ' +
        'Wersje z brylantami/złota są poza zakresem.',
    },
    calc: { service: 1200, buyback: 5500 },
    risks: [
      { label: 'Polerowanie krawędzi', severity: 'high',
        detail: 'Szukaj „grubych" uszu i ostrych faz. Over-polish daje miękki kształt = niższa wartość.' },
      { label: 'Łańcuszek i cap koronki', severity: 'high',
        detail: 'Zakręcana nakładka często ginie. Brak utrudnia sprzedaż, dorobienie kosztowne.' },
      { label: 'Wodoszczelność', severity: 'med',
        detail: 'Stare uszczelki przeciekają — przed wodą serwis. Wilgoć pod szkłem = stop.' },
    ],
    auth: [
      { label: 'Kaboszon capa', detail: 'Niebieski syntetyczny kaboszon w zakręcanej nakładce na łańcuszku.' },
      { label: 'Deksel', detail: 'Grawer „Pasha C", numer seryjny, water resistant 100 m.' },
    ],
    liquidity: { score: 2, speed: '4–10 tyg.', loss: '20–30%' },
    acks: [
      'Rozumiem ryzyko nadmiernej polerki koperty (over-polish)',
      'Rozumiem ryzyko braku oryginalnego capa/łańcuszka koronki',
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════
// PALETA baby blue + royal · style starych okienek
// ═══════════════════════════════════════════════════════════════════

const C = {
  desktop: '#6f9fd0',
  face:    '#dbe8f6',
  face2:   '#eef5fc',
  well:    '#cdddf0',
  titleA:  '#16357d',
  titleB:  '#3d72c9',
  hi:      '#ffffff',
  hi2:     '#bcd6f2',
  lo:      '#1c3a63',
  lo2:     '#5c83b0',
  ink:     '#0f2747',
  inkSoft: '#3a577a',
};

// Win95-style bevels via box-shadow
const raised = {
  boxShadow: `inset -1px -1px 0 ${C.lo}, inset 1px 1px 0 ${C.hi}, inset -2px -2px 0 ${C.lo2}, inset 2px 2px 0 ${C.hi2}`,
} as const;
const sunken = {
  boxShadow: `inset 1px 1px 0 ${C.lo}, inset -1px -1px 0 ${C.hi}, inset 2px 2px 0 ${C.lo2}, inset -2px -2px 0 ${C.hi2}`,
} as const;

const FONT = '"Tahoma", "MS Sans Serif", Geneva, Verdana, sans-serif';

const SEV: Record<Severity, { color: string; label: string }> = {
  high: { color: '#b4282a', label: 'KRYTYCZNE' },
  med:  { color: '#b9791b', label: 'WAŻNE' },
  low:  { color: '#2f7d4f', label: 'DROBNE' },
};

const fmtPLN = (n: number) => `${n.toLocaleString('pl-PL')} PLN`;

// ═══════════════════════════════════════════════════════════════════
// KOMPONENT GŁÓWNY
// ═══════════════════════════════════════════════════════════════════

export default function WatchCompare() {
  const [activeId, setActiveId] = useState(WATCHES[0].id);
  const [acks, setAcks] = useState<Record<string, boolean>>({});
  const idx = WATCHES.findIndex(m => m.id === activeId);
  const w = WATCHES[idx];
  const go = (i: number) => setActiveId(WATCHES[Math.min(WATCHES.length - 1, Math.max(0, i))].id);
  const allAcked = w.acks.every((_, i) => acks[`${w.id}::${i}`]);

  // ── Feed „Ostatnio widziane na polskich forach" ──
  const [feed, setFeed] = useState<{ loading: boolean; items: FeedItem[]; error: boolean }>({
    loading: true, items: [], error: false,
  });
  useEffect(() => {
    let alive = true;
    setFeed({ loading: true, items: [], error: false });
    fetchWatchFeed(w.q, w.feedToken)
      .then(items => { if (alive) setFeed({ loading: false, items, error: false }); })
      .catch(() => { if (alive) setFeed({ loading: false, items: [], error: true }); });
    return () => { alive = false; };
  }, [w.q, w.feedToken]);

  return (
    <div
      className="min-h-screen p-3 md:p-8 flex justify-center"
      style={{
        background: `repeating-linear-gradient(45deg, ${C.desktop}, ${C.desktop} 14px, #6a9acb 14px, #6a9acb 28px)`,
        fontFamily: FONT,
        color: C.ink,
      }}
    >
      <div className="w-full max-w-4xl">

        {/* ══ OKNO ════════════════════════════════════════════════ */}
        <div style={{ background: C.face, ...raised }} className="p-1">

          {/* TITLE BAR */}
          <div
            className="flex items-center gap-2 px-2 py-1 mb-1"
            style={{ background: `linear-gradient(90deg, ${C.titleA}, ${C.titleB})` }}
          >
            <span className="text-base leading-none">⌚</span>
            <span className="text-white font-bold text-[12px] sm:text-[13px] tracking-wide truncate">
              <span className="hidden sm:inline">Porównywarka Zegarków — </span>Cartier Vintage
            </span>
            <div className="ml-auto flex gap-1 shrink-0">
              {['–', '☐', '✕'].map((g, i) => (
                <span
                  key={i}
                  aria-hidden
                  className="w-5 h-5 flex items-center justify-center text-[11px] font-bold leading-none"
                  style={{ background: C.face, color: C.ink, ...raised }}
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* BROWSER TOOLBAR — nawigacja */}
          <div className="flex items-center gap-1 px-1 py-1">
            {([
              { g: '◀', t: 'Wstecz',  fn: () => go(idx - 1), off: idx === 0 },
              { g: '▶', t: 'Dalej',   fn: () => go(idx + 1), off: idx === WATCHES.length - 1 },
              { g: '⟳', t: 'Odśwież', fn: () => go(idx),     off: false },
              { g: '⌂', t: 'Start',   fn: () => go(0),       off: false },
            ] as const).map((b, i) => (
              <button
                key={i}
                onClick={b.fn}
                disabled={b.off}
                title={b.t}
                className="w-7 h-7 shrink-0 flex items-center justify-center text-[12px] font-bold active:translate-y-px disabled:opacity-40"
                style={{ background: C.face, color: C.ink, ...raised }}
              >
                {b.g}
              </button>
            ))}
          </div>

          {/* Pasek ładowania (dekoracyjny) */}
          <div className="h-1 mx-1 mb-1" style={{ background: `linear-gradient(90deg, ${C.titleB} 70%, ${C.well} 70%)`, ...sunken }} />

          {/* TABS przeglądarki — wybór modelu (przewijalne na mobile) */}
          <div className="flex gap-0.5 px-1 pt-1 overflow-x-auto whitespace-nowrap">
            {WATCHES.map(m => {
              const on = m.id === activeId;
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveId(m.id)}
                  className="px-3 md:px-5 py-1.5 text-[12px] font-bold relative shrink-0"
                  style={{
                    background: on ? C.face2 : C.face,
                    color: on ? C.titleA : C.inkSoft,
                    ...raised,
                    marginBottom: on ? '-2px' : '0',
                    zIndex: on ? 2 : 1,
                  }}
                >
                  {m.name}
                </button>
              );
            })}
          </div>

          {/* BODY */}
          <div className="p-3 md:p-4" style={{ background: C.face2, ...sunken }}>

            {/* Nagłówek modelu */}
            <div className="px-3 py-2 mb-3" style={{ background: C.well, ...sunken }}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[15px] md:text-base font-bold" style={{ color: C.titleA }}>{w.full}</span>
                <span className="text-[11px] font-bold" style={{ color: C.inkSoft }}>· {w.era}</span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: C.inkSoft }}>{w.spec}</div>
            </div>

            {/* Dwie zgrupowane sekcje */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

              {/* GRUPA 1 — Budżet i płynność */}
              <Group title="Budżet i płynność">
                <div className="text-xl font-bold leading-tight" style={{ color: C.titleA }}>{w.budget.entry}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.inkSoft }}>
                  punkt wejścia
                </div>
                <p className="text-[12px] leading-snug mb-3" style={{ color: C.ink }}>{w.budget.reality}</p>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold" style={{ color: C.inkSoft }}>Płynność:</span>
                  <span className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span
                        key={i}
                        className="w-3 h-3 inline-block"
                        style={{ background: i <= w.liquidity.score ? C.titleB : C.well, ...sunken }}
                      />
                    ))}
                  </span>
                  <span className="text-[11px] font-bold" style={{ color: C.titleA }}>{w.liquidity.score}/5</span>
                </div>
                <div className="flex gap-2">
                  <Mini label="Czas zbytu" value={w.liquidity.speed} />
                  <Mini label="Realna strata" value={w.liquidity.loss} />
                </div>
              </Group>

              {/* GRUPA 2 — Czego pilnować */}
              <Group title="Czego pilnować">
                {w.risks.slice(0, 3).map(r => (
                  <div key={r.label} className="flex gap-2 mb-2">
                    <span className="w-3 h-3 mt-0.5 shrink-0" style={{ background: SEV[r.severity].color, ...raised }} />
                    <div className="min-w-0">
                      <span className="text-[12px] font-bold" style={{ color: C.ink }}>{r.label} </span>
                      <span className="text-[10px] font-bold" style={{ color: SEV[r.severity].color }}>
                        [{SEV[r.severity].label}]
                      </span>
                      <p className="text-[11px] leading-snug" style={{ color: C.inkSoft }}>{r.detail}</p>
                    </div>
                  </div>
                ))}
                <div className="my-2 h-px" style={{ background: C.lo2, boxShadow: `0 1px 0 ${C.hi}` }} />
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.inkSoft }}>
                  Autentyczność — musi się zgadzać
                </div>
                {w.auth.slice(0, 2).map(a => (
                  <div key={a.label} className="flex gap-2 mb-1.5">
                    <span className="text-[12px] leading-none" style={{ color: C.titleB }}>✓</span>
                    <div className="min-w-0">
                      <span className="text-[12px] font-bold" style={{ color: C.ink }}>{a.label}: </span>
                      <span className="text-[11px]" style={{ color: C.inkSoft }}>{a.detail}</span>
                    </div>
                  </div>
                ))}
              </Group>
            </div>

            {/* KALKULATOR SPREADU — żywe narzędzie zamiast statycznego wykresu */}
            <div className="mt-3">
              <SpreadCalc calc={w.calc} />
            </div>

            {/* FEED — Ostatnio widziane na polskich forach */}
            <div className="mt-3">
              <Group title="📡 Ostatnio widziane na polskich forach">
                {feed.loading && (
                  <p className="text-[11px]" style={{ color: C.inkSoft }}>Wczytywanie świeżych wzmianek…</p>
                )}
                {!feed.loading && feed.items.length === 0 && (
                  <p className="text-[11px]" style={{ color: C.inkSoft }}>
                    Brak świeżych publicznych wzmianek dla „Cartier {w.name}". Ustaw alert na giełdzie KMZiZ (ścieżka ②), żeby łapać oferty pierwszy.
                  </p>
                )}
                {!feed.loading && feed.items.length > 0 && (
                  <ul className="space-y-1.5">
                    {feed.items.map((it, i) => (
                      <li key={i} className="px-2 py-1.5" style={{ background: C.face2, ...sunken }}>
                        <a
                          href={it.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] font-bold leading-snug block hover:underline"
                          style={{ color: C.titleA }}
                        >
                          {it.title} ↗
                        </a>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[10px]" style={{ color: C.inkSoft }}>
                          {it.date && <span>🗓 {new Date(it.date).toLocaleDateString('pl-PL')}</span>}
                          {it.price && (
                            <span className="font-bold" style={{ color: SEV.med.color }}>💰 {it.price}</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[9px] mt-2" style={{ color: C.lo2 }}>
                  Źródło: publiczne kanały RSS (agregacja wzmianek). Tylko podgląd — weryfikuj w oryginalnym ogłoszeniu.
                </p>
              </Group>
            </div>

            {/* BRAMKA WERYFIKACYJNA — potwierdzenie ryzyka przed wyjściem */}
            <div className="mt-3">
              <Group title="🔒 Bramka weryfikacyjna — potwierdź ryzyko">
                <p className="text-[11px] mb-2" style={{ color: C.inkSoft }}>
                  Zanim ruszysz na giełdę, zaznacz, że rozumiesz wady tego modelu. Bez tego ścieżki zakupu są zablokowane.
                </p>
                {w.acks.map((txt, i) => {
                  const key = `${w.id}::${i}`;
                  return (
                    <label key={key} className="flex items-start gap-2 mb-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!!acks[key]}
                        onChange={e => setAcks(p => ({ ...p, [key]: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 shrink-0 accent-[#16357d]"
                      />
                      <span className="text-[12px]" style={{ color: C.ink }}>{txt}</span>
                    </label>
                  );
                })}
              </Group>
            </div>

            {/* 3 ŚCIEŻKI ZAKUPU — odblokowane dopiero po bramce */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">

              {/* Ścieżka 1 — Chrono24 (deep-link, twarde filtry w URL) */}
              <Group title="① Chrono24 — tylko UE">
                <p className="text-[11px] mb-2" style={{ color: C.inkSoft }}>
                  Deep-link z filtrami zaszytymi w adresie: <b>UE</b> (bez cła/VAT), <b>≤10 000 PLN</b>, od najtańszych, <b>Full Set</b>, stan bardzo dobry/nienoszony.
                </p>
                <ExitLink enabled={allAcked} href={w.chrono} label="Szukaj ofert" />
                {!allAcked && <p className="text-[10px] mt-1" style={{ color: SEV.high.color }}>Zaznacz potwierdzenia ryzyka ↑</p>}
              </Group>

              {/* Ścieżka 2 — Giełda KMZiZ */}
              <Group title="② Giełda KMZiZ — Sprzedam">
                <p className="text-[11px] mb-2" style={{ color: C.inkSoft }}>
                  Dział „Sprzedam" polskiej społeczności. Ustaw <b>alert/subskrypcję</b> na frazę „Cartier {w.name}", by łapać świeże oferty pierwszy.
                </p>
                <ExitLink enabled={allAcked} href={kmzizGielda(w.q)} label="Szukaj ofert" />
                {!allAcked && <p className="text-[10px] mt-1" style={{ color: SEV.high.color }}>Zaznacz potwierdzenia ryzyka ↑</p>}
              </Group>

              {/* Ścieżka 3 — Warszawa offline (konkretne komisy) */}
              <Group title="③ Warszawa offline">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.inkSoft }}>
                  Renomowane adresy — Śródmieście
                </p>
                <ul className="space-y-1.5">
                  {KOMISY.map(k => (
                    <li key={k.name} className="px-2 py-1.5" style={{ background: C.face2, ...sunken }}>
                      <div className="text-[12px] font-bold" style={{ color: C.titleA }}>{k.name}</div>
                      <div className="text-[10px] font-bold" style={{ color: C.inkSoft }}>📍 {k.addr}</div>
                      <p className="text-[10px] leading-snug mb-1" style={{ color: C.ink }}>{k.note}</p>
                      <div className="flex flex-wrap gap-1">
                        <a href={k.url} target="_blank" rel="noopener noreferrer"
                          className="px-2 py-0.5 text-[10px] font-bold active:translate-y-px"
                          style={{ background: C.face, color: C.titleA, ...raised }}>
                          Oferta ↗
                        </a>
                        <a href={maps(`${k.name} ${k.addr} Warszawa`)} target="_blank" rel="noopener noreferrer"
                          className="px-2 py-0.5 text-[10px] font-bold active:translate-y-px"
                          style={{ background: C.face, color: C.titleA, ...raised }}>
                          🗺️ Mapa ↗
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </Group>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-KOMPONENTY
// ═══════════════════════════════════════════════════════════════════

// Klasyczny "group box" z legendą na krawędzi (border: groove)
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset
      className="px-3 pb-3 pt-1"
      style={{ border: `2px groove ${C.hi2}`, background: C.face }}
    >
      <legend className="px-1 text-[12px] font-bold" style={{ color: C.titleA }}>{title}</legend>
      {children}
    </fieldset>
  );
}

// Kalkulator spreadu ryzyka — żywe narzędzie
function SpreadCalc({ calc }: { calc: { service: number; buyback: number } }) {
  const [price, setPrice] = useState('');
  const [cond, setCond] = useState(0);

  const p = parseInt(price.replace(/\D/g, ''), 10) || 0;
  const c = CONDS[cond];
  const service = calc.service + c.addService;          // X — serwis startowy
  const buyback = Math.round(calc.buyback * c.buyMult); // Y — odkup dilera
  const totalIn = p + service;
  const spread = totalIn > 0 ? Math.round(((totalIn - buyback) / totalIn) * 100) : 0;
  const sevColor = spread > 30 ? SEV.high.color : spread > 15 ? SEV.med.color : SEV.low.color;

  return (
    <Group title="🧮 Kalkulator spreadu ryzyka">
      <p className="text-[11px] mb-2" style={{ color: C.inkSoft }}>
        Wpisz cenę z ogłoszenia i wybierz stan. Zobaczysz, ile realnie stracisz przy natychmiastowym odkupie przez dilera.
      </p>
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: C.inkSoft }}>
            Cena oferty (PLN)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="np. 6500"
            className="w-full px-2 py-1 text-[13px] font-bold outline-none"
            style={{ background: C.hi, color: C.ink, ...sunken }}
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: C.inkSoft }}>
            Stan egzemplarza
          </label>
          <select
            value={cond}
            onChange={e => setCond(Number(e.target.value))}
            className="w-full px-2 py-1 text-[13px] font-bold outline-none"
            style={{ background: C.hi, color: C.ink, ...sunken }}
          >
            {CONDS.map((cc, i) => <option key={i} value={i}>{cc.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="px-2 py-1.5" style={{ background: C.face2, ...sunken }}>
          <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.inkSoft }}>Serwis startowy</div>
          <div className="text-[14px] font-bold" style={{ color: C.ink }}>{fmtPLN(service)}</div>
        </div>
        <div className="px-2 py-1.5" style={{ background: C.face2, ...sunken }}>
          <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.inkSoft }}>Odkup dilera (WAW)</div>
          <div className="text-[14px] font-bold" style={{ color: C.ink }}>{fmtPLN(buyback)}</div>
        </div>
        <div className="px-2 py-1.5" style={{ background: C.face2, ...sunken }}>
          <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.inkSoft }}>Spread ryzyka</div>
          <div className="text-[14px] font-bold" style={{ color: p > 0 ? sevColor : C.inkSoft }}>
            {p > 0 ? `${spread}%` : '—'}
          </div>
        </div>
      </div>
      {p > 0 && (
        <p className="text-[11px] mt-2 leading-snug" style={{ color: C.ink }}>
          Wkład razem <b>{fmtPLN(totalIn)}</b> · natychmiastowy odkup <b>{fmtPLN(buyback)}</b> ·{' '}
          <span style={{ color: sevColor }}>
            {spread > 30 ? 'wysokie ryzyko — to nie okazja.' : spread > 15 ? 'spread akceptowalny przy dłuższym trzymaniu.' : 'wąski spread — realna okazja.'}
          </span>
        </p>
      )}
    </Group>
  );
}

// Link wyjściowy — aktywny dopiero po przejściu bramki ryzyka
function ExitLink({ enabled, href, label }: { enabled: boolean; href: string; label: string }) {
  if (!enabled) {
    return (
      <span
        aria-disabled
        className="block w-full text-center px-3 py-2 text-[13px] font-bold cursor-not-allowed opacity-50"
        style={{ background: C.well, color: C.inkSoft, ...sunken }}
      >
        🔒 {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full text-center px-3 py-2 text-[13px] font-bold text-white active:translate-y-px"
      style={{ background: C.titleB, ...raised }}
    >
      {label} ↗
    </a>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-2 py-1" style={{ background: C.face2, ...sunken }}>
      <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: C.inkSoft }}>{label}</div>
      <div className="text-[13px] font-bold" style={{ color: C.ink }}>{value}</div>
    </div>
  );
}

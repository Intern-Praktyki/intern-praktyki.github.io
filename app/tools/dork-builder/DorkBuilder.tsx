'use client';

import React, { useState, useMemo } from 'react';
import {
  Search, Copy, ExternalLink, Check, ChevronDown, ChevronRight,
  BookOpen, Wrench, Zap, FileText, Globe, Lock, Eye,
  Database, AlertTriangle, RefreshCw, Shield, Calendar,
  Hash, Layers, Link2, Star, Info, Clock, Filter,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type OpCat = 'zasoby' | 'tresc' | 'url' | 'meta' | 'logika' | 'czas';
type TokenCat = 'keyword' | 'zasoby' | 'tresc' | 'url' | 'meta' | 'logika' | 'wyklucz' | 'czas';
interface Token { text: string; cat: TokenCat }

type S = {
  keyword: string;
  // ZASOBY
  useSite: boolean; site: string;
  useExcludeSite: boolean; excludeSite: string;
  useFiletype: boolean; filetype: string;
  useExt: boolean; ext: string;
  // TREŚĆ
  useIntitle: boolean; intitle: string;
  useAllintitle: boolean; allintitle: string;
  useIntext: boolean; intext: string;
  useAllintext: boolean; allintext: string;
  // URL
  useInurl: boolean; inurl: string;
  useAllinurl: boolean; allinurl: string;
  // META
  useInanchor: boolean; inanchor: string;
  useCache: boolean; cache: string;
  useRelated: boolean; related: string;
  useInfo: boolean; info: string;
  useLink: boolean; link: string;
  // LOGIKA
  useExactPhrase: boolean; exactPhrase: string;
  useExcludeWord: boolean; excludeWord: string;
  useOrTerms: boolean; orTerms: string;
  useNumrange: boolean; numFrom: string; numTo: string;
  // CZAS
  useAfter: boolean; after: string;
  useBefore: boolean; before: string;
};

// ═══════════════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════════════

const FILETYPES = ['pdf','xls','xlsx','doc','docx','txt','csv','ppt','pptx','xml','json','rtf','odt','ods'] as const;
const EXTS = ['log','sql','env','bak','conf','config','cfg','ini','yml','yaml','sh','php','asp','jsp','htpasswd','pem','key'] as const;

const CATS: { id: OpCat; label: string; desc: string; tabOn: string; tabOff: string; dot: string }[] = [
  { id: 'zasoby', label: 'ZASOBY',  desc: 'Domena i typ pliku', tabOn: 'border-b-2 border-orange-500 text-orange-400 bg-orange-500/10', tabOff: 'text-gray-500 hover:text-orange-300 hover:bg-orange-500/5', dot: 'bg-orange-500' },
  { id: 'tresc',  label: 'TREŚĆ',   desc: 'Słowa na stronie',   tabOn: 'border-b-2 border-sky-500 text-sky-400 bg-sky-500/10',        tabOff: 'text-gray-500 hover:text-sky-300 hover:bg-sky-500/5',    dot: 'bg-sky-500'    },
  { id: 'url',    label: 'URL',     desc: 'W adresie strony',   tabOn: 'border-b-2 border-yellow-500 text-yellow-400 bg-yellow-500/10', tabOff: 'text-gray-500 hover:text-yellow-300 hover:bg-yellow-500/5', dot: 'bg-yellow-500' },
  { id: 'meta',   label: 'META',    desc: 'Dane o stronie',     tabOn: 'border-b-2 border-purple-500 text-purple-400 bg-purple-500/10', tabOff: 'text-gray-500 hover:text-purple-300 hover:bg-purple-500/5', dot: 'bg-purple-500' },
  { id: 'logika', label: 'LOGIKA',  desc: 'Operatory logiczne', tabOn: 'border-b-2 border-green-500 text-green-400 bg-green-500/10',  tabOff: 'text-gray-500 hover:text-green-300 hover:bg-green-500/5',  dot: 'bg-green-500'  },
  { id: 'czas',   label: 'CZAS',    desc: 'Filtry daty',        tabOn: 'border-b-2 border-pink-500 text-pink-400 bg-pink-500/10',     tabOff: 'text-gray-500 hover:text-pink-300 hover:bg-pink-500/5',    dot: 'bg-pink-500'   },
];

const TOKEN_CLS: Record<TokenCat, string> = {
  keyword: 'bg-white/10 text-white border border-white/20',
  zasoby:  'bg-orange-500/20 text-orange-300 border border-orange-400/40',
  tresc:   'bg-sky-500/20 text-sky-300 border border-sky-400/40',
  url:     'bg-yellow-500/20 text-yellow-200 border border-yellow-400/40',
  meta:    'bg-purple-500/20 text-purple-300 border border-purple-400/40',
  logika:  'bg-green-500/20 text-green-300 border border-green-400/40',
  wyklucz: 'bg-red-900/60 text-red-300 border border-red-500/50',
  czas:    'bg-pink-500/20 text-pink-300 border border-pink-400/40',
};

// Toggle-level input styling — complete strings for Tailwind JIT
const INPUT_CLS = 'flex-1 min-w-0 bg-[#1a0d00] border border-orange-900/40 rounded px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-orange-500/60 transition disabled:opacity-30 disabled:cursor-not-allowed';

const PLAYBOOKS = [
  { name: 'Otwarte katalogi (Directory Listing)', risk: 2, desc: 'Serwery z listowaniem katalogów — złota żyła OSINT', state: { useIntitle: true, intitle: 'index of /' } },
  { name: 'Wycieki haseł — pliki logów', risk: 4, desc: 'Pliki .log z danymi uwierzytelniającymi', state: { useExt: true, ext: 'log', useIntext: true, intext: 'password' } },
  { name: 'Dokumenty HR / Benefity', risk: 3, desc: 'Publiczne PDFy z danymi pracowniczymi', state: { useFiletype: true, filetype: 'pdf', useIntext: true, intext: 'confidential' } },
  { name: 'Panele administratora', risk: 4, desc: 'Otwarte panele admina bez autentykacji', state: { useIntitle: true, intitle: 'admin panel', useInurl: true, inurl: 'admin' } },
  { name: 'Pliki .env / klucze API', risk: 5, desc: 'Pliki środowiskowe z hasłami i kluczami', state: { useInurl: true, inurl: '.env', useIntext: true, intext: 'DB_PASSWORD' } },
  { name: 'Kamery IP — podgląd live', risk: 3, desc: 'Niezabezpieczone kamery z publicznym podglądem', state: { useIntitle: true, intitle: 'webcamXP 5' } },
  { name: 'Arkusze Excel z danymi', risk: 3, desc: 'Excele z potencjalnie wrażliwymi danymi', state: { useFiletype: true, filetype: 'xls', useIntext: true, intext: 'confidential' } },
  { name: 'Backupy baz danych SQL', risk: 5, desc: 'Dumpy SQL wystawione publicznie', state: { useExt: true, ext: 'sql', useIntext: true, intext: 'INSERT INTO' } },
  { name: 'Błędy PHP / Stack trace', risk: 3, desc: 'Strony ujawniające strukturę serwera', state: { useIntext: true, intext: 'PHP Parse error' } },
  { name: 'Odsłonięte repozytoria Git', risk: 4, desc: 'Repozytoria git dostępne przez HTTP', state: { useInurl: true, inurl: '/.git/config' } },
  { name: 'Urządzenia IoT / SCADA', risk: 5, desc: 'Panele sterowania systemami przemysłowymi', state: { useIntitle: true, intitle: 'SCADA', useInurl: true, inurl: 'login' } },
  { name: 'Listy e-mail / eksporty CSV', risk: 4, desc: 'Pliki CSV z adresami email', state: { useFiletype: true, filetype: 'csv', useIntext: true, intext: '@gmail.com' } },
  { name: 'Certyfikaty SSL / klucze PEM', risk: 5, desc: 'Prywatne klucze kryptograficzne online', state: { useExt: true, ext: 'pem', useIntext: true, intext: 'PRIVATE KEY' } },
  { name: 'Routery / strony logowania', risk: 3, desc: 'Domyślne interfejsy konfiguracji routerów', state: { useIntitle: true, intitle: 'router login', useIntext: true, intext: 'password' } },
] as const;

const KNOWLEDGE = [
  { tag: 'site:', cat: 'zasoby' as OpCat, stars: 1, eli5: 'Mówi Google: "Szukaj TYLKO na tej stronie — zignoruj cały reszta internetu."', example: 'site:gov.pl filetype:pdf "przetarg"', usecase: 'Znajdź wszystkie przetargi PDF opublikowane przez rząd.' },
  { tag: 'filetype:', cat: 'zasoby' as OpCat, stars: 1, eli5: 'Mówi Google: "Pokaż mi TYLKO pliki tego formatu — PDF, Excel, Word itp."', example: 'filetype:xlsx "wynagrodzenia" site:pl', usecase: 'Szukaj Excelów z danymi płac dostępnych publicznie.' },
  { tag: 'ext:', cat: 'zasoby' as OpCat, stars: 2, eli5: 'Jak filetype:, ale szuka rozszerzenia w samym adresie URL. Bardziej precyzyjne.', example: 'ext:sql "DROP TABLE" -github.com', usecase: 'Znajdź dumpy SQL poza GitHubem.' },
  { tag: 'intitle:', cat: 'tresc' as OpCat, stars: 2, eli5: 'Mówi Google: "Szukaj słowa w TYTULE zakładki — nazwie strony, nie w treści."', example: 'intitle:"index of" passwords', usecase: 'Klasyczny dork — otwarte katalogi z plikami haseł.' },
  { tag: 'allintitle:', cat: 'tresc' as OpCat, stars: 2, eli5: 'Jak intitle:, ale WSZYSTKIE słowa muszą być w tytule strony jednocześnie.', example: 'allintitle: admin panel login setup', usecase: 'Precyzyjne wyszukiwanie paneli z konkretną konfiguracją.' },
  { tag: 'intext:', cat: 'tresc' as OpCat, stars: 2, eli5: 'Mówi Google: "Szukaj słowa gdzieś w TREŚCI strony — w tym co możesz przeczytać."', example: 'intext:"api_key =" intext:"secret"', usecase: 'Znajdź strony z publicznie ujawnionymi kluczami API.' },
  { tag: 'allintext:', cat: 'tresc' as OpCat, stars: 2, eli5: 'Jak intext:, ale WSZYSTKIE słowa muszą być w treści strony — wszystkie naraz.', example: 'allintext: password username admin login', usecase: 'Strony z formularzami logowania i danymi uwierzytelniającymi.' },
  { tag: 'inurl:', cat: 'url' as OpCat, stars: 2, eli5: 'Mówi Google: "Szukaj słowa w ADRESIE URL — w pasku adresu przeglądarki."', example: 'inurl:admin inurl:login -wikipedia.org', usecase: 'Znajdź panele adminów i strony logowania.' },
  { tag: 'allinurl:', cat: 'url' as OpCat, stars: 2, eli5: 'Jak inurl:, ale WSZYSTKIE słowa muszą być w adresie URL jednocześnie.', example: 'allinurl: admin panel config php', usecase: 'Precyzyjne znalezienie URL z kilkoma segmentami.' },
  { tag: 'inanchor:', cat: 'meta' as OpCat, stars: 3, eli5: 'Szuka słowa w TEKŚCIE LINKU prowadzącego do strony — w klikwalnym opisie linku.', example: 'inanchor:"admin login" site:pl', usecase: 'Znajdź strony opisywane jako "panel admina" w linkach.' },
  { tag: 'cache:', cat: 'meta' as OpCat, stars: 3, eli5: 'Mówi Google: "Pokaż STARY ZAPIS strony — snapshot z przeszłości gdy ją fotografowałeś."', example: 'cache:przyklad.pl/usunietastrona', usecase: 'Odtwórz usuniętą stronę lub znajdź stare wersje treści.' },
  { tag: 'related:', cat: 'meta' as OpCat, stars: 3, eli5: 'Mówi Google: "Pokaż strony PODOBNE do tej — konkurentów i siostrzane serwisy."', example: 'related:facebook.com', usecase: 'Mapuj ekosystem konkurencji.' },
  { tag: 'info:', cat: 'meta' as OpCat, stars: 2, eli5: 'Mówi Google: "Pokaż mi co wiesz o tej stronie — jej opis, cache, linki."', example: 'info:przyklad.pl', usecase: 'Szybki przegląd tego co Google wie o domenie.' },
  { tag: 'link:', cat: 'meta' as OpCat, stars: 3, eli5: 'Mówi Google: "Pokaż strony które LINKUJĄ do tej — kto na nią wskazuje."', example: 'link:przyklad.pl', usecase: 'Analiza profilu linków — kto linkuje do celu.' },
  { tag: '"fraza dokładna"', cat: 'logika' as OpCat, stars: 1, eli5: 'Cudzysłów = szukaj DOKŁADNIE tej frazy, słowo w słowo, w tej samej kolejności.', example: '"confidential" "do not distribute" filetype:pdf', usecase: 'Znajdź dokumenty z ostrzeżeniami poufności które wyciekły.' },
  { tag: '- (wyklucz słowo)', cat: 'logika' as OpCat, stars: 1, eli5: 'Minus przed słowem mówi Google: "WYKLUCZ strony z tym słowem — usuń szum."', example: 'hasła filetype:pdf -site:gov.pl -site:edu.pl', usecase: 'Usuń zaufane domeny z wyników i skup się na ryzykownych.' },
  { tag: 'OR', cat: 'logika' as OpCat, stars: 2, eli5: 'Mówi Google: "Szukaj JEDNEGO LUB DRUGIEGO — nie obu jednocześnie."', example: 'filetype:pdf OR filetype:doc "wynagrodzenia"', usecase: 'Szukaj dokumentów w kilku formatach naraz.' },
  { tag: 'X..Y (zakres liczb)', cat: 'logika' as OpCat, stars: 3, eli5: 'Dwie kropki między liczbami = szukaj liczby W TYM ZAKRESIE. Od X do Y.', example: 'laptop 500..2000 site:pl', usecase: 'Szukaj ofert w przedziale cenowym.' },
  { tag: 'after:RRRR-MM-DD', cat: 'czas' as OpCat, stars: 2, eli5: 'Mówi Google: "Pokaż tylko wyniki NOWSZE niż ta data — świeże treści."', example: 'wyciek danych after:2024-01-01', usecase: 'Szukaj tylko najnowszych incydentów bezpieczeństwa.' },
  { tag: 'before:RRRR-MM-DD', cat: 'czas' as OpCat, stars: 2, eli5: 'Mówi Google: "Pokaż tylko wyniki STARSZE niż ta data — historyczne treści."', example: 'projekt tajny before:2020-01-01', usecase: 'Znajdź historyczne dokumenty lub stare wersje serwisów.' },
];

const DEF: S = {
  keyword: '',
  useSite: false, site: '',
  useExcludeSite: false, excludeSite: '',
  useFiletype: false, filetype: 'pdf',
  useExt: false, ext: 'log',
  useIntitle: false, intitle: '',
  useAllintitle: false, allintitle: '',
  useIntext: false, intext: '',
  useAllintext: false, allintext: '',
  useInurl: false, inurl: '',
  useAllinurl: false, allinurl: '',
  useInanchor: false, inanchor: '',
  useCache: false, cache: '',
  useRelated: false, related: '',
  useInfo: false, info: '',
  useLink: false, link: '',
  useExactPhrase: false, exactPhrase: '',
  useExcludeWord: false, excludeWord: '',
  useOrTerms: false, orTerms: '',
  useNumrange: false, numFrom: '', numTo: '',
  useAfter: false, after: '',
  useBefore: false, before: '',
};

const WANTED_LABEL = ['', 'Nowicjusz', 'Dobry start!', 'Solidny dork!', 'Pro level!', 'OSINT EKSPERT!'];
const WANTED_COLOR = ['', 'text-gray-400', 'text-yellow-400', 'text-orange-400', 'text-red-400', 'text-red-500'];

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function DorkBuilder() {
  const [tab, setTab] = useState<'builder' | 'knowledge'>('builder');
  const [state, setState] = useState<S>(DEF);
  const [cat, setCat] = useState<OpCat>('zasoby');
  const [playbook, setPlaybook] = useState('');
  const [copied, setCopied] = useState(false);
  const [kSearch, setKSearch] = useState('');

  const set = <K extends keyof S>(key: K, val: S[K]) =>
    setState(prev => ({ ...prev, [key]: val }));

  // Build token list (source of truth for the dork string)
  const tokens = useMemo<Token[]>(() => {
    const t: Token[] = [];
    if (state.keyword) t.push({ text: state.keyword, cat: 'keyword' });
    if (state.useExactPhrase && state.exactPhrase) t.push({ text: `"${state.exactPhrase}"`, cat: 'logika' });
    if (state.useExcludeWord && state.excludeWord) t.push({ text: `-${state.excludeWord}`, cat: 'wyklucz' });
    if (state.useSite && state.site) t.push({ text: `site:${state.site}`, cat: 'zasoby' });
    if (state.useExcludeSite && state.excludeSite) t.push({ text: `-site:${state.excludeSite}`, cat: 'wyklucz' });
    if (state.useFiletype && state.filetype) t.push({ text: `filetype:${state.filetype}`, cat: 'zasoby' });
    if (state.useExt && state.ext) t.push({ text: `ext:${state.ext}`, cat: 'zasoby' });
    if (state.useIntitle && state.intitle) t.push({ text: `intitle:"${state.intitle}"`, cat: 'tresc' });
    if (state.useAllintitle && state.allintitle) t.push({ text: `allintitle:${state.allintitle}`, cat: 'tresc' });
    if (state.useIntext && state.intext) t.push({ text: `intext:"${state.intext}"`, cat: 'tresc' });
    if (state.useAllintext && state.allintext) t.push({ text: `allintext:${state.allintext}`, cat: 'tresc' });
    if (state.useInurl && state.inurl) t.push({ text: `inurl:${state.inurl}`, cat: 'url' });
    if (state.useAllinurl && state.allinurl) t.push({ text: `allinurl:${state.allinurl}`, cat: 'url' });
    if (state.useInanchor && state.inanchor) t.push({ text: `inanchor:${state.inanchor}`, cat: 'meta' });
    if (state.useCache && state.cache) t.push({ text: `cache:${state.cache}`, cat: 'meta' });
    if (state.useRelated && state.related) t.push({ text: `related:${state.related}`, cat: 'meta' });
    if (state.useInfo && state.info) t.push({ text: `info:${state.info}`, cat: 'meta' });
    if (state.useLink && state.link) t.push({ text: `link:${state.link}`, cat: 'meta' });
    if (state.useOrTerms && state.orTerms) {
      const parts = state.orTerms.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length) t.push({ text: parts.join(' OR '), cat: 'logika' });
    }
    if (state.useNumrange && state.numFrom && state.numTo)
      t.push({ text: `${state.numFrom}..${state.numTo}`, cat: 'logika' });
    if (state.useAfter && state.after) t.push({ text: `after:${state.after}`, cat: 'czas' });
    if (state.useBefore && state.before) t.push({ text: `before:${state.before}`, cat: 'czas' });
    return t;
  }, [state]);

  const dork = useMemo(() => tokens.map(t => t.text).join(' '), [tokens]);

  const wantedLevel = useMemo(() => {
    const n = Object.keys(DEF).filter(k => k.startsWith('use') && (state as Record<string,unknown>)[k] === true).length;
    return Math.min(5, Math.ceil(n * 5 / 7)) as 0|1|2|3|4|5;
  }, [state]);

  const applyPlaybook = (name: string) => {
    setPlaybook(name);
    const pb = PLAYBOOKS.find(p => p.name === name);
    if (pb) setState({ ...DEF, keyword: state.keyword, ...pb.state });
  };

  const copyDork = () => {
    if (!dork) return;
    navigator.clipboard.writeText(dork);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const searchGoogle = () => {
    if (!dork) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(dork)}`, '_blank', 'noopener,noreferrer');
  };

  const activeCatData = CATS.find(c => c.id === cat)!;
  const filteredK = KNOWLEDGE.filter(k =>
    !kSearch ||
    k.tag.toLowerCase().includes(kSearch.toLowerCase()) ||
    k.eli5.toLowerCase().includes(kSearch.toLowerCase()) ||
    k.example.toLowerCase().includes(kSearch.toLowerCase()),
  );

  // Count active operators per category (for badge)
  const catCount = (id: OpCat): number => {
    const map: Record<OpCat, (keyof S)[]> = {
      zasoby:  ['useSite','useExcludeSite','useFiletype','useExt'],
      tresc:   ['useIntitle','useAllintitle','useIntext','useAllintext'],
      url:     ['useInurl','useAllinurl'],
      meta:    ['useInanchor','useCache','useRelated','useInfo','useLink'],
      logika:  ['useExactPhrase','useExcludeWord','useOrTerms','useNumrange'],
      czas:    ['useAfter','useBefore'],
    };
    return map[id].filter(k => state[k] === true).length;
  };

  return (
    <div
      className="min-h-screen text-gray-100 p-3 md:p-5"
      style={{
        background: '#060300',
        backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,140,0,0.012) 3px,rgba(255,140,0,0.012) 6px)',
      }}
    >
      <div className="max-w-5xl mx-auto space-y-4">

        {/* ══ HEADER ══════════════════════════════════════════════ */}
        <header>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-xs font-bold tracking-[0.35em] text-orange-600 uppercase mb-1">
                San Andreas OSINT Division
              </p>
              <h1
                className="font-black uppercase text-3xl md:text-4xl tracking-widest text-orange-400 leading-none"
                style={{ textShadow: '0 0 40px rgba(255,140,0,0.55), 0 2px 4px rgba(0,0,0,0.9)' }}
              >
                GOOGLE DORKING
              </h1>
              <p className="text-sm text-orange-300/50 font-bold tracking-wider uppercase mt-1">
                Mistrz Wyszukiwania OSINT
              </p>
            </div>
            {/* Wanted level */}
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-gray-500 mb-1">Poziom Dorka</p>
              <div className="flex gap-1 justify-end mb-1">
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ textShadow: i <= wantedLevel ? '0 0 8px rgba(255,200,0,0.8)' : 'none' }}
                    className={`text-xl ${i <= wantedLevel ? 'text-yellow-400' : 'text-gray-800'}`}>★</span>
                ))}
              </div>
              {wantedLevel > 0 && (
                <p className={`text-xs font-black uppercase tracking-wider ${WANTED_COLOR[wantedLevel]}`}>
                  {WANTED_LABEL[wantedLevel]}
                </p>
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <div
            className="flex items-start gap-3 p-3 rounded-lg border border-yellow-600/20"
            style={{ background: 'rgba(120,80,0,0.12)' }}
          >
            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-200/60 leading-relaxed">
              <span className="font-bold text-yellow-500">Tylko autoryzowane testy penetracyjne.</span>
              {' '}Używaj wyłącznie na systemach z pisemną zgodą właściciela.
              Nieautoryzowany dostęp to przestępstwo (art.&nbsp;267&nbsp;k.k.).
            </p>
          </div>
        </header>

        {/* ══ MAIN TABS ═══════════════════════════════════════════ */}
        <div
          className="flex gap-1 p-1 rounded-xl border border-orange-900/30"
          style={{ background: 'rgba(30,12,0,0.8)' }}
        >
          <GtaTab active={tab === 'builder'} onClick={() => setTab('builder')}
            icon={<Wrench className="w-4 h-4" />} label="BUDOWNICZY"
            onCls="bg-orange-500/20 text-orange-400 border border-orange-500/40"
          />
          <GtaTab active={tab === 'knowledge'} onClick={() => setTab('knowledge')}
            icon={<BookOpen className="w-4 h-4" />} label="BAZA WIEDZY (ELI5)"
            onCls="bg-sky-500/20 text-sky-400 border border-sky-500/40"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════
            TAB 1 — BUDOWNICZY
        ══════════════════════════════════════════════════════════ */}
        {tab === 'builder' && (
          <div className="space-y-3">

            {/* TARGET INPUT */}
            <GtaPanel accent="orange">
              <SectionTitle icon={<Shield className="w-4 h-4 text-orange-400" />} color="text-orange-400">
                CEL — Słowo Kluczowe
              </SectionTitle>
              <p className="text-xs text-orange-300/40 -mt-1 mb-2 font-bold uppercase tracking-wider">
                Wpisz nazwę firmy, domeny lub osoby
              </p>
              <input
                type="text"
                value={state.keyword}
                onChange={e => set('keyword', e.target.value)}
                placeholder="np. PGE, bank.pl, Jan Kowalski..."
                className="w-full rounded-lg px-4 py-3 text-base text-white font-medium placeholder-gray-600 focus:outline-none transition"
                style={{
                  background: 'rgba(10,5,0,0.8)',
                  border: '1px solid rgba(255,140,0,0.25)',
                  boxShadow: state.keyword ? '0 0 0 1px rgba(255,140,0,0.3), 0 0 20px rgba(255,140,0,0.08)' : 'none',
                }}
              />
            </GtaPanel>

            {/* GOTOWE SCENARIUSZE */}
            <GtaPanel accent="yellow">
              <SectionTitle icon={<Zap className="w-4 h-4 text-yellow-400" />} color="text-yellow-400">
                MISJE — Gotowe Scenariusze
              </SectionTitle>
              <p className="text-xs text-yellow-300/40 -mt-1 mb-2 font-bold uppercase tracking-wider">
                Wybierz i zacznij od gotowego zestawu operatorów
              </p>
              <div className="relative">
                <select
                  value={playbook}
                  onChange={e => applyPlaybook(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm text-white font-medium appearance-none cursor-pointer pr-10 focus:outline-none transition"
                  style={{ background: 'rgba(10,5,0,0.8)', border: '1px solid rgba(255,200,0,0.2)' }}
                >
                  <option value="">— Wybierz scenariusz OSINT —</option>
                  {PLAYBOOKS.map(p => (
                    <option key={p.name} value={p.name}>
                      {'★'.repeat(p.risk)}{'☆'.repeat(5-p.risk)} {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-600 pointer-events-none" />
              </div>
              {playbook && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({length:5}).map((_,i) => (
                      <span key={i} className={`text-sm ${i < (PLAYBOOKS.find(p=>p.name===playbook)?.risk??0) ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-300/50 font-bold">
                    {PLAYBOOKS.find(p => p.name === playbook)?.desc}
                  </p>
                </div>
              )}
            </GtaPanel>

            {/* OPERATOR BUILDER */}
            <GtaPanel accent="orange">
              <SectionTitle icon={<Filter className="w-4 h-4 text-orange-400" />} color="text-orange-400">
                OPERATORY — Buduj Dorka
              </SectionTitle>
              <p className="text-xs text-orange-300/40 -mt-1 mb-3 font-bold uppercase tracking-wider">
                Przelacz, wpisz wartosc, obserwuj wynik
              </p>

              {/* Category sub-tabs */}
              <div className="flex overflow-x-auto scrollbar-none gap-0.5 mb-4 rounded-lg p-0.5" style={{ background: 'rgba(0,0,0,0.4)' }}>
                {CATS.map(c => {
                  const n = catCount(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCat(c.id)}
                      className={`relative flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded text-xs font-black uppercase tracking-widest transition-all ${cat === c.id ? c.tabOn : c.tabOff}`}
                    >
                      {n > 0 && (
                        <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-black ${c.dot}`}>
                          {n}
                        </span>
                      )}
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* ZASOBY */}
              {cat === 'zasoby' && (
                <div className="space-y-2">
                  <CatHelp text="Określ GDZIE i W JAKIEJ FORMIE Google ma szukać. Najczęściej używane operatory." />
                  <OpToggle label="site:" tag="zasoby" subtext="Szukaj tylko na tej domenie" checked={state.useSite} onCheck={v => set('useSite', v)}>
                    <input type="text" value={state.site} onChange={e => set('site', e.target.value)} placeholder="np. gov.pl, firma.com" disabled={!state.useSite} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="-site:" tag="wyklucz" subtext="Wyklucz tę domenę z wyników" checked={state.useExcludeSite} onCheck={v => set('useExcludeSite', v)}>
                    <input type="text" value={state.excludeSite} onChange={e => set('excludeSite', e.target.value)} placeholder="np. wikipedia.org" disabled={!state.useExcludeSite} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="filetype:" tag="zasoby" subtext="Tylko pliki tego formatu" checked={state.useFiletype} onCheck={v => set('useFiletype', v)}>
                    <select value={state.filetype} onChange={e => set('filetype', e.target.value)} disabled={!state.useFiletype} className={INPUT_CLS}>
                      {FILETYPES.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                    </select>
                  </OpToggle>
                  <OpToggle label="ext:" tag="zasoby" subtext="Rozszerzenie pliku w adresie URL (precyzyjniejsze)" checked={state.useExt} onCheck={v => set('useExt', v)}>
                    <select value={state.ext} onChange={e => set('ext', e.target.value)} disabled={!state.useExt} className={INPUT_CLS}>
                      {EXTS.map(x => <option key={x} value={x}>.{x}</option>)}
                    </select>
                  </OpToggle>
                </div>
              )}

              {/* TREŚĆ */}
              {cat === 'tresc' && (
                <div className="space-y-2">
                  <CatHelp text="Szukaj konkretnych słów w TYTULE lub TREŚCI strony. Użyj intitle: dla nazw paneli, intext: dla haseł i kluczy." />
                  <OpToggle label="intitle:" tag="tresc" subtext="To słowo MUSI być w tytule zakładki" checked={state.useIntitle} onCheck={v => set('useIntitle', v)}>
                    <input type="text" value={state.intitle} onChange={e => set('intitle', e.target.value)} placeholder="np. index of, admin panel" disabled={!state.useIntitle} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="allintitle:" tag="tresc" subtext="WSZYSTKIE te słowa w tytule (wpisz kilka)" checked={state.useAllintitle} onCheck={v => set('useAllintitle', v)}>
                    <input type="text" value={state.allintitle} onChange={e => set('allintitle', e.target.value)} placeholder="np. admin login setup" disabled={!state.useAllintitle} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="intext:" tag="tresc" subtext="To słowo MUSI być w treści strony" checked={state.useIntext} onCheck={v => set('useIntext', v)}>
                    <input type="text" value={state.intext} onChange={e => set('intext', e.target.value)} placeholder="np. password, api_key" disabled={!state.useIntext} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="allintext:" tag="tresc" subtext="WSZYSTKIE te słowa w treści strony" checked={state.useAllintext} onCheck={v => set('useAllintext', v)}>
                    <input type="text" value={state.allintext} onChange={e => set('allintext', e.target.value)} placeholder="np. password username admin" disabled={!state.useAllintext} className={INPUT_CLS} />
                  </OpToggle>
                </div>
              )}

              {/* URL */}
              {cat === 'url' && (
                <div className="space-y-2">
                  <CatHelp text="Szukaj słów bezpośrednio w adresie URL. Świetne do znajdowania paneli /admin, /login, /.git." />
                  <OpToggle label="inurl:" tag="url" subtext="To słowo MUSI być w adresie URL" checked={state.useInurl} onCheck={v => set('useInurl', v)}>
                    <input type="text" value={state.inurl} onChange={e => set('inurl', e.target.value)} placeholder="np. admin, login, .git/config" disabled={!state.useInurl} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="allinurl:" tag="url" subtext="WSZYSTKIE te słowa w adresie URL" checked={state.useAllinurl} onCheck={v => set('useAllinurl', v)}>
                    <input type="text" value={state.allinurl} onChange={e => set('allinurl', e.target.value)} placeholder="np. admin panel config" disabled={!state.useAllinurl} className={INPUT_CLS} />
                  </OpToggle>
                </div>
              )}

              {/* META */}
              {cat === 'meta' && (
                <div className="space-y-2">
                  <CatHelp text="Zaawansowane operatory dotyczące metadanych — cached wersje, linki, powiązane strony. Użyj do głębszej analizy celu." />
                  <OpToggle label="inanchor:" tag="meta" subtext="Słowo w tekście linka prowadzącego do strony" checked={state.useInanchor} onCheck={v => set('useInanchor', v)}>
                    <input type="text" value={state.inanchor} onChange={e => set('inanchor', e.target.value)} placeholder="np. admin login, panel" disabled={!state.useInanchor} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="cache:" tag="meta" subtext="Pokaż STARY ZAPIS strony (snapshot Google)" checked={state.useCache} onCheck={v => set('useCache', v)}>
                    <input type="text" value={state.cache} onChange={e => set('cache', e.target.value)} placeholder="np. firma.pl/strona" disabled={!state.useCache} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="related:" tag="meta" subtext="Strony podobne do podanej domeny" checked={state.useRelated} onCheck={v => set('useRelated', v)}>
                    <input type="text" value={state.related} onChange={e => set('related', e.target.value)} placeholder="np. facebook.com" disabled={!state.useRelated} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="info:" tag="meta" subtext="Informacje Google o tej domenie" checked={state.useInfo} onCheck={v => set('useInfo', v)}>
                    <input type="text" value={state.info} onChange={e => set('info', e.target.value)} placeholder="np. firma.pl" disabled={!state.useInfo} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="link:" tag="meta" subtext="Kto linkuje do tej strony?" checked={state.useLink} onCheck={v => set('useLink', v)}>
                    <input type="text" value={state.link} onChange={e => set('link', e.target.value)} placeholder="np. firma.pl" disabled={!state.useLink} className={INPUT_CLS} />
                  </OpToggle>
                </div>
              )}

              {/* LOGIKA */}
              {cat === 'logika' && (
                <div className="space-y-2">
                  <CatHelp text='Operatory logiczne. Cudzysłów = dokładna fraza. Minus = wyklucz. OR = jedno lub drugie. Zakres X..Y = szukaj liczby między X a Y.' />
                  <OpToggle label='"fraza"' tag="logika" subtext='Szukaj DOKŁADNIE tej frazy (słowo w słowo)' checked={state.useExactPhrase} onCheck={v => set('useExactPhrase', v)}>
                    <input type="text" value={state.exactPhrase} onChange={e => set('exactPhrase', e.target.value)} placeholder='np. do not distribute' disabled={!state.useExactPhrase} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="-słowo" tag="wyklucz" subtext="Wyklucz to słowo z wyników" checked={state.useExcludeWord} onCheck={v => set('useExcludeWord', v)}>
                    <input type="text" value={state.excludeWord} onChange={e => set('excludeWord', e.target.value)} placeholder="np. wikipedia, reddit" disabled={!state.useExcludeWord} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="OR" tag="logika" subtext="Szukaj jednego LUB drugiego (oddziel przecinkami)" checked={state.useOrTerms} onCheck={v => set('useOrTerms', v)}>
                    <input type="text" value={state.orTerms} onChange={e => set('orTerms', e.target.value)} placeholder="np. pdf, doc, xlsx" disabled={!state.useOrTerms} className={INPUT_CLS} />
                  </OpToggle>
                  <OpToggle label="X..Y" tag="logika" subtext="Zakres liczbowy — od X do Y" checked={state.useNumrange} onCheck={v => set('useNumrange', v)}>
                    <div className="flex gap-2 flex-1 min-w-0">
                      <input type="text" value={state.numFrom} onChange={e => set('numFrom', e.target.value)} placeholder="Od" disabled={!state.useNumrange} className={INPUT_CLS} />
                      <span className="text-orange-600 font-black self-center">..</span>
                      <input type="text" value={state.numTo} onChange={e => set('numTo', e.target.value)} placeholder="Do" disabled={!state.useNumrange} className={INPUT_CLS} />
                    </div>
                  </OpToggle>
                </div>
              )}

              {/* CZAS */}
              {cat === 'czas' && (
                <div className="space-y-2">
                  <CatHelp text="Ogranicz wyniki do konkretnego przedziału czasowego. after: = tylko nowe, before: = tylko stare." />
                  <OpToggle label="after:" tag="czas" subtext="Tylko wyniki NOWSZE niż ta data" checked={state.useAfter} onCheck={v => set('useAfter', v)}>
                    <input type="date" value={state.after} onChange={e => set('after', e.target.value)} disabled={!state.useAfter} className={INPUT_CLS + ' cursor-pointer'} />
                  </OpToggle>
                  <OpToggle label="before:" tag="czas" subtext="Tylko wyniki STARSZE niż ta data" checked={state.useBefore} onCheck={v => set('useBefore', v)}>
                    <input type="date" value={state.before} onChange={e => set('before', e.target.value)} disabled={!state.useBefore} className={INPUT_CLS + ' cursor-pointer'} />
                  </OpToggle>
                </div>
              )}
            </GtaPanel>

            {/* LIVE PREVIEW */}
            <div
              className="rounded-xl border p-4 space-y-3"
              style={{
                background: 'linear-gradient(135deg,rgba(20,10,0,0.95),rgba(10,5,0,0.98))',
                border: '1px solid rgba(255,140,0,0.3)',
                boxShadow: dork ? '0 0 30px rgba(255,140,0,0.07)' : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                <span className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">Podgląd Live</span>
                {dork && <span className="ml-auto text-xs text-orange-800 tabular-nums font-bold">{dork.length} znaków</span>}
              </div>

              {/* Token display */}
              <div
                className="rounded-lg p-3 min-h-14"
                style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,140,0,0.1)' }}
              >
                {tokens.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tokens.map((tk, i) => (
                      <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold ${TOKEN_CLS[tk.cat]}`}>
                        {tk.text}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-700 italic font-medium">
                    Wpisz słowo kluczowe lub przelacz operatory powyzej...
                  </p>
                )}
              </div>

              {/* Raw string */}
              {dork && (
                <div className="rounded px-3 py-2 font-mono text-xs text-orange-300/60 break-all" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  {dork}
                </div>
              )}

              {/* Status */}
              {wantedLevel > 0 && (
                <p className={`text-xs font-black uppercase tracking-widest ${WANTED_COLOR[wantedLevel]}`}
                  style={{ textShadow: wantedLevel >= 4 ? '0 0 10px currentColor' : 'none' }}>
                  {['','Dobry poczatek! Dodaj wiecej operatorow.','Niezle! Dork nabiera ksztaltu.','Solidny dork! Gotowy do akcji.','Pro level! To zaawansowane zapytanie.','MISTRZ OSINT! Maksymalny dork!'][wantedLevel]}
                </p>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap gap-3 items-center">
              <button onClick={copyDork} disabled={!dork}
                className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'rgba(40,20,0,0.8)', border: '1px solid rgba(255,140,0,0.3)', color: copied ? '#4ade80' : '#fb923c' }}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Skopiowano!' : 'Kopiuj Dorka'}
              </button>
              <button onClick={searchGoogle} disabled={!dork}
                className="flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-black uppercase tracking-wider text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: dork ? 'linear-gradient(135deg,#ff8c00,#ff6b00)' : '#4a2500',
                  boxShadow: dork ? '0 0 20px rgba(255,140,0,0.4), 0 4px 12px rgba(0,0,0,0.5)' : 'none',
                }}>
                <ExternalLink className="w-4 h-4" />
                Szukaj w Google
              </button>
              <button onClick={() => { setState(DEF); setPlaybook(''); }}
                className="flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-orange-600 transition-all ml-auto">
                <RefreshCw className="w-3.5 h-3.5" />
                Wyczysc
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2 — BAZA WIEDZY (ELI5)
        ══════════════════════════════════════════════════════════ */}
        {tab === 'knowledge' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-700 pointer-events-none" />
              <input type="text" value={kSearch} onChange={e => setKSearch(e.target.value)}
                placeholder="Szukaj operatora (np. site, filetype, inurl)..."
                className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-medium placeholder-gray-700 focus:outline-none transition"
                style={{ background: 'rgba(25,12,0,0.9)', border: '1px solid rgba(255,140,0,0.2)', color: '#fff' }}
              />
            </div>

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-2">
              {['Wszystkie', ...CATS.map(c => c.label)].map((label, i) => {
                const catId = i === 0 ? null : CATS[i-1].id;
                const active = i === 0 ? kSearch === '' && true : false; // just visual hint
                return (
                  <button key={label} onClick={() => setKSearch(i === 0 ? '' : CATS[i-1].label.toLowerCase())}
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all ${i === 0 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-black/40 text-gray-500 border border-gray-800 hover:border-orange-800 hover:text-orange-500'}`}>
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredK.map(item => <KnowledgeCard key={item.tag} item={item} />)}
            </div>
            {filteredK.length === 0 && (
              <p className="text-center py-16 text-orange-900 text-sm font-black uppercase tracking-widest">
                Brak wyników dla &quot;{kSearch}&quot;
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function GtaPanel({ children, accent = 'orange' }: { children: React.ReactNode; accent?: string }) {
  const borderColor = accent === 'yellow' ? 'rgba(200,160,0,0.2)' : 'rgba(255,140,0,0.2)';
  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{ background: 'linear-gradient(135deg,rgba(28,12,0,0.95),rgba(16,7,0,0.98))', border: `1px solid ${borderColor}` }}>
      {children}
    </div>
  );
}

function GtaTab({ active, onClick, icon, label, onCls }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; onCls: string;
}) {
  return (
    <button onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${active ? onCls : 'text-gray-600 border border-transparent hover:text-orange-600'}`}>
      {icon}{label}
    </button>
  );
}

function SectionTitle({ children, icon, color }: { children: React.ReactNode; icon: React.ReactNode; color: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] ${color}`}>
      {icon}{children}
    </div>
  );
}

function CatHelp({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-lg mb-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,140,0,0.08)' }}>
      <Info className="w-3.5 h-3.5 text-orange-700 mt-0.5 shrink-0" />
      <p className="text-xs text-orange-300/40 leading-relaxed font-medium">{text}</p>
    </div>
  );
}

// Tag color map — complete Tailwind strings
const TAG_CLS: Record<string, string> = {
  zasoby:  'bg-orange-500/20 text-orange-400 border-orange-500/30',
  tresc:   'bg-sky-500/20 text-sky-400 border-sky-500/30',
  url:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  meta:    'bg-purple-500/20 text-purple-400 border-purple-500/30',
  logika:  'bg-green-500/20 text-green-400 border-green-500/30',
  wyklucz: 'bg-red-900/50 text-red-400 border-red-500/40',
  czas:    'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

// Toggle row for operator builder
function OpToggle({ label, tag, subtext, checked, onCheck, children }: {
  label: string; tag: string; subtext: string;
  checked: boolean; onCheck: (v: boolean) => void; children: React.ReactNode;
}) {
  const tagCls = TAG_CLS[tag] ?? TAG_CLS.logika;
  return (
    <div
      className="rounded-xl p-3 transition-all"
      style={{
        background: checked ? 'rgba(255,140,0,0.04)' : 'rgba(0,0,0,0.3)',
        border: checked ? '1px solid rgba(255,140,0,0.2)' : '1px solid rgba(255,140,0,0.06)',
        boxShadow: checked ? '0 0 15px rgba(255,140,0,0.05)' : 'none',
      }}
    >
      {/* Top row: toggle + label + tag badge */}
      <div className="flex items-center gap-3 mb-2">
        {/* Big toggle switch */}
        <button type="button" role="switch" aria-checked={checked} onClick={() => onCheck(!checked)}
          className="relative flex-shrink-0 h-7 w-14 rounded-full transition-all duration-200 focus:outline-none"
          style={{
            background: checked ? 'linear-gradient(90deg,#ff8c00,#ff6b00)' : 'rgba(40,20,0,0.8)',
            border: checked ? '1px solid rgba(255,140,0,0.5)' : '1px solid rgba(255,140,0,0.15)',
            boxShadow: checked ? '0 0 12px rgba(255,140,0,0.35)' : 'none',
          }}>
          <span className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-200 flex items-center justify-center shadow-md"
            style={{ left: checked ? 'calc(100% - 24px)' : '4px' }}>
            {checked && <Check className="w-3 h-3 text-orange-500" strokeWidth={3} />}
          </span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className={`text-sm font-black font-mono px-2 py-0.5 rounded border ${tagCls}`}>{label}</code>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{subtext}</p>
        </div>
      </div>

      {/* Input — always visible but faded when disabled */}
      <div className="flex items-center gap-2 ml-17" style={{ marginLeft: '68px' }}>
        {children}
      </div>
    </div>
  );
}

// Knowledge base card
const K_CARD_CLS: Record<string, string> = {
  zasoby: 'bg-orange-500/8 border-orange-500/25 hover:border-orange-400/50',
  tresc:  'bg-sky-500/8 border-sky-500/25 hover:border-sky-400/50',
  url:    'bg-yellow-500/8 border-yellow-500/25 hover:border-yellow-400/50',
  meta:   'bg-purple-500/8 border-purple-500/25 hover:border-purple-400/50',
  logika: 'bg-green-500/8 border-green-500/25 hover:border-green-400/50',
  czas:   'bg-pink-500/8 border-pink-500/25 hover:border-pink-400/50',
};
const K_TAG_CLS: Record<string, string> = {
  zasoby: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
  tresc:  'text-sky-400 bg-sky-500/15 border-sky-500/30',
  url:    'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
  meta:   'text-purple-400 bg-purple-500/15 border-purple-500/30',
  logika: 'text-green-400 bg-green-500/15 border-green-500/30',
  czas:   'text-pink-400 bg-pink-500/15 border-pink-500/30',
};
const K_STARS_CLS: Record<string, string> = {
  zasoby: 'text-orange-500',
  tresc:  'text-sky-500',
  url:    'text-yellow-500',
  meta:   'text-purple-500',
  logika: 'text-green-500',
  czas:   'text-pink-500',
};

function KnowledgeCard({ item }: { item: typeof KNOWLEDGE[number] }) {
  const [open, setOpen] = useState(false);
  const cardCls = K_CARD_CLS[item.cat] ?? K_CARD_CLS.logika;
  const tagCls = K_TAG_CLS[item.cat] ?? K_TAG_CLS.logika;
  const starCls = K_STARS_CLS[item.cat] ?? K_STARS_CLS.logika;

  return (
    <div onClick={() => setOpen(o => !o)}
      className={`rounded-xl border p-4 cursor-pointer select-none transition-all hover:scale-[1.01] active:scale-100 ${cardCls}`}
      style={{ background: 'rgba(15,7,0,0.85)' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <code className={`text-sm font-black font-mono px-2 py-0.5 rounded border shrink-0 ${tagCls}`}>{item.tag}</code>
          <div className="flex gap-0.5 mt-1">
            {[1,2,3,4,5].map(i => (
              <span key={i} className={`text-xs ${i <= item.stars ? starCls : 'text-gray-800'}`}>★</span>
            ))}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-600 shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </div>

      <p className="mt-2.5 text-sm text-gray-300 leading-relaxed">{item.eli5}</p>

      {open && (
        <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-600 mb-1.5">Przyklad OSINT</p>
            <div className="px-3 py-2 rounded-lg font-mono text-xs text-orange-400 break-all" style={{ background: 'rgba(0,0,0,0.5)' }}>
              {item.example}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-600 mb-1">Zastosowanie</p>
            <p className="text-xs text-gray-400 leading-relaxed">{item.usecase}</p>
          </div>
        </div>
      )}
    </div>
  );
}

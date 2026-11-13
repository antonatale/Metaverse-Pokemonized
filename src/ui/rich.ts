import { CHARS, ROSTER, type FriendId } from '../data/characters';
import { SPECIES } from '../data/creatures';
import { esc } from './dom';
import { voiceBlip, sfx } from '../audio';

/* The words on the scroll, made to be read aloud: the names of the friends in their colours, creatures and places in
   bold, *stressed* words, SHOUTS that shake; and each speaker with a voice of his own, a syllable every few letters,
   pausing at commas and full stops (ui/story-screen.ts types them out). */

/** a piece of a line: plain, stressed, a name (of a friend, in his colour), a place or a creature, a shout */
export interface Run { t: string; k: '' | 'em' | 'who' | 'name' | 'shout'; id?: string }

/** places of Formia and of its story, and the people who are not friends: bold wherever they come up */
const NAMES = ['Formia', 'Gianola', 'Vindicio', 'Mola', 'Eclipse', 'Caposele', 'Castellone', 'Scauri', 'Gaeta', 'Ponza', 'Ventotene', 'Maranola',
  'Telepilo', 'Lestrigoni', 'Lamo', 'Ulisse', 'Odissea', 'Appia', 'Torre di Mola', 'Largo Paone', 'San Giulio', 'Acqualonga', 'Santo Janni',
  'Nicola', 'Cicerone', 'Mamurra', 'Giulio Cesare', 'Faro', 'Tullio', 'Torino', 'Chicago', 'Zauli', 'Morgana', 'Pietre di Telepilo', 'il caminetto'];
var keys: { re: RegExp; who: Record<string, string> } | null = null;
function keyRe() {
  if (keys) return keys;
  var who: Record<string, string> = {}, all: string[] = [];
  ROSTER.forEach(function (f) { who[CHARS[f].name] = f; all.push(CHARS[f].name); });
  Object.keys(SPECIES).forEach(function (k) { all.push(SPECIES[k as keyof typeof SPECIES].name); });
  all = all.concat(NAMES).filter(function (n, i, a) { return n && a.indexOf(n) === i; }).sort(function (a, b) { return b.length - a.length; });
  var alt = all.map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|');
  keys = { re: new RegExp('(^|[^\\p{L}])(' + alt + ')(?![\\p{L}])', 'gu'), who: who };
  return keys;
}
/** a SHOUT: words in capitals, at least one of three letters or more */
const SHOUT = /[A-ZÀ-ÝÈÉÌÒÙ]{2,}(?:[\s,!?.…'’]+[A-ZÀ-ÝÈÉÌÒÙ]{2,})*[!?]*/gu;
function plain(t: string, out: Run[]) {
  if (!t) return;
  /* the shouts first, then the names in what is left */
  var last = 0, m: RegExpExecArray | null;
  SHOUT.lastIndex = 0;
  while ((m = SHOUT.exec(t))) {
    if (!/[A-ZÀ-Ý]{3,}/u.test(m[0])) continue;
    named(t.slice(last, m.index), out); out.push({ t: m[0], k: 'shout' }); last = m.index + m[0].length;
  }
  named(t.slice(last), out);
}
function named(t: string, out: Run[]) {
  if (!t) return;
  var K = keyRe(), last = 0, m: RegExpExecArray | null;
  K.re.lastIndex = 0;
  while ((m = K.re.exec(t))) {
    var at = m.index + m[1].length;
    if (at > last) out.push({ t: t.slice(last, at), k: '' });
    var f = K.who[m[2]];
    out.push(f ? { t: m[2], k: 'who', id: f } : { t: m[2], k: 'name' });
    last = at + m[2].length;
  }
  if (last < t.length) out.push({ t: t.slice(last), k: '' });
}
/** a line in pieces: *stressed* is marked by hand, the rest is found */
export function runs(text: string): Run[] {
  var out: Run[] = [], parts = text.split(/\*([^*]+)\*/);
  parts.forEach(function (p, i) { if (i % 2) out.push({ t: p, k: 'em' }); else plain(p, out); });
  return out;
}
export function plainText(rs: Run[]): string { return rs.map(function (r) { return r.t; }).join(''); }
/** writes a line into an element a letter at a time: the returned function shows the first `n` letters. Each piece
    gets its element once, the first time one of its letters shows, so a shout shakes once and not at every letter */
export function typer(el: HTMLElement, rs: Run[]): (n: number) => void {
  el.innerHTML = '';
  var nodes: (Text | null)[] = rs.map(function () { return null; });
  return function (n: number) {
    var left = n;
    for (var i = 0; i < rs.length && left > 0; i++) {
      var r = rs[i], k = Math.min(left, r.t.length);
      left -= r.t.length;
      if (!nodes[i]) {
        var tn = document.createTextNode('');
        if (r.k) {
          var b = document.createElement('b');
          b.className = 'r-' + r.k;
          if (r.k === 'who') b.style.setProperty('--tc', 'var(--t-' + CHARS[r.id as FriendId].type.toLowerCase() + ')');
          b.appendChild(tn); el.appendChild(b);
        } else el.appendChild(tn);
        nodes[i] = tn;
      }
      if (nodes[i]!.data.length !== k) nodes[i]!.data = r.t.slice(0, k);
    }
  };
}
/** a whole line as HTML (for what is not typed out) */
export function richHtml(rs: Run[]): string {
  return rs.map(function (r) {
    var t = esc(r.t);
    if (!r.k) return t;
    if (r.k === 'who') return '<b class="r-who" style="--tc:var(--t-' + CHARS[r.id as FriendId].type.toLowerCase() + ')">' + t + '</b>';
    return '<b class="r-' + r.k + '">' + t + '</b>';
  }).join('');
}

/* ---------- voices ---------- */
type Voice = { f: number; w: OscillatorType; vib: number };
const VOICES: Record<string, Voice> = {
  antonio: { f: 150, w: 'triangle', vib: 0 }, costanzo: { f: 128, w: 'square', vib: 0 }, andrea: { f: 172, w: 'triangle', vib: 0 },
  valentin: { f: 205, w: 'sine', vib: 0 }, forchetta: { f: 185, w: 'triangle', vib: 0 }, zendavid: { f: 112, w: 'sine', vib: 0 },
  claudia: { f: 262, w: 'triangle', vib: 0 },
  'Nicola Spadea': { f: 158, w: 'sawtooth', vib: 0 }, Cicerone: { f: 320, w: 'sine', vib: 40 }, Mamurra: { f: 92, w: 'square', vib: 25 },
  Tullio: { f: 210, w: 'triangle', vib: 0 }, Guardaparco: { f: 240, w: 'triangle', vib: 0 }
};
/** whoever speaks, in a voice: a friend by id, a person of Formia by name (anyone else: a voice from the name) */
export function voiceOf(who: string | null | undefined): Voice | null {
  if (!who) return null;
  if (VOICES[who]) return VOICES[who];
  var h = 0;
  for (var i = 0; i < who.length; i++) h = (h * 31 + who.charCodeAt(i)) >>> 0;
  return { f: 140 + (h % 140), w: h & 1 ? 'triangle' : 'sine', vib: 0 };
}
var lastAt = 0;
/** a syllable for the letter just shown: a voice for someone, the scratch of the pen for the narrator */
export function speak(v: Voice | null, ch: string, shout: boolean) {
  if (!/[\p{L}\d]/u.test(ch)) return;
  var now = performance.now();
  if (now - lastAt < (shout ? 50 : 62)) return;
  lastAt = now;
  if (!v) { sfx('blip'); return; }
  /* vowels sing a little higher than consonants: the line gets a tune of its own */
  var lift = /[aeiouàèéìòù]/i.test(ch) ? 1.12 : 1;
  voiceBlip(v.f * lift * (shout ? 1.25 : 1), v.w, v.vib, shout ? 1.6 : 1);
}
/** how long to wait after a letter: a breath at a comma, longer at the end of a sentence */
export function pauseAfter(ch: string, next: string): number {
  if (ch === ',' || ch === ';' || ch === ':') return 90;
  if ((ch === '.' || ch === '!' || ch === '?' || ch === '…') && (next === ' ' || next === '»' || !next)) return 190;
  return 0;
}

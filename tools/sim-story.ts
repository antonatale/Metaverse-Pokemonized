/* Story balance: how often a fighter at a level beats a foe at a level, both played by the computer.
   npx tsx tools/sim-story.ts                      the usual matchups of the story
   npx tsx tools/sim-story.ts polpino:8 forchetta:9  one matchup (a fighter id or a creature, and its level)
   npx tsx tools/sim-story.ts trainers             each trainer's whole battle, against each of the three first creatures
                                                   and a second one, both at the level of the trainer's best */
import { ENGINE as E, type BattleState, type Member } from '../src/battle';
import { SPECIES, knownAt, isSpecies, type SpeciesId } from '../src/data/creatures';
import { TRAINERS } from '../src/data/trainers';
import { MAPS } from '../src/data/maps';
import { PLACE_MAGIC, sceneFor } from '../src/data/scenes';
import { CHARS, type FighterId } from '../src/data/characters';
import { atLevel } from '../src/data/growth';

function side(id: string, lv: number) {
  return isSpecies(id) ? { stats: atLevel(SPECIES[id].stats, lv), lvl: lv, known: knownAt(id, lv) } : { stats: atLevel(CHARS[id as keyof typeof CHARS].stats, lv), lvl: lv };
}
export function winRate(a: string, la: number, b: string, lb: number, n = 400): number {
  let won = 0;
  for (let seed = 1; seed <= n; seed++) {
    const s: BattleState = E.newBattle({ a: a as FighterId, b: b as FighterId, seed: seed * 7919, sideA: side(a, la), sideB: side(b, lb) });
    E.intro(s);
    for (let k = 0; k < 120 && s.phase !== 'over'; k++) {
      E.beginTurn(s);
      const ch: Record<number, string> = {};
      E.needs(s).forEach((i) => { ch[i] = E.ai(s, i); });
      E.playTurn(s, ch);
    }
    if (s.result === 'win' && s.winner === 0) won++;
  }
  return Math.round(100 * won / n);
}
/** the form a first creature has at a level */
function formAt(id: SpeciesId, lv: number): SpeciesId {
  let x = id;
  while (SPECIES[x].evolve && lv >= SPECIES[x].evolve!.at) x = SPECIES[x].evolve!.into;
  return x;
}
const member = (id: string, lv: number, key?: string): Member => ({ id: id as FighterId, key, ...side(id, lv) });
/** the magic of the place where a trainer stands */
function placeOf(id: string) {
  const f = MAPS.formia, q = (f.npcs || []).find((x) => x.trainer === id), a = q && (f.areas || []).find((r) => q.x >= r.x && q.x < r.x + r.w && q.y >= r.y && q.y < r.y + r.h);
  return PLACE_MAGIC[sceneFor('formia', a ? a.name : null)];
}
/** a whole battle against a trainer, Antonio's two (and `more`) played by the computer, who does not change: a player can do better */
export function trainerRate(first: SpeciesId, second: SpeciesId, id: string, n = 300, more: SpeciesId[] = []): { win: number; turns: number } {
  const tr = TRAINERS[id], lv = Math.max.apply(null, tr.team.map((t) => t.lv)), foes = tr.team.map((t) => { const m = member(t.sp, t.lv); if (t.moves) m.known = t.moves.slice(); return m; });
  const a = member(formAt(first, lv), lv, 'c1'), b = member(formAt(second, Math.max(1, lv - 1)), Math.max(1, lv - 1), 'c2');
  let won = 0, turns = 0;
  for (let seed = 1; seed <= n; seed++) {
    const s: BattleState = E.newBattle({ a: a.id, b: foes[0].id, seed: seed * 7919, sideA: a, sideB: foes[0], benchA: [b].concat(more.map((sp, k) => member(formAt(sp, Math.max(1, lv - 1)), Math.max(1, lv - 1), 'm' + k))), benchB: foes.slice(1), field: placeOf(id), shield: tr.shield, trainer: tr.title, smart: [0, tr.smart || 0], bag: {} });
    E.intro(s);
    for (let k = 0; k < 800 && s.phase !== 'over'; k++) {
      if (s.phase === 'begin') { E.beginTurn(s); continue; }
      if (s.phase === 'send') { const p: Record<number, number> = {}; E.sendNeeds(s).forEach((q) => { if (q.must) p[q.side] = E.benchLabels(s, q.side).filter((l) => l.ready)[0].slot; }); E.sendIn(s, p); continue; }
      const ch: Record<number, string> = {};
      E.needs(s).forEach((i) => { ch[i] = E.ai(s, i); });
      E.playTurn(s, ch);
    }
    if (s.result === 'win' && s.winner === 0) won++;
    turns += s.turn;
  }
  return { win: Math.round(100 * won / n), turns: Math.round(turns / n) };
}
const args = process.argv.slice(2);
if (process.argv[1] && process.argv[1].indexOf('sim-story') >= 0 && args[0] === 'trainers') {
  const firsts: [SpeciesId, SpeciesId][] = [['polpino', 'cicalina'], ['ramarrino', 'olivella'], ['gabbi', 'granchietto']];
  console.log('Vittorie del giocatore (%) e turni, con l\'iniziale al livello del più forte dell\'allenatore e una seconda creatura un livello sotto.');
  console.log('allenatore'.padEnd(36) + firsts.map((f) => SPECIES[f[0]].name.padStart(14)).join(''));
  for (const id of Object.keys(TRAINERS)) {
    if (!TRAINERS[id].team.length) continue;
    console.log((id + (TRAINERS[id].smart ? ' (smart ' + TRAINERS[id].smart + ')' : '')).padEnd(36) + firsts.map((f) => { const r = trainerRate(f[0], f[1], id); return (r.win + '% ' + r.turns + 't').padStart(14); }).join(''));
  }
} else if (process.argv[1] && process.argv[1].indexOf('sim-story') >= 0 && args.length === 2) {
  const [a, la] = args[0].split(':'), [b, lb] = args[1].split(':');
  console.log(a + ' Lv' + la + ' vs ' + b + ' Lv' + lb + ': ' + winRate(a, +la, b, +lb) + '%');
} else if (process.argv[1] && process.argv[1].indexOf('sim-story') >= 0) {
  const rows: [string, number, string, number][] = [
    ['polpino', 5, 'riccetto', 4], ['ramarrino', 5, 'riccetto', 4], ['gabbi', 5, 'riccetto', 4], ['antonio', 5, 'cicalina', 3],
    ['polpino', 5, 'cicalina', 3], ['gabbi', 6, 'granchietto', 7], ['polpino', 7, 'olivella', 8], ['ramarrino', 9, 'civettina', 11],
    ['antonio', 5, 'costanzo', 6], ['polpino', 6, 'costanzo', 6], ['antonio', 8, 'forchetta', 9], ['polpino', 9, 'forchetta', 9], ['gabbi', 9, 'forchetta', 9], ['ramarrino', 9, 'forchetta', 9],
    ['polpino', 6, 'olivella', 6], ['polpino', 7, 'cicalina', 7], ['polpetto', 15, 'riccione', 17], ['polpetto', 18, 'civettona', 19],
    ['polpastro', 30, 'muraglione', 28], ['muraglione', 30, 'granchione', 24],
    /* the first battles at Gianola, with each of the three: the pools and the man with the shovel */
    ['gabbi', 6, 'riccetto', 6], ['polpino', 6, 'riccetto', 6], ['ramarrino', 6, 'riccetto', 6], ['gabbi', 7, 'granchietto', 7], ['ramarrino', 7, 'granchietto', 7],
    /* the last forms against each other, with their second types */
    ['gabbiammiraglio', 30, 'muraglione', 30], ['muraglione', 30, 'polpastro', 30], ['polpastro', 30, 'gabbiammiraglio', 30]
  ];
  for (const [a, la, b, lb] of rows) console.log((a + ' Lv' + la).padEnd(16) + ' vs ' + (b + ' Lv' + lb).padEnd(16) + winRate(a, la, b, lb) + '%');
}

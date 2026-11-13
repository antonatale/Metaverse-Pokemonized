import { TUNE } from '../data/tuning';
import { ITEMS } from '../data/items';
import type { BattleState, BenchLabel, Chip, MoveLabel, Side, Snap } from './types';
import type { Move } from '../data/characters';
import { ch, mv, available, beaterOf, hasMod, personaOn, zenOn, switches, senders, switchSlot, sideType, eff } from './state';
import { SWITCH_TUNE, FIELD_TUNE } from '../data/tuning';
import { movePower, moveType, magicEff, typesOf, effLevel } from './damage';
import { isSpecies } from '../data/creatures';
import { STATUS } from '../data/passives';
import { catchChance } from './moves';

/* What the UI shows, decided here so the UI never needs to know the rules:
   the status chips under each name, and the label of every move button. */

export function snap(s: BattleState): Snap {
  const out: Snap = { k: 'sync', turn: s.turn, maxTurns: s.maxTurns, boss: s.boss, chips: [chips(s, 0), chips(s, 1)], revealed: [s.sides[0].revealed, s.sides[1].revealed], ph: [zenOn(s, s.sides[0]), zenOn(s, s.sides[1])] };
  if (s.bench) {
    out.team = [teamDots(s, 0), teamDots(s, 1)];
    /* during the playback of a turn the state may be ahead of the screen: who this is about, and the types it had then */
    out.types = [typesOf(s, s.sides[0], s.sides[1]).slice(), typesOf(s, s.sides[1], s.sides[0]).slice()];
    out.who = [s.sides[0].key || s.sides[0].id, s.sides[1].key || s.sides[1].id];
    if (s.surge) out.surge = [s.surge[0], s.surge[1]];
    if (s.field) out.place = s.field.type + ' +' + Math.round((FIELD_TUNE.boost - 1) * 100) + '%';
  }
  return out;
}
/** one dot for each of a side's team: whoever is up, and whoever is down */
function teamDots(s: BattleState, i: number): string[] {
  return [s.sides[i]].concat(s.bench![i]).filter(function (x) { return !x.last; }).map(function (x) { return x.hp > 0 ? 'up' : 'ko'; });
}

/* ---------- who can come in, for the screen that picks ---------- */
/** the one a side will be facing: the foe on the field, or the one announced to take its place */
function facing(s: BattleState, i: number): Side {
  const j = 1 - i, n = s.nextIn ? s.nextIn[j] : null;
  return s.sides[j].hp > 0 || n == null ? s.sides[j] : s.bench![j][n];
}
export function benchLabels(s: BattleState, i: number): BenchLabel[] {
  if (!s.bench) return [];
  const foe = facing(s, i), must = s.sides[i].hp <= 0, can = must ? senders(s, i) : switches(s, i).map(switchSlot);
  return s.bench[i].map(function (x, k) {
    const c = ch(x), types = typesOf(s, x, foe);
    /* a person's magic is the person's own type; a creature's, the best of the moves it knows */
    let hits = 0, takes = effLevel(magicEff(ch(foe).type, types));
    if (isSpecies(foe.id)) {
      const can = ch(foe).moves.filter(function (m) { return m.kind === 'atk' && (!foe.known || foe.known.indexOf(m.id) >= 0); });
      takes = can.length ? Math.max.apply(null, can.map(function (m) { return effLevel(magicEff(moveType(foe, m), types)); })) : 0;
    }
    if (isSpecies(x.id)) c.moves.forEach(function (m) {
      if (m.kind === 'atk' && (!x.known || x.known.indexOf(m.id) >= 0)) hits = Math.max(hits, effLevel(magicEff(moveType(x, m), typesOf(s, foe, x))));
    });
    return { slot: k, id: x.id, name: c.name, lvl: x.lvl, gold: x.gold, hp: x.hp, max: x.max, types: types, last: !!x.last, ready: can.indexOf(k) >= 0, hits: hits, takes: takes,
      note: x.hp <= 0 ? 'KO' : x.last ? 'Lotto io!' : takes > 0 && hits <= 0 ? 'Svantaggio' : hits > 0 && takes <= 0 ? 'Vantaggio' : '' };
  });
}
/** what the change is, in words: for its button, and for the sheet that opens */
export function changeText(s: BattleState, i: number): { button: string; hint: string } {
  const n = switches(s, i).length, foe = s.sides[1 - i];
  return { button: (n === 1 ? '1 pronta' : n + ' pronte') + ' · costa il turno',
    hint: 'Cambiare costa il turno: ' + ch(foe).name + ' (' + typesOf(s, foe, s.sides[i]).join(' e ') + ') colpisce chi entra, che però è in guardia e prende il ' + Math.round(SWITCH_TUNE.guard * 100) + '% del danno. Chi aspetta recupera il ' + Math.round(SWITCH_TUNE.rest * 100) + '% dei PS a turno.' };
}
/** Risonanza and the magic of the place, in words: the button before and after it is pressed, and the sheet of the battle */
export function resonanceText(s: BattleState): { button: string; armed: string; sheet: string } {
  const f = s.field, pct = f ? Math.round((FIELD_TUNE.boost - 1) * 100) : 0;
  return { button: 'Una volta sola: la prossima mossa fa il 50% in più', armed: 'Adesso scegli la mossa',
    sheet: f ? 'La magia ' + f.name + ': qui le mosse di tipo ' + f.type + ' fanno il ' + pct + '% in più. Lo Slancio sale quando un colpo è critico o superefficace, dato o preso. Con ' + FIELD_TUNE.max + ' punti, una volta a lotta, la Risonanza dà a una creatura il tipo del luogo, il ' + Math.round(FIELD_TUNE.heal * 100) + '% dei PS e un colpo fortissimo.' + ' Serve un legame di tre cuori.' : '' };
}
function chips(s: BattleState, i: number): Chip[] {
  const x = s.sides[i], out: Chip[] = [];
  function add(c: string, ic: string, t: string, d?: string) { out.push({ c: c, i: ic, t: t, d: d || t }); }
  if (x.lock) { const it = ITEMS[x.lock.move], left = x.lock.until - s.turn + 1; add('bad', it.icon, left <= 1 ? '1 turno' : left + ' turni', it.short); }
  if (x.boost && !isSpecies(x.id)) add('info', 'spark', 'IA +50%');
  if (x.id === 'antonio') { if (x.tee) add('white', 'cert', x.tee + '/3', 'Certificati bianchi'); add('stage', 'plane', ['Formia', 'Torino', 'AMERICA'][x.lv], 'Tappa del viaggio'); }
  if (x.skip) add('bad', x.skip.why === 'robot' ? 'robot' : 'mute', x.skip.why === 'robot' ? 'Robot a terra' : 'Perde il turno');
  if (x.conf > 0) add('bad', 'swirl', 'Confuso');
  if (x.encore && x.encore.until >= s.turn) add('bad', 'loop', 'Manipolato', 'Deve ripetere ' + mv(x, x.encore.move)!.name);
  if (hasMod(s, x, 'atkUp')) add('up', 'up', 'Attacco +30%');
  if (hasMod(s, x, 'atkDown')) add('down', 'down', 'Attacco −25%');
  if (hasMod(s, x, 'defUp')) add('up', 'shield', 'Difesa +25%');
  if (hasMod(s, x, 'defDown')) add('down', 'down', 'Difesa −20%');
  if (hasMod(s, x, 'guard')) add('up', 'shield', 'Danni −30%');
  if (x.fresh) add('up', 'shield', 'In guardia', 'Appena entrato: per questo turno subisce metà del danno');
  if (x.status) { const st = STATUS[x.status.id]; add('bad', st.icon, st.name, st.text); }
  if (x.away) add('info', 'plane', 'A Copenhagen');
  if (x.charge) { const held = mv(x, x.charge); if (held && held.windup) add('bad', 'flame', 'Sta per colpire', 'Al prossimo turno: ' + held.name); else add('info', 'plane', 'Di ritorno'); }
  if (i === 1 && s.shield) add(s.shield.left ? 'info' : 'bad', 'shield', s.shield.left ? s.shield.name + ' ' + s.shield.left + '/' + s.shield.max : s.shield.name + ' rotta', s.shield.left ? 'Ogni colpo superefficace la incrina' : 'Scudo rotto');
  if (hasMod(s, x, 'broken')) add('bad', 'down', 'Esposto', 'Senza difese: subisce più danni');
  if (x.boost && isSpecies(x.id)) add('up', 'spark', 'Risonanza', 'Il prossimo colpo fa il 50% in più');
  if (x.stages) add('info', 'spark', 'Parte ' + (x.stage! + 1) + ' di ' + x.stages.length, x.stages[x.stage!].name);
  if (personaOn(s, x)) add('info', 'mic', 'Nel personaggio');
  if (x.id === 'costanzo' && x.lastAtk && x.atkStreak > 0) add('white', 'mic', 'Fissa ' + ((x.atkStreak - 1) % 3 + 1) + '/3', 'Fissa su ' + mv(x, x.lastAtk)!.name);
  if (x.id === 'forchetta' && !x.sturdy) add('white', 'shield', 'Resiste 1 volta');
  if (x.id === 'zendavid') { if (x.anx) add('down', 'pulse', 'Ansia ' + x.anx + '/3'); if (zenOn(s, x)) add('up', 'music', 'Cuffie'); }
  if (x.id === 'valentin') add('white', 'heart', '+' + TUNE.regen + ' PS a turno');
  return out;
}

/* ---------- labels for the move buttons ---------- */
/** what a move made of numbers does besides its power, in words (the battle's buttons and the sheet for learning a
    move say the same); `here` is the bonus of the place's magic, when there is one */
export function moveBits(m: Move, here?: string): string[] {
  const fx = m.fx || {}, bits: string[] = [];
  if (m.windup) bits.push('Un turno per caricare');
  if (here) bits.push(here);
  if (m.priority) bits.push('Attacca per primo');
  if (m.drain) bits.push(m.drain >= 0.5 ? 'si cura metà' : 'si cura il ' + Math.round(m.drain * 100) + '%');
  if (m.crit) bits.push('critico ' + Math.round(m.crit * 100) + '%');
  if (fx.heal) bits.push('Cura il ' + Math.round(fx.heal * 100) + '%');
  if (fx.self) bits.push(fx.self === 'atkUp' ? 'Attacco +30%' : 'Difesa +25%');
  if (fx.foe) bits.push(fx.foe === 'atkDown' ? 'Attacco avv. −25%' : 'Difesa avv. −20%');
  if (fx.conf) bits.push(fx.conf >= 1 ? 'Confonde' : 'può confondere');
  if (fx.status) bits.push(STATUS[fx.status].name + (fx.odds ? ' ' + Math.round(fx.odds * 100) + '%' : '') + (m.kind !== 'atk' && m.acc ? ' · ' + Math.round(m.acc * 100) + '%' : ''));
  return bits;
}
/** the icon of a move made of numbers */
export function moveIcon(m: Move): string {
  const fx = m.fx || {};
  return m.kind === 'atk' ? (m.priority ? 'wing' : 'spark') : fx.heal ? 'heart' : fx.self ? 'up' : fx.conf ? 'swirl' : fx.status ? STATUS[fx.status].icon : 'down';
}
/* a friend's move on its card, in a few words: what it does besides its power (the ones that change say it from the
   label of the moment) */
const CARD: Record<string, string> = {
  diagnosi: 'Difesa avv. −20%, ne svela i numeri', simtoreal: 'Il robot può cadere (30%)', comizio: 'GIÀ LO SAI', bidet: 'Cura 25 PS, toglie i cali', daje: 'Coro da curva',
  analisi: 'Non sbaglia · critico 25%', volpino: 'Attacca per primo, dall\'alto', cucinato: 'Più è cotto, più picchia', weee: 'Confonde il 20% delle volte',
  manipolazione: 'Ripete l\'ultima mossa · +10 PS', copenhagen: 'Sparisce un turno, poi colpisce', king: 'Danni −30% · +10 PS', servizio: 'Ace: critico 25%',
  pitstop: 'Cura 20 PS · Difesa +25%', criptico: 'Confonde per 2 turni', formia: 'Si riprende il 40% del danno', abbaia: 'Attacco avv. −25%',
  battuta: 'Fa ridere il 45% delle volte', trinita: 'Tre colpi, ognuno può fare critico', cattiva: 'Sbaglia mossa il 30% delle volte'
};
const BAGGY: Record<string, boolean> = { retino: true, retino2: true, argento: true, oro: true, nassa: true, lampara: true, tiella: true, balsamo: true };
export function moveLabel(s: BattleState, i: number, id: string): MoveLabel {
  const me = s.sides[i], m = mv(me, id)!, lock = me.lock && me.lock.move === id;
  const av = available(s, i), out: MoveLabel = { id: id, name: m.name, kind: m.kind, locked: av.indexOf(id) < 0, sub: '', icon: null, dots: null };
  /* a creature's move always says its magic, even when it cannot be used now */
  if (isSpecies(me.id) && !ITEMS[id]) out.mtype = moveType(me, m);
  if (lock) { const it = ITEMS[id], left = me.lock!.until - s.turn + 1; out.icon = it.icon; out.sub = it.short + ' · ' + (left <= 1 ? '1 turno' : left + ' turni'); return out; }
  if (out.locked && me.encore && me.encore.until >= s.turn) { out.sub = 'Manipolato: non può'; out.icon = 'loop'; return out; }
  if (m.uses && (me.uses[id] || 0) >= m.uses) { out.icon = 'x'; out.sub = 'Usi finiti'; return out; }
  switch (id) {
    case 'diagnosi': out.icon = 'scan'; out.sub = 'Difesa −20%, rivela'; break;
    case 'certificati': out.icon = 'cert'; out.sub = me.hp >= me.max ? 'PS al massimo' : 'Cura ' + Math.min(Math.round((TUNE.healBase + TUNE.healPer * me.tee) * (me.boost ? 1.5 : 1)), me.max - me.hp) + ' PS'; break;
    case 'simtoreal': out.icon = 'robot'; out.sub = 'Fortissimo · rischio 30%'; break;
    case 'america': out.dots = [0, 1, 2].map(function (k) { return k <= me.lv; }); out.sub = 'Tappa ' + (me.lv + 1) + ': ' + ['Formia', 'Torino', 'AMERICA'][me.lv]; break;
    case 'comizio': out.icon = 'mic'; out.sub = 'Danno medio'; break;
    case 'personaggismo': out.icon = 'mic'; out.sub = personaOn(s, me) ? 'Già nel personaggio' : 'Diventa tipo ' + beaterOf(ch(s.sides[1 - i]).type); break;
    case 'bidet': out.icon = 'drop'; out.sub = 'Cura 25 PS, pulisce'; break;
    case 'daje': out.icon = 'flag'; out.sub = 'Forte · 80% di colpire'; break;
    case 'analisi': out.icon = 'chart'; out.sub = 'Critico 25%'; break;
    case 'volpino': out.icon = 'wing'; out.sub = 'Attacca per primo'; break;
    case 'palestra': out.icon = 'up'; out.sub = hasMod(s, me, 'atkUp') ? 'Già carico' : 'Attacco +30%'; break;
    case 'cucinato': out.icon = 'flame'; out.sub = 'Potenza ' + movePower(me, m); break;
    case 'weee': out.icon = 'spark'; out.sub = 'Danno medio · confonde'; break;
    case 'manipolazione': out.icon = 'loop'; out.sub = 'Lo obbliga a ripetere'; break;
    case 'copenhagen': out.icon = 'plane'; out.sub = 'Sparisce, poi colpisce'; break;
    case 'king': out.icon = 'shield'; out.sub = 'Danni subiti −30%'; break;
    case 'servizio': out.icon = 'ball'; out.sub = 'Critico 25%'; break;
    case 'pitstop': out.icon = 'wrench'; out.sub = 'Cura 20, Difesa +25%'; break;
    case 'criptico': out.icon = 'swirl'; out.sub = 'Confonde per 2 turni'; break;
    case 'formia': out.icon = 'heart'; out.sub = 'Recupera il 40% del danno'; break;
    case 'abbaia': out.icon = 'paw'; out.sub = 'Attacco avversario −25%'; break;
    case 'ascolta': out.icon = 'mic'; out.sub = me.hurtAt === s.turn ? 'Risponde: +50%' : 'Danno medio · +50% se colpita'; break;
    case 'tavoli': { const f0 = s.sides[1 - i], lm = f0.lastMove && f0.lastMove !== 'copenhagenRet' ? mv(f0, f0.lastMove) : null; out.icon = 'shield'; out.sub = lm ? 'Blocca ' + lm.name : 'Niente da bloccare'; break; }
    case 'trinita': out.icon = 'spark'; out.sub = 'Tre colpi'; break;
    case 'cattiva': out.icon = 'swirl'; out.sub = 'Lo fa sbagliare strada'; break;
    /* the chance is 0.45 (the balance was simulated with it): if this is ever fixed, fix the label, not the chance */
    case 'battuta': out.icon = 'mic'; out.sub = '40% di far ridere'; break;
    case 'zen': out.icon = 'music'; out.sub = zenOn(s, me) ? 'Cuffie già in testa' : 'Cuffie, cura 20'; break;
    case 'stronger': out.icon = 'music'; out.sub = zenOn(s, me) ? 'Forte · +20% cuffie' : 'Danno alto'; break;
    case 'retino': case 'retino2': case 'argento': case 'oro': case 'nassa': case 'lampara': {
      /* how likely it is to hold now, in words: the player learns to wear the creature out first */
      out.icon = 'ball'; out.count = s.bag![id] || 0;
      if (out.locked) { out.sub = 'Non regge ancora'; break; }
      const c = catchChance(s, i, id);
      out.chance = c;
      out.sub = c >= 0.8 ? 'Quasi certo' : c >= 0.5 ? 'Probabile' : c >= 0.25 ? 'Difficile' : 'Molto difficile';
      break;
    }
    case 'tiella': out.icon = 'heart'; out.count = s.bag!.tiella || 0; out.sub = out.locked ? 'PS al massimo' : 'Cura 40 PS'; break;
    case 'balsamo': out.icon = 'drop'; out.count = s.bag!.balsamo || 0; out.sub = out.locked ? 'Niente da curare' : 'Toglie stati e cali'; break;
    default: {
      /* the moves made of numbers, the creatures' and those of the people who have grown: what they do, from their numbers
         (the Esame's keep no label, as they always had) */
      const magic = isSpecies(me.id);
      if (!magic && !me.grown) break;
      const bits: string[] = [];
      if (magic) out.mtype = moveType(me, m);
      if (m.kind === 'atk') {
        out.power = m.power; out.acc = m.acc || 1;
        if (magic) out.eff = magicEff(out.mtype!, typesOf(s, s.sides[1 - i], me));
        bits.push('Potenza ' + m.power + (m.acc ? ' · ' + Math.round(m.acc * 100) + '%' : ''));
      }
      const more = moveBits(m, m.kind === 'atk' && s.field && out.mtype === s.field.type ? '+' + Math.round((FIELD_TUNE.boost - 1) * 100) + '% qui' : '');
      out.icon = moveIcon(m);
      out.more = more.join(', ');
      out.sub = bits.concat(more).join(', ');
    }
  }
  if (m.uses) out.left = m.uses - (me.uses[id] || 0);
  /* a person's move on a card, as a creature's: the person's type of the moment, the power and aim of a blow, how well
     it does on the one in front, and in a few words what else it does */
  if (!isSpecies(me.id) && !BAGGY[id] && !ITEMS[id]) {
    const foe = s.sides[1 - i], pt = sideType(s, me, foe);
    out.ptype = pt;
    if (m.kind === 'atk') {
      const pw = movePower(me, m);
      if (pw) { out.power = pw; out.acc = m.acc || 1; out.eff = eff(pt, sideType(s, foe, me)); if (id === 'trinita') out.hits = 3; }
    }
    if (out.more == null) out.more = CARD[id] || out.sub.replace(/^(Danno (medio|alto|basso)|Fortissimo|Forte|Potenza \d+)( · |, )?/, '');
  }
  return out;
}

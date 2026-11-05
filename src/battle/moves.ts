import { TUNE } from '../data/tuning';
import { JOKES } from '../data/characters';
import type { BattleEvent, BattleState } from './types';
import { rand, pick } from './rng';
import { say, line, expr, anim } from './events';
import { ch, mv, addMod, available, beaterOf, zenOn, BAG } from './state';
import { statFx, inflict, cureStatus } from './passives';
import type { Move } from '../data/characters';
import { SPECIES, isSpecies } from '../data/creatures';
import { applyHit, heal, confuse } from './damage';
import { NETS, SEA_BODIES, type NetId } from '../data/nets';

/** the chance that a net holds: the more worn out the creature, the easier (a quarter at full health, almost always near
    the end), times the net (a sea net against a creature of the sea, a night net in the dark), the legend's own rate and
    Antonio's steady hand */
export function catchChance(s: BattleState, i: number, id: string): number {
  const foe = s.sides[1 - i], net = NETS[id as NetId], sp = isSpecies(foe.id) ? SPECIES[foe.id] : null;
  let mult = net ? net.mult : 1;
  if (net && net.sea && sp && SEA_BODIES.indexOf(sp.art.body) >= 0) mult *= net.sea;
  if (net && net.night && s.night) mult *= net.night;
  return Math.min(0.95, (0.25 + 0.65 * (1 - foe.hp / foe.max)) * mult * (sp ? sp.catchRate || 1 : 1) * (s.sides[i].net || 1));
}

/* ---------- moves: what each one does, character by character ---------- */
export function useMove(s: BattleState, i: number, id: string, ev: BattleEvent[]): boolean {
  const me = s.sides[i], foe = s.sides[1 - i], j = 1 - i, cm = ch(me), m = mv(me, id), nm = cm.name;
  let attacked = false, dmg;
  /* the bag is Antonio's: he throws the nets, the tiella says itself (story battles only) */
  if (id !== 'copenhagenRet' && !BAG[id]) ev.push(say(nm + ' usa ' + m!.name + '!'));
  /* a creature's moves are numbers: an id it shares with someone else's move (Radici, the Esame's too) must not end up
     in that one's case */
  switch (isSpecies(me.id) && !BAG[id] ? '' : id) {
    /* --- Antonio --- */
    case 'diagnosi':
      ev.push(expr(i, 'smirk'));
      dmg = applyHit(s, i, id, ev); attacked = true;
      if (foe.hp > 0) {
        addMod(foe, 'def', 0.8, s.turn + 2, 'defDown');
        if (!foe.revealed) { foe.revealed = true; ev.push(anim(j, 'reveal')); }
        ev.push(say('Inefficienze trovate: la Difesa di ' + ch(foe).name + ' cala per 2 turni.'));
        if (s.mode === 'cpu' && me.human) { s.forecastNext[i] = true; ev.push(say('Al prossimo turno saprai quale mossa userà ' + ch(foe).name + '.')); }
      }
      me.boost = false;
      break;
    case 'certificati':
      if (me.hp >= me.max) { ev.push(say('Antonio ha già tutti i PS: i certificati restano da parte.')); break; }
      if (me.tee > 0) ev.push(say('Incassa ' + (me.tee === 1 ? 'un certificato' : me.tee + ' certificati') + '.'));
      ev.push(expr(i, 'grin'));
      heal(s, i, (TUNE.healBase + TUNE.healPer * me.tee) * (me.boost ? 1.5 : 1), ev);
      me.tee = 0; me.boost = false;
      break;
    case 'simtoreal':
      ev.push(expr(i, 'grin'));
      if (rand(s) < m!.risk!) {
        ev.push(anim(i, 'robotFail'));
        ev.push(expr(i, 'worried'));
        ev.push(line(i, cm.lines.robotFail));
        ev.push(say('Il robot è caduto. Al prossimo turno Antonio dovrà rimetterlo in piedi.'));
        me.skip = { why: 'robot' }; me.st.fails++;
        break;
      }
      ev.push(anim(i, 'robot'));
      applyHit(s, i, id, ev, { noLunge: true }); attacked = true; me.boost = false;
      break;
    case 'america': {
      const lv = me.lv;
      ev.push(expr(i, 'grin'));
      ev.push(say(['Antonio parte da Formia!', 'Antonio arriva a Torino!', 'Antonio vola in AMERICA!'][lv]));
      if (lv === 2) ev.push(anim(i, 'banner', { text: 'AMERICA!', style: 'usa' }));
      applyHit(s, i, id, ev); attacked = true; me.boost = false;
      if (lv === 2 && !me.seenAmerica && foe.hp > 0) { me.seenAmerica = true; ev.push(expr(i, 'cool')); ev.push(line(i, cm.lines.america)); }
      if (lv < 2) { me.lv++; if (foe.hp > 0) ev.push(say(lv === 0 ? 'Prossima tappa: Torino.' : 'Prossima tappa: AMERICA.')); }
      break;
    }
    /* --- Costanzo --- */
    case 'comizio':
      ev.push(expr(i, 'smirk'));
      ev.push(anim(i, 'speech'));
      applyHit(s, i, id, ev); attacked = true;
      break;
    case 'personaggismo': {
      const bt = beaterOf(ch(foe).type);
      me.persona = s.turn + 3;
      ev.push(expr(i, 'cool'));
      ev.push(anim(i, 'glint'));
      ev.push(line(i, cm.lines.persona));
      ev.push(say('Costanzo entra nel personaggio: per 3 turni è di tipo ' + bt + '.'));
      break;
    }
    case 'bidet': {
      ev.push(expr(i, 'grin'));
      const cleaned = me.mods.some(function (x) { return x.mult < 1 && x.until >= s.turn; }) || me.conf > 0 || !!me.encore || !!me.skip;
      me.mods = me.mods.filter(function (x) { return x.mult >= 1; }); me.conf = 0; me.encore = null; me.skip = null;
      heal(s, i, 25, ev);
      if (cleaned) ev.push(say('Il bidet lava via tutti gli effetti negativi.'));
      break;
    }
    case 'daje':
      ev.push(expr(i, 'grin'));
      ev.push(anim(i, 'banner', { text: 'DAJE!', style: 'roma' }));
      applyHit(s, i, id, ev); attacked = true;
      break;
    /* --- Andrea --- */
    case 'analisi':
      ev.push(expr(i, 'smirk'));
      applyHit(s, i, id, ev); attacked = true;
      break;
    case 'volpino':
      ev.push(expr(i, 'grin'));
      ev.push(anim(i, 'fox'));
      applyHit(s, i, id, ev, { noLunge: true }); attacked = true;
      break;
    case 'palestra':
      addMod(me, 'atk', 1.3, s.turn + 3, 'atkUp');
      ev.push(expr(i, 'grin'));
      ev.push(anim(i, 'pump'));
      ev.push(say('L\'Attacco di Andrea sale del 30% per 3 turni.'));
      break;
    case 'cucinato':
      ev.push(expr(i, me.hp < me.max * 0.4 ? 'worried' : 'smirk'));
      if (me.hp < me.max * 0.4) ev.push(line(i, cm.lines.cucinato));
      applyHit(s, i, id, ev); attacked = true;
      break;
    /* --- Valentin --- */
    case 'weee':
      ev.push(expr(i, 'grin'));
      ev.push(anim(i, 'confetti'));
      applyHit(s, i, id, ev, { noLunge: true }); attacked = true;
      if (foe.hp > 0 && rand(s) < 0.2) confuse(s, j, 2, ev);
      break;
    case 'manipolazione':
      ev.push(expr(i, 'smirk'));
      if (zenOn(s, foe)) ev.push(say('Zendavid ha le cuffie: non sente una parola.'));
      else if (!foe.lastMove || available(s, j).indexOf(foe.lastMove) < 0 && !(foe.lock && foe.lock.move === foe.lastMove)) ev.push(say('Ma ' + ch(foe).name + ' non ha ancora fatto niente da ripetere.'));
      else {
        foe.encore = { move: foe.lastMove, until: s.turn + 2 };
        ev.push(anim(j, 'confused'));
        ev.push(say(ch(foe).name + ' si convince: per 2 turni userà solo ' + mv(foe, foe.lastMove)!.name + '.'));
      }
      heal(s, i, 10, ev, 'Valentin si sente una brava persona: +10 PS.');
      break;
    case 'copenhagen':
      ev.push(expr(i, 'grin'));
      ev.push(anim(i, 'flyAway'));
      ev.push(say('Valentin vola a Copenhagen da Christiana. Per ora è irraggiungibile.'));
      me.away = true; me.charge = 'copenhagenRet';
      break;
    case 'copenhagenRet':
      me.charge = null;
      ev.push(anim(i, 'flyBack'));
      ev.push(line(i, cm.lines.back));
      ev.push(say('Valentin torna da Copenhagen pieno di energia!'));
      applyHit(s, i, 'copenhagen', ev, { noLunge: true }); attacked = true;
      break;
    case 'king':
      addMod(me, 'guard', 0.7, s.turn + 3, 'guard');
      ev.push(expr(i, 'cool'));
      ev.push(anim(i, 'glowGreen'));
      heal(s, i, 10, ev, 'Relax totale: per 3 turni subisce il 30% di danno in meno, e recupera 10 PS.');
      break;
    /* --- Forchetta --- */
    case 'servizio':
      ev.push(expr(i, 'smirk'));
      ev.push(anim(i, 'ball'));
      applyHit(s, i, id, ev, { noLunge: true }); attacked = true;
      break;
    case 'pitstop':
      addMod(me, 'def', 1.25, s.turn + 3, 'defUp');
      ev.push(expr(i, 'grin'));
      heal(s, i, 20, ev, 'Cambio gomme in 2 secondi: Forchetta recupera PS e la sua Difesa sale per 3 turni.');
      break;
    case 'criptico':
      ev.push(expr(i, 'smirk'));
      ev.push(anim(i, 'cryptic'));
      confuse(s, j, 2, ev);
      break;
    case 'formia':
      ev.push(expr(i, 'grin'));
      ev.push(anim(i, 'banner', { text: 'FORZA FORMIA!', style: 'formia' }));
      dmg = applyHit(s, i, id, ev); attacked = true;
      if (dmg > 0 && me.hp > 0) heal(s, i, dmg * m!.drain!, ev, 'Forchetta si ricarica con l\'aria di Formia.');
      break;
    /* --- Zendavid --- */
    case 'abbaia':
      ev.push(expr(i, 'grin'));
      ev.push(anim(i, 'bark'));
      applyHit(s, i, id, ev, { noLunge: true }); attacked = true;
      if (foe.hp > 0) { addMod(foe, 'atk', 0.75, s.turn + 3, 'atkDown'); ev.push(say(ch(foe).name + ' si spaventa: il suo Attacco cala per 3 turni.')); }
      break;
    case 'battuta': {
      const joke = pick(s, JOKES);
      ev.push(expr(i, 'grin'));
      ev.push(line(i, joke));
      if (rand(s) < m!.chance!) {
        ev.push(say(cm.lines.jokeWin!));
        ev.push(anim(j, 'laugh'));
        applyHit(s, i, id, ev, { noLunge: true }); attacked = true;
      } else {
        ev.push(expr(i, 'worried'));
        ev.push(anim(j, 'cricket'));
        ev.push(say(cm.lines.jokeFail!));
        attacked = true;
      }
      break;
    }
    case 'zen':
      me.zen = s.turn + 3; me.anx = 0;
      ev.push(anim(i, 'phOn'));
      ev.push(line(i, cm.lines.zen));
      heal(s, i, 20, ev, 'Cuffie in testa, ansia azzerata: per 3 turni non sente niente. Recupera 20 PS.');
      break;
    case 'stronger':
      ev.push(expr(i, 'cool'));
      ev.push(anim(i, 'notes'));
      applyHit(s, i, id, ev, { noLunge: true }); attacked = true;
      break;
    /* --- Esame --- */
    case 'bode': case 'trabocchetto': case 'bocciatura':
      ev.push(expr(i, 'angry'));
      applyHit(s, i, id, ev); attacked = true;
      break;
    case 'radici':
      ev.push(expr(i, 'angry'));
      dmg = applyHit(s, i, id, ev); attacked = true;
      if (dmg > 0 && foe.hp > 0) { addMod(foe, 'atk', 0.75, s.turn + 2, 'atkDown'); ev.push(say(ch(foe).name + ' si perde tra poli e zeri: il suo Attacco cala per 2 turni.')); }
      break;
    case 'orale':
      heal(s, i, 30, ev, 'Ti fa ripetere tutto a voce: l\'Esame recupera PS.');
      break;
    /* --- the bag, in story battles --- */
    case 'retino': case 'retino2': case 'argento': case 'oro': case 'nassa': case 'lampara': {
      s.bag![id] = (s.bag![id] || 0) - 1;
      ev.push(say((s.hero || 'Antonio') + ' lancia ' + NETS[id as NetId].a + '!'));
      const chance = catchChance(s, i, id), roll = rand(s), held = roll < chance;
      /* the net shakes before it holds (three times) or the creature gets out: more shakes the closer it came */
      const shakes = held ? 3 : roll < chance * 1.35 ? 2 : roll < chance * 2 ? 1 : 0;
      ev.push(anim(i, 'net', { item: id, shakes: shakes }));
      if (held) { s.caught = true; s.caughtWith = id; }
      else ev.push(say(shakes >= 2 ? 'Per un pelo! ' + ch(foe).name + ' si libera all\'ultimo!' : shakes ? 'Accidenti, ' + ch(foe).name + ' si libera!' : ch(foe).name + ' scappa dal retino!'));
      break;
    }
    case 'tiella':
      s.bag!.tiella = (s.bag!.tiella || 0) - 1;
      ev.push(expr(i, 'grin'));
      heal(s, i, 40, ev, nm + ' mangia una fetta di tiella: si sente meglio.');
      cureStatus(s, i, ev);
      break;
    /* --- the creatures of Formia: their moves are numbers, done here --- */
    default:
      if (genericMove(s, i, m!, ev)) attacked = true;
  }
  const used = id === 'copenhagenRet' ? 'copenhagen' : id;
  if (me.id === 'zendavid') me.used[used] = true;
  if (me.id === 'costanzo' && m!.kind === 'atk') { me.atkStreak = me.lastAtk === id ? me.atkStreak + 1 : 1; me.lastAtk = id; }
  if (id !== 'copenhagenRet') me.lastMove = id;
  if (m && m.uses) me.uses[id] = (me.uses[id] || 0) + 1;
  return attacked;
}
/** a creature's move: damage, a heal, a raise or a drop, a confusion; true if it attacked */
function genericMove(s: BattleState, i: number, m: Move, ev: BattleEvent[]): boolean {
  const me = s.sides[i], foe = s.sides[1 - i], j = 1 - i, fx = m.fx || {};
  let attacked = false;
  const type = ch(me).type;
  /* a blow seen coming: this turn it only gets ready, and whoever is in front has a turn to do something about it */
  if (m.windup && me.charge !== m.id) {
    me.charge = m.id;
    ev.push(expr(i, 'grin'));
    ev.push(isSpecies(me.id) ? anim(i, 'magicUp', { style: m.mtype || type, move: m.id }) : anim(i, 'pump'));
    ev.push(say(m.windup.replace('{n}', ch(me).name)));
    return false;
  }
  if (m.windup) me.charge = null;
  if (m.kind === 'atk') {
    ev.push(expr(i, 'grin'));
    /* a person has no magic to cast: it has its own way of doing it */
    if (isSpecies(me.id)) ev.push(anim(i, 'magic', { style: m.plain ? type : m.mtype || type, move: m.id }));
    else if (m.show) ev.push(anim(i, m.show.a, { text: m.show.text, style: m.show.style }));
    const dmg = applyHit(s, i, m.id, ev, { noLunge: isSpecies(me.id) }); attacked = true;
    if (dmg > 0) me.boost = false;
    if (dmg > 0 && m.drain && me.hp > 0 && me.hp < me.max) heal(s, i, dmg * m.drain, ev, ch(me).name + ' si riprende ' + (m.drain >= 0.5 ? 'metà' : 'il ' + Math.round(m.drain * 100) + '%') + ' del danno.');
    if (dmg <= 0 || foe.hp <= 0 || me.hp <= 0) return attacked;
  } else if (m.kind === 'heal' && fx.heal) {
    ev.push(expr(i, 'grin'));
    if (isSpecies(me.id)) ev.push(anim(i, 'magicUp', { style: type, move: m.id }));
    heal(s, i, me.max * fx.heal, ev);
  } else {
    ev.push(expr(i, 'smirk'));
    ev.push(isSpecies(me.id) ? anim(i, fx.self ? 'magicUp' : 'magic', { style: m.mtype || type, move: m.id }) : anim(i, fx.self ? 'pump' : 'glint'));
    /* a spell on the foe can miss, if it says so */
    if (m.acc && !fx.self && rand(s) > m.acc) { ev.push(anim(j, 'dodge')); ev.push(say('Ma ' + ch(foe).name + ' la scampa!')); return attacked; }
  }
  /* a number going up or down shows itself (story battles only: only the creatures' moves come here) */
  if (fx.self) statFx(s, i, fx.self, ev);
  if (fx.foe && foe.hp > 0) statFx(s, j, fx.foe, ev);
  if (fx.conf && foe.hp > 0 && (fx.conf >= 1 || rand(s) < fx.conf)) confuse(s, j, 2, ev);
  if (fx.status && foe.hp > 0 && (fx.odds == null || rand(s) < fx.odds)) inflict(s, j, fx.status, ev);
  return attacked;
}

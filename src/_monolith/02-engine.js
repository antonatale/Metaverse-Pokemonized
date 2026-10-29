/* Battle engine v2: any two characters, against the computer or two players on one device.
   Pure state + seeded RNG; every call returns a list of events for the UI to play back. */
(function (G) {
  'use strict';

  var TUNE = { zenBoost: 1.2, healBase: 20, healPer: 12, K: 0.3, se: 1.12, nve: 0.9, regen: 5, calc: 0.8, talk: 0.25, critAndrea: 2 };
  /* five types in a cycle: each beats the next one */
  var TYPES = {
    Calma: { beats: 'Caos', why: 'lo spegne' },
    Caos: { beats: 'Cervello', why: 'manda all\'aria i piani' },
    Cervello: { beats: 'Chiacchiera', why: 'smonta le chiacchiere' },
    Chiacchiera: { beats: 'Cuore', why: 'lo convince di tutto' },
    Cuore: { beats: 'Calma', why: 'la scioglie' }
  };
  var TYPE_ORDER = ['Calma', 'Caos', 'Cervello', 'Chiacchiera', 'Cuore'];
  function eff(a, d) {
    if (!a || !d || a === d) return 1;
    if (TYPES[a].beats === d) return TUNE.se;
    if (TYPES[d].beats === a) return TUNE.nve;
    return 1;
  }
  function beaterOf(t) { for (var k in TYPES) if (TYPES[k].beats === t) return k; return null; }

  var K = 0.42, CRIT = 1 / 16;

  var ITEMS = {
    diagnosi: { name: 'gli appunti', short: 'Appunti persi', icon: 'notes' },
    certificati: { name: 'il portafoglio', short: 'Portafoglio perso', icon: 'wallet' },
    simtoreal: { name: 'il caricabatterie del robot', short: 'Caricabatterie perso', icon: 'charger' },
    america: { name: 'il passaporto', short: 'Passaporto perso', icon: 'passport' }
  };
  var FOUND = ['in tasca', 'nello zaino', 'nel cappuccio della felpa', 'sotto il banco', 'nella giacca dell\'anno scorso', 'in mano. Da tutto il tempo'];
  var JOKES = [
    'Qual è il colmo per un giardiniere? Piantare la fidanzata.',
    'Qual è il colmo per un elettricista? Restare folgorato da una ragazza.',
    'Sai perché gli scheletri non litigano mai? Non hanno fegato.',
    'Qual è il colmo per un idraulico? Non capire un tubo.'
  ];

  var CHARS = {
    antonio: {
      id: 'antonio', name: 'Antonio', full: 'Antonio', nick: 'Crazy shit', type: 'Cervello', tagline: 'Formia → Torino → Chicago',
      stats: { hp: 104, atk: 118, def: 76, spe: 110 },
      passive: { name: 'Prompt Engineer', text: 'A inizio turno, 25% di probabilità che l\'IA gli suggerisca un\'idea: la mossa successiva fa il 50% in più.' },
      weakness: { name: 'Dove l\'ho messo?', text: 'A inizio turno, 15% di probabilità di perdere un oggetto. La mossa collegata resta bloccata per 2 turni, finché non lo ritrova.' },
      moves: [
        { id: 'diagnosi', name: 'Diagnosi Energetica', kind: 'atk', power: 45, text: 'Danno basso. Trova le inefficienze: la Difesa dell\'avversario cala per 2 turni e i suoi numeri diventano visibili. Contro il computer prevede anche la sua prossima mossa.' },
        { id: 'certificati', name: 'Certificati Bianchi', kind: 'heal', uses: 3, text: 'Recupera 20 PS, più 12 per ogni certificato messo da parte. Ne mette da parte uno in ogni turno in cui non attacca (massimo 3).' },
        { id: 'simtoreal', name: 'Sim-to-Real', kind: 'atk', power: 78, risk: 0.3, text: 'Danno altissimo. Nel 30% dei casi il robot cade: nessun danno, e il turno dopo Antonio lo rimette in piedi.' },
        { id: 'america', name: 'Formia → Torino → AMERICA', kind: 'atk', powers: [24, 46, 76], text: 'Ogni uso avanza di una tappa: Formia fa poco danno, Torino di più, AMERICA è devastante e resta al massimo.' }
      ],
      lines: {
        entry: 'Ho già letto il paper di questa settimana.', crit: 'Crazy shit!', win: 'Crazy shit… stato dell\'arte.', ko: '…mi servono più basi di controlli.',
        lost: 'Ma dove l\'ho messo?!', ai: 'Ok, questa idea è forte.', robotFail: 'In simulazione funzionava…', america: 'Crazy shit!', time: 'Aspetti, manca solo l\'ultimo punto!'
      }
    },
    costanzo: {
      id: 'costanzo', name: 'Costanzo', full: 'Costanzo', nick: 'Er Politico', type: 'Chiacchiera', tagline: 'Comizi tutto il giorno',
      stats: { hp: 105, atk: 100, def: 86, spe: 95 },
      passive: { name: 'Non ti fa parlare', text: 'Quando colpisce, 20% di probabilità che l\'avversario non riesca a dire una parola e perda il turno.' },
      weakness: { name: 'La fissa', text: 'Se cambia attacco rispetto all\'ultimo che ha usato, perde il filo e fa il 20% in meno. Se insiste con lo stesso attacco, ogni terza volta è un colpo critico sicuro.' },
      moves: [
        { id: 'comizio', name: 'Comizio', kind: 'atk', power: 50, text: 'Sale sul palco e parte il comizio. Danno medio.' },
        { id: 'personaggismo', name: 'Personaggismo', kind: 'buff', text: 'Inforca gli occhiali di destra ed entra nel personaggio: per 3 turni diventa del tipo che batte l\'avversario.' },
        { id: 'bidet', name: 'Difesa del Bidet', kind: 'heal', uses: 3, text: 'Comizio in difesa del bidet: recupera 25 PS ed elimina gli effetti negativi.' },
        { id: 'daje', name: 'Daje Roma Daje', kind: 'atk', power: 70, acc: 0.8, text: 'Coro da curva: danno alto, ma va a segno 8 volte su 10.' }
      ],
      lines: { entry: 'GIÀ LO SAI.', crit: 'Daje Roma daje!', win: 'GIÀ LO SAI. Daje Roma daje!', ko: 'Mi appello al popolo…', fissa: 'GIÀ LO SAI!', persona: 'Adesso parlo da statista.' }
    },
    andrea: {
      id: 'andrea', name: 'Andrea', full: 'Andrea Albino Vento', nick: 'Volpino Alato', type: 'Cervello', tagline: 'Furbo, scaltro, calcolatore',
      stats: { hp: 100, atk: 98, def: 85, spe: 100 },
      passive: { name: 'Calcolatore', text: 'Registra ogni colpo: la seconda volta che subisce la stessa mossa, prende il 30% di danno in meno.' },
      weakness: { name: 'Senza sentimenti', text: 'Macchina razionale: non ha mosse per curarsi, e i colpi critici lo colpiscono dove fa male: fanno il doppio invece del 50% in più.' },
      moves: [
        { id: 'analisi', name: 'Analisi Statistica', kind: 'atk', power: 45, crit: 0.25, text: 'Colpo calcolato: non sbaglia mai e fa critico il 25% delle volte.' },
        { id: 'volpino', name: 'Volpino Alato', kind: 'atk', power: 58, priority: 1, text: 'Spicca il volo e colpisce dall\'alto: danno alto, e attacca sempre per primo.' },
        { id: 'palestra', name: 'Palestra e Padel', kind: 'buff', text: 'Allenamento doppio: l\'Attacco sale del 30% per 3 turni.' },
        { id: 'cucinato', name: 'Sono Cucinato', kind: 'atk', text: 'Più è cotto, più picchia: la potenza sale man mano che perde PS.' }
      ],
      lines: { entry: 'Ho calcolato tutto.', crit: 'Statisticamente inevitabile.', win: 'Come previsto. Al 94%.', ko: 'Sono cucinato.', cucinato: 'Sono cucinato… ma tu di più.', calc: 'Dati già raccolti.' }
    },
    valentin: {
      id: 'valentin', name: 'Valentin', full: 'Valentin', nick: 'L\'Animale Anomalo', type: 'Caos', tagline: 'L\'anima della festa',
      stats: { hp: 104, atk: 95, def: 80, spe: 105 },
      passive: { name: 'Anima della festa', text: 'La festa non finisce mai: recupera 5 PS alla fine di ogni turno.' },
      weakness: { name: 'Animale anomalo', text: 'Imprevedibile: nel 15% dei casi cambia idea e usa un\'altra mossa a caso.' },
      moves: [
        { id: 'weee', name: 'Weee!', kind: 'atk', power: 55, text: 'Trascina tutti nella festa: danno medio e 20% di confondere l\'avversario.' },
        { id: 'manipolazione', name: 'Manipolazione a Fin di Bene', kind: 'status', uses: 3, text: 'Lo convince che è per il suo bene: per 2 turni l\'avversario deve ripetere la sua ultima mossa. Valentin recupera 10 PS.' },
        { id: 'copenhagen', name: 'Volo per Copenhagen', kind: 'atk', power: 84, twoTurn: true, text: 'Vola da Christiana a Copenhagen: per il resto del turno è irraggiungibile, al turno dopo torna e colpisce fortissimo.' },
        { id: 'king', name: 'Il King del Verde', kind: 'buff', uses: 3, text: 'Inforca gli occhiali verdi, relax totale: per 3 turni subisce il 30% di danno in meno e recupera 10 PS.' }
      ],
      lines: { entry: 'Weee!', crit: 'WEEEEE!', win: 'Weee! Si fa festa da me.', ko: 'Weee… ok, mi siedo un attimo.', anomalo: 'Cambio di programma!', back: 'Saluti da Copenhagen!' }
    },
    forchetta: {
      id: 'forchetta', name: 'Forchetta', full: 'Antonio Forcina', nick: 'Forchetta', type: 'Calma', tagline: 'Il più formiano di tutti',
      stats: { hp: 108, atk: 96, def: 92, spe: 75 },
      passive: { name: 'Poteva andare peggio', text: 'La prima volta che un colpo lo manderebbe KO, resta in piedi con 1 PS.' },
      weakness: { name: 'Criptico', text: 'Risponde quando vuole lui: agisce sempre per ultimo, anche se è più veloce.' },
      moves: [
        { id: 'servizio', name: 'Servizio Vincente', kind: 'atk', power: 55, crit: 0.25, text: 'Ace al primo servizio: danno medio e 25% di colpo critico.' },
        { id: 'pitstop', name: 'Pit Stop', kind: 'heal', uses: 3, text: 'Cambio gomme in due secondi: recupera 20 PS e la Difesa sale del 25% per 3 turni.' },
        { id: 'criptico', name: 'Messaggio Criptico', kind: 'status', text: 'Manda un messaggio che nessuno capisce: l\'avversario resta confuso per 2 turni.' },
        { id: 'formia', name: 'Forza Formia', kind: 'atk', power: 55, drain: 0.4, text: 'Il più formiano di tutti: danno medio e recupera il 40% del danno inflitto.' }
      ],
      lines: { entry: 'Poteva andare peggio.', crit: 'Ace.', win: 'Poteva andare peggio. Per te.', ko: 'Poteva andare peggio… forse no.', sturdy: 'Poteva andare peggio.' }
    },
    zendavid: {
      id: 'zendavid', name: 'Zendavid', full: 'Davide Borrelli', nick: 'Zendavid', type: 'Cuore', tagline: 'Cuffie grosse, sempre',
      stats: { hp: 108, atk: 100, def: 86, spe: 90 },
      passive: { name: 'Creativo', text: 'Non gli piace ripetersi: la prima volta che usa ogni mossa, fa il 25% in più.' },
      weakness: { name: 'Ansia', text: 'Ogni colpo subito gli mette ansia: ogni livello (massimo 3) abbassa il suo Attacco del 6%. La Modalità Zen la azzera.' },
      moves: [
        { id: 'abbaia', name: 'Abbaia', kind: 'atk', power: 30, text: 'Bau! L\'avversario si spaventa: danno basso e il suo Attacco cala del 25% per 3 turni.' },
        { id: 'battuta', name: 'Battuta', kind: 'atk', power: 120, chance: 0.45, text: 'Più della metà delle volte non fa ridere nessuno. Nel 45% dei casi fa crollare tutti: danno enorme.' },
        { id: 'zen', name: 'Modalità Zen', kind: 'buff', uses: 3, text: 'Mette le cuffie: per 3 turni non sente niente (niente turni persi né manipolazioni), recupera 20 PS e azzera l\'ansia.' },
        { id: 'stronger', name: 'Stronger', kind: 'atk', power: 70, text: 'Kanye a tutto volume: danno alto, +20% se ha le cuffie in testa.' }
      ],
      lines: { entry: 'Bau.', crit: 'BAU!', win: 'Bau bau. Questa era bella, ammettilo.', ko: 'Ansia… metto le cuffie.', zen: 'Ok. Respira.', jokeFail: '…nessuno ride.', jokeWin: 'Stavolta ridono tutti!' }
    },
    esame: {
      id: 'esame', name: 'Esame di Controlli', full: 'Esame di Controlli', nick: 'Il boss', type: 'Cervello', tagline: 'Appello · 2 ore', boss: true,
      stats: { hp: 180, atk: 92, def: 85, spe: 70 },
      passive: { name: 'Tempo limite', text: 'L\'esame dura 2 ore e ogni turno passano 10 minuti. Allo scadere il compito viene ritirato, e conta come bocciatura.' },
      weakness: null,
      moves: [
        { id: 'bode', name: 'Diagramma di Bode', kind: 'atk', power: 40, acc: 0.95, text: 'Danno medio.' },
        { id: 'trabocchetto', name: 'Domanda a Trabocchetto', kind: 'atk', power: 35, acc: 0.9, text: 'Danno medio-basso, a volte sbaglia.' },
        { id: 'radici', name: 'Luogo delle Radici', kind: 'atk', power: 25, text: 'Danno basso, abbassa l\'Attacco per 2 turni.' },
        { id: 'bocciatura', name: 'Bocciatura', kind: 'atk', power: 75, acc: 0.7, text: 'Danno enorme, ma va a segno solo 7 volte su 10.' },
        { id: 'orale', name: 'Orale Integrativo', kind: 'heal', uses: 1, text: 'Recupera 30 PS, una sola volta.' }
      ],
      lines: { entry: 'Avete due ore. Niente appunti.', win: 'Ci vediamo al prossimo appello.', ko: 'Accetta il voto?', time: 'Consegnate.' }
    }
  };
  var ROSTER = ['antonio', 'costanzo', 'andrea', 'valentin', 'forchetta', 'zendavid'];
  var PAIRS = {
    'andrea|antonio': { antonio: 'Dopo questa, padel?', andrea: 'Ho già calcolato il risultato. Anche quello del padel.' },
    'antonio|forchetta': { antonio: 'Chi perde paga la prossima partita alla Play.', forchetta: 'Poteva andare peggio. Per te.' }
  };

  function ch(side) { return CHARS[side.id]; }
  function move(c, id) { for (var i = 0; i < c.moves.length; i++) if (c.moves[i].id === id) return c.moves[i]; return null; }
  function mv(side, id) { return move(ch(side), id); }

  /* mulberry32 on a state field, so a battle can be saved and resumed */
  function rand(s) {
    s.rng = (s.rng + 0x6D2B79F5) >>> 0;
    var t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function pick(s, arr) { return arr[Math.floor(rand(s) * arr.length) % arr.length]; }

  function newSide(id, human) {
    var c = CHARS[id];
    return {
      id: id, human: !!human, hp: c.stats.hp, max: c.stats.hp,
      skip: null, conf: 0, mods: [], encore: null, lastMove: null, revealed: false,
      boost: false, tee: 0, lv: 0, lock: null, saidAi: false, seenAmerica: false,
      lastAtk: null, atkStreak: 0, persona: 0,
      seen: {}, away: false, charge: null, saidRegen: false,
      sturdy: false, anx: 0, zen: 0, used: {}, uses: {},
      st: { dmg: 0, crits: 0, lost: 0, fails: 0, heals: 0 }
    };
  }

  function newBattle(o) {
    var a = o.a, b = o.b, mode = o.mode || 'cpu';
    if (b === 'esame') mode = 'cpu';
    var s = {
      v: 2, rng: (o.seed >>> 0) || 1, turn: 1, mode: mode, boss: b === 'esame', K: b === 'esame' ? 0.42 : TUNE.K,
      maxTurns: b === 'esame' ? 12 : 30,
      sides: [newSide(a, true), newSide(b, mode === 'pvp')],
      phase: 'intro', plan: [null, null], forced: [null, null], forecast: [false, false], forecastNext: [false, false],
      result: null, winner: null, grade: null, recorded: false,
      /* moves whose object the player's Antonio can't lose (story mode: the things already found around town) */
      safe: (o.safe || []).slice()
    };
    if (mode === 'pvp') { s.sides[0].revealed = true; s.sides[1].revealed = true; }
    return s;
  }

  /* ---------- events ---------- */
  function say(t) { return { k: 'say', text: t }; }
  function line(w, t) { return { k: 'line', who: w, text: t }; }
  function expr(w, v) { return { k: 'expr', who: w, v: v }; }
  function anim(w, a, extra) { var o = { k: 'anim', who: w, a: a }; if (extra) for (var x in extra) o[x] = extra[x]; return o; }

  /* ---------- modifiers ---------- */
  function addMod(side, stat, mult, until, tag) {
    side.mods = side.mods.filter(function (m) { return m.tag !== tag; });
    side.mods.push({ stat: stat, mult: mult, until: until, tag: tag });
  }
  function modMult(s, side, stat) {
    var m = 1;
    side.mods.forEach(function (x) { if (x.stat === stat && x.until >= s.turn) m *= x.mult; });
    return m;
  }
  function hasMod(s, side, tag) { return side.mods.some(function (x) { return x.tag === tag && x.until >= s.turn; }); }
  function zenOn(s, side) { return side.id === 'zendavid' && side.zen >= s.turn; }
  function personaOn(s, side) { return side.id === 'costanzo' && side.persona >= s.turn; }

  /* ---------- what a side may choose ---------- */
  function available(s, i) {
    var side = s.sides[i], c = ch(side);
    var all = c.moves.map(function (m) { return m.id; }).filter(function (id) {
      if (side.lock && side.lock.move === id) return false;
      var mm = move(c, id);
      if (mm.uses && (side.uses[id] || 0) >= mm.uses) return false;
      return true;
    });
    if (side.encore && side.encore.until >= s.turn && all.indexOf(side.encore.move) >= 0) return [side.encore.move];
    return all;
  }

  /* ---------- damage ---------- */
  function movePower(side, m) {
    if (m.id === 'america') return m.powers[side.lv];
    if (m.id === 'cucinato') return Math.round(20 + 100 * (1 - side.hp / side.max));
    return m.power;
  }
  /* matchups depend on the characters' types; Costanzo's Personaggismo swaps his */
  function sideType(s, side, foe) {
    if (personaOn(s, side)) return beaterOf(ch(foe).type) || ch(side).type;
    return ch(side).type;
  }
  function parts(s, i, id) {
    var me = s.sides[i], foe = s.sides[1 - i], m = mv(me, id), cm = ch(me), cf = ch(foe);
    var type = sideType(s, me, foe), e = eff(type, sideType(s, foe, me));
    var atk = cm.stats.atk * modMult(s, me, 'atk') * (me.id === 'zendavid' ? 1 - 0.06 * me.anx : 1);
    var def = cf.stats.def * modMult(s, foe, 'def');
    var mult = 1, critChance = m.crit || CRIT, forceCrit = false, notes = [];
    if (me.boost) mult *= 1.5;
    if (me.id === 'costanzo') {
      if (me.lastAtk && me.lastAtk !== id) { mult *= 0.8; notes.push('filo'); }
      else if (me.lastAtk === id && (me.atkStreak + 1) % 3 === 0) forceCrit = true;
    }
    if (me.id === 'zendavid') {
      if (!me.used[id]) mult *= 1.25;
      if (id === 'stronger' && zenOn(s, me)) mult *= TUNE.zenBoost;
    }
    if (foe.id === 'andrea' && foe.seen[id]) { mult *= TUNE.calc; notes.push('calc'); }
    mult *= modMult(s, foe, 'guard');
    var base = movePower(me, m) * atk / def * (s.K || K) * e * mult;
    return { base: base, eff: e, type: type, critChance: forceCrit ? 1 : critChance, forceCrit: forceCrit, acc: foe.away ? 0 : (m.acc || 1), notes: notes };
  }
  function expected(s, i, id) {
    var m = mv(s.sides[i], id);
    if (m.kind !== 'atk') return 0;
    var p = parts(s, i, id), v = p.base * 0.94 * (1 + p.critChance * 0.5) * p.acc;
    if (m.risk) v *= 1 - m.risk;
    if (m.chance) v *= m.chance;
    if (m.twoTurn) v *= 0.55;
    return v;
  }

  function applyHit(s, i, id, ev, opt) {
    opt = opt || {};
    var me = s.sides[i], foe = s.sides[1 - i], j = 1 - i, cm = ch(me);
    var p = parts(s, i, id);
    if (rand(s) > p.acc) {
      ev.push(anim(i, 'lunge'));
      if (foe.away) ev.push(say(ch(foe).name + ' è a Copenhagen: il colpo va a vuoto.'));
      else { ev.push(anim(j, 'dodge')); ev.push(say('Ma ' + ch(foe).name + ' la scampa!')); }
      return 0;
    }
    var crit = p.forceCrit || rand(s) < p.critChance;
    var roll = 0.88 + rand(s) * 0.12;
    var dmg = Math.max(1, Math.round(p.base * roll * (crit ? (foe.id === 'andrea' ? TUNE.critAndrea : 1.5) : 1) * (opt.mult || 1)));
    var sturdy = false;
    if (foe.id === 'forchetta' && !foe.sturdy && dmg >= foe.hp && foe.hp > 1) { dmg = foe.hp - 1; foe.sturdy = true; sturdy = true; }
    foe.hp = Math.max(0, foe.hp - dmg);
    me.st.dmg += dmg; if (crit) me.st.crits++;
    if (!opt.noLunge) ev.push(anim(i, 'lunge'));
    ev.push({ k: 'hp', who: j, hp: foe.hp, dmg: dmg, crit: crit, eff: p.eff });
    ev.push(expr(j, foe.hp > 0 ? 'pout' : 'sleepy'));
    if (crit) ev.push(say(p.forceCrit ? 'La fissa di Costanzo: colpo critico sicuro!' : 'Colpo critico!'));
    if (p.eff > 1) ev.push(say('È superefficace!'));
    else if (p.eff < 1) ev.push(say('Non è molto efficace…'));
    if (p.notes.indexOf('filo') >= 0 && !opt.quiet) ev.push(say('Costanzo cambia argomento e perde il filo: −20%.'));
    if (p.notes.indexOf('calc') >= 0) { ev.push(say('Andrea ha già i dati su questa mossa: −' + Math.round(100 - TUNE.calc * 100) + '%.')); }
    if (sturdy) { ev.push(say('Forchetta resta in piedi con 1 PS!')); ev.push(line(j, CHARS.forchetta.lines.sturdy)); }
    if (foe.id === 'andrea' && foe.hp > 0) foe.seen[id] = (foe.seen[id] || 0) + 1;
    if (foe.id === 'zendavid' && foe.hp > 0 && !zenOn(s, foe) && foe.anx < 3) {
      foe.anx++;
      ev.push(say('L\'ansia di Zendavid sale (' + foe.anx + '/3).'));
    }
    if (crit && foe.hp > 0 && cm.lines.crit) { ev.push(expr(i, 'grin')); ev.push(line(i, cm.lines.crit)); }
    if (me.id === 'costanzo' && foe.hp > 0 && rand(s) < TUNE.talk) {
      if (zenOn(s, foe)) ev.push(say('Costanzo prova a non farlo parlare, ma Zendavid ha le cuffie: non sente niente.'));
      else { foe.skip = { why: 'talk' }; ev.push(say('Costanzo non lo fa parlare: ' + ch(foe).name + ' perde il turno!')); }
    }
    return dmg;
  }
  function heal(s, i, amt, ev, msg) {
    var me = s.sides[i], real = Math.min(Math.round(amt), me.max - me.hp);
    if (real <= 0) { ev.push(say(ch(me).name + ' ha già tutti i PS.')); return 0; }
    me.hp += real; me.st.heals++;
    ev.push(anim(i, 'heal'));
    ev.push({ k: 'hp', who: i, hp: me.hp, heal: real });
    ev.push(say(msg || ch(me).name + ' recupera ' + real + ' PS.'));
    return real;
  }
  function confuse(s, j, turns, ev) {
    var foe = s.sides[j];
    foe.conf = Math.max(foe.conf, turns);
    ev.push(anim(j, 'confused'));
    ev.push(say(ch(foe).name + ' è confuso!'));
    return true;
  }

  function snap(s) {
    return { k: 'sync', turn: s.turn, maxTurns: s.maxTurns, boss: s.boss, chips: [chips(s, 0), chips(s, 1)], revealed: [s.sides[0].revealed, s.sides[1].revealed], ph: [zenOn(s, s.sides[0]), zenOn(s, s.sides[1])] };
  }
  function chips(s, i) {
    var x = s.sides[i], out = [];
    function add(c, ic, t, d) { out.push({ c: c, i: ic, t: t, d: d || t }); }
    if (x.lock) { var it = ITEMS[x.lock.move], left = x.lock.until - s.turn + 1; add('bad', it.icon, left <= 1 ? '1 turno' : left + ' turni', it.short); }
    if (x.boost) add('info', 'spark', 'IA +50%');
    if (x.id === 'antonio') { if (x.tee) add('white', 'cert', x.tee + '/3', 'Certificati bianchi'); add('stage', 'plane', ['Formia', 'Torino', 'AMERICA'][x.lv], 'Tappa del viaggio'); }
    if (x.skip) add('bad', x.skip.why === 'robot' ? 'robot' : 'mute', x.skip.why === 'robot' ? 'Robot a terra' : 'Perde il turno');
    if (x.conf > 0) add('bad', 'swirl', 'Confuso');
    if (x.encore && x.encore.until >= s.turn) add('bad', 'loop', 'Manipolato', 'Deve ripetere ' + mv(x, x.encore.move).name);
    if (hasMod(s, x, 'atkUp')) add('up', 'up', 'Attacco +30%');
    if (hasMod(s, x, 'atkDown')) add('down', 'down', 'Attacco −25%');
    if (hasMod(s, x, 'defUp')) add('up', 'shield', 'Difesa +25%');
    if (hasMod(s, x, 'defDown')) add('down', 'down', 'Difesa −20%');
    if (hasMod(s, x, 'guard')) add('up', 'shield', 'Danni −30%');
    if (x.away) add('info', 'plane', 'A Copenhagen');
    if (x.charge) add('info', 'plane', 'Di ritorno');
    if (personaOn(s, x)) add('info', 'mic', 'Nel personaggio');
    if (x.id === 'costanzo' && x.lastAtk && x.atkStreak > 0) add('white', 'mic', 'Fissa ' + ((x.atkStreak - 1) % 3 + 1) + '/3', 'Fissa su ' + mv(x, x.lastAtk).name);
    if (x.id === 'forchetta' && !x.sturdy) add('white', 'shield', 'Resiste 1 volta');
    if (x.id === 'zendavid') { if (x.anx) add('down', 'pulse', 'Ansia ' + x.anx + '/3'); if (zenOn(s, x)) add('up', 'music', 'Cuffie'); }
    if (x.id === 'valentin') add('white', 'heart', '+' + TUNE.regen + ' PS a turno');
    return out;
  }

  /* ---------- intro ---------- */
  function intro(s) {
    var ev = [], A = s.sides[0], B = s.sides[1], ca = ch(A), cb = ch(B);
    var key = [A.id, B.id].sort().join('|'), pair = PAIRS[key];
    ev.push(say(s.boss ? 'L\'Esame di Controlli sfida ' + ca.name + '!' : cb.name + ' sfida ' + ca.name + '!'));
    ev.push(expr(1, s.boss ? 'angry' : 'grin'));
    ev.push(line(1, pair && A.id !== B.id ? pair[B.id] : cb.lines.entry));
    ev.push(expr(1, s.boss ? 'idle' : 'smirk'));
    ev.push(anim(0, 'enter'));
    ev.push(line(0, pair && A.id !== B.id ? pair[A.id] : ca.lines.entry));
    s.phase = 'begin';
    return ev;
  }

  /* ---------- start of turn ---------- */
  function beginTurn(s) {
    var ev = [];
    for (var i = 0; i < 2; i++) {
      var x = s.sides[i];
      if (x.id === 'antonio') {
        if (x.lock && s.turn > x.lock.until) {
          var it = ITEMS[x.lock.move];
          ev.push(anim(i, 'found', { item: it.icon }));
          ev.push(expr(i, 'grin'));
          ev.push(say('Antonio ritrova ' + it.name + ': era ' + pick(s, FOUND) + '.'));
          x.lock = null;
          ev.push(snap(s));
        }
        var losable = ['diagnosi', 'certificati', 'simtoreal', 'america'].filter(function (m) { return i !== 0 || !s.safe || s.safe.indexOf(m) < 0; });
        if (!x.lock && !x.charge && losable.length && rand(s) < 0.15) {
          var id = pick(s, losable), item = ITEMS[id];
          x.lock = { move: id, until: s.turn + 1 };
          x.st.lost++;
          ev.push(expr(i, 'worried'));
          ev.push(anim(i, 'lost', { item: item.icon }));
          ev.push(say('Antonio ha perso ' + item.name + '!'));
          ev.push(line(i, CHARS.antonio.lines.lost));
          ev.push(snap(s));
          ev.push(say(CHARS.antonio.moves.filter(function (m) { return m.id === id; })[0].name + ' è bloccata per 2 turni.'));
        }
        if (!x.boost && rand(s) < 0.25) {
          x.boost = true;
          ev.push(anim(i, 'ai'));
          ev.push(expr(i, 'grin'));
          ev.push(say('L\'IA suggerisce un\'idea ad Antonio: la sua prossima mossa farà il 50% in più.'));
          if (!x.saidAi) { x.saidAi = true; ev.push(line(i, CHARS.antonio.lines.ai)); }
          ev.push(snap(s));
        }
      }
      if (x.encore && x.encore.until < s.turn) x.encore = null;
    }
    for (var k = 0; k < 2; k++) {
      var y = s.sides[k];
      ev.push(expr(k, y.id === 'esame' ? 'idle' : 'smirk'));
      s.forced[k] = y.charge ? { move: y.charge } : y.skip ? { skip: true } : null;
      s.plan[k] = (!y.human && !s.forced[k]) ? ai(s, k) : null;
    }
    s.phase = 'select';
    ev.push(snap(s));
    return ev;
  }
  /* sides whose player must choose a move this turn */
  function needs(s) {
    var out = [];
    for (var i = 0; i < 2; i++) if (s.sides[i].human && !s.forced[i]) out.push(i);
    return out;
  }

  /* ---------- moves ---------- */
  function useMove(s, i, id, ev, forced) {
    var me = s.sides[i], foe = s.sides[1 - i], j = 1 - i, cm = ch(me), m = mv(me, id), nm = cm.name;
    var attacked = false, dmg;
    if (id !== 'copenhagenRet') ev.push(say(nm + ' usa ' + m.name + '!'));
    switch (id) {
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
        if (rand(s) < m.risk) {
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
      case 'america':
        var lv = me.lv;
        ev.push(expr(i, 'grin'));
        ev.push(say(['Antonio parte da Formia!', 'Antonio arriva a Torino!', 'Antonio vola in AMERICA!'][lv]));
        if (lv === 2) ev.push(anim(i, 'banner', { text: 'AMERICA!', style: 'usa' }));
        applyHit(s, i, id, ev); attacked = true; me.boost = false;
        if (lv === 2 && !me.seenAmerica && foe.hp > 0) { me.seenAmerica = true; ev.push(expr(i, 'cool')); ev.push(line(i, cm.lines.america)); }
        if (lv < 2) { me.lv++; if (foe.hp > 0) ev.push(say(lv === 0 ? 'Prossima tappa: Torino.' : 'Prossima tappa: AMERICA.')); }
        break;
      /* --- Costanzo --- */
      case 'comizio':
        ev.push(expr(i, 'smirk'));
        ev.push(anim(i, 'speech'));
        applyHit(s, i, id, ev); attacked = true;
        break;
      case 'personaggismo':
        var bt = beaterOf(ch(foe).type);
        me.persona = s.turn + 3;
        ev.push(expr(i, 'cool'));
        ev.push(anim(i, 'glint'));
        ev.push(line(i, cm.lines.persona));
        ev.push(say('Costanzo entra nel personaggio: per 3 turni è di tipo ' + bt + '.'));
        break;
      case 'bidet':
        ev.push(expr(i, 'grin'));
        var cleaned = me.mods.some(function (x) { return x.mult < 1 && x.until >= s.turn; }) || me.conf > 0 || !!me.encore || !!me.skip;
        me.mods = me.mods.filter(function (x) { return x.mult >= 1; }); me.conf = 0; me.encore = null; me.skip = null;
        heal(s, i, 25, ev);
        if (cleaned) ev.push(say('Il bidet lava via tutti gli effetti negativi.'));
        break;
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
          ev.push(say(ch(foe).name + ' si convince: per 2 turni userà solo ' + mv(foe, foe.lastMove).name + '.'));
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
        if (dmg > 0 && me.hp > 0) heal(s, i, dmg * m.drain, ev, 'Forchetta si ricarica con l\'aria di Formia.');
        break;
      /* --- Zendavid --- */
      case 'abbaia':
        ev.push(expr(i, 'grin'));
        ev.push(anim(i, 'bark'));
        applyHit(s, i, id, ev, { noLunge: true }); attacked = true;
        if (foe.hp > 0) { addMod(foe, 'atk', 0.75, s.turn + 3, 'atkDown'); ev.push(say(ch(foe).name + ' si spaventa: il suo Attacco cala per 3 turni.')); }
        break;
      case 'battuta':
        var joke = pick(s, JOKES);
        ev.push(expr(i, 'grin'));
        ev.push(line(i, joke));
        if (rand(s) < m.chance) {
          ev.push(say(cm.lines.jokeWin));
          ev.push(anim(j, 'laugh'));
          applyHit(s, i, id, ev, { noLunge: true }); attacked = true;
        } else {
          ev.push(expr(i, 'worried'));
          ev.push(anim(j, 'cricket'));
          ev.push(say(cm.lines.jokeFail));
          attacked = true;
        }
        break;
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
    }
    var used = id === 'copenhagenRet' ? 'copenhagen' : id;
    if (me.id === 'zendavid') me.used[used] = true;
    if (me.id === 'costanzo' && m.kind === 'atk') { me.atkStreak = me.lastAtk === id ? me.atkStreak + 1 : 1; me.lastAtk = id; }
    if (id !== 'copenhagenRet') me.lastMove = id;
    if (m && m.uses) me.uses[id] = (me.uses[id] || 0) + 1;
    return attacked;
  }

  function act(s, i, choice, ev) {
    var me = s.sides[i], cm = ch(me);
    if (me.skip) {
      var why = me.skip.why; me.skip = null;
      if (why === 'robot') { ev.push(expr(i, 'worried')); ev.push(anim(i, 'robotFix')); ev.push(say('Antonio sta rimettendo in piedi il robot…')); }
      else { ev.push(expr(i, 'worried')); ev.push(say(cm.name + ' non riesce a dire una parola.')); }
      return false;
    }
    var id = choice;
    if (me.conf > 0 && id !== 'copenhagenRet') {
      me.conf--;
      ev.push(anim(i, 'confused'));
      ev.push(say(cm.name + ' è confuso…'));
      if (rand(s) < 0.33) {
        var self = Math.max(1, Math.round(30 * cm.stats.atk / cm.stats.def * (s.K || K) * (0.88 + rand(s) * 0.12)));
        if (me.id === 'forchetta' && !me.sturdy && self >= me.hp && me.hp > 1) { self = me.hp - 1; me.sturdy = true; }
        me.hp = Math.max(0, me.hp - self);
        ev.push({ k: 'hp', who: i, hp: me.hp, dmg: self });
        ev.push(expr(i, me.hp > 0 ? 'pout' : 'sleepy'));
        ev.push(say('Non capisce più niente e si fa male da solo!'));
        return false;
      }
      if (me.conf === 0) ev.push(say(cm.name + ' torna lucido.'));
    }
    if (me.id === 'valentin' && id !== 'copenhagenRet' && rand(s) < 0.15) {
      var others = available(s, i).filter(function (x) { return x !== id; });
      if (others.length) {
        id = pick(s, others);
        ev.push(expr(i, 'grin'));
        ev.push(line(i, cm.lines.anomalo));
        ev.push(say('Animale anomalo: Valentin cambia idea.'));
      }
    }
    return useMove(s, i, id, ev);
  }

  /* ---------- the computer's choice ---------- */
  function ai(s, i) {
    var me = s.sides[i], foe = s.sides[1 - i], opts = available(s, i);
    if (!opts.length) return ch(me).moves[0].id;
    if (me.id === 'esame') return planEsame(s, i, opts);
    var best = null, bestSc = -1e9, hpF = me.hp / me.max, foeHp = foe.hp;
    opts.forEach(function (id) {
      var m = mv(me, id), sc = 0;
      if (m.kind === 'atk') {
        sc = expected(s, i, id);
        if (expected(s, i, id) * (m.twoTurn ? 1.8 : 1) >= foeHp * 0.95 && !m.twoTurn) sc += 30;
        if (m.risk) sc -= 6;
        if (id === 'america' && me.lv < 2) sc += 6;
        if (id === 'diagnosi' && !hasMod(s, foe, 'defDown')) sc += 5;
        if (id === 'abbaia' && !hasMod(s, foe, 'atkDown')) sc += 8;
        if (id === 'weee') sc += foe.conf ? 0 : 2;
      } else {
        var missing = me.max - me.hp;
        if (id === 'certificati') sc = Math.min(TUNE.healBase + TUNE.healPer * me.tee, missing) * (hpF < 0.45 ? 1.25 : 0.35) + (me.tee >= 2 && hpF < 0.6 ? 6 : 0);
        else if (id === 'bidet') sc = Math.min(25, missing) * (hpF < 0.45 ? 1.2 : 0.35) + ((me.conf || me.encore || me.mods.some(function (x) { return x.mult < 1 && x.until >= s.turn; })) ? 12 : 0);
        else if (id === 'pitstop') sc = Math.min(20, missing) * (hpF < 0.5 ? 1.2 : 0.35) + (hasMod(s, me, 'defUp') ? 0 : 6);
        else if (id === 'zen') sc = Math.min(20, missing) * (hpF < 0.5 ? 1 : 0.3) + me.anx * 6 + (zenOn(s, me) ? -20 : 4);
        else if (id === 'personaggismo') sc = personaOn(s, me) ? -10 : (eff(ch(me).type, ch(foe).type) < 1 ? 24 : eff(ch(me).type, ch(foe).type) > 1 ? 2 : 12) * (foeHp > 40 ? 1 : 0.3);
        else if (id === 'palestra') sc = hasMod(s, me, 'atkUp') ? -10 : (foeHp > 45 && hpF > 0.4 ? 20 : 4);
        else if (id === 'king') sc = hasMod(s, me, 'guard') ? -10 : (hpF < 0.7 ? 16 : 9);
        else if (id === 'criptico') sc = foe.conf ? -10 : (foeHp > 35 ? 18 : 6);
        else if (id === 'manipolazione') {
          var lm = foe.lastMove, lmMove = lm ? mv(foe, lm) : null;
          sc = (!lm || zenOn(s, foe) || foe.encore) ? 2 : (lmMove.kind !== 'atk' ? 22 : 10);
          sc += Math.min(10, missing) * 0.4;
        } else if (id === 'orale') sc = hpF < 0.45 ? 30 : 0;
      }
      sc *= 0.85 + rand(s) * 0.3;
      if (sc > bestSc) { bestSc = sc; best = id; }
    });
    return best;
  }
  function planEsame(s, i, opts) {
    var e = s.sides[i], p = s.sides[1 - i];
    function ok(id) { return opts.indexOf(id) >= 0; }
    if (e.hp < e.max * 0.45 && ok('orale') && rand(s) < 0.75) return 'orale';
    var r = rand(s);
    if (p.hp <= 40) return r < 0.45 ? 'bocciatura' : r < 0.8 ? 'trabocchetto' : 'bode';
    var list = hasMod(s, p, 'atkDown') ? [['bode', 40], ['trabocchetto', 40], ['bocciatura', 20]] : [['bode', 35], ['trabocchetto', 30], ['radici', 25], ['bocciatura', 10]];
    list = list.filter(function (x) { return ok(x[0]); });
    if (!list.length) return opts[0];
    var tot = 0, k; for (k = 0; k < list.length; k++) tot += list[k][1];
    var xx = r * tot;
    for (k = 0; k < list.length; k++) { xx -= list[k][1]; if (xx < 0) return list[k][0]; }
    return list[0][0];
  }

  /* ---------- resolution ---------- */
  function orderOf(s, choice) {
    var keys = [0, 1].map(function (i) {
      var side = s.sides[i], c = ch(side), id = choice[i], m = id && id !== 'skip' ? (mv(side, id === 'copenhagenRet' ? 'copenhagen' : id)) : null;
      var pr = m && m.priority ? m.priority : 0;
      if (side.id === 'forchetta') pr = -5;
      return { i: i, pr: pr, spe: c.stats.spe, tie: rand(s) };
    });
    keys.sort(function (a, b) { return b.pr - a.pr || b.spe - a.spe || a.tie - b.tie; });
    return keys.map(function (k) { return k.i; });
  }

  function grade(s) {
    var p = s.sides[0], hpFrac = p.hp / p.max, timeFrac = (s.maxTurns - s.turn) / (s.maxTurns - 1);
    var score = Math.min(1, (0.6 * hpFrac + 0.4 * timeFrac) / 0.8);
    var g = Math.max(18, Math.min(30, 18 + Math.round(12 * score)));
    return { g: g, lode: g === 30 && hpFrac >= 0.6 };
  }
  function finish(s, result, winner, ev) {
    s.phase = 'over'; s.result = result; s.winner = winner;
    if (result === 'win') {
      var w = s.sides[winner], l = s.sides[1 - winner];
      if (s.boss && winner === 0) s.grade = grade(s);
      ev.push(expr(1 - winner, l.id === 'esame' ? 'ko' : 'sleepy'));
      ev.push(anim(1 - winner, 'faint'));
      ev.push(say(ch(l).name + ' è KO!'));
      ev.push(line(1 - winner, ch(l).lines.ko));
      ev.push(expr(winner, w.id === 'esame' ? 'angry' : 'cool'));
      ev.push(line(winner, ch(w).lines.win));
    } else if (result === 'time') {
      ev.push(say('Tempo scaduto! Il compito viene ritirato.'));
      ev.push(expr(1, 'angry'));
      ev.push(line(1, CHARS.esame.lines.time));
      ev.push(expr(0, 'worried'));
      if (ch(s.sides[0]).lines.time) ev.push(line(0, ch(s.sides[0]).lines.time));
    } else {
      ev.push(say('Turno ' + s.maxTurns + ': nessuno cede. Pareggio!'));
      ev.push(expr(0, 'worried')); ev.push(expr(1, 'worried'));
    }
    ev.push({ k: 'end', result: result, winner: winner, grade: s.grade });
  }

  function playTurn(s, choices) {
    choices = choices || {};
    var ev = [], choice = [null, null], attacked = [false, false];
    for (var i = 0; i < 2; i++) {
      var f = s.forced[i], side = s.sides[i];
      if (f && f.skip) choice[i] = 'skip';
      else if (f && f.move) choice[i] = f.move;
      else if (!side.human) choice[i] = s.plan[i] || ai(s, i);
      else {
        var av = available(s, i);
        choice[i] = av.indexOf(choices[i]) >= 0 ? choices[i] : av[0];
      }
    }
    s.phase = 'busy';
    var order = orderOf(s, choice);
    for (var n = 0; n < 2; n++) {
      var k = order[n];
      if (s.sides[k].hp <= 0) continue;
      attacked[k] = act(s, k, choice[k] === 'skip' ? null : choice[k], ev);
      ev.push(snap(s));
      var dead = s.sides[0].hp <= 0 ? 0 : s.sides[1].hp <= 0 ? 1 : -1;
      if (dead >= 0) { finish(s, 'win', 1 - dead, ev); return ev; }
    }
    /* end of turn */
    for (var e = 0; e < 2; e++) {
      var x = s.sides[e];
      x.away = false;
      if (x.id === 'valentin' && x.hp > 0 && x.hp < x.max) {
        var amt = Math.min(TUNE.regen, x.max - x.hp);
        x.hp += amt;
        ev.push({ k: 'hp', who: e, hp: x.hp, heal: amt, quiet: true });
        if (!x.saidRegen) { x.saidRegen = true; ev.push(say('La festa continua: Valentin recupera ' + TUNE.regen + ' PS a ogni turno.')); }
      }
      if (x.id === 'antonio' && !attacked[e] && x.tee < 3 && choice[e] !== 'certificati') {
        x.tee++;
        ev.push(say('Antonio mette da parte un certificato bianco (' + x.tee + '/3).'));
      }
      if (x.id === 'zendavid' && x.zen && x.zen === s.turn) { ev.push(anim(e, 'phOff')); ev.push(say('Zendavid si toglie le cuffie.')); }
    }
    s.turn++;
    if (s.turn > s.maxTurns) { s.turn = s.maxTurns; finish(s, s.boss ? 'time' : 'draw', s.boss ? 1 : null, ev); return ev; }
    if (s.boss) {
      var left = s.maxTurns - s.turn + 1;
      if (left === 3) ev.push(say('Mancano 30 minuti alla consegna.'));
      if (left === 1) ev.push(say('Ultimi 10 minuti!'));
    }
    s.forecast = s.forecastNext.slice(); s.forecastNext = [false, false];
    s.phase = 'begin';
    ev.push(snap(s));
    return ev;
  }

  /* ---------- labels for the move buttons ---------- */
  function moveLabel(s, i, id) {
    var me = s.sides[i], m = mv(me, id), lock = me.lock && me.lock.move === id;
    var av = available(s, i), out = { id: id, name: m.name, kind: m.kind, locked: av.indexOf(id) < 0, sub: '', icon: null, dots: null };
    if (lock) { var it = ITEMS[id], left = me.lock.until - s.turn + 1; out.icon = it.icon; out.sub = it.short + ' · ' + (left <= 1 ? '1 turno' : left + ' turni'); return out; }
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
      case 'battuta': out.icon = 'mic'; out.sub = '40% di far ridere'; break;
      case 'zen': out.icon = 'music'; out.sub = zenOn(s, me) ? 'Cuffie già in testa' : 'Cuffie, cura 20'; break;
      case 'stronger': out.icon = 'music'; out.sub = zenOn(s, me) ? 'Forte · +20% cuffie' : 'Danno alto'; break;
    }
    if (m.uses) out.left = m.uses - (me.uses[id] || 0);
    return out;
  }

  var API = {
    TYPES: TYPES, TYPE_ORDER: TYPE_ORDER, eff: eff, beaterOf: beaterOf, ITEMS: ITEMS, CHARS: CHARS, ROSTER: ROSTER, TUNE: TUNE,
    move: move, newBattle: newBattle, intro: intro, beginTurn: beginTurn, needs: needs, playTurn: playTurn,
    available: available, moveLabel: moveLabel, snap: snap, ai: ai, expected: expected,
    ANTONIO: CHARS.antonio, ESAME: CHARS.esame,
    clock: function (s) { var m = (s.maxTurns - s.turn + 1) * 10; return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); },
    planName: function (s, i) { var p = s.plan[i]; return p ? mv(s.sides[i], p).name : null; },
    sideType: function (s, i) { return sideType(s, s.sides[i], s.sides[1 - i]); }
  };
  G.ENGINE = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);


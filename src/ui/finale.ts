import { music, sfx } from '../audio';
import { CHARS, ROSTER, type FriendId } from '../data/characters';
import { FORMIA_AT, FORMIA_SPOT } from '../data/maps/formia-ground';
import { MAPS } from '../data/maps';
import { COVI } from '../data/covi';
import { COVO_PLACES } from '../data/covo-places';
import { st, save } from '../save/story-progress';
import { settle as settlePeople, M } from '../story/maps';
import { dismount, lock, travel } from '../story/movement';
import { firstHuman, formNow, hearts, leadCreature, monsOf, nameOf, earn } from '../story/growth';
import { flag, STONES } from '../story/plot';
import { rivalFriend } from '../story/rival-who';
import { PARTNER } from '../data/rival-lines';
import type { SpeciesId } from '../data/creatures';
import { tullioMood } from '../story/choices';
import { ABDUCTION, ARRIVAL, REVEAL, REUNION, MAMURRA_BEATEN, allFriendsFreed, friendFreed, readyForVilla, creaturesMissing, newFinale, finalePrompt, finaleTurn, COMMANDS, type Command } from '../story/finale';
import { mamurra } from '../render/svg/cicero';
import { creature } from '../render/svg/creatures';
import { PEOPLE, PEOPLE_FORMS, posed } from '../render/canvas/walkers';
import { sceneInfo } from '../render/scenes';
import lamoArt from '../assets/scenes/lamo.webp';
import { townMap } from '../render/world-view';
import { esc, reduced } from './dom';
import { playScene, type Beat, type Tile } from './story-cutscene';
import { recordChat } from './chat';
import { finaleRide } from './nicola';
import { askChoice, stoneSVG } from './plot';
import { say, sheet, closeSheet, renderHud, refreshMusic } from './story-screen';
import { shout } from './shout';
import { SPR } from '../render/svg';

const STRUCK = 'finale-colpo';
const FAREWELL = 'finale-saluti';
const lamoShot = `<img class="film-lamo" src="${lamoArt}" alt="">`;
const hero = () => firstHuman() as FriendId;
const group = () => ROSTER.filter(id => id !== hero());
const here = (): Tile => [st.x, st.y];
function other(preferred: FriendId): FriendId { return hero() === preferred ? (rivalFriend() || group()[0]) : preferred; }

export function covoScene(id: string, then: () => void) {
  const all = !st.seen['scena-caminetto-riunito'] && allFriendsFreed(hero());
  const first = !st.seen['scena-prima-spilla'] && st.badges.length === 1;
  if (first) st.seen['scena-prima-spilla'] = true;
  if (all) st.seen['scena-caminetto-riunito'] = true;
  const at = here();
  const beats: Beat[] = [];
  if (first) beats.push({ ms: 4600, line: 'Il custode allenta la presa sulla spilla. Le luci del covo si spengono e l’eco lo lascia libero.', motif: 'echo', sound: 'magic', color: COVO_PLACES[id].aura });
  const inside = M.id === COVO_PLACES[id].map;
  if (inside && id === 'circolo') beats.push({ ms: 5200, motif: 'fragment', who: 'forchetta', sound: 'pickup',
    image: '<div class="film-fragment"><i></i><i></i><i></i></div>',
    line: 'Guarda qui. Quando ci batte la luce di lato, si vedono tutte e tre le tacche. Qualcuno le ha incise apposta.' });
  if (inside && id === 'eclipse') beats.push(
    { ms: 3600, motif: 'fog', actors: ['valentin'], who: 'valentin', sound: 'step', line: 'Dietro quella candela vedo la danzatrice. Credo che non trovi più l’uscita.' },
    { ms: 4200, motif: 'lantern', actors: ['valentin'], who: 'valentin', line: 'Tieni la fiamma dritta. Ecco, ti vedo. Facciamo gli ultimi passi insieme.' }
  );
  if (all) beats.push(
    { ms: 3600, line: 'L’ultimo covo si spegne. Gli amici raggiungono {hero}, uno dopo l’altro.', motif: 'group', actors: group() },
    { ms: 6600, who: rivalFriend() || other('andrea'), line: STONES.every(stone => flag(stone.id))
      ? 'Siamo tutti fuori e abbiamo le tre Pietre. Mamurra ci aspetta tra le rovine della villa. Stavolta ci andiamo insieme.'
      : 'Sappiamo cosa cerca Mamurra. Quando avremo tutte e tre le Pietre, andiamo alla sua villa. Stavolta ci andiamo insieme.', actors: group() }
  );
  if (!beats.length) { then(); return; }
  save();
  const scene = all ? 'caminetto-riunito' : first ? 'prima-spilla' : id === 'circolo' ? 'frammento-forchetta' : 'ritorno-nella-nebbia';
  playScene(scene, at, beats, then);
}

export function cisternScene(at: Tile, enter: () => void) {
  if (st.seen['scena-cisternone']) { enter(); return; }
  const withClaudia = hero() === 'claudia' || st.beaten.morgana;
  playScene('cisternone', here(), [{ ms: 4300, to: at, motif: 'lantern', sound: 'step',
    line: withClaudia ? 'La lanterna di Claudia svela i graffi lasciati dagli uomini di Mamurra sulla soglia.' : 'Sulla soglia compaiono i graffi lasciati dagli uomini di Mamurra.',
    actors: withClaudia && hero() !== 'claudia' ? ['claudia'] : [] }], () => {
    st.seen['scena-cisternone'] = true; save(); enter();
  });
}

export function archiveScene(who: string, then: () => void) {
  const image = `<div class="film-manuscript"><img class="film-ink" src="${lamoArt}" alt="">${sealLights()}</div>`;
  playScene('disegno-sigillo', here(), [
    { ms: 5800, motif: 'archive', who, image, sound: 'page', line: 'Sei luci dentro il sigillo e una fuori. La mano è disegnata sul bordo della Porta. Da qui non capisco in che direzione spinga.' }
  ], then);
}

export function seaStoneScene(then: () => void) {
  const beats: Beat[] = [{ ms: 4400, art: 'caposele', motif: 'stone', sound: 'splash',
    line: 'La Pietra del Mare risale tra le peschiere. Il telefono registra un suono regolare, proprio sotto il rumore dell’acqua.', image: '<i class="film-stone"></i>' }];
  if (flag('pietra-mura')) beats.push({ ms: 4300, art: 'caposele', motif: 'signal', sound: 'finaleEcho', line: 'Avvicini le due Pietre. Il suono cambia: tra un impulso e l’altro, qualcuno sta parlando.' });
  playScene('pietra-mare', here(), beats, then);
}

export function voiceStoneScene(then: () => void) {
  playScene('pietra-voce', here(), [{ ms: 5500, motif: 'attunement', sound: 'finaleEcho', image: carriedStones(),
    line: 'Cicerone posa la Pietra della Voce accanto alle altre due. Le tre luci si accendono insieme. In lontananza, da Gianola, risponde un lampo dorato.' }], then);
}

export function stonesReturnedScene(then: () => void) {
  const image = '<div class="film-niches">' + STONES.map(stone => `<i style="--stone:${stone.color}">${stoneSVG(stone, 80)}</i>`).join('') + '</div>';
  playScene('pietre-al-sigillo', here(), [
    { ms: 4200, motif: 'niches', sound: 'magic', image, line: 'Prima le Mura, poi il Mare, infine la Voce. Appena l’ultima Pietra trova posto, il ponte smette di tremare.' },
    { ms: 4100, art: 'telepilo', motif: 'reveal', who: 'Lamo', image: lamoShot, line: 'ADESSO POSSO LEVARE LA MANO. SE VUOI SCENDERE A TROVARMI, LA VIA È LIBERA.' }
  ], then);
}

function creatureAtSide() {
  const id = hero(), owned = monsOf(id);
  const uid = leadCreature() || (id === 'antonio' ? st.lead : st.leads?.[id]);
  return owned.find(m => m.uid === uid) || owned.find(m => !m.home) || owned[0];
}

function homeCut(): string {
  const guests = (st.mons || []).filter(m => m.home).slice(0, 2);
  return guests.length ? '<div class="film-home">' + guests.map(m => creature(m.sp, 'idle', 'film-creature', undefined, undefined, m.gold)).join('') + '</div>' : '';
}

function carriedStones(): string {
  return '<div class="film-carried-stones">' + STONES.map(stone => stoneSVG(stone, 75)).join('') + '</div>';
}

function sealLights(): string {
  const points = Object.values(COVO_PLACES).filter(place => place.leader !== hero());
  return '<div class="film-seals"><div class="film-seal-inside">' + points.map(place => '<i style="--seal:' + place.aura + '"></i>').join('') + '</div><i class="film-seal-outside"></i></div>';
}

function visorShot(shot: HTMLElement) {
  const panel = document.createElement('div');
  panel.className = 'film-visor'; shot.append(panel); townMap(panel);
  const map = MAPS.formia;
  const trail: { at: Tile; color: string }[] = [{ at: FORMIA_SPOT.mamurra, color: '#ffd98a' }];
  for (const badge of st.badges.slice().reverse()) {
    const id = Object.keys(COVO_PLACES).find(key => COVI[key].badge.id === badge);
    const place = id && FORMIA_AT[COVO_PLACES[id].building];
    if (id && place) trail.push({ at: [place.x + place.w / 2, place.y + place.h / 2], color: COVO_PLACES[id].aura });
  }
  trail.push({ at: FORMIA_SPOT['selv-lamo'], color: '#ffd98a' });
  const width = map.rows[0].length, height = map.rows.length;
  const position = ([x, y]: Tile) => `left:${(x + 0.5) / width * 100}%;top:${(y + 0.5) / height * 100}%;`;
  trail.forEach(({ at: [x, y], color }, index) => {
    const previous = trail[index - 1];
    if (previous) {
      const dx = x - previous.at[0], dy = y - previous.at[1];
      const segment = document.createElement('span');
      segment.style.cssText = position(previous.at) + `width:${Math.hypot(dx, dy) / width * 100}%;--angle:${Math.atan2(dy, dx)}rad;--delay:${(index - 1) * 390}ms`;
      panel.append(segment);
    }
    const pin = document.createElement('i');
    pin.style.cssText = position([x, y]) + `--pin:${color};--delay:${index * 390}ms`;
    panel.append(pin);
  });
}

export function mamurraTalk() {
  if (!readyForVilla(hero())) {
    say(['Sulle pietre delle rovine corre una luce dorata. Ti servono tutti gli amici e le tre Pietre di Telepilo.']);
    return;
  }
  say(['La luce alle rovine ha cominciato a pulsare quando le Pietre si sono avvicinate. Quando le allontaniamo, si spegne.',
    'Se le vuole tutte, le tenga d’occhio da qui. Noi ci fermiamo alle colonne. Se qualcuno vede una moneta, lo dice a tutti e ci ritiriamo.'], rivalFriend() || other('andrea'),
    [{ label: 'Entra nella villa con gli amici', fn: abduction }, { label: 'Più tardi', fn: null }]);
}

function abduction() {
  dismount();
  const at = FORMIA_SPOT.mamurra;
  const lead = creatureAtSide();
  const captured = lead ? creature(lead.sp, 'idle', 'film-creature', undefined, undefined, lead.gold) : '';
  playScene('mamurra-gianola', here(), [
    { ms: 3500, to: at, motif: 'coins', actors: group(), sound: 'finaleCoin', image: '<i class="film-coin"></i>', line: 'La risacca tace. Una moneta gira sulla pietra, tra le colonne.' },
    { ms: 6600, art: 'gianola', motif: 'entrance', image: mamurra('film-mamurra'), who: 'Mamurra', line: 'Alle mie monete servivano le tre Pietre insieme. Tu le hai radunate tutte qui per salvare i tuoi amici. Grazie, {hero}.' },
    { ms: 7000, art: 'gianola', motif: 'abduction', sound: 'finaleEcho', image: captured + carriedStones(), who: 'Mamurra', line: 'Da secoli il mio nome è scritto su una rovina. Lamo mi darà una città intera. Gli basterà sentire un verso da quelle gabbie.' },
    { ms: 4200, motif: 'abduction', actors: group(), image: homeCut(), who: other('claudia'), line: 'Ho chiamato casa. Ha preso anche quelle che aspettavano lì. Le Pietre sono sparite con lui.' },
    { ms: 4300, motif: 'signal', draw: visorShot, who: other('andrea'), line: 'Sul Visore l’onda torna indietro lungo i covi. Si ferma sotto le mura di Castellone.' }
  ], () => {
    st.seen[ABDUCTION] = true;
    recordChat('rapimento'); save(); settlePeople(M); renderHud();
    const resolve = tullioMood() === 'bitter' ? 'Il Visore ha trovato l’eco sotto Castellone. Per stavolta ci fidiamo l’uno dell’altro. Andiamo.' : 'Il Visore ha trovato l’eco sotto Castellone. Contaci come al parco. Andiamo a riprenderle.';
    say(['L’idea di portare qui le Pietre è stata mia. E Mamurra ha preso le nostre creature.', resolve], rivalFriend() || other('andrea'), null, offerFinaleRide);
  }, 'mistero');
}

export function offerFinaleRide() {
  say(['Salite, tutti e sette. Vi porto verso Castellone.'], 'Nicola Spadea', [
    { label: 'Sali sul furgone', fn: () => finaleRide(FORMIA_SPOT['selv-lamo'], () => { st.seen[ARRIVAL] = true; save(); renderHud(); }) },
    { label: 'Andiamo a piedi', fn: () => { st.seen[ARRIVAL] = true; save(); renderHud(); } }
  ]);
}

export function finaleThreshold() {
  if (M.id === 'formia') {
    const [x, y, dir] = MAPS.telepilo.start;
    const marks = hero() !== 'forchetta' && friendFreed('forchetta') ? 'Sono uguali a quelle del frammento trovato da Forchetta.'
      : flag('trama-archivio') ? 'Sono le stesse del disegno della Torre di Mola.' : 'Sono incise sul bordo delle tre nicchie.';
    say(['La lanterna scopre tre tacche. ' + marks,
      'Sotto le mura si è aperta una scala. Dal fondo arriva lo stesso suono registrato a Caposele.'], hero() === 'claudia' ? null : 'claudia', [
      { label: 'Scendi a Telepilo', fn: () => { st.seen[ARRIVAL] = true; travel('telepilo', x, y, dir); } },
      { label: 'Aspetta', fn: null }
    ]);
    return;
  }
  if (st.seen[STRUCK]) { victoryScene(); return; }
  if (st.seen[REVEAL]) { startFinaleBattle(); return; }
  playScene('porta-telepilo', here(), [
    { ms: 3900, to: MAPS.telepilo.place!.goal, motif: 'lantern', actors: group(), sound: 'step', line: 'I sette avanzano lungo il ponte. Sotto le pietre corre il mare.' },
    { ms: 4000, art: 'telepilo', motif: 'lamo-shadow', sound: 'finaleEcho', image: lamoShot, line: 'Una mano enorme esce da dietro la Porta. Sembra che voglia sfondarla.' },
    { ms: 6500, art: 'telepilo', motif: 'reveal', image: lamoShot, who: 'Lamo', line: 'Fui io a chiudere la Porta. Le creature venivano qui a nascondersi. Le tenevo al sicuro. Ora reggo la pietra per loro.' },
    { ms: 6700, art: 'telepilo', motif: 'signs', image: lamoShot + sealLights(), who: 'Lamo', line: 'Quando la Porta si incrina, chiama sei custodi e lascia qualcuno fuori per andare a riprenderli. Quella persona eri tu, {hero}.' },
    { ms: 6100, art: 'telepilo', motif: 'signs', image: '<i class="film-coin"></i>' + sealLights(), who: 'Lamo', line: 'Le luci correvano da un covo all’altro per tenere il sigillo. Con la sua moneta, Mamurra ha bloccato i custodi dentro e ha fatto ripetere il richiamo.' },
    { ms: 5700, art: 'telepilo', motif: 'entrance', image: mamurra('film-mamurra', 'battle'), who: 'Mamurra', line: 'Le senti, Lamo? Tre gabbie, proprio sotto la lastra. Prima sollevi quella pietra per me. Poi ti lascio liberarle.' },
    { ms: 2600, motif: 'group', actors: group(), who: other('costanzo'), line: 'Ci siamo tutti. Apriamo quelle gabbie.' }
  ], () => { st.seen[REVEAL] = true; save(); startFinaleBattle(); }, 'boss');
}

function victoryScene() {
  const at = here(), lead = creatureAtSide();
  const sp = lead ? creature(lead.sp, 'idle', 'film-creature', undefined, undefined, lead.gold) : '';
  const name = lead && nameOf(lead.uid);
  const reunion = lead ? hearts(lead.uid) >= 3 ? name + ' sente la tua voce e ti raggiunge prima ancora che tu finisca di chiamare.'
    : name + ' esita sulla soglia della gabbia. Tendi la mano e aspetti. Dopo un momento ti viene incontro.'
    : 'Gli amici contano le creature una a una. Quando arriva anche l’ultima, Forchetta fa segno che ci siamo tutti.';
  playScene('vittoria-telepilo', at, [
    { ms: 4900, art: 'telepilo', motif: 'coin-fall', sound: 'finaleCoin', image: '<i class="film-coin"></i>', line: 'Mamurra stringe la moneta e chiama ancora. Il metallo batte sul ponte. Stavolta nessuna creatura si volta.' },
    { ms: 5400, art: 'telepilo', motif: 'reunion', sound: 'splash', image: lamoShot + sp, line: 'La moneta cade in acqua. Lamo stende il braccio fra i due lati del ponte e le creature lo attraversano.' },
    { ms: 5100, motif: 'group', actors: group(), creatureCall: lead, image: sp, line: reunion },
    { ms: 5200, art: 'telepilo', motif: 'closing', sound: 'door', image: carriedStones(), line: 'Le Pietre tornano nelle tue mani. Lamo riprende la lastra sulle spalle e la accompagna finché la Porta si chiude.' },
    { ms: 3200, motif: 'dawn', sound: 'horn', line: 'Da sopra le mura arriva un fischio. Il primo treno è rientrato in stazione.' }
  ], () => {
    st.beaten[MAMURRA_BEATEN] = true;
    st.seen[REUNION] = true;
    st.seen['cic-lamo'] = true;
    earn(200); recordChat('mamurra'); save(); renderHud();
    const exit = MAPS.telepilo.warps![1];
    travel(exit.to, exit.tx, exit.ty, exit.tdir);
    askChoice('pietre');
  }, 'nicola');
}

export function resumeFinale() {
  if (!creaturesMissing()) return false;
  recordChat('rapimento');
  if (st.seen[STRUCK]) { victoryScene(); return true; }
  if (st.map === 'formia' && !st.seen[ARRIVAL]) { offerFinaleRide(); return true; }
  return false;
}

export function farewellScene(station: string, depart: () => void) {
  if (!flag(REUNION) || flag(FAREWELL)) { depart(); return; }
  const at = here(), rival = rivalFriend(), mood = tullioMood();
  const goodbye = mood === 'ally' ? 'A Gianola volevo batterti a tutti i costi. Adesso mi va solo di sapere quando torni.'
    : mood === 'bitter' ? 'Alla prossima ci sfidiamo ancora. Però quando arrivi, scrivi. Così lo sappiamo.'
      : 'La prossima sfida la facciamo qui. Intanto manda un messaggio quando arrivi.';
  playScene('saluti-stazione', at, [
    { ms: 3500, motif: 'group', actors: group(), sound: 'horn', line: 'Il capotreno fischia. Gli amici arrivano sul marciapiede, uno dopo l’altro.' },
    { ms: 5500, motif: 'group', actors: group(), who: rival || other('claudia'), line: rival ? goodbye : 'Hai il biglietto, hai la tua creatura. Adesso vai. Noi siamo qui.' },
    { ms: 3300, motif: 'dawn', actors: group(), sound: 'buzz', line: 'Sul tabellone compare ' + station + '. Il telefono vibra un’ultima volta. Sul caminetto c’è scritto «Buon viaggio, {hero}».' }
  ], () => { st.seen[FAREWELL] = true; recordChat('saluti'); save(); depart(); }, 'nicola');
}

let cancelBattle: (() => void) | null = null;
export function cancelFinaleBattle() { cancelBattle?.(); }
function startFinaleBattle() {
  const friends = group(), order = [...friends.slice(0, 3), hero(), ...friends.slice(3)];
  const hostages = (st.mons || []).map(mon => mon.sp).concat(friends.map(id => PARTNER[id] as SpeciesId)).slice(0, 3);
  const overlay = sheet(`<section class="finale-fight" role="dialog" aria-modal="true" aria-labelledby="finale-title">
    <div class="finale-arena" aria-label="Il ponte sospeso alla Porta di Telepilo" role="group">
      <div class="finale-enemy" aria-hidden="true">${mamurra(undefined, 'battle')}<div class="finale-rings"><i></i><i></i><i></i></div></div>
      <div class="finale-cages" aria-hidden="true">${hostages.map(sp => `<i>${creature(sp)}</i>`).join('')}</div><i class="finale-wave" aria-hidden="true"></i>
      <ol class="finale-lineup" aria-label="Il caminetto in campo">${order.map((id, i) => `<li data-friend="${id}"${id === hero() ? ' data-protagonist' : ''} style="--order:${i};--friend:var(--t-${CHARS[id].type.toLowerCase()})"><span>${esc(CHARS[id].name)}</span></li>`).join('')}</ol>
    </div><div class="finale-panel"><h2 id="finale-title">Mamurra alla Porta di Telepilo</h2><div class="finale-hud"></div></div></section>`, 'finale-overlay');
  const arena = overlay.querySelector<HTMLElement>('.finale-arena')!;
  const hud = overlay.querySelector<HTMLElement>('.finale-hud')!;
  const actors = Array.from(arena.querySelectorAll<HTMLElement>('[data-friend]')).map(element => {
    const id = element.dataset.friend as FriendId, form = formNow(id);
    const look = { ...PEOPLE[id], ...(form ? PEOPLE_FORMS[id][form - 1] : {}) };
    const idle = posed(look, 3, 'up', 'stand');
    const acting = posed(look, 3, 'up', 'throw', 1);
    idle.setAttribute('aria-hidden', 'true');
    acting.setAttribute('aria-hidden', 'true');
    element.prepend(idle);
    return { id, element, idle, acting };
  });
  arena.style.backgroundImage = `url("${sceneInfo('telepilo').art}")`;
  const rival = rivalFriend(), name = rival && CHARS[rival].name, mood = tullioMood();
  let battle = newFinale(), timer: ReturnType<typeof setTimeout>, resolving = false, last = 'Lamo regge la Porta. Ogni gabbia alimenta una delle difese di Mamurra.';
  function close() { clearTimeout(timer); cancelBattle = null; lock(false); closeSheet(); refreshMusic(); }
  function render() {
    arena.dataset.freed = String(battle.freed);
    arena.dataset.phase = battle.phase;
    arena.dataset.action = '';
    for (const actor of actors) actor.acting.replaceWith(actor.idle);
    if (battle.phase === 'lost') {
      hud.innerHTML = '<p role="status">I sette si ritirano al riparo. Le creature vi aspettano ancora.</p><button type="button" class="btn primary">Torna all’ingresso</button>';
      const button = hud.querySelector('button')!;
      button.addEventListener('click', () => { close(); travel('telepilo', ...MAPS.telepilo.start); });
      button.focus();
      return;
    }
    const prompt = finalePrompt(battle);
    arena.dataset.threat = prompt.threat;
    hud.innerHTML = `<div class="finale-status"><label>Tenuta del gruppo <meter min="0" max="100" value="${battle.resolve}">${battle.resolve}%</meter></label><span>Gabbie aperte ${battle.freed}/3</span></div>
      <p class="finale-tell" aria-live="polite">${esc(prompt.tell)}</p><div class="finale-actions">${prompt.commands.map(command => `<button type="button" class="btn" data-command="${command}">${COMMANDS[command]}</button>`).join('')}</div>
      <p class="finale-last" aria-live="polite">${esc(last)}</p>`;
    hud.querySelectorAll<HTMLButtonElement>('[data-command]').forEach(button => button.addEventListener('click', () => act(button.dataset.command as Command)));
    hud.querySelector('button')?.focus({ preventScroll: true });
  }
  function act(command: Command) {
    const result = resolving ? null : finaleTurn(battle, command);
    if (!result) return;
    resolving = true;
    const moment = command === 'center' && result.success && name && mood;
    const line = moment === 'bitter' ? `${name} ti porge la mano mentre il ponte cede. Vi tirate al riparo e lo scudo di Mamurra si spezza.`
      : moment === 'ally' ? `Incroci lo sguardo di ${name}. Vi staccate dalla ringhiera nello stesso istante. L’onda passa e lo scudo cede.`
        : result.line;
    const buttons = hud.querySelectorAll<HTMLButtonElement>('button');
    buttons.forEach(button => { button.disabled = true; });
    hud.querySelector('.finale-last')!.textContent = line;
    arena.dataset.action = result.success ? command : 'hit';
    arena.dataset.freed = String(result.next.freed);
    for (const actor of actors) {
      const involved = command === 'strike' || result.actors.includes(actor.id) || !!moment && actor.id === rival;
      actor.element.dataset.acting = String(involved);
      if (involved) actor.idle.replaceWith(actor.acting);
    }
    sfx(command === 'strike' ? 'finaleEcho' : result.success ? command === 'open' ? 'magic' : 'weak' : 'hit');
    const on = () => {
      timer = setTimeout(() => {
        resolving = false; battle = result.next; last = line;
        if (battle.phase === 'won') {
          st.seen[STRUCK] = true; save(); close(); victoryScene(); return;
        }
        render();
      }, reduced ? 90 : command === 'strike' ? 1500 : 720);
    };
    /* Valentin's diversion works, and the last blow lands: «Stai inguaiatoooo!» to Mamurra (27 November 2026) */
    if (result.success && (command === 'distract' || command === 'strike')) {
      st.seen['inguaiato-1'] = true; save();
      setTimeout(() => shout(SPR.personIn('valentin', formNow('valentin'), 'grin', '', SPR.thumb('valentin')), on), reduced ? 0 : 450);
    } else on();
  }
  cancelBattle = close;
  lock(true); music('boss', { fade: 0.6 });
  render();
}

export function recordedVoice(): { line: string; speaker: string | null } {
  if (hero() === 'zendavid') return { line: 'Metti le cuffie e abbassi le frequenze che coprono la voce. Tra due impulsi, qualcuno parla latino.', speaker: null };
  if (st.beaten.pineta) return { line: 'È la voce che ho registrato in pineta. Questa volta è più vicina. Aspetta che tolgo il basso. Ecco, parla latino.', speaker: 'zendavid' };
  return { line: 'Le frequenze delle due Pietre si sovrappongono. In mezzo all’eco si sente una voce in latino.', speaker: null };
}

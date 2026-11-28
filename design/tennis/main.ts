import { drawReview, lineReview } from './line-review';
import { clayReady } from './clay';
import { createCourt, poseOf } from './court';
import { courtGestures, swipeRange, swipeVector } from './gesture';
import { awardPoint, newTieBreak, serviceTurn } from './match';
import { canHit, clearPreparation, contactGuide, contactPowerLimit, practiceTarget, createRally, createService, HALF_LENGTH, HALF_WIDTH, MAX_CHARGE, playerDestination, PRACTICE_SPEED, preparationPower, recoveryTicks, previewStroke, STEP, step } from './physics';
import { createReplayBuffer } from './replay';
import { isTennisCharacter, roster, tennisPortrait, trainingKits } from './roster';
import type { Side, TennisResult, TieBreak } from './match';
import type { Aim, Bounce, Command, Difficulty, Feed, Point, Rally, StrokeKind, Technique, TennisEvent } from './physics';
import type { TennisCharacter } from './roster';

function element<T extends HTMLElement = HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Elemento mancante: ${id}`);
  return node as T;
}

const court = element('court');
const renderer = createCourt(element<HTMLCanvasElement>('scene'));
const matchup = element('matchup');
const nearShowcase = element('near-showcase');
const farShowcase = element('far-showcase');
const nearPortrait = element<HTMLCanvasElement>('near-portrait');
const farPortrait = element<HTMLCanvasElement>('far-portrait');
const nearShowcaseName = element('near-showcase-name');
const farShowcaseName = element('far-showcase-name');
const feedButtons = ['center', 'backhand', 'wide', 'short', 'volley'].map((id) => element<HTMLButtonElement>(id));
const practiceButton = element<HTMLButtonElement>('practice-mode');
const matchButton = element<HTMLButtonElement>('match-mode');
const lineup = element('lineup');
const characterSelect = element<HTMLSelectElement>('character');
const rivalSelect = element<HTMLSelectElement>('rival');
const characterIcon = element<HTMLImageElement>('character-icon');
const rivalIcon = element<HTMLImageElement>('rival-icon');
const serviceDrillButton = element<HTMLButtonElement>('service-drill');
const drillTurn = element<HTMLSelectElement>('drill-turn');
let serviceDrill = false;
let targetsCompleted = 0;
const feedChoices = element('feed-choices');
const serveStrip = element('serve-strip');
const serveTitle = element('serve-title');
const serveDetail = element('serve-detail');
const courtMode = element('court-mode');
const difficultySelect = element<HTMLSelectElement>('difficulty');
const timingButton = element<HTMLButtonElement>('aim-timing');
const aimSlider = element<HTMLInputElement>('aim-slider');
const aimButtons = ['aim-cross', 'aim-center', 'aim-line'].map((id) => element<HTMLButtonElement>(id));
const aimReadout = element('aim-readout');
const aimSettings = element<HTMLDetailsElement>('aim-settings');
const launch = element<HTMLButtonElement>('launch');
const launchLabel = launch.querySelector('span')!;
const touchLaunch = element<HTMLButtonElement>('touch-launch');
const replayButton = element<HTMLButtonElement>('replay');
const replayCamera = element<HTMLSelectElement>('replay-camera');
const outCall = element('out-call');
const reviewCanvas = element<HTMLCanvasElement>('review-canvas');
const outDetail = element('out-detail');
const replayLabel = element('replay-label');
const feedback = element('feedback');
const title = element('status');
const detail = element('detail');
const announcement = element('announcement');
const charge = element('charge');
const powerLabel = element('power-label');
const chargeWarning = element('charge-warning');
const chargeState = element('charge-state');
const contact = element('contact');
const contactLabel = element('contact-label');
const contactHint = element('contact-hint');
const gestureCard = element('gesture-card');
const gestureMode = element('gesture-mode');
const gestureReadout = element('gesture-readout');
const shotSpeed = element('shot-speed');
const rallyCount = element('rally-count');
const rallyBest = element('rally-best');
const scoreBoard = element('score');
const playerScore = element('player-score');
const cpuScore = element('cpu-score');
const playerName = element('player-name');
const opponentName = element('opponent-name');
const slowButton = element<HTMLButtonElement>('slow');
const swipeSensitivity = element<HTMLSelectElement>('swipe-sensitivity');
const audioButton = element<HTMLButtonElement>('audio');
const pauseButton = element<HTMLButtonElement>('pause');
const stick = element('stick');
const thumb = element('thumb');
const strike = element<HTMLButtonElement>('strike');
const menu = element<HTMLDialogElement>('menu');
const specialShots = element('special-shots');
const returnButton = element<HTMLButtonElement>('return');
const exit = element<HTMLButtonElement>('exit');

const feedCopy = {
  center: { label: 'Palla centrale', hint: 'Inizia la carica sul segnale CARICA e rilascia su ORA.' },
  backhand: { label: 'Palla sul rovescio', hint: 'La palla arriva a sinistra. Puoi colpirla da fermo.' },
  wide: { label: 'Palla larga', hint: 'Spostati a destra verso il rimbalzo.' },
  volley: { label: 'Volée a rete', hint: 'Chiudi prima del rimbalzo. I lanci alternano dritto e rovescio.' },
  short: { label: 'Palla corta', hint: 'Entra in campo verso il rimbalzo.' },
} satisfies Record<Feed, { label: string; hint: string }>;
const score = { player: 0, opponent: 0 };
const highlights = createReplayBuffer();
const parameters = new URLSearchParams(location.search);
const requestedPlayer = parameters.get('giocatore') ?? '';
const requestedOpponent = parameters.get('avversario') ?? '';
let feed: Feed = 'center';
let volleySide: 1 | -1 = 1;
let difficulty: Difficulty = 'easy';
let match: TieBreak | null = parameters.get('modalita') === 'tie-break' ? newTieBreak() : null;
let playerCharacter: TennisCharacter = isTennisCharacter(requestedPlayer) ? requestedPlayer : 'claudia';
let opponentCharacter: TennisCharacter = isTennisCharacter(requestedOpponent) && requestedOpponent !== playerCharacter ? requestedOpponent
  : playerCharacter === 'forchetta' ? 'andrea' : 'forchetta';
characterSelect.value = playerCharacter;
rivalSelect.value = opponentCharacter;
let latestWinner: Side | null = null;
let outcomeAge = 1;
let renderedMatch = '';
let aim: Aim = 'timing';
let rally = createRally(feed);
let previous = poseOf(rally);
let mode: 'active' | 'paused' | 'closed' | 'replay' = 'active';
let session: AbortController | null = null;
let frame = 0;
let focusCheck = 0;
let lastTime = 0;
let accumulated = 0;
let lastCall = feedCopy.center.label;
const coarsePointer = matchMedia('(pointer: coarse)');
aimSettings.open = coarsePointer.matches;
coarsePointer.addEventListener('change', () => { aimSettings.open = coarsePointer.matches; });
const readyHint = coarsePointer.matches ? 'Tocca Lancia. Carica poco prima di ORA.' : 'Clicca sul campo per lanciare.';
let lastDetail = readyHint;
let tone = 'neutral';
let lastLanding = '';
let lastPlayerBounce: Bounce | null = null;
let lastStroke: Extract<TennisEvent, { type: 'hit'; hitter: 'player' }> | null = null;
let lastImpact = '';
let lastMiss: Extract<TennisEvent, { type: 'miss' }>['reason'] | null = null;
let windowSeen = false;
let bestRally = 0;
let slow = false;
let audio: AudioContext | null = null;
let impactNoise: AudioBuffer | null = null;
let muted = false;

const keys = new Set<string>();
const arrows = new Set(['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'KeyD', 'KeyA', 'KeyW', 'KeyS']);
const aimKeys: Record<string, Aim | undefined> = { KeyQ: -1, KeyX: 0, KeyE: 1, KeyT: 'timing' };
let stickPointer: number | null = null;
let strikePointer: number | null = null;
let touchSwipeOrigin: Point | null = null;
let gesture: { pointer: number; origin: Point; range: number } | null = null;
let swipe: Point | null = null;
let targetPosition: Point | null = null;
let releasedPosition: Point | null = null;
let releasedAim: Aim | null = null;
let joystick = { x: 0, y: 0 };
let pressed = false;
let released = false;

const isHeld = () => keys.has('Space') || strikePointer !== null || gesture !== null;
let resetFlick: (() => void) | undefined;
const selectedAim = () => swipe ? { swipe } : aim;
const direction = (first: string, second: string) => Number(keys.has(first) || keys.has(second));

function commandForStep(): Command {
  const x = direction('ArrowRight', 'KeyD') - direction('ArrowLeft', 'KeyA');
  const y = direction('ArrowUp', 'KeyW') - direction('ArrowDown', 'KeyS');
  const command: Command = { x: x || joystick.x, y: y || joystick.y, pressed, released, aim: releasedAim ?? selectedAim(), destination: targetPosition ?? undefined };
  pressed = false;
  released = false;
  releasedAim = null;
  return command;
}

function releaseStroke(): void {
  releasedAim = selectedAim();
  swipe = null;
  released = true;
}

function clearControls(): void {
  resetFlick?.();
  window.clearTimeout(focusCheck);
  keys.clear();
  pressed = false;
  released = false;
  releasedAim = null;
  targetPosition = null;
  releasedPosition = null;
  const left = stickPointer;
  const right = strikePointer;
  const pointer = gesture?.pointer;
  stickPointer = null;
  strikePointer = null;
  touchSwipeOrigin = null;
  gesture = null;
  swipe = null;
  if (left !== null && stick.hasPointerCapture(left)) stick.releasePointerCapture(left);
  if (right !== null && strike.hasPointerCapture(right)) strike.releasePointerCapture(right);
  if (pointer !== undefined && court.hasPointerCapture(pointer)) court.releasePointerCapture(pointer);
  joystick = { x: 0, y: 0 };
  thumb.style.transform = '';
  clearPreparation(rally);
}

function text(node: HTMLElement, value: string): void {
  if (node.textContent !== value) node.textContent = value;
}

function call(status: string, message: string, kind = 'neutral', speak = true): void {
  lastCall = status;
  lastDetail = message;
  tone = kind;
  if (speak) announcement.textContent = `${status}. ${message}`;
}

function aimText(angle: number): string {
  if (angle === 0) return 'Centro';
  const side = angle < 0 ? 'Incrociato' : 'Lungolinea';
  return Math.abs(angle) >= 1 ? side : `${side} ${Math.round(Math.abs(angle) * 100)}%`;
}

function chargePercent(value: number): string {
  return `${value > 1 ? Math.ceil(value * 100) : Math.round(value * 100)}%`;
}

const misses = {
  early: ['Troppo presto', 'Carica poco prima di ORA. Rilascia su ORA.'],
  late: ['Troppo tardi', 'Il passaggio è finito. Rilascia appena appare ORA.'],
  reach: ['Fuori portata', 'Indica il rombo col puntatore o corri con i comandi direzionali.'],
} as const;
const strokeNames: Record<StrokeKind, string> = { ground: '', serve: 'Servizio', volley: 'Volée', halfVolley: 'Demi-volée', lob: 'Pallonetto', drop: 'Smorzata', slice: 'Slice', reach: 'Recupero in allungo' };

function renderGesture(preview: ReturnType<typeof previewStroke>): void {
  const buffered = rally.pending?.aim;
  const vector = swipe ?? (typeof buffered === 'object' ? buffered.swipe : null);
  const review = !vector && !preview ? lastPlayerBounce : null;
  const flight = !vector && !preview && !review && rally.hitter === 'player' && rally.phase === 'rally' ? lastStroke : null;
  const state = preview ? preview.net ? 'over' : 'aim' : vector ? 'aim' : review ? 'review' : flight ? 'flight' : 'move';
  gestureCard.dataset.mode = state;
  gestureCard.dataset.kind = preview?.kind ?? flight?.kind ?? '';
  gestureCard.dataset.bounce = review && !review.inCourt ? 'out' : '';
  text(gestureMode, vector || preview ? 'Mira' : review ? 'Rimbalzo' : flight ? 'In volo' : 'Corsa');
  if (vector) {
    const lane = Math.abs(vector.x) < 0.14 ? 'Centro' : vector.x < 0 ? 'Sinistra' : 'Destra';
    const depth = vector.y > 0.24 ? ' · profondo' : vector.y < -0.24 ? ' · corto' : '';
    const gestureName = preview && strokeNames[preview.kind] || lane;
    text(gestureReadout, gestureName === 'Centro' && !depth ? 'Centro · ↑ lungo / ↓ corto' : `${gestureName}${depth}`);
  } else text(gestureReadout, preview ? strokeNames[preview.kind] || preview.shot
    : review ? 'Ultimo rimbalzo' : flight ? strokeNames[flight.kind] || flight.shot : 'Muovi il puntatore per correre');
  const target = preview?.target ?? review ?? flight?.target;
  gestureCard.dataset.target = String(!!target);
  const pace = preview?.speed ?? ((review || flight) ? lastStroke?.speed : undefined);
  shotSpeed.hidden = pace === undefined;
  if (pace !== undefined) text(shotSpeed, Math.round(pace) + ' km/h');
  if (target) {
    gestureCard.style.setProperty('--aim-x', `${Math.max(5, Math.min(95, 50 + target.x / HALF_WIDTH * 32))}%`);
    gestureCard.style.setProperty('--aim-y', `${Math.max(5, 87 - target.y / HALF_LENGTH * 73)}%`);
  }
}

function renderMatch(): void {
  const active = match !== null;
  const view = `${mode}/${rally.phase}/${!!rally.service}/${match?.score.player}:${match?.score.opponent}/${match?.attempt}/${match?.winner}/${playerCharacter}/${opponentCharacter}`;
  if (view === renderedMatch) return;
  renderedMatch = view;
  const locked = active && !match?.winner && rally.phase !== 'ready';
  practiceButton.setAttribute('aria-pressed', String(!active));
  matchButton.setAttribute('aria-pressed', String(active));
  lineup.hidden = !active;
  matchup.hidden = !active || rally.phase !== 'ready' || mode !== 'active';
  feedChoices.hidden = active;
  serveStrip.hidden = !active;
  characterSelect.disabled = rivalSelect.disabled = difficultySelect.disabled = locked;
  const playerKit = active ? roster[playerCharacter].kit : trainingKits.player;
  const rivalKit = active ? roster[opponentCharacter].kit : trainingKits.opponent;
  scoreBoard.style.setProperty('--near-kit', playerKit.shirt);
  scoreBoard.style.setProperty('--far-kit', rivalKit.shirt);
  characterIcon.hidden = rivalIcon.hidden = !active;
  if (active) {
    if (characterIcon.dataset.character !== playerCharacter) {
      characterIcon.dataset.character = playerCharacter;
      characterIcon.src = tennisPortrait(playerCharacter);
      renderer.portrait(nearPortrait, playerKit, -1);
      nearShowcase.style.setProperty('--kit-tone', playerKit.shirt);
      text(nearShowcaseName, roster[playerCharacter].name);
    }
    if (rivalIcon.dataset.character !== opponentCharacter) {
      rivalIcon.dataset.character = opponentCharacter;
      rivalIcon.src = tennisPortrait(opponentCharacter);
      renderer.portrait(farPortrait, rivalKit, 1);
      farShowcase.style.setProperty('--kit-tone', rivalKit.shirt);
      text(farShowcaseName, roster[opponentCharacter].name);
    }
  }
  const servingDrill = serviceDrill && !active;
  element('drill-options').hidden = !servingDrill;
  difficultySelect.parentElement!.hidden = servingDrill;
  serviceDrillButton.setAttribute('aria-pressed',String(servingDrill));
  for (const button of feedButtons) button.setAttribute('aria-pressed',String(!servingDrill && button.dataset.feed === feed));
  text(playerName, active ? roster[playerCharacter].name : servingDrill ? 'Valide' : 'Tu');
  text(opponentName, active ? roster[opponentCharacter].name : servingDrill ? 'Falli' : 'CPU');
  text(courtMode, active ? 'Tie-break' : 'Allenamento');
  launch.disabled = touchLaunch.disabled = mode === 'replay' || (active && rally.phase === 'rally');
  if (!match) {
    if (servingDrill) {
      const action = rally.phase === 'ready' ? 'Lancia per servire' : 'Batti di nuovo';
      text(launchLabel,action);
      text(touchLaunch,action);
      touchLaunch.setAttribute('aria-label',action);
    }
    delete scoreBoard.dataset.server;
    return;
  }
  const turn = serviceTurn(match);
  scoreBoard.dataset.server = match.winner || (rally.phase === 'rally' && !rally.service) ? '' : turn.server;
  const leading = Math.max(match.score.player, match.score.opponent);
  const trailing = Math.min(match.score.player, match.score.opponent);
  text(serveTitle, match.winner ? 'Fine tie-break' : leading >= 6 && leading > trailing ? 'Match point'
    : rally.phase === 'rally' && !rally.service ? 'Palla in gioco' : turn.attempt === 1 ? 'Prima di servizio' : 'Seconda di servizio');
  text(serveDetail, match.winner ? `${roster[match.winner === 'player' ? playerCharacter : opponentCharacter].name} vince`
    : turn.server === 'player' ? 'Tu al servizio' : `${roster[opponentCharacter].name} al servizio`);
  const action = match.winner ? 'Rivincita' : rally.phase === 'rally' ? 'In gioco' : rally.phase === 'ready' ? 'Inizia tie-break'
    : match.attempt === 2 ? 'Seconda palla' : 'Prossima palla';
  text(launchLabel, action);
  text(touchLaunch, action);
  touchLaunch.setAttribute('aria-label', action);
}

function kitsForCourt() {
  return match ? { player: roster[playerCharacter].kit, opponent: roster[opponentCharacter].kit } : trainingKits;
}

function render(mix = 1): void {
  const guide = mode === 'active' ? contactGuide(rally) : null;
  const ready = guide?.state === 'ready';
  const rest = rally.phase === 'rally' ? recoveryTicks(rally) : 0;
  const recovering = rest > 0 && !rally.pending;
  const preparing = !!rally.preparation && !recovering;
  const preview = mode === 'active' ? previewStroke(rally, selectedAim(), guide) : null;
  const toss = rally.service?.phase === 'toss';
  const timeToCharge = guide?.state === 'wait' && guide.seconds <= (toss ? .39 : .45) && !preparing && !rally.pending;
  const nextPower = preparationPower(rally);
  const limit = preview?.limit ?? contactPowerLimit(rally, guide);
  const overload = preview?.net ?? false;
  const value = preparing && !overload && previous.tick !== rally.tick ? previous.charge + (nextPower - previous.charge) * mix : nextPower;
  const strokeTitle = preview ? strokeNames[preview.kind] || `${preview.wing} · ${preview.shot}` : '';
  text(title, overload ? 'Troppa carica' : ready && strokeTitle ? strokeTitle : lastCall);
  text(detail, overload ? 'La traiettoria incontra la rete. Sul prossimo colpo rilascia prima.' : toss && ready ? (rally.ball.vz < -1.5 ? 'Lancio in discesa · dosa la spinta' : 'Colpisci in alto · scegli T o lato esterno') : ready && preparing ? 'Rilascia ora.' : lastDetail);
  feedback.dataset.tone = overload ? 'fault' : ready ? 'hit' : tone;
  charge.dataset.zone = overload ? 'over' : value >= 0.72 ? 'full' : preparing ? 'building' : 'ready';
  charge.style.setProperty('--gauge-position', `${value / MAX_CHARGE * 100}%`);
  charge.style.setProperty('--safe-limit', ((limit ?? 1) * 100) + '%');
  text(chargeWarning, limit !== null ? 'Limite ' + chargePercent(limit) : '');
  text(powerLabel, chargePercent(value));
  text(chargeState, recovering ? 'Riarmo' : overload ? 'Rischio rete' : preparing ? value < .25 ? 'Appoggio' : value < .60 ? 'Controllo' : value < .85 ? 'Spinta' : 'Piena spinta' : 'Pronta');
  text(contactLabel, recovering ? 'Riarmo' : ready ? (guide.stretched ? 'Recupera' : 'Ora') : guide?.state === 'late' ? 'Passata' : rally.pending ? 'In attesa'
    : guide?.state === 'away' ? 'Spostati' : timeToCharge ? 'Carica' : guide?.state === 'wait' ? 'Aspetta' : toss && rally.phase === 'rally' ? 'Risposta' : '—');
  text(contactHint, recovering ? (rally.queuedTap !== null ? 'Tocco in memoria' : rally.swing?.spot.kind === 'reach' ? 'Frena e copri la diagonale' : 'Ritorno in posizione') : ready ? (guide.stretched ? 'Ultimo allungo' : guide.volley ? 'Volée prima del rimbalzo' : preparing ? 'Rilascia' : 'Palla a portata') : guide?.state === 'late' ? 'Finestra chiusa'
    : rally.pending ? 'Rilascio registrato' : guide?.state === 'away' ? 'Verso il rombo'
    : guide?.state === 'wait' ? (preparing || timeToCharge ? 'Tieni premuto' : 'Palla in arrivo') : 'Finestra di tiro');
  contact.dataset.state = recovering ? 'recovery' : guide?.stretched ? 'stretch' : guide?.state ?? 'idle';
  const timeMeter = recovering && rally.swing ? 1 - rest / (rally.swing.readyAt - rally.swing.started) : guide?.state === 'wait' ? Math.max(0, 1 - guide.seconds / 0.85) : ready ? Math.min(1, guide.seconds / 0.32) : 0;
  contact.style.setProperty('--contact-meter', `${timeMeter * 100}%`);
  const angle = typeof aim === 'number' ? aim : swipe ? 0 : preview?.angle ?? 0;
  const sliderValue = String(Math.round(angle * 100));
  if (aimSlider.value !== sliderValue) aimSlider.value = sliderValue;
  const readout = aim === 'timing' && (!preview || swipe) ? 'Tempismo' : aimText(angle);
  if (aimSlider.getAttribute('aria-valuetext') !== readout) aimSlider.setAttribute('aria-valuetext', readout);
  text(aimReadout, readout);
  renderGesture(preview);
  text(rallyCount, String(rally.strokes));
  text(rallyBest, String(bestRally));
  strike.dataset.held = String(isHeld());
  if (court.dataset.phase !== rally.phase) court.dataset.phase = rally.phase;
  const gestureActive = String(gesture !== null);
  if (court.dataset.gesture !== gestureActive) court.dataset.gesture = gestureActive;
  const replaying = mode === 'replay';
  replayButton.hidden = rally.phase !== 'finished' || highlights.frames.length < 2;
  replayCamera.hidden = replayButton.hidden;
  const mark = rally.marks[rally.marks.length - 1];
  const out = rally.phase === 'finished' && mark?.first && !mark.inCourt;
  outCall.hidden = !out || replaying;
  if (out) {
    const call = lineReview(mark, rally.service);
    text(outDetail, (call.lateral ? 'Larga' : 'Lunga') + ' di ' + Math.max(1, Math.round(call.distance * 100)) + ' cm');
    reviewCanvas.hidden = outcomeAge < .32 && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reviewCanvas.hidden) drawReview(reviewCanvas, mark, rally.service, matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : outcomeAge, rally.ball);

  }
  replayLabel.hidden = !replaying;
  court.dataset.replay = String(replaying);
  text(replayButton, replaying ? 'Chiudi replay' : 'Rivedi il punto');
  renderMatch();
  renderer.draw(rally, previous, mix, guide, preview, targetPosition, value, kitsForCourt(), latestWinner, outcomeAge);
}

function enableAudio(): void {
  if (muted || !('AudioContext' in window)) return;
  audio ??= new AudioContext();
  if (audio.state === 'suspended') void audio.resume().catch(() => {});
}

function playTone(context: AudioContext, frequency: number, volume: number, duration: number, type: OscillatorType): void {
  const time = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, time);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.57, time + duration * 0.67);
  gain.gain.setValueAtTime(volume, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(time);
  oscillator.stop(time + duration);
}

function sound(event: TennisEvent): void {
  if (muted || audio?.state !== 'running' || event.type === 'service') return;
  if (event.type === 'miss') {
    // A filtered air sweep is distinct from the short percussive string contact.
    const air = audio.createOscillator(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    const now = audio.currentTime;
    air.type = 'sawtooth';
    air.frequency.setValueAtTime(118, now);
    air.frequency.exponentialRampToValueAtTime(63, now + .095);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1750, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + .11);
    gain.gain.setValueAtTime(.003, now);
    gain.gain.linearRampToValueAtTime(.063, now + .035);
    gain.gain.exponentialRampToValueAtTime(.001, now + .12);
    air.connect(filter).connect(gain).connect(audio.destination);
    air.start(now); air.stop(now + .12);
    return;
  }
  if (event.type === 'point' && event.reason !== 'Rete') return;
  if (event.type === 'hit') {
    const charge = event.hitter === 'player' ? event.charge : 0.57;
    playTone(audio, 198 + charge * 61, 0.08 + charge * 0.075, 0.088, 'triangle');
    if (!impactNoise) {
      impactNoise = audio.createBuffer(1, Math.ceil(audio.sampleRate * 0.057), audio.sampleRate);
      const samples = impactNoise.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length) ** 3;
    }
    const hit = audio.createBufferSource();
    const gain = audio.createGain();
    hit.buffer = impactNoise;
    gain.gain.value = 0.14 + charge * 0.12;
    hit.connect(gain);
    gain.connect(audio.destination);
    hit.start();
  } else playTone(audio, event.type === 'bounce' ? 110 : 67, 0.094, 0.072, 'sine');
}

function record(event: TennisEvent): void {
  sound(event);
  switch (event.type) {
    case 'hit':
      bestRally = Math.max(bestRally, rally.strokes);
      if (event.hitter === 'player') {
        lastLanding = '';
        lastPlayerBounce = null;
        lastStroke = event;
        lastMiss = null;
        const stroke = strokeNames[event.kind] || event.wing;
        const technique = event.kind === 'volley' ? (event.charge >= .68 && (rally.impact?.z ?? 0) > 1.12 ? 'Chiusura' : 'Blocco') + ' di ' + event.wing.toLowerCase() : stroke;
        const height = event.kind === 'serve' && rally.impact ? ' · impatto a ' + rally.impact.z.toFixed(2).replace('.', ',') + ' m' : '';
        lastImpact = `${technique} · ${chargePercent(event.charge)} · ${Math.round(event.speed)} km/h${height}`;
        call(event.kind === 'ground' ? event.shot : stroke, lastImpact, 'hit', false);
      } else {
        lastMiss = null;
        windowSeen = false;
        call(event.kind === 'serve' ? `${roster[opponentCharacter].name} ha battuto` : strokeNames[event.kind] ? 'L’avversario gioca ' + strokeNames[event.kind].toLowerCase() : rally.wrongFoot ? 'Attacco in contropiede' : rally.attacking ? 'Attacco sul lato libero' : lastLanding || 'L’avversario risponde', 'Segui il rombo e prepara il prossimo colpo.');
      }
      break;
    case 'bounce': {
      const { mark, shot } = event;
      if (mark.first && mark.hitter === 'player') lastPlayerBounce = mark;
      if (!mark.first || !mark.inCourt) break;
      if (shot) {
        lastLanding = `${shot} in campo`;
        call(lastLanding, lastImpact, 'hit');
      } else if (mark.hitter === 'feed' && !lastMiss) {
        call('Primo rimbalzo', 'Rilascia quando il segnale diventa verde.', 'neutral', false);
      }
      break;
    }
    case 'miss': {
      lastMiss = event.reason;
      const [label, hint] = misses[event.reason];
      call(label, hint, 'fault');
      break;
    }
    case 'service':
      if (serviceDrill && !match && event.result !== 'let') {
        if (event.result === 'in') score.player++; else score.opponent++;
        text(playerScore,String(score.player));
        text(cpuScore,String(score.opponent));
        if (event.result === 'fault') call('Fallo · ' + event.reason,lastImpact,'fault');
      }
      if (event.result === 'let') call('Let', 'La palla ha sfiorato il nastro. Ripeti la stessa battuta.');
      if (event.result === 'fault' && event.turn.attempt === 1 && match) {
        match = { ...match, attempt: 2 };
        call('Fallo di servizio', `${event.reason}. Si gioca la seconda.`, 'fault');
      }
      if (event.result === 'in') {
        const target = rally.serveTarget;
        if (target && lastPlayerBounce) {
          const distance = Math.hypot(lastPlayerBounce.x - target.x, lastPlayerBounce.y - target.y);
          if (distance <= target.radius) targetsCompleted++;
          const result = distance <= target.radius ? target.name + ' centrato' : 'Valido · ' + distance.toFixed(1).replace('.', ',') + ' m dal centro';
          call(result, lastImpact, 'hit');
        } else call('Servizio valido', event.turn.server === 'player' ? lastImpact : 'Aspetta il rimbalzo e prepara la risposta.', 'hit');
      }
      break;
    case 'point': {
      if (serviceDrill && !match) break;
      const last = rally.marks[rally.marks.length - 1];
      const distance = event.reason === 'Larga' && last ? Math.abs(last.x) - HALF_WIDTH
        : event.reason === 'Lunga' && last ? Math.abs(last.y) - HALF_LENGTH : 0;
      const margin = distance > 0 ? ` di ${Math.max(1, Math.round(distance * 100))} cm` : '';
      if (match) match = awardPoint(match, event.winner);
      else score[event.winner]++;
      const points = match?.score ?? score;
      latestWinner = event.winner;
      scoreBoard.dataset.winner = event.winner;
      text(playerScore, String(points.player));
      text(cpuScore, String(points.opponent));
      const result = event.winner === 'player' ? 'Punto tuo' : match ? `Punto ${roster[opponentCharacter].name}` : 'Punto CPU';
      const why = `${event.reason}${margin}.`;
      if (match?.winner) {
        call(match.winner === 'player' ? 'Tie-break vinto' : `${roster[opponentCharacter].name} vince`, `${points.player}–${points.opponent} · ${why}`, match.winner === 'player' ? 'hit' : 'fault');
        const detail: TennisResult = { player: playerCharacter, opponent: opponentCharacter, score: { ...points }, winner: match.winner, longestRally: bestRally };
        court.dispatchEvent(new CustomEvent('telepilo:tennis:result', { bubbles: true, detail }));
      } else if (event.winner === 'opponent' && event.reason === 'Doppio rimbalzo') {
        const [label, hint] = misses[lastMiss ?? (windowSeen ? 'late' : 'reach')];
        call(`${result} · ${label}`, hint, 'fault');
      } else call(result, lastLanding ? `${lastLanding}. ${why}` : why, event.winner === 'player' ? 'hit' : 'fault');
      break;
    }
  }
}

function update(time: number): void {
  frame = 0;
  accumulated += Math.min((time - lastTime) / 1000, 0.10) * (slow ? PRACTICE_SPEED : 1);
  lastTime = time;
  while (accumulated + 1e-9 >= STEP && rally.phase === 'rally') {
    previous = poseOf(rally);
    if (!windowSeen && canHit(rally)) {
      windowSeen = true;
      if (!muted && audio?.state === 'running') playTone(audio, 690, 0.043, 0.075, 'sine');
    }
    const events = step(rally, commandForStep());
    for (const event of events) record(event);
    highlights.observe(rally, events.some((event) => event.type === 'hit'));
    accumulated = Math.max(0, accumulated - STEP);
  }
  if (rally.phase === 'rally') {
    render(accumulated / STEP);
    frame = requestAnimationFrame(update);
  } else {
    clearControls();
    outcomeAge = 0;
    render();
    if ((latestWinner || rally.netStop || !outCall.hidden) && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const started = performance.now();
      const reaction = (now: number) => {
        outcomeAge = Math.min(1, (now - started) / (outCall.hidden ? 950 : 2000));
        render();
        frame = outcomeAge < 1 ? requestAnimationFrame(reaction) : 0;
      };
      frame = requestAnimationFrame(reaction);
    }
  }
}

function stopFrames(): void {
  cancelAnimationFrame(frame);
  accumulated = 0;
  frame = 0;
}

function playFrames(): void {
  lastTime = performance.now();
  frame = requestAnimationFrame(update);
}

function stopReplay(): void {
  if (mode !== 'replay') return;
  stopFrames();
  mode = 'active';
  outcomeAge = 1;
  render();
}

function toggleReplay(): void {
  if (mode === 'replay') {
    stopReplay();
    return;
  }
  const frames = highlights.frames;
  if (mode !== 'active' || rally.phase !== 'finished' || frames.length < 2) return;
  stopFrames();
  mode = 'replay';
  const lastFrame = frames[frames.length - 1];
  const landing = lastFrame.marks.filter(mark => mark.stroke === lastFrame.strokes && mark.first).pop() ?? lastFrame.ball;
  renderer.followReplay(frames[0].ball, 0, replayCamera.value, landing);
  replayLabel.style.setProperty('--replay-progress', '0%');
  render();
  const started = performance.now();
  const firstTick = frames[0].tick;
  const totalTicks = frames[frames.length - 1].tick - firstTick;
  let index = 0;
  const playback = (time: number) => {
    const tick = firstTick + (time - started) / (2000 * STEP);
    while (index + 1 < frames.length && frames[index + 1].tick <= tick) index++;
    const before = frames[index];
    const after = frames[index + 1];
    if (!after) {
      stopReplay();
      return;
    }
    const fraction = (tick - before.tick) / Math.max(1, after.tick - before.tick);
    const progress = Math.min(1, (tick - firstTick) / Math.max(1, totalTicks));
    renderer.followReplay({
      x: before.ball.x + (after.ball.x - before.ball.x) * fraction,
      y: before.ball.y + (after.ball.y - before.ball.y) * fraction,
    }, progress, replayCamera.value, landing);
    replayLabel.style.setProperty('--replay-progress', `${progress * 100}%`);
    renderer.draw(after, poseOf(before), fraction, null, null, null, preparationPower(after), kitsForCourt(), null, 1);
    frame = requestAnimationFrame(playback);
  };
  frame = requestAnimationFrame(playback);
}

function locate(): void {
  court.focus({ preventScroll: true });
}

function selectAim(next: Aim, focusCourt = true): void {
  aim = next;
  timingButton.setAttribute('aria-pressed', String(next === 'timing'));
  for (const button of aimButtons) button.setAttribute('aria-pressed', String(next === Number(button.dataset.aim)));
  if (focusCourt) locate();
  render();
}

function resetScore(): void {
  score.player = score.opponent = 0;
  bestRally = 0;
  targetsCompleted = 0;
  text(playerScore, '0');
  text(cpuScore, '0');
}

function place(next: Rally): void {
  stopFrames();
  clearControls();
  highlights.reset();
  rally = next;
  renderedMatch = '';
  previous = poseOf(rally);
  lastLanding = '';
  lastPlayerBounce = null;
  lastStroke = null;
  lastImpact = '';
  lastMiss = null;
  windowSeen = false;
  latestWinner = null;
  outcomeAge = 1;
  delete scoreBoard.dataset.winner;
  const ready = rally.phase === 'ready';
  text(launchLabel, ready ? 'Lancia la palla' : 'Ripeti il lancio');
  text(touchLaunch, ready ? 'Lancia' : 'Ripeti');
  touchLaunch.setAttribute('aria-label', ready ? 'Lancia la palla' : 'Ripeti il lancio');
}

function servicePractice(phase: 'ready' | 'rally') {
  const attempt = drillTurn.value.startsWith('2') ? 2 : 1;
  const side = drillTurn.value.endsWith('d') ? 1 : -1;
  const practice = createService({ server: 'player', attempt, side }, difficulty, 'baseline', phase);
  practice.serviceDrill = true;
  practice.serveTarget = practiceTarget({server: 'player', attempt, side}, targetsCompleted);
  return practice;
}

function selectServiceDrill(): void {
  if (mode !== 'active' || match) return;
  if (!serviceDrill) resetScore();
  serviceDrill = true;
  place(servicePractice('ready'));
  call(drillTurn.selectedOptions[0].text, 'Lancia, carica e rilascia vicino al culmine. Puoi ripetere con R.');
  render();
  locate();
}

function selectFeed(value: Feed): void {
  if (mode !== 'active' || match) return;
  if (value === feed && !serviceDrill) {
    locate();
    return;
  }
  if (serviceDrill) resetScore();
  serviceDrill = false;
  feed = value;
  volleySide = 1;
  for (const button of feedButtons) button.setAttribute('aria-pressed', String(button.dataset.feed === feed));
  place(createRally(feed, 'ready', difficulty));
  call(feedCopy[feed].label, feed === 'center' ? readyHint : feedCopy[feed].hint);
  render();
  locate();
}

function serve(): void {
  if (mode !== 'active' || (match && rally.phase === 'rally')) return;
  enableAudio();
  if (match) {
    if (match.winner) {
      match = newTieBreak();
      resetScore();
    }
    const turn = serviceTurn(match);
    place(createService(turn, difficulty, roster[opponentCharacter].tactic, 'rally'));
    call(turn.server === 'player' ? 'Tocca a te servire' : `Serve ${roster[opponentCharacter].name}`,
      turn.server === 'player' ? 'Aspetta CARICA durante il lancio, poi rilascia su ORA.' : 'Posizionati per la risposta dopo il rimbalzo.');
  } else if (serviceDrill) {
    place(servicePractice('rally'));
    call(drillTurn.selectedOptions[0].text, 'Carica durante il lancio. Mira con la strusciata e rilascia su ORA.');
  } else {
    place(createRally(feed, 'rally', difficulty, 'neutral', volleySide));
    call(feed === 'volley' ? 'Volée di ' + (volleySide === 1 ? 'dritto' : 'rovescio') : feedCopy[feed].label, feedCopy[feed].hint);
    if (feed === 'volley') volleySide = volleySide === 1 ? -1 : 1;
  }
  locate();
  render();
  playFrames();
}

function resetCourt(): void {
  resetScore();
  if (match) {
    match = newTieBreak();
    place(createService(serviceTurn(match), difficulty, roster[opponentCharacter].tactic));
    const opponent = roster[opponentCharacter];
    call(`${roster[playerCharacter].name} contro ${opponent.name}`, `${opponent.description}. «${opponent.intro}»`);
  } else if (serviceDrill) {
    selectServiceDrill();
  } else {
    place(createRally(feed, 'ready', difficulty));
    call(feedCopy[feed].label, feed === 'center' ? readyHint : feedCopy[feed].hint);
  }
  render();
}

function changeMode(next: 'practice' | 'match'): void {
  if (mode !== 'active' || (next === 'match') === Boolean(match)) return;
  match = next === 'match' ? newTieBreak() : null;
  resetCourt();
  locate();
}

function changeLineup(side: Side, value: string): void {
  if (!match || !isTennisCharacter(value)) return;
  if (side === 'player') {
    if (opponentCharacter === value) opponentCharacter = playerCharacter;
    playerCharacter = value;
  } else {
    if (playerCharacter === value) playerCharacter = opponentCharacter;
    opponentCharacter = value;
  }
  characterSelect.value = playerCharacter;
  rivalSelect.value = opponentCharacter;
  resetCourt();
}

function showMenu(closed: boolean): void {
  text(element('menu-title'), closed ? match ? 'Tie-break chiuso' : 'Allenamento chiuso' : 'Pausa');
  text(element('menu-detail'), closed ? 'Puoi tornare al campo e ricominciare.' : 'Lo scambio riprende da qui.');
  text(returnButton, closed ? 'Torna al campo' : 'Riprendi');
  text(exit, match ? 'Esci dal tie-break' : 'Esci dall’allenamento');
  exit.hidden = closed;
  slowButton.hidden = closed;
  specialShots.hidden = closed;
  if (!menu.open) menu.showModal();
  returnButton.focus();
}

function pause(): void {
  if (mode === 'replay') {
    stopReplay();
    return;
  }
  if (mode !== 'active') return;
  mode = 'paused';
  stopFrames();
  clearControls();
  render();
  showMenu(false);
}

function resume(): void {
  const wasClosed = mode === 'closed';
  mode = 'active';
  menu.close();
  if (wasClosed) {
    listen();
    resetCourt();
  }
  locate();
  render();
  if (rally.phase === 'rally' && !frame) playFrames();
}

function closeTraining(): void {
  mode = 'closed';
  resetCourt();
  session?.abort();
  session = null;
  if (audio) {
    void audio.close().catch(() => {});
    audio = null;
    impactNoise = null;
  }
  render();
  showMenu(true);
  court.dispatchEvent(new Event('telepilo:tennis:exit', { bubbles: true }));
}

function interrupted(): void {
  if (mode === 'replay') stopReplay();
  else if (mode === 'active' && rally.phase === 'rally') pause();
  else clearControls();
}

function windowBlur(event: FocusEvent): void {
  if (event.target !== window) return;
  window.clearTimeout(focusCheck);
  focusCheck = window.setTimeout(() => {
    focusCheck = 0;
    if (!document.hasFocus()) interrupted();
  }, 150);
}

function keyDown(event: KeyboardEvent): void {
  if (mode === 'replay' && event.code === 'Escape') {
    event.preventDefault();
    stopReplay();
    return;
  }
  if (event.defaultPrevented || mode !== 'active' || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLSelectElement) return;
  const { code } = event;
  if (code === 'Escape') {
    event.preventDefault();
    if (!event.repeat) pause();
    return;
  }
  if (code === 'KeyR') {
    event.preventDefault();
    if (!event.repeat) serve();
    return;
  }
  const nextAim = aimKeys[code];
  if (nextAim !== undefined) {
    event.preventDefault();
    if (!event.repeat) selectAim(nextAim);
    return;
  }
  if (code === 'KeyL' && acceptsFlick()) {
    event.preventDefault();
    if (!event.repeat) flickShot('lob', { x: typeof aim === 'number' ? aim * (rally.ball.x < 0 ? -1 : 1) : 0, y: .8 });
    return;
  }
  if (event.target === aimSlider && arrows.has(code)) return;
  if (code === 'Space') {
    if (event.target instanceof HTMLButtonElement) return;
    if (rally.phase !== 'rally' && !event.repeat) {
      event.preventDefault();
      serve();
      return;
    }
  }
  if (rally.phase !== 'rally') return;
  if (!arrows.has(code) && code !== 'Space') return;
  event.preventDefault();
  if (event.repeat) return;
  if (arrows.has(code)) targetPosition = null;
  const held = isHeld();
  keys.add(code);
  if (!held && isHeld()) pressed = true;
}

function keyUp(event: KeyboardEvent): void {
  if (!keys.has(event.code)) return;
  event.preventDefault();
  const held = isHeld();
  keys.delete(event.code);
  if (held && !isHeld()) releaseStroke();
}

function courtHover(event: PointerEvent): void {
  if (gesture || event.pointerType === 'touch' || mode !== 'active' || rally.phase !== 'rally') return;
  if (releasedPosition && Math.hypot(event.clientX - releasedPosition.x, event.clientY - releasedPosition.y) < 10) return;
  releasedPosition = null;
  const point = renderer.groundAt(event.clientX, event.clientY);
  targetPosition = point && point.y < 0 && point.y >= -15.1 && Math.abs(point.x) <= 7.6
    ? playerDestination(point) : null;
}

function capturePointer(node: HTMLElement, id: number): void {
  try {
    node.setPointerCapture(id);
  } catch (error) {
    // An inactive pointer may lose capture before this callback runs. Window listeners still own the gesture.
    if (!(error instanceof DOMException) || error.name !== 'NotFoundError') throw error;
  }
}

function courtDown(event: PointerEvent): void {
  if (event.pointerType === 'touch' || mode !== 'active' || event.button !== 0 || gesture) return;
  event.preventDefault();
  if (rally.phase !== 'rally') {
    serve();
    return;
  }
  const held = isHeld();
  gesture = {
    pointer: event.pointerId,
    origin: { x: event.clientX, y: event.clientY },
    range: swipeRange(court.clientWidth) * Number(swipeSensitivity.value),
  };
  swipe = { x: 0, y: 0 };
  releasedPosition = null;
  capturePointer(court, event.pointerId);
  locate();
  if (!held) pressed = true;
}

function courtUp(event: PointerEvent): void {
  if (event.pointerId !== gesture?.pointer) return;
  releasedPosition = { x: event.clientX, y: event.clientY };
  swipe = swipeVector(gesture.origin, releasedPosition, gesture.range);
  gesture = null;
  if (!isHeld()) releaseStroke();
}

function updateStick(event: PointerEvent): void {
  const box = stick.getBoundingClientRect();
  const reach = box.width * 0.35;
  const dx = (event.clientX - box.left - box.width / 2) / reach;
  const dy = (event.clientY - box.top - box.height / 2) / reach;
  const extent = Math.hypot(dx, dy);
  const length = Math.min(1, Math.max(0, (extent - 0.19) / 0.81));
  const scale = extent ? length / extent : 0;
  joystick = { x: dx * scale, y: -dy * scale };
  const travel = box.width * 0.30;
  thumb.style.transform = `translate(${joystick.x * travel}px, ${-joystick.y * travel}px)`;
}

function stickDown(event: PointerEvent): void {
  if (mode !== 'active' || rally.phase !== 'rally' || stickPointer !== null || event.button !== 0) return;
  event.preventDefault();
  stickPointer = event.pointerId;
  capturePointer(stick, event.pointerId);
  updateStick(event);
}

function stickUp(event: PointerEvent): void {
  if (stickPointer !== event.pointerId) return;
  stickPointer = null;
  joystick = { x: 0, y: 0 };
  thumb.style.transform = '';
}

function strikeDown(event: PointerEvent): void {
  if (mode !== 'active' || strikePointer !== null || event.button !== 0) return;
  event.preventDefault();
  if (rally.phase !== 'rally') {
    serve();
    return;
  }
  const held = isHeld();
  strikePointer = event.pointerId;
  touchSwipeOrigin = event.pointerType === 'touch' ? { x: event.clientX, y: event.clientY } : null;
  capturePointer(strike, event.pointerId);
  if (!held) pressed = true;
}

function strikeMove(event: PointerEvent): void {
  if (strikePointer !== event.pointerId || !touchSwipeOrigin || gesture) return;
  const vector = swipeVector(touchSwipeOrigin, { x: event.clientX, y: event.clientY }, Math.min(68, strike.clientWidth * .79));
  swipe = vector.x || vector.y ? vector : null;
}

function strikeUp(event: PointerEvent): void {
  if (strikePointer !== event.pointerId) return;
  strikeMove(event);
  strikePointer = null;
  touchSwipeOrigin = null;
  if (!isHeld()) releaseStroke();
}

function cancelPointer(event: PointerEvent): void {
  if (event.pointerId === stickPointer) {
    stickUp(event);
    return;
  }
  if (event.pointerId === gesture?.pointer) {
    gesture = null;
    releasedPosition = { x: event.clientX, y: event.clientY };
  } else if (event.pointerId === strikePointer) {
    strikePointer = null;
    touchSwipeOrigin = null;
  } else return;
  swipe = null;
  if (isHeld()) return;
  if (mode === 'active' && rally.phase === 'rally' && (pressed || rally.preparation)) {
    call('Gesto interrotto', 'Tieni di nuovo premuto per caricare.', 'neutral', false);
  }
  pressed = false;
  released = false;
  releasedAim = null;
  clearPreparation(rally);
}

function pointerMove(event: PointerEvent): void {
  const { pointerId } = event;
  if (pointerId !== gesture?.pointer && pointerId !== stickPointer && pointerId !== strikePointer) return;
  if (focusCheck && event.isTrusted) {
    window.clearTimeout(focusCheck);
    focusCheck = 0;
  }
  // The button can be released outside the window after capture has been lost.
  if (event.pointerType !== 'touch' && (event.buttons & 1) === 0) {
    pointerUp(event);
  } else if (pointerId === gesture?.pointer) {
    swipe = swipeVector(gesture.origin, { x: event.clientX, y: event.clientY }, gesture.range);
  } else if (pointerId === stickPointer) updateStick(event);
  else strikeMove(event);
}

function pointerUp(event: PointerEvent): void {
  courtUp(event);
  stickUp(event);
  strikeUp(event);
}

function acceptsFlick(): boolean {
  return mode === 'active' && rally.phase === 'rally' && rally.hitter !== 'player' && rally.service?.phase !== 'toss'
    && !isHeld() && !released && !rally.pending && recoveryTicks(rally) <= 4;
}

function flickShot(technique: Technique, vector: Point): void {
  if (!acceptsFlick()) return;
  // A flick is a complete stroke in its own right. Ignore subsequent scroll inertia.
  pressed = released = true;
  releasedAim = { swipe: vector, technique };
}

function listen(): void {
  session = new AbortController();
  const options = { signal: session.signal };
  const reverse = element<HTMLInputElement>('reverse-scroll');
  resetFlick = courtGestures(court, acceptsFlick, () => Number(swipeSensitivity.value), () => reverse.checked,
    vector => flickShot('cut', vector), session.signal);
  window.addEventListener('keydown', keyDown, options);
  window.addEventListener('keyup', keyUp, options);
  window.addEventListener('blur', windowBlur, options);
  window.addEventListener('focus', () => window.clearTimeout(focusCheck), options);
  window.addEventListener('pagehide', interrupted, options);
  document.addEventListener('visibilitychange', () => { if (document.hidden) interrupted(); }, options);
  // Keep the original gesture even if the platform releases pointer capture mid-drag.
  window.addEventListener('pointermove', pointerMove, options);
  window.addEventListener('pointerup', pointerUp, options);
  window.addEventListener('pointercancel', cancelPointer, options);
  court.addEventListener('pointermove', courtHover, options);
  court.addEventListener('pointerleave', () => { if (!gesture && !releasedPosition) targetPosition = null; }, options);
  court.addEventListener('pointerdown', courtDown, options);
  stick.addEventListener('pointerdown', stickDown, options);
  strike.addEventListener('pointerdown', strikeDown, options);
  for (const node of [strike, stick, court]) {
    node.addEventListener('contextmenu', (event) => event.preventDefault(), options);
  }
}

for (const button of feedButtons) button.addEventListener('click', () => selectFeed(button.dataset.feed as Feed));
serviceDrillButton.addEventListener('click',selectServiceDrill);
drillTurn.addEventListener('change',selectServiceDrill);
practiceButton.addEventListener('click', () => changeMode('practice'));
matchButton.addEventListener('click', () => changeMode('match'));
characterSelect.addEventListener('change', () => changeLineup('player', characterSelect.value));
rivalSelect.addEventListener('change', () => changeLineup('opponent', rivalSelect.value));
for (const button of aimButtons) button.addEventListener('click', () => selectAim(Number(button.dataset.aim)));
timingButton.addEventListener('click', () => selectAim('timing'));
aimSlider.addEventListener('input', () => selectAim(aimSlider.valueAsNumber / 100, false));
aimSlider.addEventListener('pointerdown', () => {
  if (typeof aim !== 'number') selectAim(aimSlider.valueAsNumber / 100, false);
});
aimSlider.addEventListener('pointerup', locate);
difficultySelect.addEventListener('change', () => {
  difficulty = difficultySelect.value as Difficulty;
  resetCourt();
  locate();
});
slowButton.addEventListener('click', () => {
  slow = !slow;
  slowButton.setAttribute('aria-pressed', String(slow));
});
launch.addEventListener('click', serve);
touchLaunch.addEventListener('click', serve);
replayButton.addEventListener('click', toggleReplay);
audioButton.addEventListener('click', () => {
  muted = !muted;
  audioButton.setAttribute('aria-pressed', String(!muted));
  if (!muted) enableAudio();
});
pauseButton.addEventListener('click', pause);
returnButton.addEventListener('click', resume);
exit.addEventListener('click', closeTraining);
menu.addEventListener('cancel', (event) => {
  event.preventDefault();
  if (mode === 'paused') resume();
});

listen();
if (match) resetCourt();
else if (parameters.get('esercizio') === 'servizio') selectServiceDrill();
else if (parameters.get('esercizio') === 'volee') selectFeed('volley');
function redrawCourt(): void {
  renderer.resize();
  render();
}
new ResizeObserver(redrawCourt).observe(court);
void clayReady.then(redrawCourt, () => { /* The painted base remains playable on a failed asset load. */ });

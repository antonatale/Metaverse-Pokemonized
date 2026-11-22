import vindicio from '../assets/scenes/vindicio.webp';
import pineta from '../assets/scenes/pineta.webp';
import porto from '../assets/scenes/porto.webp';
import mola from '../assets/scenes/mola.webp';
import castellone from '../assets/scenes/castellone.webp';
import maranola from '../assets/scenes/maranola.webp';
import castellonorato from '../assets/scenes/castellonorato.webp';
import gianola from '../assets/scenes/gianola.webp';
import caposele from '../assets/scenes/caposele.webp';
import centro from '../assets/scenes/centro.webp';
import campo from '../assets/scenes/campo.webp';
import birreria from '../assets/scenes/birreria.webp';
import cisterna from '../assets/scenes/cisterna.webp';
import telepilo from '../assets/scenes/telepilo.webp';
import covoAntonio from '../assets/scenes/covo-antonio.webp';
import covoAntonioBoss from '../assets/scenes/covo-antonio-boss.webp';
import covoAndrea from '../assets/scenes/covo-andrea.webp';
import covoAndreaBoss from '../assets/scenes/covo-andrea-boss.webp';
import covoForchetta from '../assets/scenes/covo-forchetta.webp';
import covoForchettaBoss from '../assets/scenes/covo-forchetta-boss.webp';
import covoValentin from '../assets/scenes/covo-valentin.webp';
import covoValentinBoss from '../assets/scenes/covo-valentin-boss.webp';
import covoClaudia from '../assets/scenes/covo-claudia.webp';
import covoClaudiaBoss from '../assets/scenes/covo-claudia-boss.webp';
import covoCostanzo from '../assets/scenes/covo-costanzo.webp';
import covoCostanzoBoss from '../assets/scenes/covo-costanzo-boss.webp';
import covoZendavid from '../assets/scenes/covo-zendavid.webp';
import covoZendavidBoss from '../assets/scenes/covo-zendavid-boss.webp';

/** Illustrated battle locations. Focus keeps the landmark in view on a portrait screen. */
interface Scene { title: string; art: string; focus?: number; indoor?: boolean }
const SCENES: Record<string, Scene> = {
  vindicio: { title: 'La spiaggia di Vindicio', art: vindicio },
  pineta: { title: 'La pineta di Vindicio', art: pineta },
  porto: { title: 'Il porto di Formia', art: porto },
  mola: { title: 'Mola, il borgo dei pescatori', art: mola, focus: 26 },
  castellone: { title: 'Castellone, le mura e la torre', art: castellone, focus: 27 },
  maranola: { title: 'I Monti Aurunci, sotto Maranola', art: maranola, focus: 64 },
  castellonorato: { title: 'Il golfo da via Amendola', art: castellonorato, focus: 32 },
  gianola: { title: 'Gianola, il porticciolo romano', art: gianola, focus: 30 },
  caposele: { title: 'Le peschiere romane di Caposele', art: caposele },
  centro: { title: 'Piazza della Vittoria', art: centro, focus: 58 },
  campo: { title: 'I campi coperti del Bruno Zauli', art: campo, indoor: true },
  birreria: { title: 'Dentro la Birreria Morgana', art: birreria, indoor: true },
  cisterna: { title: 'Dentro il Cisternone', art: cisterna, indoor: true },
  telepilo: { title: 'La Porta di Telepilo', art: telepilo, indoor: true },
  'covo-antonio': { title: "La Cupola", art: covoAntonio, indoor: true },
  'covo-antonio-boss': { title: "La Cupola · Sala del custode", art: covoAntonioBoss, indoor: true },
  'covo-andrea': { title: "La Torre delle Probabilità", art: covoAndrea, indoor: true },
  'covo-andrea-boss': { title: "La Torre delle Probabilità · Sala del custode", art: covoAndreaBoss, indoor: true },
  'covo-forchetta': { title: "Il Tempio della Terra Rossa", art: covoForchetta, indoor: true },
  'covo-forchetta-boss': { title: "Il Tempio della Terra Rossa · Sala del custode", art: covoForchettaBoss, indoor: true },
  'covo-valentin': { title: "Turnul Verde", art: covoValentin, indoor: true },
  'covo-valentin-boss': { title: "Turnul Verde · Sala del custode", art: covoValentinBoss, indoor: true },
  'covo-claudia': { title: "Il Castello del Padre", art: covoClaudia, indoor: true },
  'covo-claudia-boss': { title: "Il Castello del Padre · Sala del custode", art: covoClaudiaBoss, indoor: true },
  'covo-costanzo': { title: "Il Palazzo del Popolo", art: covoCostanzo, indoor: true },
  'covo-costanzo-boss': { title: "Il Palazzo del Popolo · Sala del custode", art: covoCostanzoBoss, indoor: true },
  'covo-zendavid': { title: "Il Tempio del Basso", art: covoZendavid, indoor: true },
  'covo-zendavid-boss': { title: "Il Tempio del Basso · Sala del custode", art: covoZendavidBoss, indoor: true }
};

/** The accessible location name also describes the illustrated background. */
export function sceneInfo(id: string): Scene { return SCENES[id] || SCENES.porto; }

/* One picture per scene, kept once it has been decoded (13 November 2026). In the single-file game every picture is a
   data URL of some hundred kilobytes: written into the battle's HTML at every battle it was parsed again and decoded
   again, and the first frames of the battle showed the bare background. Now the picture of the part of town where the
   player is gets decoded while he walks there (warmScene, from the story map), and the battle puts that very element
   in place: it shows at once. Only a few are kept; the rest are made again when needed. */
const kept = new Map<string, HTMLImageElement>();
const KEEP = 4;
function picture(id: string): HTMLImageElement {
  const sc = sceneInfo(id), key = SCENES[id] ? id : 'porto';
  let img = kept.get(key);
  if (!img) {
    img = new Image();
    img.decoding = 'async'; img.alt = ''; img.draggable = false;
    img.src = sc.art;
    kept.set(key, img);
    if (img.decode) img.decode().catch(function () { /* shown when it is ready */ });
    while (kept.size > KEEP) { const first = kept.keys().next().value as string; if (first === key) break; kept.delete(first); }
  } else { kept.delete(key); kept.set(key, img); }
  return img;
}
/** decode a scene ahead of its battle: the part of town the player has just walked into, the keeper's hall of a covo */
export function warmScene(id: string) { if (typeof Image !== 'undefined') picture(id); }

/** No lettering or fighters are baked into the art. The existing battle UI stays above it. The picture goes into the
    holder of the battle (`.scene`) after its HTML is written: see placeScene */
export function placeScene(holder: Element | null, id: string, dark: boolean) {
  if (!holder) return;
  const sc = sceneInfo(id), img = picture(id);
  img.className = 'scene-art' + (dark ? ' is-night' : '') + (sc.indoor ? ' is-indoor' : '');
  img.style.objectPosition = (sc.focus ?? 50) + '% center';
  holder.appendChild(img);
}

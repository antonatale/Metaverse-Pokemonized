import type { FriendId } from '../../data/characters';
import type { ExprName } from './types';
import { SHARED, GRADIENTS } from './palette';
import { CH } from './looks';
import { hairCurls, hairWavy, hairQuiff, hairBuzz } from './hair';
import { outfit } from './outfit';
import { ears, face, faceD, mouths, exprGroup } from './face';
import { glasses, props, hood } from './extras';
import { esameParts, robotParts } from './esame';
import type { Look } from './types';

/* Portraits v2: six friends drawn from their photos, the Esame di Controlli and the robot.
   Each character is built once into a hidden <svg><defs>; an instance is a stack of <use>.
   Expressions switch with data-expr (smirk, grin, pout, worried, sleepy, cool), Zendavid's headphones with data-ph. */

export const EXPRS: ExprName[] = ['smirk', 'grin', 'pout', 'worried', 'sleepy', 'cool'];

function buildChar(c: Look): string {
  var P = c.P, S = c.skin, I = c.iris, s = '';
  s += '<radialGradient id="' + P + 'SkinG" cx="44%" cy="38%" r="70%"><stop offset="0" stop-color="' + S.light + '"/><stop offset=".5" stop-color="' + S.base + '"/><stop offset="1" stop-color="' + S.shade + '"/></radialGradient>';
  s += '<linearGradient id="' + P + 'EarG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + S.shade + '"/><stop offset="1" stop-color="' + S.base + '"/></linearGradient>';
  s += '<radialGradient id="' + P + 'IrisG" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="' + I.light + '"/><stop offset=".55" stop-color="' + I.base + '"/><stop offset="1" stop-color="' + I.dark + '"/></radialGradient>';
  if (c.hair.style === 'quiff') s += '<linearGradient id="' + P + 'FadeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.hair.out + '"/><stop offset=".4" stop-color="' + c.hair.body[0] + '" stop-opacity=".95"/><stop offset=".78" stop-color="' + c.hair.body[0] + '" stop-opacity=".4"/><stop offset="1" stop-color="' + c.hair.body[0] + '" stop-opacity="0"/></linearGradient>';
  s += '<clipPath id="' + P + 'FaceClip"><path d="' + faceD(c) + '"/></clipPath>';
  var st = c.hair.style;
  s += st === 'wavy' ? hairWavy(c) : st === 'quiff' ? hairQuiff(c) : st === 'buzz' ? hairBuzz(c) : hairCurls(c);
  s += outfit(c) + ears(c) + face(c) + glasses(c) + props(c) + hood(c);
  var M = mouths(c);
  EXPRS.forEach(function (x) { s += exprGroup(c, x, M); });
  return s;
}

export function person(id: string, expr?: string, cls?: string, vb?: string): string {
  var c = CH[id as FriendId], P = c.P, H = c.hair, hoodKo = c.ko === 'hood';
  var s = '<svg class="spr spr-p spr-' + id + ' ' + (cls || '') + '" viewBox="' + (vb || '0 0 260 300') + '" data-expr="' + (expr || 'smirk') + '" data-ph="off" role="img" aria-label="' + c.name + '">';
  if (hoodKo) s += '<use class="hood" href="#' + P + 'HoodBack"/>';
  s += '<use class="' + (hoodKo ? 'nohood' : '') + '" href="#' + P + 'Back"/>';
  if (c.outfit.style === 'hoodie') s += '<use href="#' + P + 'Body"/><use class="nohood" href="#' + P + 'Collar"/><use href="#' + P + 'Neck"/>';
  else s += '<use href="#' + P + 'Neck"/><use href="#' + P + 'Body"/>';
  s += '<use href="#' + P + 'Front"/>';
  if (c.props && c.props.phones) s += '<use class="ph-neck" href="#' + P + 'PhNeck"/>';
  s += '<use class="' + (hoodKo ? 'nohood' : '') + '" href="#' + P + 'Ears"/><use href="#' + P + 'Face"/>';
  EXPRS.forEach(function (x) { s += '<use class="ex ex-' + x + '" href="#' + P + 'Ex-' + x + '"/>'; });
  if (H.fshadow || H.style === 'wavy' || H.style === 'quiff') s += '<use href="#' + P + 'FShadow"/>';
  s += '<use class="' + (hoodKo ? 'nohood' : '') + '" href="#' + P + 'Top"/>';
  if (hoodKo) s += '<use class="hood" href="#' + P + 'HairHood"/>';
  if (H.rings) s += '<use href="#' + P + 'Fringe"/>';
  if (c.glasses) {
    if (c.glasses.when === 'always') {
      s += '<use class="' + (c.glasses.koTilt ? 'gl-norm' : '') + '" href="#' + P + 'Gl"/>';
      if (c.glasses.koTilt) s += '<use class="gl-ko" href="#' + P + 'GlKo"/>';
    } else s += '<use class="cond ' + c.glasses.when.map(function (w) { return 'on-' + w; }).join(' ') + '" href="#' + P + 'Gl"/>';
  }
  if (hoodKo) s += '<use class="hood" href="#' + P + 'HoodFront"/>';
  if (c.props && c.props.phones) s += '<use class="ph-on" href="#' + P + 'PhOn"/>';
  return s + '</svg>';
}

/** the minimal document install() needs (a fake one in the golden test) */
export interface DefsDoc {
  getElementById(id: string): unknown;
  createElement(tag: string): { innerHTML: string; firstChild: unknown };
  body: { firstChild: unknown; insertBefore(n: unknown, ref: unknown): unknown };
}
let installed = false;
/** puts every character's parts into a hidden <svg><defs> at the top of the page, once */
export function install(doc?: DefsDoc): void {
  doc = doc || (document as unknown as DefsDoc);
  if (installed || doc.getElementById('spr-defs')) { installed = true; return; }
  let defs = SHARED + GRADIENTS;
  for (const id in CH) defs += buildChar(CH[id as FriendId]);
  defs += esameParts() + robotParts();
  const holder = doc.createElement('div');
  holder.innerHTML = '<svg id="spr-defs" xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>' + defs + '</defs></svg>';
  doc.body.insertBefore(holder.firstChild, doc.body.firstChild);
  installed = true;
}
export function esame(face?: string, cls?: string): string {
  return '<svg class="spr spr-e ' + (cls || '') + '" viewBox="0 0 200 200" data-expr="smirk" data-face="' + (face || 'idle') + '" role="img" aria-label="Esame di Controlli">' +
    '<use href="#eBody"/><use class="ef ef-idle" href="#eFace-idle"/><use class="ef ef-angry" href="#eFace-angry"/><use class="ef ef-hurt" href="#eFace-hurt"/><use class="ef ef-ko" href="#eFace-ko"/></svg>';
}
export function robot(cls?: string): string { return '<svg class="spr spr-r ' + (cls || '') + '" viewBox="0 0 60 82" aria-hidden="true"><use href="#rBot"/></svg>'; }

/** the same rules are in styles/sprites.css; kept here because the old API had them */
export const CSS = '.spr-p .ex,.spr-p .hood,.spr-p .cond,.spr-p .gl-ko,.spr-p .ph-on{display:none}' +
  EXPRS.map(function (x) { return '.spr-p[data-expr="' + x + '"] .ex-' + x + ',.spr-p[data-expr="' + x + '"] .on-' + x; }).join(',') + '{display:inline}' +
  '.spr-p[data-expr="sleepy"] .hood,.spr-p[data-expr="sleepy"] .gl-ko{display:inline}.spr-p[data-expr="sleepy"] .nohood,.spr-p[data-expr="sleepy"] .gl-norm{display:none}' +
  '.spr-p[data-ph="on"] .ph-on,.spr-p[data-expr="cool"] .ph-on{display:inline}.spr-p[data-ph="on"] .ph-neck,.spr-p[data-expr="cool"] .ph-neck{display:none}' +
  '.spr-e .ef{display:none}.spr-e[data-face="idle"] .ef-idle,.spr-e[data-face="angry"] .ef-angry,.spr-e[data-face="hurt"] .ef-hurt,.spr-e[data-face="ko"] .ef-ko{display:inline}';


export const CHARS = Object.keys(CH);
/** viewBox of a character's thumbnail */
export function thumb(id: string): string { return CH[id as FriendId] ? CH[id as FriendId].thumb : '0 0 200 200'; }

/** the whole module as one object, with the same names the old window.SPR had */
export const SPR = {
  install, person, esame, robot, CSS, EXPRS, CHARS, thumb,
  antonio: function (expr?: string, cls?: string, vb?: string) { return person('antonio', expr, cls, vb); }
};

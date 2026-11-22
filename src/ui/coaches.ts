import { PEOPLE, PEOPLE_FORMS, LOOKS, townsperson, posed, handAt, type PersonLook, type Pose } from '../render/canvas/walkers';
import type { Dir } from '../data/maps/types';
import type { FriendId } from '../data/characters';
import { fighter } from '../data/fighters';
import { SPECIES, isSpecies } from '../data/creatures';
import type { BattleEvent } from '../battle';
import { formNow, firstHuman } from '../story/growth';
import { reduced, esc, $ } from './dom';
import { sleep } from './common';
import { fx, animate, rel } from './effects';
import { bagIcon } from './spells';
import { arena, S } from './battle-screen';

/* Who stands behind the creatures (14 November 2026; their own places and their gestures, 17 November). A trainer's
   or a keeper's creature has its trainer behind it, as on the map, facing the camera; Antonio (whoever is played) has
   his place at the front on the left, in profile, looking at the battle, and comes into it only now and then: he walks
   in, draws his arm back and throws his creature in, calls it back with a ray of light, throws the net or the tiella,
   and shouts when it counts; then he turns and walks out. They are the walkers of the map (render/canvas/walkers.ts),
   in a pose. Nobody stands on anybody: `fit` gives each of the four its strip of the arena. A wild creature has nobody
   behind it, and in the tournament the friends fight in person. Nothing here waits on the battle but the throw. */

/** who a trainer is, as a key the battle keeps (StoryTag.coach): a friend `p:`, someone with a look `l:`, townsfolk `s:` */
export function coachKey(n: { person?: string; look?: string; seed?: number }): string | undefined {
  return n.person ? 'p:' + n.person : n.look ? 'l:' + n.look : n.seed != null ? 's:' + n.seed : undefined;
}
function lookOf(key: string): PersonLook | null {
  var t = key.slice(0, 2), k = key.slice(2);
  if (t === 'p:' && PEOPLE[k as FriendId]) { var f = formNow(k); return Object.assign({}, PEOPLE[k as FriendId], f ? PEOPLE_FORMS[k as FriendId][f - 1] : null); }
  if (t === 'l:' && LOOKS[k]) return LOOKS[k];
  if (t === 's:' && k && !isNaN(+k)) return townsperson(+k);
  return null;
}

interface Coach {
  side: number; key: string; look: PersonLook; d: Dir; face: Dir; el: HTMLElement; cv: HTMLCanvasElement; pose: Pose; f: number;
  on: boolean; off: boolean; said?: HTMLElement; out?: ReturnType<typeof setTimeout>; back?: ReturnType<typeof setTimeout>; steps?: ReturnType<typeof setInterval>;
}
/* drawn big, shown smaller: sharp on a phone too */
const SCALE = [6, 5];
/** the picture `posed` draws is 48 by 44 walker units */
const ASPECT = 48 / 44;
var coaches: (Coach | null)[] = [null, null], frames: Record<string, HTMLCanvasElement> = {}, cheered = -9, lowSaid: Record<string, boolean> = {}, item: string | null = null, watch: ResizeObserver | null = null;

function draw(c: Coach) {
  var id = c.key + '|' + c.face + '|' + c.pose + '|' + c.f, im = frames[id] || (frames[id] = posed(c.look, SCALE[c.side], c.face, c.pose, c.f)), g = c.cv.getContext('2d');
  if (!g) return;
  g.clearRect(0, 0, c.cv.width, c.cv.height);
  g.drawImage(im, 0, 0);
}
/** how far across the picture he reaches, in any pose (his hair, the arm out): measured once per person */
var extents: Record<string, number[]> = {};
function extent(c: Coach): number[] {
  var id = c.key + '|' + c.d;
  if (extents[id]) return extents[id];
  var x0 = 1, x1 = 0;
  (['stand', 'wind', 'throw', 'point', 'cheer'] as Pose[]).forEach(function (p) {
    var cv = posed(c.look, 1, c.d, p), g = cv.getContext('2d'), w = cv.width, h = cv.height;
    if (!g) return;
    var px = g.getImageData(0, 0, w, h).data;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 60) { if (x < x0 * w) x0 = x / w; if (x + 1 > x1 * w) x1 = (x + 1) / w; }
  });
  return extents[id] = x1 > x0 ? [x0, x1] : [0.2, 0.8];
}
function setPose(c: Coach, p: Pose) { if (c.pose !== p || c.f) { c.pose = p; c.f = 0; draw(c); } }
function make(side: number, key: string, look: PersonLook): Coach {
  var el = document.createElement('div'), s = SCALE[side], cv = document.createElement('canvas');
  el.className = 'coach ' + (side ? 'opp' : 'me');
  el.id = 'coach-' + side;
  el.setAttribute('aria-hidden', 'true');
  cv.width = 48 * s; cv.height = 44 * s;
  el.appendChild(cv);
  var d: Dir = side ? 'down' : 'right', c: Coach = { side: side, key: key, look: look, d: d, face: d, el: el, cv: cv, pose: 'stand', f: 0, on: false, off: false };
  draw(c);
  /* the trainer behind his creature; Antonio closer to the camera than his own */
  if (side) arena.insertBefore(el, $('w-1')); else arena.appendChild(el);
  return c;
}

/** the battle's shell is drawn: who stands where. `fresh` at the start of a battle, when Antonio's creature is still
    to be thrown in */
export function mountCoaches(fresh: boolean) {
  coaches = [null, null]; cheered = -9; lowSaid = {}; item = null;
  if (watch) { watch.disconnect(); watch = null; }
  var st = S && S.story;
  if (!st || st.tourney != null || !arena) return;
  var fl = st.coach && (st.trainer || st.covo) ? lookOf(st.coach) : null;
  if (fl) {
    var f = coaches[1] = make(1, st.coach!, fl);
    arena.classList.add('coached');
    f.on = isSpecies(S.sides[1].id);
    f.el.classList.toggle('on', f.on);
    if (!f.on) f.off = true;
    /* he has just sent it in: the arm still out, as the curtain opens */
    else if (fresh && !reduced) { setPose(f, 'throw'); sleep(900).then(function () { setPose(f, 'stand'); }); }
  }
  var hk = firstHuman(), hl = hk ? lookOf('p:' + hk) : null;
  if (hl) {
    var h = coaches[0] = make(0, 'p:' + hk, hl);
    arena.classList.add('hero');
    if (!isSpecies(S.sides[0].id)) h.off = true;
    else if (fresh) {
      /* the first creature is still in his hand: it comes on with his throw (coachAnim, 'enter') */
      h.on = true; h.el.classList.add('on');
      $('m-0').classList.add('gone');
    }
  }
  fit();
  if (typeof ResizeObserver !== 'undefined') { watch = new ResizeObserver(function () { fit(); }); watch.observe(arena); }
}

/* ---------- each in his own strip ---------- */
/** Antonio on the left, his creature, the foe's creature, its trainer on the right: side by side, none on another.
    The creatures keep the size the stylesheet gives them unless there is no room (on a phone they get smaller); the
    two people are sized on the room left under the boxes */
function fit() {
  var h = coaches[0], f = coaches[1], w0 = $('w-0'), w1 = $('w-1');
  if (!arena || !arena.isConnected || !w0 || !w1 || (!h && !f)) return;
  w0.style.left = w0.style.width = w1.style.right = w1.style.width = '';
  var A = arena.getBoundingClientRect(), W = A.width, H = A.height, top = 0;
  if (!W || !H) return;
  arena.querySelectorAll('.box').forEach(function (b) { var r = b.getBoundingClientRect(); if (r.height) top = Math.max(top, r.bottom - A.top); });
  var room = Math.max(110, H - top - 6), m = Math.max(4, W * 0.012), gap = Math.max(6, W * 0.014), used = 2 * m + gap, hh = 0, hc = 0,
    eh = h ? extent(h) : [0, 0], ef = f ? extent(f) : [0, 0], kh = (eh[1] - eh[0]) * ASPECT, kf = (ef[1] - ef[0]) * ASPECT;
  /* how wide each of them is, for his height: kh, kf */
  if (h) { hh = Math.max(96, Math.min(room * 0.7, 300)); used += kh * hh + gap; }
  if (f) { hc = Math.max(80, Math.min(room * 0.52, 220)); used += kf * hc + gap; }
  var a = w0.offsetWidth, b = w1.offsetWidth, R = W - used;
  if (a + b > R && R > 0) {
    /* not enough room: the people get smaller first, down to a point, then the creatures */
    var spare = (h ? kh * (hh - 96) : 0) + (f ? kf * (hc - 80) : 0), short = a + b - R, cut = Math.min(short, spare);
    if (cut > 0) {
      var t = cut / spare;
      if (h) hh -= (hh - 96) * t;
      if (f) hc -= (hc - 80) * t;
      short -= cut;
    }
    if (short > 0) { var k = (a + b - short) / (a + b); a *= k; b *= k; }
  }
  if (h) {
    h.el.style.height = hh + 'px';
    /* the back of his hair at the margin, his feet just in front of his creature's */
    h.el.style.left = (m - eh[0] * ASPECT * hh) + 'px';
    h.el.style.bottom = (12 - 0.06 * hh) + 'px';
    w0.style.left = (m + kh * hh + gap) + 'px';
  }
  w0.style.width = a + 'px';
  if (f) {
    f.el.style.height = hc + 'px';
    f.el.style.right = (m - (1 - ef[1]) * ASPECT * hc) + 'px';
    w1.style.right = (m + kf * hc + gap) + 'px';
  }
  w1.style.width = b + 'px';
}

/* ---------- walking in and out ---------- */
function walking(c: Coach, face: Dir, ms: number) {
  if (c.steps) clearInterval(c.steps);
  c.face = face; c.pose = 'stand';
  var n = 0, seq = [1, 0, 2, 0];
  c.f = 1; draw(c);
  c.steps = setInterval(function () { c.f = seq[++n % 4]; draw(c); }, 105);
  setTimeout(function () { if (c.steps) { clearInterval(c.steps); c.steps = undefined; } c.face = c.d; c.f = 0; draw(c); }, ms);
}
function show(c: Coach): Promise<unknown> {
  if (c.out) { clearTimeout(c.out); c.out = undefined; }
  if (c.on || c.off) return Promise.resolve();
  c.on = true;
  c.el.classList.add('on');
  if (reduced) { draw(c); return Promise.resolve(); }
  if (c.side) return animate(c.el, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  /* he walks in from the edge, a step every tenth of a second */
  walking(c, 'right', 480);
  return animate(c.el, [{ transform: 'translateX(-130%)' }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.25, .7, .35, 1)' });
}
function hide(c: Coach, now?: boolean) {
  if (c.out) { clearTimeout(c.out); c.out = undefined; }
  if (!c.on) return;
  c.on = false;
  if (now || reduced) { c.el.classList.remove('on'); setPose(c, 'stand'); return; }
  if (c.side) {
    animate(c.el, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).then(function () { if (!c.on) c.el.classList.remove('on'); });
    return;
  }
  /* he turns round and walks off the way he came */
  walking(c, 'left', 520);
  animate(c.el, [{ transform: 'none' }, { transform: 'translateX(-140%)' }], { duration: 520, easing: 'cubic-bezier(.5, 0, .8, .6)' })
    .then(function () { if (!c.on) { c.el.classList.remove('on'); c.face = c.d; setPose(c, 'stand'); } });
}
/** Antonio leaves the field after a while; the trainer behind never does */
function later(c: Coach, ms: number) {
  if (c.out) clearTimeout(c.out);
  if (!c.side) c.out = setTimeout(function () { c.out = undefined; hide(c); }, reduced ? 400 : ms);
}
function strike(c: Coach, p: Pose, ms: number) {
  if (c.steps) { clearInterval(c.steps); c.steps = undefined; c.face = c.d; }
  setPose(c, p);
  if (c.back) clearTimeout(c.back);
  c.back = setTimeout(function () { c.back = undefined; setPose(c, 'stand'); }, ms);
}
function hop(c: Coach, h: number) {
  if (reduced) return;
  animate(c.cv, [{ transform: 'none' }, { transform: 'translateY(' + (-h) + '%) scaleY(1.03)', offset: 0.35 }, { transform: 'scaleY(.97)', offset: 0.75 }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
}
/** the throw, with the whole body: Antonio leans into it, the trainer gives a little jump */
function lunge(c: Coach) {
  if (reduced) return;
  if (c.side) { hop(c, 3); return; }
  animate(c.cv, [{ transform: 'none' }, { transform: 'translateX(-3%) rotate(-4deg)', offset: 0.25 }, { transform: 'translateX(6%) rotate(7deg)', offset: 0.5 }, { transform: 'none' }], { duration: 560, easing: 'ease-out' });
}
/** where the hand is that throws, in the arena */
export function coachHand(i: number): number[] | null {
  var c = coaches[i];
  if (!c || !c.on || !arena) return null;
  var r = rel(c.cv), pt = handAt(c.face, c.pose);
  return [r.x + r.w * pt[0], r.y + r.h * pt[1]];
}
function tint(i: number): string {
  var sp = S.sides[i].id;
  return isSpecies(sp) ? 'var(--t-' + SPECIES[sp].type.toLowerCase() + ')' : '#ffe45c';
}
/** a little light that flies on an arc, with three sparks behind: from the hand to where the creature will stand, or
    back from the creature into the hand */
function orb(from: number[] | null, to: number[] | null, color: string, ms: number): Promise<unknown> {
  if (!from || !to || reduced) return Promise.resolve();
  var mx = (from[0] + to[0]) / 2, my = Math.min(from[1], to[1]) - Math.max(36, Math.abs(to[0] - from[0]) * 0.22);
  var path = function (s0: number, s1: number, o0: number, o1: number) {
    return [
      { transform: 'translate(' + from[0] + 'px,' + from[1] + 'px) scale(' + s0 + ')', opacity: o0 },
      { transform: 'translate(' + mx + 'px,' + my + 'px) scale(' + (s0 + s1) / 2 + ')', opacity: 1, offset: 0.5 },
      { transform: 'translate(' + to[0] + 'px,' + to[1] + 'px) scale(' + s1 + ')', opacity: o1 }
    ];
  };
  [1, 2, 3].forEach(function (n) {
    var sp = fx('<i class="coach-spark" style="--mc:' + color + '"></i>', 'coach-fly', 0, 0, 0);
    animate(sp, path(0.5, 0.3, 0, 0), { duration: ms, delay: n * 45, easing: 'ease-in-out' }).then(function () { sp.remove(); });
  });
  var el = fx('<i class="coach-orb" style="--mc:' + color + '"></i>', 'coach-fly', 0, 0, 0);
  return animate(el, path(0.55, 1.4, 0.5, 0), { duration: ms, easing: 'ease-in-out' }).then(function () { el.remove(); });
}
function spot(i: number, fy: number): number[] | null {
  var w = $('w-' + i);
  if (!w) return null;
  var r = rel(w);
  return [r.x + r.w * 0.5, r.y + r.h * fy];
}
/** what he shouts, in a comic bubble by his head */
function shout(c: Coach, text: string) {
  if (!c.on) return;
  var r = rel(c.cv), x = r.x + r.w * (c.side ? 0.32 : 0.62), y = r.y + r.h * 0.04;
  /* a new word takes the place of the last one */
  if (c.said) c.said.remove();
  var el = c.said = fx('<div class="coach-say' + (c.side ? ' opp' : '') + '">' + esc(text) + '</div>', 'coach-bubble', x, y, 0);
  animate(el, [
    { transform: 'translate(-50%, -100%) translateY(10px) scale(.4) rotate(-6deg)', opacity: 0 },
    { transform: 'translate(-50%, -100%) translateY(-4px) scale(1.08) rotate(2deg)', opacity: 1, offset: 0.12 },
    { transform: 'translate(-50%, -100%) scale(1) rotate(0)', opacity: 1, offset: 0.2 },
    { transform: 'translate(-50%, -100%) translateY(-4px) scale(1)', opacity: 1, offset: 0.85 },
    { transform: 'translate(-50%, -100%) translateY(-12px) scale(.96)', opacity: 0 }
  ], { duration: reduced ? 1 : 1700, easing: 'ease-out', fill: 'forwards' }).then(function () { el.remove(); if (c.said === el) c.said = undefined; });
}
/** a mark over his head: `!` when his creature falls, little stars when he cheers */
function mark(c: Coach, kind: 'oh' | 'yay') {
  if (!c.on || reduced) return;
  var r = rel(c.cv), x = r.x + r.w * 0.5, y = r.y + r.h * 0.06;
  if (kind === 'oh') {
    var el = fx('<i class="coach-mark">!</i>', 'coach-fly', x, y, 0);
    animate(el, [{ transform: 'translate(-50%, 0) scale(.2)', opacity: 0 }, { transform: 'translate(-50%, -14px) scale(1.15)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%, -12px) scale(1)', opacity: 1, offset: 0.8 }, { transform: 'translate(-50%, -18px)', opacity: 0 }], { duration: 900, easing: 'ease-out' }).then(function () { el.remove(); });
    return;
  }
  [-1, 0, 1].forEach(function (k) {
    var st = fx('<i class="coach-star">★</i>', 'coach-fly', x + k * r.w * 0.18, y + Math.abs(k) * 8, 0);
    animate(st, [{ transform: 'translate(-50%, 0) scale(.3) rotate(0)', opacity: 0 }, { transform: 'translate(-50%, -20px) scale(1) rotate(' + (k * 25) + 'deg)', opacity: 1, offset: 0.4 }, { transform: 'translate(-50%, -30px) scale(.7) rotate(' + (k * 50) + 'deg)', opacity: 0 }], { duration: 750, delay: (k + 1) * 70, easing: 'ease-out' }).then(function () { st.remove(); });
  });
}
function nameOn(i: number): string { var x = S.sides[i]; return x.nick || fighter(x.id).name; }
function pick<T>(xs: T[]): T { return xs[Math.floor(Math.random() * xs.length)]; }

/** the arm back, the throw, the light into the field: done when the light lands */
function throwIn(c: Coach, i: number): Promise<unknown> {
  setPose(c, 'wind');
  return sleep(reduced ? 0 : 170).then(function () {
    strike(c, 'throw', 650); lunge(c);
    return orb(coachHand(c.side), spot(i, 0.6), tint(i), 360);
  });
}

/* ---------- the battle's events ---------- */
/** a sign of the battle is about to be shown: who throws, who calls back. What it gives back is waited for (the throw) */
export function coachAnim(ev: Extract<BattleEvent, { k: 'anim' }>): Promise<unknown> | null {
  var i = ev.who, c0 = coaches[i];
  if (!c0) return null;
  const c: Coach = c0;
  var mon = isSpecies(S.sides[i].id);
  switch (ev.a) {
    case 'enter': {
      var m = $('m-' + i);
      if (!mon) { if (m) m.classList.remove('gone'); hide(c, true); c.off = true; return null; }
      c.off = false;
      /* whatever happens to the show, the creature does not stay hidden */
      setTimeout(function () { if (m) m.classList.remove('gone'); }, 1800);
      return show(c).then(function () {
        if (!c.side) shout(c, pick(['Vai, ', 'Tocca a te, ', 'Forza, ']) + nameOn(i) + '!');
        return throwIn(c, i);
      }).then(function () {
        if (m) { m.classList.remove('gone'); m.classList.add('thrown'); setTimeout(function () { m.classList.remove('thrown'); }, 700); }
        later(c, 1100);
      });
    }
    case 'recall':
      if (!mon || c.off) return null;
      /* he points, and the creature goes back into his hand as a light */
      return show(c).then(function () {
        strike(c, 'point', 900);
        if (!c.side) shout(c, nameOn(i) + ', rientra!');
        sleep(160).then(function () { orb(spot(i, 0.55), coachHand(c.side), tint(i), 380); });
      });
    case 'faint':
      if (!mon || c.off) return null;
      /* Antonio comes to see who goes next; the trainer behind takes it badly */
      if (!c.side) show(c).then(function () { strike(c, 'point', 700); });
      else { mark(c, 'oh'); hop(c, 2); }
      return null;
    case 'net':
      if (i !== 0 || c.off) return null;
      return show(c).then(function () {
        setPose(c, 'wind');
        return sleep(reduced ? 0 : 150);
      }).then(function () { strike(c, 'throw', 700); lunge(c); later(c, 2400); });
    default: return null;
  }
}
/** a blow lands: now and then he cheers, or shouts to hold on */
export function coachHit(ev: Extract<BattleEvent, { k: 'hp' }>) {
  if (!ev.dmg || !S) return;
  var h = coaches[0], f = coaches[1], good = !!ev.crit || (ev.eff != null && ev.eff > 1), i = ev.who;
  if (i === 1 && good && ev.hp > 0) {
    if (h && !h.off && isSpecies(S.sides[0].id) && S.turn - cheered >= 3 && Math.random() < 0.7) {
      cheered = S.turn;
      const hc: Coach = h;
      show(hc).then(function () { strike(hc, 'cheer', 800); hop(hc, 5); mark(hc, 'yay'); shout(hc, pick(['Grande, ', 'Così, ', 'Vai così, ']) + nameOn(0) + '!'); later(hc, 1600); });
    }
    if (f && f.on) { hop(f, 3); mark(f, 'oh'); }
  }
  if (i === 0) {
    var k = S.sides[0].key || S.sides[0].id;
    if (h && !h.off && isSpecies(S.sides[0].id) && ev.hp > 0 && ev.hp <= S.sides[0].max * 0.3 && !lowSaid[k]) {
      lowSaid[k] = true;
      const hc: Coach = h;
      show(hc).then(function () { strike(hc, 'point', 900); shout(hc, pick(['Resisti, ', 'Tieni duro, ', 'Non mollare, ']) + nameOn(0) + '!'); later(hc, 1600); });
    }
    if (f && f.on && good) { strike(f, 'cheer', 700); hop(f, 4); mark(f, 'yay'); }
  }
}
/** another fighter takes that side: who steps in in person has nobody behind him; a creature comes out of the hand */
export function coachSwap(ev: Extract<BattleEvent, { k: 'swap' }>) {
  var c = coaches[ev.who];
  if (!c) return;
  if (!isSpecies(ev.id)) {
    hide(c, ev.who === 0); c.off = true;
    return;
  }
  c.off = false;
  if (!reduced) $('m-' + ev.who).classList.add('gone');
}
/** the player picks the turn: a tiella or the balm, handed over by Antonio when the creature takes it */
export function coachTurn(mine: string | undefined) { item = mine === 'tiella' || mine === 'balsamo' ? mine : null; }
export function coachExpr(ev: Extract<BattleEvent, { k: 'expr' }>) {
  var h0 = coaches[0];
  if (!item || !h0 || h0.off || ev.who !== 0 || ev.v !== 'grin') return;
  const h: Coach = h0;
  var it = item;
  item = null;
  show(h).then(function () {
    setPose(h, 'wind');
    return sleep(reduced ? 0 : 140);
  }).then(function () {
    strike(h, 'throw', 650); lunge(h);
    var a = coachHand(0), b = spot(0, 0.45);
    if (a && b && !reduced) {
      var el = fx('<div class="pop coach-item">' + bagIcon(it) + '</div>', 'coach-fly', 0, 0, 0), mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - 50;
      animate(el, [{ transform: 'translate(' + a[0] + 'px,' + a[1] + 'px) scale(.6) rotate(0)' }, { transform: 'translate(' + mx + 'px,' + my + 'px) scale(1) rotate(-200deg)', offset: 0.5 }, { transform: 'translate(' + b[0] + 'px,' + b[1] + 'px) scale(.8) rotate(-360deg)', opacity: 0 }],
        { duration: 460, easing: 'ease-in-out' }).then(function () { el.remove(); });
    }
    later(h, 1300);
  });
}

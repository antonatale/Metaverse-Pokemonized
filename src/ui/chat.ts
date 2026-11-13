import { st, save } from '../save/story-progress';
import { flag } from '../story/plot';
import { firstHuman, formNow } from '../story/growth';
import { rivalFriend } from '../story/rival-who';
import { CHATS, GROUP, type Chat } from '../data/chat';
import { CHARS, ROSTER, type FriendId } from '../data/characters';
import { busy } from '../story/movement';
import { sheet, closeSheet } from './story-screen';
import { SPR } from '../render/svg';
import { heroText } from '../story/growth';
import { esc, each, $, reduced } from './dom';
import { sfx } from '../audio';

/* «il caminetto», the group chat (data/chat.ts), on a phone on the screen. When the moment of a chat has come and
   nothing else is going on, the phone buzzes and comes up: the friends write one after the other, each with "is
   typing…" first, in bubbles with their face and their name in their colour; at the end the player can answer. Whoever
   is played does not write; the rival writes as the rival (Tullio is not in the group). The phone can be taken out at
   any time (the button in the corner, or T) to read the chat again. A story opened after its moments had passed does
   not get them all at once: what was already due when it was opened is counted as read. */

var primed = '';
const due = (c: Chat) => (c.after ? flag(c.after) : c.badges != null ? (st.badges || []).length >= c.badges : false);
/** the lines of a chat for this story: who writes each one */
function linesOf(c: Chat): [FriendId, string][] {
  var me = firstHuman(), rv = rivalFriend(), hasRival = c.lines.some(function (l) { return l[0] === 'rival'; });
  return c.lines.map(function (l): [FriendId, string] | null {
    var who = l[0] === 'rival' ? rv : l[0];
    if (!who || who === me || (hasRival && l[0] !== 'rival' && who === rv)) return null;
    return [who as FriendId, heroText(l[1])];
  }).filter(function (l): l is [FriendId, string] { return !!l; });
}
/** the next chat, if its moment has come; `quiet` says nothing else is going on */
export function groupChat(quiet: boolean) {
  var slot = String(st.first) + '|' + (st.squad || []).join(',');
  if (primed !== slot) { primed = slot; CHATS.forEach(function (c) { if (due(c)) st.seen['chat-' + c.id] = true; }); return; }
  if (!quiet || busy) return;
  var c = CHATS.filter(function (x) { return !st.seen['chat-' + x.id] && due(x); })[0];
  if (c) playChat(c.id);
}

/* ---------- the phone ---------- */
const hm = (t: number) => { var d = new Date(t); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };
function dayOf(t: number): string {
  var d = new Date(t), now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Oggi';
  return d.getDate() + ' ' + ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'][d.getMonth()];
}
/** the fire in the hearth: the picture of the group */
const HEARTH = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#4a2c1c"/><path d="M8 40h32v4H8z" fill="#2a1a10"/>' +
  '<path d="M13 37l22-6M13 31l22 6" stroke="#8a5a3c" stroke-width="4.5" stroke-linecap="round"/>' +
  '<path d="M24 9c3 6 10 9 9 18-1 6-5 9-9 9s-9-3-9-9c0-5 4-7 5-11 1 3 3 4 4 4-1-4-1-8 0-11z" fill="#ff8a3c"/>' +
  '<path d="M24 19c2 4 6 6 5 11-1 3-3 5-5 5s-5-2-5-5c0-3 2-4 3-6 0 2 1 2 2 3 0-3-1-5 0-8z" fill="#ffd166"/></svg>';
const avatar = (id: FriendId) => '<span class="ph-face" style="--tc:var(--t-' + CHARS[id].type.toLowerCase() + ')">' + SPR.personIn(id, formNow(id), 'smirk', '', SPR.thumb(id)) + '</span>';
function bubble(id: FriendId, text: string, at: number, first: boolean): string {
  return '<div class="ph-msg in' + (first ? ' first' : '') + '">' + (first ? avatar(id) : '<span class="ph-face"></span>') + '<div class="ph-b">' +
    (first ? '<b class="ph-name" style="--tc:var(--t-' + CHARS[id].type.toLowerCase() + ')">' + esc(CHARS[id].name) + '</b>' : '') +
    '<p>' + esc(text) + '<small>' + hm(at) + '</small></p></div></div>';
}
const mine = (text: string, at: number) => '<div class="ph-msg out"><div class="ph-b"><p>' + esc(text) + '<small>' + hm(at) + ' <i class="ph-tick">✓✓</i></small></p></div></div>';
const pill = (label: string, at: number) => '<div class="ph-day"><span>' + esc(dayOf(at)) + ' · ' + esc(label) + '</span></div>';
/** who is in the group, for the line under its name: everyone but whoever is played */
function members(): string { var me = firstHuman(); return ROSTER.filter(function (f) { return f !== me; }).map(function (f) { return CHARS[f].name; }).join(', ') + ', tu'; }
function phone(): HTMLElement {
  sheet('<div class="phone" role="dialog" aria-modal="true" aria-label="Telefono: ' + GROUP + '"><div class="ph-screen">' +
    '<div class="ph-status" aria-hidden="true"><span id="ph-clock">' + hm(Date.now()) + '</span><span class="ph-island"></span><span class="ph-sig"><i></i><i></i><i></i><i></i> 5G <b class="ph-bat"></b></span></div>' +
    '<div class="ph-head"><button class="ph-back" type="button" id="ph-x" aria-label="Metti via il telefono">‹</button><span class="ph-av">' + HEARTH + '</span>' +
    '<span class="ph-title"><b>' + GROUP + '</b><small id="ph-sub">' + esc(members()) + '</small></span></div>' +
    '<div class="ph-chat" id="ph-chat" aria-live="polite"></div>' +
    '<div class="ph-foot"><div class="ph-replies" id="ph-replies" hidden></div><div class="ph-input" aria-hidden="true"><span>Messaggio</span><i>➤</i></div></div>' +
    '</div></div>', 'phone-ov');
  return $('ph-chat');
}
var playing: { skip: () => void; done: () => void } | null = null;
function scrollDown(el: HTMLElement) { el.scrollTop = el.scrollHeight; }
function closePhone(then?: () => void) {
  playing = null; document.removeEventListener('keydown', keys, true);
  closeSheet(); sfx('click');
  if (then) then();
}
function keys(e: KeyboardEvent) {
  if (!playing) return;
  /* on a button of the phone, Enter presses it */
  if ((e.key === 'Enter' || e.key === ' ') && (e.target as HTMLElement).tagName === 'BUTTON') return;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopImmediatePropagation(); playing.skip(); }
  else if (e.key === 'Escape' || e.key === 't' || e.key === 'T') { e.preventDefault(); e.stopImmediatePropagation(); playing.done(); }
}
/** the history of the chat, as it was: every chat had so far, with what the player answered */
function history(el: HTMLElement, skip?: string) {
  var html = '';
  CHATS.forEach(function (c) {
    if (!st.seen['chat-' + c.id] || c.id === skip) return;
    var rec = (st.chats || {})[c.id], at = rec ? rec.at : Date.now(), prev = '';
    html += pill(c.label, at);
    linesOf(c).forEach(function (l) { html += bubble(l[0], l[1], at, l[0] !== prev); prev = l[0]; });
    if (rec && rec.reply) html += mine(rec.reply, at);
  });
  el.innerHTML = html || (skip ? '' : '<p class="ph-empty">Ancora niente: il gruppo si sveglia quando succede qualcosa.</p>');
  scrollDown(el);
}
/** the phone out of the pocket: the chat so far (T, or the button in the corner) */
export function openPhone() {
  if (playing) return;
  var el = phone();
  history(el);
  sfx('pop');
  var done = function () { closePhone(); };
  playing = { skip: done, done: done };
  document.addEventListener('keydown', keys, true);
  $('ph-x').addEventListener('click', done);
}
/** a chat, now: the phone buzzes, comes up, and the friends write one after the other; then `then` */
export function playChat(id: string, then?: () => void) {
  var c = CHATS.filter(function (x) { return x.id === id; })[0];
  if (!c || playing) { if (then) then(); return; }
  st.seen['chat-' + c.id] = true;
  st.chats = st.chats || {};
  var at = Date.now();
  st.chats[c.id] = { at: at };
  save();
  var ls = linesOf(c);
  if (!ls.length) { if (then) then(); return; }
  sfx('buzz');
  var el = phone(), sub = $('ph-sub'), replies = $('ph-replies'), k = 0, timer = 0, tick = 0, typing: HTMLElement | null = null, prev = '';
  history(el, c.id);
  el.insertAdjacentHTML('beforeend', pill(c.label, at));
  scrollDown(el);
  var finished = false;
  var end = function () {
    finished = true; clearTimeout(timer); clearInterval(tick);
    sub.textContent = members();
    replies.hidden = false;
    replies.innerHTML = (c.replies || ['👍', '😂', '🔥']).map(function (r) { return '<button type="button" class="ph-chip">' + esc(r) + '</button>'; }).join('') +
      '<button type="button" class="ph-chip ph-away" id="ph-away">Metti via il telefono</button>';
    each(replies.querySelectorAll('.ph-chip:not(.ph-away)'), function (b) {
      b.addEventListener('click', function () {
        var r = b.textContent || '';
        st.chats![c.id].reply = r; save();
        el.insertAdjacentHTML('beforeend', mine(r, Date.now())); scrollDown(el); sfx('msgOut');
        each(replies.querySelectorAll('.ph-chip:not(.ph-away)'), function (o) { (o as HTMLButtonElement).disabled = true; });
        var away = $('ph-away'); away.classList.add('go'); away.focus();
      });
    });
    $('ph-away').addEventListener('click', finish);
    var first = replies.querySelector('button') as HTMLButtonElement | null; if (first) first.focus();
  };
  var finish = function () { if (!finished) { show(true); return; } closePhone(then); };
  /** the next message: "is typing…" for a moment, as long as the message, then the bubble */
  var next = function () {
    if (k >= ls.length) { end(); return; }
    var l = ls[k];
    typing = document.createElement('div');
    typing.className = 'ph-msg in typing' + (l[0] !== prev ? ' first' : '');
    typing.innerHTML = (l[0] !== prev ? avatar(l[0]) : '<span class="ph-face"></span>') + '<div class="ph-b"><i></i><i></i><i></i></div>';
    el.appendChild(typing); scrollDown(el);
    sub.textContent = CHARS[l[0]].name + ' sta scrivendo…';
    clearInterval(tick); tick = window.setInterval(function () { sfx('typing'); }, 150);
    timer = window.setTimeout(function () { show(false); }, reduced ? 200 : 650 + Math.min(1500, l[1].length * 16));
  };
  /** the message being typed comes in (all of them at once with `all`) */
  var show = function (all: boolean) {
    clearTimeout(timer); clearInterval(tick);
    do {
      if (k >= ls.length) break;
      if (typing) { typing.remove(); typing = null; }
      var l = ls[k++];
      el.insertAdjacentHTML('beforeend', bubble(l[0], l[1], Date.now(), l[0] !== prev));
      prev = l[0];
    } while (all);
    scrollDown(el); sfx('msgIn');
    if (k >= ls.length) end(); else timer = window.setTimeout(next, all ? 0 : 380);
  };
  playing = { skip: function () { if (!finished) show(false); }, done: finish };
  document.addEventListener('keydown', keys, true);
  $('ph-x').addEventListener('click', finish);
  el.addEventListener('click', function () { if (!finished) show(false); });
  timer = window.setTimeout(next, reduced ? 100 : 700);
}

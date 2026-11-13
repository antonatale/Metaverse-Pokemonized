import { st, save } from '../save/story-progress';
import { flag } from '../story/plot';
import { firstHuman } from '../story/growth';
import { rivalFriend } from '../story/rival-who';
import { CHATS, type Chat } from '../data/chat';
import { busy } from '../story/movement';
import { say } from './story-screen';
import { sfx } from '../audio';

/* The group chat (data/chat.ts): when its moment has come and nothing else is going on, the phone buzzes and the
   friends write, one line each, in their colours. Whoever is played does not write; the rival writes as the rival
   (Tullio is not in the group). A story opened after its moments had passed does not get them all at once: what was
   already due when it was opened is counted as read. */

var primed = '';
const due = (c: Chat) => (c.after ? flag(c.after) : (st.badges || []).length >= (c.badges || 0));
/** the lines of a chat for this story: who writes each one */
function linesOf(c: Chat): [string, string][] {
  var me = firstHuman(), rv = rivalFriend(), hasRival = c.lines.some(function (l) { return l[0] === 'rival'; });
  return c.lines.map(function (l): [string, string] | null {
    var who = l[0] === 'rival' ? rv : l[0];
    if (!who || who === me || (hasRival && l[0] !== 'rival' && who === rv)) return null;
    return [who, l[1]];
  }).filter(function (l): l is [string, string] { return !!l; });
}
/** the next chat, if its moment has come; `quiet` says nothing else is going on */
export function groupChat(quiet: boolean) {
  var slot = String(st.first) + '|' + (st.squad || []).join(',');
  if (primed !== slot) { primed = slot; CHATS.forEach(function (c) { if (due(c)) st.seen['chat-' + c.id] = true; }); return; }
  if (!quiet || busy) return;
  var c = CHATS.filter(function (x) { return !st.seen['chat-' + x.id] && due(x); })[0];
  if (!c) return;
  st.seen['chat-' + c.id] = true; save();
  var ls = linesOf(c);
  if (!ls.length) return;
  sfx('blip');
  var k = 0, next = function () { if (k >= ls.length) return; var l = ls[k++]; say(['📱 ' + l[1]], l[0], null, next); };
  say(['Il telefono vibra: è il gruppo degli amici.'], null, null, next);
}

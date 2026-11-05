import { type CharId, type FriendId, type Character, type Move } from '../data/characters';
import { fighter } from '../data/fighters';
import { isSpecies } from '../data/creatures';
import { creature } from '../render/svg/creatures';
import type { Mode } from '../battle';
import { SPR } from '../render/svg';
import { reduced, $ } from './dom';

/* What the screens share: type colours and tags, portraits, the three screen elements and the overlay,
   and what the player has picked so far. */

export const TC: Record<string, string> = { Calma: 'var(--t-calma)', Caos: 'var(--t-caos)', Cervello: 'var(--t-cervello)', Chiacchiera: 'var(--t-chiacchiera)', Cuore: 'var(--t-cuore)',
  Corrente: 'var(--t-corrente)', Calore: 'var(--t-calore)', Cielo: 'var(--t-cielo)', Corazza: 'var(--t-corazza)', Crepuscolo: 'var(--t-crepuscolo)' };
export function tc(id: string): string { return TC[fighter(id).type]; }
export function typeTag(t: string): string { return '<span class="type t-' + t.toLowerCase() + '">' + t + '</span>'; }
export function kindTag(m: Move): string { return m.kind === 'atk' ? '<span class="type">Attacco</span>' : '<span class="type">Supporto</span>'; }
export function sleep(ms: number): Promise<void> { return new Promise<void>(function (r) { setTimeout(r, reduced ? Math.min(ms, 60) : ms); }); }
export function face(id: string, expr?: string, cls?: string): string { return id === 'esame' ? SPR.esame('idle', cls) : isSpecies(id) ? creature(id, expr || 'smirk', cls, '10 26 180 170') : SPR.person(id, expr || 'smirk', cls, SPR.thumb(id)); }
/** a fighter's portrait in battle and on the result: a friend, the Esame, or a creature of Formia */
export function bust(id: string, expr?: string, cls?: string, vb?: string, gold?: boolean): string { return id === 'esame' ? SPR.esame(expr || 'idle', cls) : isSpecies(id) ? creature(id, expr || 'smirk', cls, undefined, undefined, gold) : SPR.person(id, expr || 'smirk', cls, vb); }

export const home = $('home'), battle = $('battle'), overlay = $('overlay');
/** the screen on show, and what the player has picked on the home page and in the setup sheet */
export interface View { screen: string; sel: FriendId; hero: string; mode: Mode; p1: FriendId; p2: CharId }
export const view: View = { screen: 'home', sel: 'antonio', hero: 'smirk', mode: 'cpu', p1: 'antonio', p2: 'costanzo' };
export function setScreen(s: string) { view.screen = s; }

export function closeOverlay() { overlay.hidden = true; overlay.innerHTML = ''; overlay.className = 'overlay'; }
overlay.addEventListener('click', function (e) {
  if (e.target === overlay && !overlay.classList.contains('result') && !overlay.classList.contains('pass') && !overlay.classList.contains('bench')) closeOverlay();
});


export type { Character };

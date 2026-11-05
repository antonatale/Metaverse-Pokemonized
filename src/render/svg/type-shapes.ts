/* The little shape of each type's magic, in a 24×24 box: the moon, the bolt, the star, the note, the heart; and for
   the creatures' own types the wave, the flame, the feather, the stone and the setting sun. The spells are made of
   them (ui/effects.ts, ui/spells.ts), and the runes on the creatures are the same shapes (fit). */
import type { TypeName } from '../../data/types';

export const SHAPE: Record<TypeName, string> = {
  Calma: 'M15 3a9 9 0 1 0 6 15A10 10 0 0 1 15 3Z',
  Caos: 'M13 2L5 14h6l-2 8 9-13h-6l3-7Z',
  Cervello: 'M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z',
  Chiacchiera: 'M10 18V5l10-2v12M10 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3ZM20 15a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z',
  Cuore: 'M12 21C5 16 2 12 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 4-3 8-10 13Z',
  /* a wave that curls over */
  Corrente: 'M2 20C3 11 9 4.5 16 5.5C20.6 6.2 22.4 11 19.3 13.6C17 15.5 13.7 13.8 14.5 11C10.5 11.6 8.2 15.5 7.8 20Z',
  /* a flame with its tongue */
  Calore: 'M12 2C13.2 6.5 19 9 19 15A7 7 0 0 1 5 15C5 12 6.5 10 8.5 8.5C8.6 11 9.5 12.4 11 13C10 9 10.5 5 12 2Z',
  /* a feather in the wind */
  Cielo: 'M20.5 2C11 3 5 9 4.5 17L2.8 21L4.2 21.9L7.2 19C15.2 18.4 20.8 11 20.5 2ZM16 7.5L6.5 17.5',
  /* a cut stone, like a shield */
  Corazza: 'M12 2L20 6.5V15.5L12 22L4 15.5V6.5ZM12 2V22M4 6.5L12 11L20 6.5',
  /* the sun going down behind the line of the sea, with its last rays */
  Crepuscolo: 'M5 16A7 7 0 0 1 19 16ZM10.8 2.5H13.2L12 8.5ZM3.4 6.6L5.1 4.9L8.9 9.5ZM20.6 6.6L18.9 4.9L15.1 9.5ZM2 18H22V20.6H2Z'
};

/** a shape moved and scaled into a circle of radius r around (x, y), as a path of its own */
export function fit(t: TypeName, x: number, y: number, r: number): string {
  const s = r / 12, d = SHAPE[t], out: string[] = [];
  const tok = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  let i = 0, cmd = '';
  const n = (): number => parseFloat(tok[i++]);
  const X = (v: number): string => (x + (v - 12) * s).toFixed(2), Y = (v: number): string => (y + (v - 12) * s).toFixed(2), S = (v: number): string => (v * s).toFixed(2);
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) { cmd = tok[i++]; out.push(cmd); if (cmd === 'Z' || cmd === 'z') continue; }
    const abs = cmd === cmd.toUpperCase(), up = cmd.toUpperCase();
    const P = (): string => { const a = n(), b = n(); return abs ? X(a) + ' ' + Y(b) : S(a) + ' ' + S(b); };
    if (up === 'M' || up === 'L') out.push(P());
    else if (up === 'H') out.push(abs ? X(n()) : S(n()));
    else if (up === 'V') out.push(abs ? Y(n()) : S(n()));
    else if (up === 'C') out.push(P() + ' ' + P() + ' ' + P());
    else if (up === 'Q' || up === 'S') out.push(P() + ' ' + P());
    else if (up === 'A') { const rx = n(), ry = n(), rot = n(), la = n(), sw = n(); out.push(S(rx) + ' ' + S(ry) + ' ' + rot + ' ' + la + ' ' + sw + ' ' + P()); }
    else i++;
  }
  return out.join(' ');
}

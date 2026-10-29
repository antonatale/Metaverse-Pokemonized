/* World art: everything on the map is drawn in code with canvas 2D, once, then reused.
   Style: a map drawn in ballpoint on squared paper, coloured with highlighters. Map colours come from
   CSS tokens (--m-*), so the map follows light and dark mode; characters are fixed-colour "stickers"
   with a dark outline. This is the part Phaser will replace. */
import { LEGEND } from '../../data/maps';
import { T, hash } from './draw';
import { palette } from './palette';
import { paintGround } from './ground';
import { paintObject } from './objects';
import { walker, PEOPLE, townsperson } from './walkers';
import { badgeSVG, itemSVG } from '../svg/badges';

export { T, hash, palette, paintGround, paintObject, walker, PEOPLE, townsperson };
export type { Palette } from './palette';
export type { GroundMap, Rect } from './ground';
export type { ObjOpts, Sprite } from './objects';
export type { PersonLook } from './walkers';

/** the whole module as one object, with the same names the old window.WORLD_ART had */
export const WORLD_ART = { T, LEGEND, palette, paintGround, paintObject, walker, PEOPLE, townsperson, badgeSVG, itemSVG, hash };

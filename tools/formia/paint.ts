/* Hand-drawn touches on the generated ground, in tiles (see projection.ts for where real places fall).
   CLEAR empties a rectangle of trees and grass decorations (to: the ground to put there).
   PAINT draws rows of map characters from a corner; a space leaves the tile as it is. */
export interface Clear { x: number; y: number; w: number; h: number; to?: string }
export interface Paint { x: number; y: number; rows: string[]; note?: string }
export const CLEAR: Clear[] = [];
export const PAINT: Paint[] = [];

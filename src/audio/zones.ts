import { sceneFor } from '../data/scenes';

/* Which tune the map plays. The neighbourhood Antonio is in already says which drawn scene sits behind his battles
   (data/scenes.ts), so the music follows the same table: no second list of places to keep. A place without a tune of
   its own keeps the plain `world` one; at night every tune has its quieter version (tracks.ts, `name:night`). */
const BY_SCENE: Record<string, string> = {
  castellone: 'castellone',
  mola: 'mola', porto: 'mola', caposele: 'mola',
  vindicio: 'vindicio', pineta: 'vindicio'
};
/** the track for Antonio on `map`, in neighbourhood `area` (the empty string out in the open), by day or by night */
export function worldMusic(map: string, area: string, night: boolean): string {
  /* indoors, and out in the open, outside any neighbourhood, there is no scene to ask: the plain tune */
  const base = map === 'formia' && area ? BY_SCENE[sceneFor(map, area)] || 'world' : 'world';
  return night ? base + ':night' : base;
}

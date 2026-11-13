/* Map colours come from the CSS tokens --m-*, so the map follows light and dark mode. */
export type Palette = Record<string, string>;

const KEYS = ['paper', 'grid', 'ink', 'grass', 'grass2', 'grass3', 'grass-hi', 'rock3', 'weed', 'path', 'path2', 'road', 'road2', 'sand', 'sand2', 'sea', 'sea2', 'foam', 'wood', 'wood2', 'stone', 'stone2',
  'roof-a', 'roof-b', 'roof-c', 'roof-d', 'wall', 'leaf', 'leaf2', 'trunk', 'clay', 'line', 'hedge', 'flower-a', 'flower-b', 'shadow', 'label',
  'hill', 'hill2', 'rock', 'rock2', 'olive', 'track', 'far', 'far2', 'wall-b', 'wall-c', 'wall-d', 'wall-e', 'wall-f', 'wall-g', 'wall-h', 'shutter-a', 'shutter-b', 'tent-a', 'tent-b',
  'night', 'dusk', 'lamp', 'shade', 'sunlit', 'glint', 'firefly',
  'moto', 'moto2', 'moto3', 'tyre', 'chrome', 'case', 'case2', 'beam', 'tail', 'blinker', 'tartan', 'tartan2'];
export function palette(): Palette {
  var cs = getComputedStyle(document.documentElement), P: Palette = {};
  KEYS.forEach(function (k) { P[k] = (cs.getPropertyValue('--m-' + k) || '').trim() || '#ff00ff'; });
  return P;
}

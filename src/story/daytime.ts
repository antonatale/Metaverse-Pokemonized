/* The hour in Formia. By default it is the hour outside (the device's clock), with the sun rising and setting when it
   really does in Formia that day: after sunset the street lamps come on and the windows light up. The menu can fix it
   to day, sunset or night. The choice has its own key, like the audio switch, so the saves are not touched. */
export type DayMode = 'auto' | 'giorno' | 'tramonto' | 'notte';
export const DAY_MODES: { id: DayMode; label: string }[] = [
  { id: 'auto', label: 'Come fuori' }, { id: 'giorno', label: 'Giorno' }, { id: 'tramonto', label: 'Tramonto' }, { id: 'notte', label: 'Notte' }
];
const KEY = 'lotte-tra-amici:ora:v1';
function load(): DayMode {
  try {
    var v = localStorage.getItem(KEY);
    for (var k = 0; k < DAY_MODES.length; k++) if (DAY_MODES[k].id === v) return DAY_MODES[k].id;
  } catch (e) { /* no storage in this frame: the hour outside */ }
  return 'auto';
}
export let dayMode: DayMode = load();
export function setDayMode(m: DayMode) {
  dayMode = m;
  try { localStorage.setItem(KEY, m); } catch (e) { /* the choice lasts until the page is closed */ }
}

/** sunrise and sunset in Formia (41.26° N, 13.6° E) on the day of d, in hours of the local clock */
export function sunTimes(d: Date): [number, number] {
  var day = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 864e5);
  var rad = Math.PI / 180, decl = 23.44 * rad * Math.sin(2 * Math.PI * (284 + day) / 365), lat = 41.26 * rad;
  /* the hour angle of the sun on the horizon (refraction included), in hours */
  var cosH = (Math.sin(-0.833 * rad) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
  var half = Math.acos(Math.max(-1, Math.min(1, cosH))) * 12 / Math.PI;
  /* noon in Formia: 13.6° E is west of the 15° E of Central European Time, plus the equation of time, plus summer time */
  var b = 2 * Math.PI * (day - 81) / 364, eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  var jan = new Date(d.getFullYear(), 0, 1).getTimezoneOffset(), jul = new Date(d.getFullYear(), 6, 1).getTimezoneOffset();
  var summer = d.getTimezoneOffset() < Math.max(jan, jul) ? 1 : 0;
  var noon = 12 + (4 * (15 - 13.6) - eot) / 60 + summer;
  return [noon - half, noon + half];
}
function hours(d: Date) { return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
/** how dark it is in Formia at d: 0 by day, 1 at night, in between at dawn and dusk */
export function darkness(d: Date): number {
  if (dayMode !== 'auto') return dayMode === 'notte' ? 1 : dayMode === 'tramonto' ? 0.45 : 0;
  var h = hours(d), t = sunTimes(d);
  var ramp = function (a: number, b: number) { return Math.max(0, Math.min(1, (h - a) / (b - a))); };
  /* it gets dark from a quarter of an hour before sunset to an hour after it, and light the other way round at dawn */
  return Math.max(1 - ramp(t[0] - 1, t[0] + 0.25), ramp(t[1] - 0.25, t[1] + 1));
}
/** the warm light of sunset (and, less, of sunrise): strongest as the sun touches the sea */
export function sunset(d: Date): number {
  if (dayMode !== 'auto') return dayMode === 'tramonto' ? 1 : 0;
  var h = hours(d), t = sunTimes(d);
  var bell = function (c: number) { return Math.max(0, 1 - Math.abs(h - c) / 0.9); };
  return Math.max(bell(t[1]), bell(t[0]) * 0.6);
}

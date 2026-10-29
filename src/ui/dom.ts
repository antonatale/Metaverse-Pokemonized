/* Small DOM helpers shared by the screens. */
export const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
export function esc(s: unknown): string { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]; }); }
export function each<T extends Element>(list: ArrayLike<T>, fn: (el: T, i: number) => void) { Array.prototype.forEach.call(list, fn); }
/** an element by id (the screens only ask for ids they have just rendered) */
export function $(id: string): HTMLElement { return document.getElementById(id) as HTMLElement; }

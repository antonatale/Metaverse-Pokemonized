/* A belvedere seen with one's own eyes (Antonio, 21 November 2026): the panorama of render/canvas/panorama.ts over the
   whole screen, wider than it, to look around by dragging, with the arrows or the wheel. The names of what one sees
   are drawn over it and can be hidden. It opens looking a little to the left and turns to the middle, unless motion is
   reduced. Esc, Invio or the button close it; «Dall'alto» goes on to the old view from above (story-screen flyUp). */
import { panorama, type PanoLight } from '../render/canvas/panorama';
import { reduced, esc, $ } from './dom';

var keyFn: ((e: KeyboardEvent) => void) | null = null;
export function panoramaOpen(): boolean { return !!keyFn; }
export function openPanorama(view: { id: string; name: string }, light: PanoLight, onClose: (fromAbove: boolean) => void) {
  var o = $('overlay');
  o.className = 'overlay pano-ov';
  o.innerHTML = '<div class="pano" role="dialog" aria-label="' + esc(view.name) + '"><div class="pano-view" tabindex="0"><div class="pano-wait">Guardi lontano…</div></div>' +
    '<div class="pano-bar"><b>' + esc(view.name) + '</b><span class="pano-hint">Trascina o usa le frecce per guardarti intorno</span>' +
    '<button class="btn pano-names" type="button" aria-pressed="true">Nomi</button>' +
    '<button class="btn pano-sky" type="button">Dall\'alto</button>' +
    '<button class="btn primary pano-close" type="button">Chiudi</button></div></div>';
  o.hidden = false;
  var box = o.querySelector('.pano-view') as HTMLElement, inner: HTMLElement | null = null, P: ReturnType<typeof panorama> | null = null;
  /* the picture is as tall as the screen (less, on a phone held upright) and as wide as its proportions say */
  var fit = function () {
    if (!P || !inner) return;
    var h = Math.min(box.clientHeight || window.innerHeight, Math.max(box.clientWidth * 1.15, 480)), w = h * P.w / P.h;
    inner.style.height = h + 'px'; inner.style.width = w + 'px';
  };
  var mid = function () { return (box.scrollWidth - box.clientWidth) / 2; };
  /* drawn a moment after the sheet is open, so that the words are on the screen while it is computed */
  setTimeout(function () {
    if (!keyFn) return;
    P = panorama(view.id, light, Math.min(1.5, Math.max(1, (window.devicePixelRatio || 1) * 0.75)));
    var svg = '<svg class="pano-labels" viewBox="0 0 ' + P.w + ' ' + P.h + '" aria-hidden="true">' + P.labels.map(function (l) {
      var w = l.text.length * 8.6 + 18;
      return '<path d="M' + l.x.toFixed(1) + ' ' + (l.y + 9).toFixed(1) + ' L' + l.ax.toFixed(1) + ' ' + (l.ay - 2).toFixed(1) + '" stroke="#1c2340" stroke-width="1.6" stroke-dasharray="4 4" fill="none"/>' +
        '<circle cx="' + l.ax.toFixed(1) + '" cy="' + l.ay.toFixed(1) + '" r="3" fill="#1c2340"/>' +
        '<rect x="' + (l.x - w / 2).toFixed(1) + '" y="' + (l.y - 13).toFixed(1) + '" width="' + w.toFixed(1) + '" height="22" rx="7" fill="#fffdf6" fill-opacity=".9" stroke="#1c2340" stroke-width="1.4"/>' +
        '<text x="' + l.x.toFixed(1) + '" y="' + (l.y + 3).toFixed(1) + '" font-family="Patrick Hand, Chalkboard SE, Comic Sans MS, cursive" font-size="17" text-anchor="middle" fill="#1c2340">' + esc(l.text) + '</text>';
    }).join('') + '</svg>';
    box.innerHTML = '<div class="pano-pic"></div>';
    inner = box.firstChild as HTMLElement;
    P.canvas.className = 'pano-canvas'; P.canvas.setAttribute('aria-hidden', 'true');
    inner.appendChild(P.canvas); inner.insertAdjacentHTML('beforeend', svg);
    fit();
    box.scrollLeft = reduced ? mid() : mid() * 0.55;
    if (!reduced) setTimeout(function () { try { box.scrollTo({ left: mid(), behavior: 'smooth' }); } catch (e) { box.scrollLeft = mid(); } }, 350);
  }, 30);
  /* dragging */
  var drag: { x: number; left: number } | null = null;
  box.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, left: box.scrollLeft }; box.setPointerCapture(e.pointerId); box.classList.add('grab'); });
  box.addEventListener('pointermove', function (e) { if (drag) box.scrollLeft = drag.left - (e.clientX - drag.x); });
  var up = function () { drag = null; box.classList.remove('grab'); };
  box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up);
  box.addEventListener('wheel', function (e) { box.scrollLeft += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY); e.preventDefault(); }, { passive: false });
  var names = o.querySelector('.pano-names') as HTMLButtonElement;
  names.addEventListener('click', function () {
    var on = names.getAttribute('aria-pressed') !== 'true';
    names.setAttribute('aria-pressed', on ? 'true' : 'false'); box.classList.toggle('no-names', !on);
  });
  var close = function (fromAbove: boolean) {
    if (keyFn) { document.removeEventListener('keydown', keyFn, true); keyFn = null; }
    window.removeEventListener('resize', fit);
    o.hidden = true; o.innerHTML = ''; o.className = 'overlay';
    onClose(fromAbove);
  };
  (o.querySelector('.pano-close') as HTMLElement).addEventListener('click', function () { close(false); });
  (o.querySelector('.pano-sky') as HTMLElement).addEventListener('click', function () { close(true); });
  keyFn = function (e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'e' || e.key === 'E' || e.key === 'z' || e.key === 'Z') {
      if (e.key === 'Enter' && document.activeElement && (document.activeElement as HTMLElement).tagName === 'BUTTON') return;
      e.preventDefault(); e.stopImmediatePropagation(); close(false);
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); e.stopImmediatePropagation(); box.scrollLeft -= 140; }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); e.stopImmediatePropagation(); box.scrollLeft += 140; }
    else if (e.key === 'n' || e.key === 'N') { e.preventDefault(); names.click(); }
  };
  document.addEventListener('keydown', keyFn, true);
  window.addEventListener('resize', fit);
  box.focus({ preventScroll: true });
}

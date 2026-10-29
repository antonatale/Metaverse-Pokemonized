/* Everything the portrait module draws, as strings: the shared <defs> and every kind of <svg> it hands out.
   The SVG is built by code from parameters, so the same code must give the very same characters. */
import { createHash } from 'node:crypto';

/** a document just good enough for SPR.install(): it records what would be inserted */
function fakeDoc() {
  const inserted = [];
  return {
    inserted,
    getElementById: () => null,
    createElement: () => ({ html: '', set innerHTML(v) { this.html = v; }, get firstChild() { return { html: this.html }; } }),
    body: { firstChild: null, insertBefore: (n) => { inserted.push(n.html); } }
  };
}

export function spriteFacts(SPR) {
  const doc = fakeDoc();
  SPR.install(doc);
  const out = { defs: doc.inserted.join(''), CSS: SPR.CSS, EXPRS: JSON.stringify(SPR.EXPRS), CHARS: JSON.stringify(SPR.CHARS) };
  for (const id of SPR.CHARS) {
    out['thumb ' + id] = SPR.thumb(id);
    for (const x of SPR.EXPRS.concat([undefined, 'nope'])) {
      out['person ' + id + ' ' + x] = SPR.person(id, x);
      out['person ' + id + ' ' + x + ' thumb'] = SPR.person(id, x, 'a b', SPR.thumb(id));
      out['person ' + id + ' ' + x + ' card'] = SPR.person(id, x, '', '0 6 260 294');
    }
  }
  out['thumb nope'] = SPR.thumb('nope');
  for (const f of ['idle', 'angry', 'hurt', 'ko', undefined]) { out['esame ' + f] = SPR.esame(f); out['esame ' + f + ' cls'] = SPR.esame(f, 'x'); }
  out.robot = SPR.robot(); out['robot cls'] = SPR.robot('robot');
  out.antonio = SPR.antonio('grin', 'c', '0 0 260 270');
  return out;
}
export function spriteDigests(SPR) {
  const f = spriteFacts(SPR), out = {};
  for (const k of Object.keys(f)) out[k] = createHash('sha256').update(String(f[k])).digest('hex').slice(0, 24) + ' ' + String(f[k]).length;
  return out;
}

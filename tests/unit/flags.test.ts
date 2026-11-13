import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { MAPS } from '../../src/data/maps';
import { LEGENDS } from '../../src/data/legends';
import { TRAINERS } from '../../src/data/trainers';
import { COVI } from '../../src/data/covi';
import { STONES, flag, linesNow } from '../../src/story/plot';
import { epilogue } from '../../src/story/epilogue';
import { CHOICES } from '../../src/data/choices';
import { endFlag, optionFlag } from '../../src/story/choices';
import { st } from '../../src/save/story-progress';
import { SPECIES } from '../../src/data/creatures';

/* A branch that hangs on a flag nobody sets is a branch nobody will ever see, and nothing fails: the game simply never gets
   there. So here every flag the data reads is looked for among those the game can set. */
function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? sources(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []);
}
/** every flag something in the game can turn on */
function settable(): Set<string> {
  const out = new Set<string>();
  Object.keys(TRAINERS).forEach((id) => out.add('tr-' + id));
  Object.keys(COVI).forEach((id) => out.add(id));
  Object.entries(LEGENDS).forEach(([id, L]) => { out.add('enigma-' + id); if (L.end) (['preso', 'libero', 'patto', 'amico'] as const).forEach((e) => out.add(endFlag(L, e))); });
  Object.values(CHOICES).forEach((c) => c.options.forEach((o) => out.add(optionFlag(c.id, o.id))));
  STONES.forEach((s) => out.add(s.id));
  for (const f of sources('src')) for (const m of fs.readFileSync(f, 'utf8').matchAll(/seen(?:\[['"]([a-z0-9-]+)['"]\]|\.([a-z0-9]+))\s*=[^=]/g)) out.add(m[1] || m[2]);
  return out;
}
/** every flag the data of the game reads, with where */
function read(): [string, string][] {
  const out: [string, string][] = [];
  Object.entries(LEGENDS).forEach(([id, L]) => out.push([L.after, 'the legend ' + id]));
  Object.entries(MAPS).forEach(([id, m]) => {
    (m.npcs || []).forEach((n) => {
      if (n.when && n.when.after) out.push([n.when.after, id + ': ' + n.id]);
      if (n.when && n.when.until) out.push([n.when.until, id + ': ' + n.id]);
      (n.reacts || []).forEach((r) => out.push([r.after, id + ': what ' + n.id + ' says']));
    });
    (m.signs || []).forEach((s) => { if (s.enter) s.enter.after.forEach((f) => out.push([f, id + ': a way in'])); });
  });
  return out;
}

describe('the branches of the story', () => {
  it('hang on flags that can really be set', () => {
    const can = settable();
    for (const [f, where] of read()) expect(can.has(f), where + ' waits for «' + f + '», that nothing sets').toBe(true);
  });
  it('the list above is really reading the game', () => {
    expect(read().length).toBeGreaterThan(15);
    expect(settable().has('tr-mamurra')).toBe(true);
    expect(settable().has('porta-cisterna')).toBe(true);
    expect(settable().has('no-such-flag')).toBe(false);
  });
});

describe('what people say', () => {
  beforeEach(() => { st.seen = {}; st.beaten = {}; });
  const n = { lines: ['Buongiorno.'], reacts: [{ after: 'pietra-mura', say: ['Prima.'] }, { after: 'tr-mamurra', say: ['Dopo.'] }] };
  it('changes with what has happened, the last thing that holds', () => {
    expect(linesNow(n)).toEqual(['Buongiorno.']);
    st.seen['pietra-mura'] = true;
    expect(linesNow(n)).toEqual(['Prima.']);
    st.beaten['tr-mamurra'] = true;
    expect(flag('tr-mamurra')).toBe(true);
    expect(linesNow(n)).toEqual(['Dopo.']);
  });
  it('can come before what they always say, and not take its place', () => {
    const k = { lines: ['Sempre.'], reacts: [{ after: 'pietra-mura', say: ['Oggi.'], keep: true }] };
    st.seen['pietra-mura'] = true;
    expect(linesNow(k)).toEqual(['Oggi.', 'Sempre.']);
  });
  it('stays what it was for someone with nothing to react to', () => {
    expect(linesNow({ lines: ['Ciao.'] })).toEqual(['Ciao.']);
    expect(linesNow({})).toEqual([]);
  });
});

describe('the epilogue', () => {
  beforeEach(() => { st.seen = {}; st.beaten = {}; st.dex = {}; st.mons = []; st.squad = ['antonio']; st.found = {}; });
  it('tells only what has happened', () => {
    st.mons = [{ uid: 'c1', sp: 'polpino', moves: [], bond: 30, nat: 'Sereno' }] as typeof st.mons;
    st.dex = { polpino: 2, cicalina: 1 };
    const t = epilogue().join(' ');
    expect(t).toContain('Polpino è ancora con te');
    expect(t).toContain('2 creature su ' + Object.keys(SPECIES).length + ', e una è stata con te');
    expect(t).not.toContain('Mamurra');
    expect(t).not.toContain('Tullio');
    expect(t).not.toContain('Lamo');
  });
  it('tells two different stories for two different games', () => {
    st.dex = { lamo: 2, giano: 1 };
    st.beaten['tr-mamurra'] = true;
    st.squad = ['antonio', 'costanzo', 'forchetta'];
    st.mons = [{ uid: 'c1', sp: 'gabbi', nick: 'Pino', moves: [], bond: 90, nat: 'Sereno' }] as typeof st.mons;
    const t = epilogue().join(' ');
    expect(t).toContain('fantasma di Mamurra');
    expect(t).toContain('Lamo è con te');
    expect(t).toContain('Giano l\'hai guardato in faccia');
    expect(t).not.toContain('Fuocelmo');
    expect(t).toContain('Costanzo e Forchetta');
    st.beaten['tr-rivale-3'] = true;
    expect(epilogue().join(' '), 'it does not count meetings that may have been missed').not.toContain('tre volte');
    expect(t).toContain('Con Pino ormai vi capite');
  });
});

describe('who says something new', () => {
  it('does not lose what it said about a legend it knows of', () => {
    const m = (MAPS.formia.npcs || []).find((n) => n.id === 'marinaio')!;
    expect(m.lines!.join(' ')).toContain('molo del faro');
    st.seen = {}; st.beaten = {};
    st.beaten['tr-mamurr-peschiere'] = true;
    expect(linesNow(m).join(' '), 'it opens the very moment the legend comes out').toContain('molo del faro');
    expect(linesNow(m).join(' ')).toContain('peschiere');
  });
  it('the guardaparco keeps his word about who walks among the ruins at sunset', () => {
    const g = (MAPS.formia.npcs || []).find((n) => n.id === 'guardaparco')!;
    st.seen = {}; st.beaten = {};
    expect(linesNow(g).join(' ')).toContain('due facce');
    st.seen['sc-tullio1-amico'] = true;
    /* the rival of the story, whoever it is ({rv}: the dialog puts the name in) */
    expect(linesNow(g).join(' ')).toContain('{rv}');
    expect(linesNow(g).join(' ')).toContain('due facce');
  });
});


/* Boot. */
import { ROSTER } from './data/characters';
import type { BattleState } from './battle';
import { SPR } from './render/svg';
import { WORLD, installStoryKeys } from './ui/story-screen';
import { UI, S, resumeBattle, installBattleKeys } from './ui/battle-screen';
import { view, type View } from './ui/common';
import { renderHome } from './ui/home';

/* the story's keys first: they stop the keys that belong to the map before the battle screen sees them */
installStoryKeys();
installBattleKeys();

/* the automated playtests drive the game through these, as they did with the old single file */
const G = window as unknown as Record<string, unknown>;
G.WORLD = WORLD;
G.UI = UI;

/* =================== BOOT (keeps an open battle across updates of the claude.ai artifact) =================== */
interface HotData { v?: number; view?: Partial<View>; battle?: BattleState | null }
interface Hot { snapshot?(fn: () => HotData): void; ready?(fn: (data?: HotData) => void): void; data?: HotData }
const W = window as unknown as { claude?: { hot?: Hot } };
const hot = W.claude && W.claude.hot;
if (hot && hot.snapshot) {
  hot.snapshot(function () {
    return { v: 2, view: view, battle: view.screen === 'battle' && S && S.phase !== 'over' ? JSON.parse(JSON.stringify(S)) : null };
  });
}
function start(data?: HotData) {
  data = data || {};
  if (data.v === 2 && data.view) {
    const saved = data.view as Record<string, string>, into = view as unknown as Record<string, string>;
    ['sel', 'hero', 'mode', 'p1', 'p2'].forEach(function (k) { if (saved[k]) into[k] = saved[k]; });
    if (ROSTER.indexOf(view.sel) < 0) view.sel = 'antonio';
  }
  SPR.install();
  renderHome();
  if (data.v === 2 && data.view && data.view.screen === 'battle' && data.battle && data.battle.v === 2) resumeBattle(data.battle);
  else if (data.v === 2 && data.view && data.view.screen === 'world' && WORLD) WORLD.open(true);
}
if (hot && hot.ready) hot.ready(start); else start(hot && hot.data ? hot.data : {});

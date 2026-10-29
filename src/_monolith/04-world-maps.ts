/* Temporary bridge while the rest of the game is still the old scripts: they read the maps from window. */
import { MAPS } from '../data/maps';
import { COVI } from '../data/covi';
import { GATES } from '../data/gates';

const G = window as unknown as Record<string, unknown>;
G.WORLD_MAPS = MAPS;
G.WORLD_COVI = COVI;
G.WORLD_GATES = GATES;

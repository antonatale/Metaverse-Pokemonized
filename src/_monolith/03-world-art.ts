/* Temporary bridge while the UI and the story mode are still the old scripts: they read the map art from window. */
import { WORLD_ART } from '../render/canvas';

(window as unknown as Record<string, unknown>).WORLD_ART = WORLD_ART;

/* Temporary bridge while the UI and the story mode are still the old scripts: they read the engine from window. */
import { ENGINE } from '../battle';

(window as unknown as Record<string, unknown>).ENGINE = ENGINE;

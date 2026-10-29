/* Temporary bridge while the UI and the story mode are still the old scripts: they read the portraits from window. */
import { SPR } from '../render/svg';

(window as unknown as Record<string, unknown>).SPR = SPR;

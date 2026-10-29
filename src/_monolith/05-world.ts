/* Temporary bridge while the battle screen is still the old script: it reads the story mode from window. */
import { WORLD } from '../ui/story-screen';

(window as unknown as Record<string, unknown>).WORLD = WORLD;

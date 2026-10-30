import type { MapDef } from './types';
import { formia } from './formia';
import { circolo } from './circolo';
import { casa } from './casa';

export type { MapDef } from './types';
export { LEGEND } from './legend';

/** every map of the story, by id */
export const MAPS: Record<string, MapDef> = { formia, circolo, casa };

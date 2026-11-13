import type { MapDef } from './types';
import { formia } from './formia';
import { circolo } from './circolo';
import { casa } from './casa';
import { HOME_MAPS } from './homes';
import { torino, milano, rogoredo, perugia } from './stations';
import { morgana } from './morgana';
import { cisterna } from './cisterna';
import { telepilo } from './telepilo';
import { altieri, barberMay } from './botteghe';
import { COVI_MAPS } from './covi';

export type { MapDef } from './types';
export { LEGEND } from './legend';

/** every map of the story, by id */
export const MAPS: Record<string, MapDef> = { formia, circolo, casa, morgana, cisterna, telepilo, torino, milano, rogoredo, perugia, altieri, 'barber-may': barberMay, ...HOME_MAPS, ...COVI_MAPS };

/* The types. The people have five in a cycle, each beating the next one (TYPES): a matchup between people depends on
   their types, not their moves', and it never changes (the free battles are the same as ever).
   The creatures of Formia have ten (MAGIC_CHART): the five of the people and five of their own, of the sea, the sun,
   the sky, the stone and the dusk. Each one beats two and is beaten by two, and between the first five it is the cycle
   of the people. */
export type PersonType = 'Calma' | 'Caos' | 'Cervello' | 'Chiacchiera' | 'Cuore';
/** the types only the creatures have */
export type WildType = 'Corrente' | 'Calore' | 'Cielo' | 'Corazza' | 'Crepuscolo';
export type TypeName = PersonType | WildType;
export interface TypeInfo { beats: PersonType; why: string }

export const TYPES: Record<PersonType, TypeInfo> = {
  Calma: { beats: 'Caos', why: 'lo spegne' },
  Caos: { beats: 'Cervello', why: 'manda all\'aria i piani' },
  Cervello: { beats: 'Chiacchiera', why: 'smonta le chiacchiere' },
  Chiacchiera: { beats: 'Cuore', why: 'lo convince di tutto' },
  Cuore: { beats: 'Calma', why: 'la scioglie' }
};
export const TYPE_ORDER: PersonType[] = ['Calma', 'Caos', 'Cervello', 'Chiacchiera', 'Cuore'];
export function isPersonType(t: string | null | undefined): t is PersonType { return !!t && Object.prototype.hasOwnProperty.call(TYPES, t); }

/** the magic of a creature's type: what it is, the two it beats and why */
export interface MagicInfo { what: string; beats: [TypeName, TypeName]; why: [string, string] }
export const MAGIC_CHART: Record<TypeName, MagicInfo> = {
  Calma: { what: 'la luna', beats: ['Caos', 'Calore'], why: ['lo spegne', 'lo rinfresca come una notte di luna'] },
  Caos: { what: 'il fulmine', beats: ['Cervello', 'Corrente'], why: ['manda all\'aria i piani', 'il fulmine la scuote tutta'] },
  Cervello: { what: 'la stella', beats: ['Chiacchiera', 'Corazza'], why: ['smonta le chiacchiere', 'trova la crepa'] },
  Chiacchiera: { what: 'il canto', beats: ['Cuore', 'Crepuscolo'], why: ['lo convince di tutto', 'il canto scaccia le ombre'] },
  Cuore: { what: 'il cuore', beats: ['Calma', 'Cielo'], why: ['la scioglie', 'lo riporta a terra'] },
  Corrente: { what: 'il mare', beats: ['Calore', 'Cuore'], why: ['lo spegne con un\'onda', 'lo travolge'] },
  Calore: { what: 'il sole e il fuoco', beats: ['Corazza', 'Chiacchiera'], why: ['fonde la pietra', 'con la canicola nessuno parla più'] },
  Cielo: { what: 'il vento', beats: ['Crepuscolo', 'Calma'], why: ['apre le nuvole e fa luce', 'la mette in burrasca'] },
  Corazza: { what: 'la pietra', beats: ['Cielo', 'Caos'], why: ['il vento ci sbatte contro', 'regge ai fulmini'] },
  Crepuscolo: { what: 'l\'ombra del tramonto', beats: ['Corrente', 'Cervello'], why: ['la notte ferma la marea', 'confonde i pensieri'] }
};
/** the creatures' types, in the order of the chart: the cycle of the people, then the five of the creatures */
export const MAGIC_ORDER: TypeName[] = ['Calma', 'Caos', 'Cervello', 'Chiacchiera', 'Cuore', 'Corrente', 'Calore', 'Cielo', 'Corazza', 'Crepuscolo'];
/** does magic of type a beat a creature of type d? */
export function magicBeats(a: TypeName, d: TypeName): boolean { return MAGIC_CHART[a].beats.indexOf(d) >= 0; }
/** the types whose magic beats t */
export function beatersOf(t: TypeName): TypeName[] { return MAGIC_ORDER.filter(function (a) { return magicBeats(a, t); }); }

/* Five types in a cycle: each beats the next one. A matchup depends on the characters' types, not the moves'. */
export type TypeName = 'Calma' | 'Caos' | 'Cervello' | 'Chiacchiera' | 'Cuore';
export interface TypeInfo { beats: TypeName; why: string }

export const TYPES: Record<TypeName, TypeInfo> = {
  Calma: { beats: 'Caos', why: 'lo spegne' },
  Caos: { beats: 'Cervello', why: 'manda all\'aria i piani' },
  Cervello: { beats: 'Chiacchiera', why: 'smonta le chiacchiere' },
  Chiacchiera: { beats: 'Cuore', why: 'lo convince di tutto' },
  Cuore: { beats: 'Calma', why: 'la scioglie' }
};
export const TYPE_ORDER: TypeName[] = ['Calma', 'Caos', 'Cervello', 'Chiacchiera', 'Cuore'];

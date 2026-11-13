/* The choices of the story: the player decides, the story remembers. Each option is a flag `sc-<choice>-<option>` of st.seen
   (story/choices.ts), so a save with none of them is simply a story that has not got there. They do not split the story
   in two: they change who stands where, what people say and how things end. Every option must be read by something, and
   tests/unit/choices.test.ts checks it: a choice that changes nothing is a lie told to the player. */
export interface ChoiceOption { id: string; label: string; say: string[]; who?: string }
export interface Choice {
  id: string;
  /** who speaks before the question, in order: the last one asks */
  ask: { who: string; say: string[] }[];
  options: ChoiceOption[];
}
export const CHOICES: Record<string, Choice> = {
  /* the rival (a friend, or Tullio in a story that met him), at the first two meetings: be a friend, or rub it in. Both
     ways it goes somewhere: see tullioMood. {rv} is the rival's name, '{rv}' as who speaks is the rival */
  tullio1: { id: 'tullio1', ask: [{ who: '{rv}', say: ['Però ti ho quasi battuto, eh? Ammettilo.'] }], options: [
    { id: 'amico', label: 'Bella lotta, {rv}', say: ['…Davvero? Cioè, lo sapevo. Bella lotta anche a te.'] },
    { id: 'sfotto', label: 'Tutto qui?', say: ['Ridi, ridi. Me la lego al dito.'] }
  ] },
  tullio2: { id: 'tullio2', ask: [{ who: '{rv}', say: ['Tutti dicono sempre: «Guarda {hero}». Io sono stuf{rv-a} di guardarti.'] }], options: [
    { id: 'amico', label: 'Alleniamoci insieme', say: ['Insieme? Nessuno me l\'aveva mai chiesto.', 'Va bene. Ma non dirlo in giro.'] },
    { id: 'sfotto', label: 'Fatti un altro giro', say: ['…Te ne pentirai, {hero}. Conosco gente.'] }
  ] },
  /* the stones, once Mamurra is beaten: the seal of Telepilo, or the power in Antonio's bag */
  pietre: { id: 'pietre', ask: [
    { who: 'Mamurra', say: ['Aspetta. Le hai tu, le tre pietre. Con quelle in tasca sei il più forte di Formia: te lo dice uno che di potere se ne intende.', 'Tienile. Nessuno lo saprà mai.'] },
    { who: 'Cicerone', say: ['Non ascoltarlo. Il sigillo va chiuso: le pietre devono tornare al loro posto, sotto le mura di Castellone.', 'Scegli tu, {hero}. Io l\'esame te l\'ho già fatto.'] }
  ], options: [
    { id: 'sigillo', label: 'Le rimetto al loro posto', who: 'Cicerone', say: ['Promosso. Formia è nata due volte: dalla Formiae dei Romani, e da Castellone e Mola che nel 1862 tornarono a chiamarsi Formia. Oggi l\'hai salvata tu.',
      'Sotto le mura di Castellone ci sono tre nicchie vuote: portale là, di notte. Stai attento: là sotto qualcosa si è svegliato. Lamo, il re dei Lestrigoni. Ti aspetta, ma non si fa prendere facilmente.',
      'Poi il treno: Torino, e un giorno Chicago. Vai pure lontano, {hero}. Ma ricordati da dove vieni.'] },
    { id: 'tenute', label: 'Le tengo io', who: 'Cicerone', say: ['Duemila anni di storia, e tu le metti in borsa insieme alle tielle.',
      'Senti come scaldano? Con quelle in borsa ogni tua creatura può fare la Risonanza, anche senza legame, e parte già con un punto di Slancio.', 'Ma qualcuno se n\'è accorto: di notte, sotto le mura di Castellone, Lamo si è svegliato. E le rivuole indietro.',
      'Formia è nata due volte, e non è mai stata tranquilla. Poi il treno: Torino, e un giorno Chicago. Ricordati da dove vieni. E di chi hai fatto arrabbiare.'] }
  ] }
};

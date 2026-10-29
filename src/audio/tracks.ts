/* The soundtrack, written like a tracker: every bar is 16 steps (sixteenth notes) separated by spaces.
   A note ('C#5', 'Bb3') starts on its step, '-' holds the note before it, '.' is a rest.
   Drums: k kick, s snare, h hat, and combinations like 'kh'. */

export interface Voice {
  type: OscillatorType;
  gain: number;
  cutoff?: number;
  decay?: number;
  sustain?: number;
  release?: number;
  vibrato?: number;
  bars: string[];
}
export interface Track {
  bpm: number;
  /** a loop plays until the scene changes; a jingle plays once */
  loop: boolean;
  voices: Voice[];
  drums?: { gain: number; bars: string[] };
}

const lead = (bars: string[], o: Partial<Voice> = {}): Voice => ({ type: 'square', gain: 0.075, cutoff: 2600, decay: 0.1, sustain: 0.6, release: 0.08, vibrato: 9, ...o, bars });
const bass = (bars: string[], o: Partial<Voice> = {}): Voice => ({ type: 'triangle', gain: 0.3, decay: 0.08, sustain: 0.8, release: 0.05, ...o, bars });
const pluck = (bars: string[], o: Partial<Voice> = {}): Voice => ({ type: 'square', gain: 0.032, cutoff: 2200, decay: 0.09, sustain: 0.15, release: 0.04, ...o, bars });
const repeat = <T>(xs: T[], n: number): T[] => Array.from({ length: n }, () => xs).flat();

export const TRACKS: Record<string, Track> = {
  /* the home page: a sunny little tune, C Am F G */
  home: {
    bpm: 112, loop: true,
    voices: [
      lead([
        'E5 . G5 . C6 - B5 . A5 . G5 - E5 - . .',
        'A5 . C6 . E6 - D6 . C6 . A5 - G5 - . .',
        'F5 . A5 . C6 - A5 . G5 . F5 - A5 - . .',
        'G5 . B5 . D6 - C6 . B5 . G5 . A5 - B5 -'
      ]),
      bass([
        'C3 . C3 . G2 . C3 . C3 . C3 . G2 . E2 .',
        'A2 . A2 . E2 . A2 . A2 . A2 . E2 . C3 .',
        'F2 . F2 . C3 . F2 . F2 . F2 . C3 . A2 .',
        'G2 . G2 . D3 . G2 . G2 . B2 . D3 . B2 .'
      ]),
      pluck([
        'C4 . E4 . G4 . E4 . C4 . E4 . G4 . E4 .',
        'A3 . C4 . E4 . C4 . A3 . C4 . E4 . C4 .',
        'F3 . A3 . C4 . A3 . F3 . A3 . C4 . A3 .',
        'G3 . B3 . D4 . B3 . G3 . B3 . D4 . B3 .'
      ])
    ],
    drums: { gain: 0.6, bars: repeat(['k . h . s . h . k . h . s . h h'], 4) }
  },
  /* Formia from above: a breezy tune with a mandolin tremolo, D G A D Bm G Em A */
  world: {
    bpm: 100, loop: true,
    voices: [
      lead([
        'F#5 - - - A5 - - - D6 - C#6 - B5 - A5 -',
        'B5 - - - G5 - - - B5 - A5 - G5 - F#5 -',
        'E5 - - - A5 - - - C#6 - B5 - A5 - G5 -',
        'F#5 - - - - - - - . . . . A4 - D5 -',
        'D5 - - - F#5 - - - B5 - A5 - F#5 - D5 -',
        'E5 - - - G5 - - - B5 - D6 - B5 - G5 -',
        'G5 - - - F#5 - - - E5 - F#5 - G5 - B5 -',
        'A5 - - - - - - - E5 - - - C#5 - - -'
      ], { type: 'triangle', gain: 0.2, cutoff: undefined, decay: 0.2, sustain: 0.8, vibrato: 14 }),
      bass([
        'D3 - - - . . A2 . D3 - - - . . A2 .',
        'G2 - - - . . D3 . G2 - - - . . D3 .',
        'A2 - - - . . E2 . A2 - - - . . E2 .',
        'D3 - - - . . A2 . D3 - - - . . A2 .',
        'B2 - - - . . F#2 . B2 - - - . . F#2 .',
        'G2 - - - . . D3 . G2 - - - . . D3 .',
        'E2 - - - . . B2 . E2 - - - . . B2 .',
        'A2 - - - . . E2 . A2 - - - . . E2 .'
      ]),
      pluck([
        repeat(['D4 F#4 A4 F#4'], 4).join(' '),
        repeat(['D4 G4 B4 G4'], 4).join(' '),
        repeat(['C#4 E4 A4 E4'], 4).join(' '),
        repeat(['D4 F#4 A4 F#4'], 4).join(' '),
        repeat(['D4 F#4 B4 F#4'], 4).join(' '),
        repeat(['D4 G4 B4 G4'], 4).join(' '),
        repeat(['E4 G4 B4 G4'], 4).join(' '),
        repeat(['C#4 E4 A4 E4'], 4).join(' ')
      ], { gain: 0.026, cutoff: 2800 })
    ],
    drums: { gain: 0.45, bars: repeat(['k . h . h . h . k . h . h . h .'], 8) }
  },
  /* a friendly battle: driving bass, Am F G E */
  battle: {
    bpm: 150, loop: true,
    voices: [
      lead([
        'A4 . C5 . E5 . A5 - G5 . E5 . C5 . E5 .',
        'F5 . E5 . C5 . A4 - C5 . F5 . A5 . G5 .',
        'G5 - D5 . G5 . B5 - A5 . G5 . D5 . B4 .',
        'G#4 . B4 . E5 . G#5 - B5 - - - E5 . G#5 .'
      ]),
      bass([
        'A2 . A3 . A2 . A3 . A2 . A3 . A2 . A3 .',
        'F2 . F3 . F2 . F3 . F2 . F3 . F2 . F3 .',
        'G2 . G3 . G2 . G3 . G2 . G3 . G2 . G3 .',
        'E2 . E3 . E2 . E3 . E2 . E3 . E2 . E3 .'
      ], { type: 'square', gain: 0.12, cutoff: 750, sustain: 0.6 })
    ],
    drums: { gain: 0.7, bars: repeat(['k . h . s . h k k . h . s . h h'], 4) }
  },
  /* the exam: tense and minor, Dm Bb Gm A */
  boss: {
    bpm: 160, loop: true,
    voices: [
      lead([
        'D5 - F5 - A5 - G#5 - A5 - F5 - D5 - E5 -',
        'F5 - D5 - Bb4 - D5 - F5 - Bb5 - A5 - F5 -',
        'G5 - Bb5 - D6 - C6 - Bb5 - G5 - A5 - Bb5 -',
        'C#6 - - - A5 - - - E5 - G5 - F5 - E5 -'
      ], { cutoff: 2200 }),
      bass([
        'D2 D2 . D2 D3 . D2 . D2 D2 . D2 C3 . A1 .',
        'Bb1 Bb1 . Bb1 Bb2 . Bb1 . Bb1 Bb1 . Bb1 A1 . F1 .',
        'G1 G1 . G1 G2 . G1 . G1 G1 . G1 F2 . D2 .',
        'A1 A1 . A1 A2 . A1 . A1 A1 . A1 G2 . E2 .'
      ], { type: 'square', gain: 0.14, cutoff: 600, sustain: 0.5 })
    ],
    drums: { gain: 0.7, bars: repeat(['k . h h s . h k . k h h s . h h'], 4) }
  },
  /* a battle won */
  victory: {
    bpm: 140, loop: false,
    voices: [
      lead(['G4 C5 E5 G5 C6 - - - E6 - D6 - C6 - - -', 'A5 - B5 - C6 - D6 - C6 - - - - - - -'], { gain: 0.09 }),
      bass(['C3 - - - G2 - - - C3 - - - E3 - - -', 'F2 - - - G2 - - - C3 - - - - - - -'])
    ],
    drums: { gain: 0.6, bars: ['k . . . s . . . k . . . s . s s', 'k . . . s . . . k . . . . . . .'] }
  },
  /* a battle lost, or the exam taken away */
  defeat: {
    bpm: 84, loop: false,
    voices: [
      lead(['E5 - - - D#5 - - - D5 - - - C#5 - - -', 'C5 - - - - - - - - - - - . . . .'], { type: 'triangle', gain: 0.18, cutoff: undefined, vibrato: 18 }),
      bass(['A2 - - - - - - - G#2 - - - - - - -', 'A1 - - - - - - - - - - - . . . .'])
    ]
  }
};

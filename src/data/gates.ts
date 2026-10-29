/* City gates: what you need to leave a city (all the pins of that city). */
export interface Gate { city: string; label: string }

export const GATES: Record<string, Gate> = {
  torino: { city: 'formia', label: 'Il treno per Torino' }
};

/* Fixed sticker colours of the exam and the robot, and the hand-written font used inside the SVG. */
export const INK = '#1c2340', RED = '#d8392b', BLUE = '#22378f', HAND = 'Patrick Hand, Comic Sans MS, cursive';

/* ================= shared filters ================= */
export const SHARED =
  '<filter id="fB2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>' +
  '<filter id="fB3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter>' +
  '<filter id="fB6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>' +
  '<filter id="fSoft" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation=".5"/></filter>' +
  '<filter id="fGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.05" numOctaves="2" seed="11" result="n"/>' +
  '<feColorMatrix in="n" type="matrix" values="0 0 0 0 .2  0 0 0 0 .15  0 0 0 0 .13  3.4 0 0 0 -1.25" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in"/></filter>' +
  '<filter id="fKnit" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9 .35" numOctaves="2" seed="5" result="n"/>' +
  '<feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.2 0 0 0 -1.1" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in"/></filter>';

/** metal and lens gradients shared by everyone */
export const GRADIENTS =
  '<linearGradient id="gBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d9a3"/><stop offset=".5" stop-color="#caa56a"/><stop offset="1" stop-color="#8b6b3c"/></linearGradient>' +
  '<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a8"/><stop offset=".5" stop-color="#e3bf6a"/><stop offset="1" stop-color="#9c7629"/></linearGradient>' +
  '<linearGradient id="gSilver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c9ced6"/><stop offset="1" stop-color="#7d838c"/></linearGradient>' +
  '<linearGradient id="gLensDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f3646"/><stop offset="1" stop-color="#0d0f15"/></linearGradient>';

/* Small SVG pictures for the HUD, the menu and the reward screen. */
export interface BadgeLook { color: string; mark: string; earned?: boolean }

/* a small badge drawn for the HUD and the reward screen */
export function badgeSVG(b: BadgeLook, size?: number): string {
  size = size || 40;
  var earned = b.earned !== false;
  return '<svg viewBox="0 0 40 40" width="' + size + '" height="' + size + '" aria-hidden="true">' +
    '<circle cx="20" cy="20" r="17" fill="' + (earned ? b.color : 'none') + '" stroke="currentColor" stroke-width="2.4"' + (earned ? '' : ' stroke-dasharray="3 3"') + '/>' +
    (earned ? '<circle cx="20" cy="20" r="11" fill="#fffdf6" stroke="#1c2340" stroke-width="1.6"/><text x="20" y="24.5" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="12" fill="#1c2340">' + b.mark + '</text>' +
      '<path d="M11 9A13 13 0 0 1 22 6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>' : '') + '</svg>';
}

/* the things Antonio lost around town, for the menu */
export function itemSVG(kind: string, found: boolean, size?: number): string {
  size = size || 32;
  var body = ({
    notes: '<rect x="9" y="5" width="14" height="19" rx="2" fill="#fffdf6"/><path d="M12 10h8M12 14h8M12 18h6" stroke="#8fd0f6"/><path d="M12 5v19" stroke="#d14b3a"/>',
    wallet: '<rect x="6" y="9" width="20" height="14" rx="3" fill="#8a5a3c"/><rect x="15" y="12" width="12" height="8" rx="2" fill="#6b4429"/><circle cx="22.5" cy="16" r="1.4" fill="#ffd166" stroke="none"/>',
    charger: '<path d="M13 8V4M19 8V4"/><rect x="9" y="8" width="14" height="11" rx="3" fill="#f3f3f3"/><path d="M16 19c0 6 9 6 9 0" fill="none"/>',
    passport: '<rect x="9" y="4" width="14" height="21" rx="2" fill="#7a1f2b"/><circle cx="16" cy="12" r="3.6" fill="none" stroke="#ffd166"/>'
  } as Record<string, string>)[kind] || '';
  return '<svg viewBox="0 0 32 32" width="' + size + '" height="' + size + '" aria-hidden="true">' +
    (found ? '' : '<circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 3"/>') +
    '<g stroke="#1c2340" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="' + (found ? 1 : 0.3) + '">' + body + '</g></svg>';
}

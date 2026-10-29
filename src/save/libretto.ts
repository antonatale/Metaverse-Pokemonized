/* The libretto: wins, losses and exam marks, on this device only. Same key and same format as the old
   single-file game, so old records keep working; localStorage can be missing or throw. */
export const KEY = 'lotte-tra-amici:libretto:v2';
export interface ExamRecord { p: number; f: number; best: number | null; lode: boolean }
export interface LibrettoRecord { v: 2; chars: Record<string, { w: number; l: number }>; exam: Record<string, ExamRecord> }

function blankRecord(): LibrettoRecord { return { v: 2, chars: {}, exam: {} }; }
function loadRecord(): LibrettoRecord {
  try {
    var v = JSON.parse(window.localStorage.getItem(KEY) || 'null');
    if (v && v.v === 2 && v.chars && v.exam) return v;
  } catch (e) { /* storage unavailable */ }
  return blankRecord();
}
export function saveRecord() { try { window.localStorage.setItem(KEY, JSON.stringify(record)); } catch (e) { /* ignore */ } }
export const record = loadRecord();

/* A show never stops a battle: if a scene throws, or has not finished in SHOW_MAX ms, the battle goes on without it
   and the error goes to the console. The battle's state is the engine's, untouched by the drawing. */
const SHOW_MAX = 8000;
export function safeShow(run: () => Promise<unknown>, what: string, max = SHOW_MAX): Promise<unknown> {
  var p: Promise<unknown>;
  try { p = run(); } catch (e) { console.error('battle show «' + what + '» failed:', e); return Promise.resolve(); }
  var t: ReturnType<typeof setTimeout> | undefined;
  var late = new Promise<void>(function (r) { t = setTimeout(function () { console.error('battle show «' + what + '» took more than ' + max + ' ms: skipped'); r(); }, max); });
  return Promise.race([p.then(function () {}, function (e) { console.error('battle show «' + what + '» failed:', e); }), late]).then(function () { clearTimeout(t); });
}

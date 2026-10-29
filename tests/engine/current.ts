/* The engine under test: whatever src/ currently ships. */
import '../../src/_monolith/02-engine.js';

export const E = (globalThis as unknown as { ENGINE: unknown }).ENGINE;

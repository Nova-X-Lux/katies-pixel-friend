export const STACK_GOAL = 12;
export const STACK_START_WIDTH = 64;
export const STACK_MIN_WIDTH = 3;

export interface SnackLayer {
  x: number;
  width: number;
}

export type SnackLanding =
  | { landed: false; perfect: false; layer: null }
  | { landed: true; perfect: boolean; layer: SnackLayer };

/** The visible moving layer is trimmed to the part supported by the stack. */
export function landSnack(previous: SnackLayer, movingX: number): SnackLanding {
  if (![previous.x, previous.width, movingX].every(Number.isFinite) || previous.width < STACK_MIN_WIDTH) {
    return { landed: false, perfect: false, layer: null };
  }
  const tolerance = Math.min(2, previous.width * 0.1);
  if (Math.abs(previous.x - movingX) <= tolerance) {
    return { landed: true, perfect: true, layer: { ...previous } };
  }
  const x = Math.max(previous.x, movingX);
  const width = Math.min(previous.x + previous.width, movingX + previous.width) - x;
  if (width < STACK_MIN_WIDTH) return { landed: false, perfect: false, layer: null };
  return { landed: true, perfect: false, layer: { x, width } };
}

/** Motion uses active elapsed time, so pausing never changes the next landing. */
export function getSnackPosition(elapsedMs: number, width: number, placed: number): number {
  const travel = Math.max(0, 100 - width);
  if (!travel) return 0;
  const distance = Math.max(0, elapsedMs) / 1000 * (24 + Math.min(STACK_GOAL, placed) * 2);
  const phase = distance % (travel * 2);
  const x = phase <= travel ? phase : travel * 2 - phase;
  return placed % 2 === 0 ? x : travel - x;
}

export function getSnackStackScore(layers: number, perfects: number): number {
  const count = Math.min(STACK_GOAL, Math.max(0, Math.floor(Number.isFinite(layers) ? layers : 0)));
  const perfectCount = Math.min(count, Math.max(0, Math.floor(Number.isFinite(perfects) ? perfects : 0)));
  return count * 10 + perfectCount * 5 + (count === STACK_GOAL ? 30 : 0);
}

export function getSnackStackReward(layers: number, perfects: number): number {
  const count = Math.min(STACK_GOAL, Math.max(0, Math.floor(Number.isFinite(layers) ? layers : 0)));
  if (!count) return 0;
  const perfectCount = Math.min(count, Math.max(0, Math.floor(Number.isFinite(perfects) ? perfects : 0)));
  return Math.min(18, count + Math.floor(perfectCount / 3) + (count === STACK_GOAL ? 2 : 0));
}

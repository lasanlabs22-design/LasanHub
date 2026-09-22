/**
 * Logs in development only. Release builds stay quiet, so nothing
 * internal can be read off a phone with USB debugging switched on.
 */
export function devLog(...args: unknown[]) {
  if (__DEV__) console.log(...args);
}

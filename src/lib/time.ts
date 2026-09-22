/**
 * "Just now", "5m ago", "3h ago", "2d ago", then a date.
 * Clamped at zero, so a phone with its clock a little behind the
 * server never shows "-2m ago".
 */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

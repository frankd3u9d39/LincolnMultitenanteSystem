// GROUP 4: SuperAdmin Module - display formatting

/**
 * "15m ago" style relative time for a "YYYY-MM-DD HH:mm:ss" timestamp.
 * Timestamps from the API are in the server's timezone, which matches the
 * operator's in this deployment; the value is only used for coarse recency.
 */
export function timeAgo(timestamp: string, now: Date = new Date()): string {
  const then = new Date(timestamp.replace(' ', 'T'));

  if (Number.isNaN(then.getTime())) {
    return timestamp;
  }

  const seconds = Math.max(0, Math.round((now.getTime() - then.getTime()) / 1000));

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`;

  return timestamp.slice(0, 10);
}

/** Storage in GB, switching to TB once it is large enough to read better that way. */
export function formatStorage(gb: number): string {
  return gb >= 1024 ? `${(gb / 1024).toFixed(2)} TB` : `${gb.toFixed(1)} GB`;
}

/** Large counts as 3.48M / 16.2K, for headline figures. */
export function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

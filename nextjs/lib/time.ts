export function timeAgo(dateStr: string): { value: number; unit: "mo" | "w" | "d" | "h" | "m" } {
  const then = new Date(dateStr).getTime();
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return { value: 1, unit: "m" };
  if (minutes < 60) return { value: minutes, unit: "m" };

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { value: hours, unit: "h" };

  const days = Math.floor(hours / 24);
  if (days < 7) return { value: days, unit: "d" };

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return { value: weeks, unit: "w" };

  return { value: Math.floor(days / 30), unit: "mo" };
}

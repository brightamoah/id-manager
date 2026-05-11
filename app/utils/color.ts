export function statusColor(s: string): ColorType {
  if (s === "active") return "success";
  if (s === "full") return "warning";
  return "neutral";
}

export function progressColor(pct: number, status: string): ColorType {
  if (status === "deprecated") return "neutral";
  if (pct >= 100) return "warning";
  if (pct >= 75) return "success";
  return "primary";
}

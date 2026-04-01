export function getInitials(name?: string): string {
  if (!name || typeof name !== "string") return "";

  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

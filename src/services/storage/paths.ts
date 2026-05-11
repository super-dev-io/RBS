export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9_\-\.]/gi, "_")
    .replace(/_+/g, "_")
    .toLowerCase()
    .slice(0, 100);
}

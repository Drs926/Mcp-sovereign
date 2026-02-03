export function envString(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

export function envNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

export function envCsv(name: string): Set<string> {
  const value = process.env[name] ?? "";
  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return new Set(parts);
}

export function envBool(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value.trim() === "") return fallback;
  return value.toLowerCase() === "true" || value === "1";
}

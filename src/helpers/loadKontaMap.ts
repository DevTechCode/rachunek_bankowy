import { GSSClient } from "../lib/GSSClient.ts";

/**
 * Wczytuje mapę kont z arkusza "Konta"
 * Zakłada, że arkusz ma kolumny:
 * | Numer konta | Odbiorca |
 */
export async function loadKontaMap(gss: GSSClient, range: string): Promise<Map<string, string>> {
  const rows = await gss.read(range);

  const map = new Map<string, string>();

  for (const row of rows) {
    const [konto, odbiorca] = row.map((v: string) => v.trim());
    if (konto && odbiorca && /^[0-9]{20,26}$/.test(konto)) {
      map.set(konto, odbiorca);
    }
  }

  console.log(`✅ Załadowano ${map.size} pozycji z arkusza "Konta"`);
  return map;
}


function toYmd(value: unknown): string {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    // jeśli przypadkiem dostaniemy liczbę (Excel serial), przekonwertujmy ją na datę
    const base = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(base.getTime() + value * 86400000);
    return date.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    // jeśli już jest w formacie daty, zostawmy
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
    // inne przypadki — próbujemy z Date.parse
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return "";
}

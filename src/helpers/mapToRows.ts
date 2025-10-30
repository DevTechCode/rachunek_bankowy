import { Operacja } from "../models/Operacja.ts";

function excelSerialToDate(n: number): Date {
  const base = new Date(Date.UTC(1899, 11, 30));
  return new Date(base.getTime() + n * 86400000);
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

function numOrEmpty(n: unknown): number | "" {
  return typeof n === "number" && Number.isFinite(n) ? n : "";
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === "number" && Number.isFinite(value)) return excelSerialToDate(value);
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function operacjeToRows(ops: Operacja[]): (string | number)[][] {
  const HEADER = [
    "data_zlecenia",
    "data_realizacji",
    "typ",
    "rodzaj",
    "kwota",
    "saldo_koncowe",
    "kontrahent",
    "kwota_vat",
    "opis_surowy",
  ];

    const sorted = [...ops].sort((a, b) => {
    const da = toDate(a.dataRealizacji);
    const db = toDate(b.dataRealizacji);
    if (da && db) return da.getTime() - db.getTime();
    return 0;
  });

  const rows: (string | number)[][] = [HEADER];

  for (const o of sorted) {
    rows.push([
      toYmd(o.dataZlecenia),
      toYmd(o.dataRealizacji),
      o.typ ?? "",
      o.rodzaj ?? "",
      numOrEmpty(o.kwota),
      numOrEmpty(o.saldoKoncowe),
      o.nazwaKontrahenta || o.innePola?.kontrahent || "",
      numOrEmpty(o.kwotaVat || ""),
      o.opisSurowy ?? "",
    ]);
  }

  return rows;
}

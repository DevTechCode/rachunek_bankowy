import { Operacja } from "../models/Operacja.ts";

/** Zamiana liczby Excela na datę (Excel serial → JS Date) */
function excelSerialToDate(n: number): Date {
  const base = new Date(Date.UTC(1899, 11, 30));
  return new Date(base.getTime() + n * 86400000);
}

/** Normalizuje daty do formatu YYYY-MM-DD */
function toYmd(value: unknown): string {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return excelSerialToDate(value).toISOString().slice(0, 10);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return "";
}

/** Zwraca liczbę lub pusty string */
function numOrEmpty(n: unknown): number | "" {
  return typeof n === "number" && Number.isFinite(n) ? n : "";
}

/**
 * Konwersja listy Operacja → tablica wierszy do GSS
 */
export function operacjeToRows(ops: Operacja[]): (string | number)[][] {
  const HEADER = [
    "data_zlecenia",
    "data_realizacji",
    "typ",
    "rodzaj",
    "kwota",
    "saldo_koncowe",
    "numer_rachunku",
    "opis_surowy",
  ];

  const rows: (string | number)[][] = [HEADER];

  for (const o of ops) {
    rows.push([
      toYmd(o.dataZlecenia),
      toYmd(o.dataRealizacji),
      o.typ ?? "",
      o.rodzaj ?? "",
      numOrEmpty(o.kwota),
      numOrEmpty(o.saldoKoncowe),
      o.rachunekKontrahenta ?? "",
      o.opisSurowy ?? "",
    ]);
  }

  return rows;
}

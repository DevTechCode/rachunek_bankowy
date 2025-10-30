// src/helpers/mapToRows.ts
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
    return excelSerialToDate(value).toISOString().slice(0, 10);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return "";
}
function numOrEmpty(n: unknown): number | "" {
  return typeof n === "number" && Number.isFinite(n) ? n : "";
}

export function operacjeToRows(ops: Operacja[]): (string | number)[][] {
  const HEADER = [
    "data_zlecenia",
    "data_realizacji",
    "typ",
    "rodzaj",
    "kwota",
    "waluta_kwoty",
    "saldo_koncowe",
    "waluta_salda",
    "opis_surowy",
  ];

  const rows:(string|number)[][] = [HEADER];

  for (const o of ops) {
    rows.push([
      toYmd(o.dataZlecenia),
      toYmd(o.dataRealizacji),
      o.typ ?? "",
      o.rodzaj ?? "",
      numOrEmpty(o.kwota),
      o.walutaKwoty ?? "",
      numOrEmpty(o.saldoKoncowe),
      o.walutaSalda ?? "",
      o.opisSurowy ?? "",
    ]);
  }

  return rows;
}

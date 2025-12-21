import fs from "node:fs/promises";
import path from "node:path";
import type { Transaction } from "../domain/Transaction.js";
import { TransactionSerializer } from "./TransactionSerializer.js";

/**
 * Serwis eksportu danych.
 *
 * Wymaganie: eksport JSON + CSV.
 * - JSON: pełny model (w wersji "JSON-friendly")
 * - CSV: spłaszczone kolumny do analizy w Excel/Sheets
 */
export class ExportService {
  private readonly serializer = new TransactionSerializer();

  /**
   * Zwraca "miesiąc wystawienia faktury".
   *
   * Zgodnie z Twoim wymaganiem: **zawsze defaultowo "-"**.
   * (W razie potrzeby później możemy dodać heurystyki.)
   */
  private invoiceMonth(): string {
    return "-";
  }

  /**
   * Wylicza kolumnę "Rodzaj" zgodnie z wymaganiem:
   * - "koszt" / "przychod" na bazie znaku kwoty
   * - "Vat-" / "Vat+" jeśli wykryto kwotę VAT
   *
   * @param amountMinor - kwota transakcji w minor units
   * @param hasVat - czy jest kwota VAT
   */
  private rodzaj(amountMinor: bigint, hasVat: boolean): string {
    if (hasVat) return amountMinor < 0n ? "vat -" : "vat +";
    return amountMinor < 0n ? "koszt" : "przychód";
  }

  /**
   * Eksportuje transakcje do pliku JSON.
   *
   * @param outFile - ścieżka wyjściowa
   * @param transactions - lista transakcji
   */
  public async exportJson(outFile: string, transactions: Transaction[]): Promise<void> {
    const payload = transactions.map((t) => this.serializer.toJsonObject(t));
    await this.ensureDir(outFile);
    await fs.writeFile(outFile, JSON.stringify(payload, null, 2), "utf8");
  }

  /**
   * Eksportuje transakcje do pliku CSV.
   *
   * CSV jest celowo "wąski" (najczęściej używane pola). Surowy opis jest zachowany,
   * a `details` nie są rozwijane (bo mogłyby generować setki kolumn).
   *
   * @param outFile - ścieżka wyjściowa
   * @param transactions - lista transakcji
   */
  public async exportCsv(outFile: string, transactions: Transaction[]): Promise<void> {
    // Separator CSV: w polskim Excel/Sheets często oczekiwany jest średnik.
    // Dodatkowo opisy transakcji zawierają przecinki (np. kwoty "16.948,96 , 200 ZŁ"),
    // więc użycie ';' minimalizuje ryzyko "rozjechania" kolumn w narzędziach,
    // które naiwnie dzielą po przecinku i ignorują cudzysłowy.
    const delimiter = ";";

    // Polskie tytuły kolumn (zgodnie z wymaganiem).
    // Uwaga: "type" zmienione na "typ_".
    const header = [
      "Data operacji",
      "Data waluty",
      "Rodzaj",
      "Typ",
      "Kategoria",
      "Kwota",
      "Saldo po",
      "Kontrahent",
      "Split payment",
      "Kwota VAT",
      "Formularz",
      "Okres płatności",
      "Numer faktury",
      "Miesiąc wystawienia faktury",
      "isVat",
      "Inwestycja",
      "isFaktura",
      "Link",
      "Uwagi",
      "Opis"
    ];

    const lines = [header.join(delimiter)];
    for (const t of transactions) {
      const vatAmount = t.vatInfo?.vatAmount;
      const hasVat = Boolean(vatAmount && vatAmount.minor !== 0n);
      const row = [
        t.operationDate.toISOString().slice(0, 10),
        t.valueDate.toISOString().slice(0, 10),
        this.csv(this.rodzaj(t.amount.minor, hasVat)),
        this.csv(t.type),
        this.csv(t.category),
        this.csv(t.amount.toNumber().toFixed(t.amount.minorUnits)),
        this.csv(t.endingBalance.toNumber().toFixed(t.endingBalance.minorUnits)),
        this.csv(t.counterparty?.name ?? ""),
        this.csv(String(t.splitPayment)),
        this.csv(vatAmount ? vatAmount.toNumber().toFixed(vatAmount.minorUnits) : ""),
        this.csv(t.vatInfo?.taxForm ?? ""),
        this.csv(t.vatInfo?.paymentPeriod ?? ""),
        this.csv(t.vatInfo?.invoiceNumber ?? ""),
        this.csv(this.invoiceMonth()),
        this.csv(String(hasVat)),
        this.csv(""),
        this.csv("false"),
        this.csv(""),
        this.csv(""),
        this.csv(t.description.raw)
      ];
      lines.push(row.join(delimiter));
    }

    await this.ensureDir(outFile);
    await fs.writeFile(outFile, lines.join("\n"), "utf8");
  }

  /**
   * Zapewnia istnienie katalogu dla ścieżki pliku.
   *
   * @param outFile - ścieżka docelowa
   */
  private async ensureDir(outFile: string): Promise<void> {
    const dir = path.dirname(outFile);
    await fs.mkdir(dir, { recursive: true });
  }

  /**
   * Escapuje wartość do CSV.
   *
   * @param v - wartość
   */
  private csv(v: unknown): string {
    const s = (v ?? "").toString();
    // Cytujemy jeśli są znaki specjalne CSV (cudzysłów / newline / delimiter),
    // plus CR dla Windows.
    if (/[;"\n\r]/.test(s)) return `"${s.replace(/"/g, "\"\"")}"`;
    return s;
  }
}

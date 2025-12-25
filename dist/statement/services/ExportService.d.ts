import type { Transaction } from "../domain/Transaction.js";
/**
 * Serwis eksportu danych.
 *
 * Wymaganie: eksport JSON + CSV.
 * - JSON: pełny model (w wersji "JSON-friendly")
 * - CSV: spłaszczone kolumny do analizy w Excel/Sheets
 */
export declare class ExportService {
    private readonly serializer;
    /**
     * Wyciąga rachunek odbiorcy z opisu.
     *
     * W danych PKO najczęściej występuje w polu:
     * "Rachunek odbiorcy : 02102010260000190207153234"
     *
     * Wykorzystujemy już sparsowane `ParsedDescription` (normalizuje klucze i whitespace),
     * więc tu logika jest prosta i odporna na formatowanie.
     *
     * @param t - transakcja
     */
    private rachunekOdbiorcy;
    /**
     * Zwraca "miesiąc wystawienia faktury".
     *
     * Zgodnie z Twoim wymaganiem: **zawsze defaultowo "-"**.
     * (W razie potrzeby później możemy dodać heurystyki.)
     */
    private invoiceMonth;
    /**
     * Wylicza kolumnę "Rodzaj" zgodnie z wymaganiem:
     * - "koszt" / "przychod" na bazie znaku kwoty
     * - "Vat-" / "Vat+" jeśli wykryto kwotę VAT
     *
     * @param amountMinor - kwota transakcji w minor units
     * @param hasVat - czy jest kwota VAT
     */
    private rodzaj;
    /**
     * Eksportuje transakcje do pliku JSON.
     *
     * @param outFile - ścieżka wyjściowa
     * @param transactions - lista transakcji
     */
    exportJson(outFile: string, transactions: Transaction[]): Promise<void>;
    /**
     * Eksportuje transakcje do pliku CSV.
     *
     * CSV jest celowo "wąski" (najczęściej używane pola). Surowy opis jest zachowany,
     * a `details` nie są rozwijane (bo mogłyby generować setki kolumn).
     *
     * @param outFile - ścieżka wyjściowa
     * @param transactions - lista transakcji
     */
    exportCsv(outFile: string, transactions: Transaction[]): Promise<void>;
    /**
     * Zapewnia istnienie katalogu dla ścieżki pliku.
     *
     * @param outFile - ścieżka docelowa
     */
    private ensureDir;
    /**
     * Escapuje wartość do CSV.
     *
     * @param v - wartość
     */
    private csv;
}
//# sourceMappingURL=ExportService.d.ts.map
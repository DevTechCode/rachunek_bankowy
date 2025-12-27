import fs from "node:fs/promises";
import path from "node:path";
import { TransactionSerializer } from "./TransactionSerializer.js";
/**
 * Serwis eksportu danych.
 *
 * Wymaganie: eksport JSON + CSV.
 * - JSON: pełny model (w wersji "JSON-friendly")
 * - CSV: spłaszczone kolumny do analizy w Excel/Sheets
 */
export class ExportService {
    serializer = new TransactionSerializer();
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
    rachunekOdbiorcy(t) {
        const v = t.description.getFirst("Rachunek odbiorcy");
        return v && v.trim() ? v.trim() : "-";
    }
    /**
     * Zwraca "miesiąc wystawienia faktury".
     *
     * Zgodnie z Twoim wymaganiem: **zawsze defaultowo "-"**.
     * (W razie potrzeby później możemy dodać heurystyki.)
     */
    invoiceMonth() {
        return "-";
    }
    /**
     * Wylicza kolumnę "Rodzaj" zgodnie z wymaganiem:
     * - "koszt" / "przychod" na bazie znaku kwoty
     * - "vat -" / "vat +" tylko gdy wykryto kwotę VAT ORAZ |kwota| == |VAT|
     *
     * @param amountMinor - kwota transakcji w minor units
     * @param vatAmountMinor - kwota VAT (minor) lub null/undefined jeśli brak
     */
    rodzaj(amountMinor, vatAmountMinor) {
        const abs = (v) => (v < 0n ? -v : v);
        const hasVat = Boolean(vatAmountMinor && vatAmountMinor !== 0n);
        const isVatOnly = hasVat && abs(amountMinor) === abs(vatAmountMinor);
        if (isVatOnly)
            return amountMinor < 0n ? "vat -" : "vat +";
        return amountMinor < 0n ? "koszt" : "przychód";
    }
    /**
     * Eksportuje transakcje do pliku JSON.
     *
     * @param outFile - ścieżka wyjściowa
     * @param transactions - lista transakcji
     */
    async exportJson(outFile, transactions) {
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
    async exportCsv(outFile, transactions) {
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
            "Rachunek odbiorcy",
            "Split payment",
            "Kwota VAT",
            "Formularz",
            "Okres płatności",
            "Numer faktury",
            "Miesiąc wystawienia faktury",
            "isVat",
            "isFaktura",
            "isPracownik",
            "isZarząd",
            "Przeznaczenie",
            "Inwestycja",
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
                this.csv(this.rodzaj(t.amount.minor, vatAmount?.minor)),
                this.csv(t.type),
                this.csv(t.category),
                this.csv(t.amount.toNumber().toFixed(t.amount.minorUnits)),
                this.csv(t.endingBalance.toNumber().toFixed(t.endingBalance.minorUnits)),
                this.csv(t.counterparty?.name ?? ""),
                this.csv(this.rachunekOdbiorcy(t)),
                this.csv(String(t.splitPayment)),
                this.csv(vatAmount ? vatAmount.toNumber().toFixed(vatAmount.minorUnits) : ""),
                this.csv(t.vatInfo?.taxForm ?? ""),
                this.csv(t.vatInfo?.paymentPeriod ?? ""),
                this.csv(t.vatInfo?.invoiceNumber ?? ""),
                this.csv(this.invoiceMonth()),
                this.csv(String(hasVat)),
                this.csv("false"),
                this.csv("false"),
                this.csv(""),
                this.csv(""),
                this.csv(""),
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
    async ensureDir(outFile) {
        const dir = path.dirname(outFile);
        await fs.mkdir(dir, { recursive: true });
    }
    /**
     * Escapuje wartość do CSV.
     *
     * @param v - wartość
     */
    csv(v) {
        const s = (v ?? "").toString();
        // Cytujemy jeśli są znaki specjalne CSV (cudzysłów / newline / delimiter),
        // plus CR dla Windows.
        if (/[;"\n\r]/.test(s))
            return `"${s.replace(/"/g, "\"\"")}"`;
        return s;
    }
}
//# sourceMappingURL=ExportService.js.map
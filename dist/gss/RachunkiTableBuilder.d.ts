import type { Transaction } from "../statement/domain/Transaction.js";
/**
 * Buduje tabelę "Rachunki" do Google Sheets.
 *
 * Wymaganie:
 * - kolumny: "Rachunek odbiorcy", "Kontrahent", "isPracownik", "isZarzad", "Mapowanie"
 * - wartości domyślne dla 3 ostatnich kolumn: puste
 *
 * Dane wejściowe: transakcje z parsera.
 * - rachunek odbiorcy wyciągamy z `description` (klucz "Rachunek odbiorcy")
 * - kontrahent bierzemy z `counterparty.name`
 *
 * Wiersze są deduplikowane po (rachunek, kontrahent) i sortowane po rachunku/nazwie.
 */
export declare class RachunkiTableBuilder {
    /**
     * Buduje wartości do wgrania do arkusza (z nagłówkiem w pierwszym wierszu).
     *
     * @param transactions - lista transakcji
     */
    build(transactions: Transaction[]): string[][];
}
//# sourceMappingURL=RachunkiTableBuilder.d.ts.map
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
export class RachunkiTableBuilder {
    /**
     * Buduje wartości do wgrania do arkusza (z nagłówkiem w pierwszym wierszu).
     *
     * @param transactions - lista transakcji
     */
    build(transactions) {
        const header = ["Rachunek odbiorcy", "Kontrahent", "isPracownik", "isZarzad", "Mapowanie"];
        const rows = [];
        for (const t of transactions) {
            const rachunek = (t.description.getFirst("Rachunek odbiorcy") ?? "").trim();
            const kontrahent = (t.counterparty?.name ?? "").trim();
            if (!rachunek)
                continue;
            rows.push([rachunek, kontrahent || "-"]);
        }
        // Deduplikacja
        const seen = new Set();
        const unique = [];
        for (const [r, k] of rows) {
            const key = `${r}|${k}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            unique.push([r, k]);
        }
        unique.sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
        const out = [header];
        for (const [rachunek, kontrahent] of unique) {
            out.push([rachunek, kontrahent, "", "", ""]);
        }
        return out;
    }
}
//# sourceMappingURL=RachunkiTableBuilder.js.map
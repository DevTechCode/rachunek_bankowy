/**
 * Kontrahent (nadawca/odbiorca) po normalizacji.
 *
 * Założenia:
 * - bankowe opisy potrafią być niespójne (spacje, wielkość liter, łamanie linii),
 * - czasem mamy konto (IBAN/NRB), czasem NIP, czasem tylko nazwę,
 * - potrzebujemy stabilnego fingerprint do agregacji (recurring payees, top kontrahenci).
 */
export declare class Counterparty {
    readonly name?: string;
    readonly account?: string;
    readonly id?: string;
    readonly address?: string;
    readonly fingerprint: string;
    /**
     * @param init - dane kontrahenta (część może być undefined)
     */
    constructor(init?: {
        name?: string;
        account?: string;
        id?: string;
        address?: string;
    });
    /**
     * Zwraca "kanoniczną" nazwę do porównań (bez diakrytyków, znormalizowane spacje).
     */
    normalizedName(): string;
    /**
     * Normalizacja nazwy (pomaga w grupowaniu podobnych nazw).
     *
     * @param name - nazwa wejściowa
     */
    static normalizeName(name?: string): string;
    /**
     * Normalizacja rachunku: usuwamy spacje, zostawiamy cyfry, akceptujemy NRB/IBAN.
     *
     * @param account - tekst rachunku
     */
    static normalizeAccount(account?: string): string | undefined;
    /**
     * Normalizacja identyfikatora (np. NIP).
     *
     * @param id - wejście
     */
    static normalizeId(id?: string): string | undefined;
    /**
     * Oblicza fingerprint kontrahenta. Priorytet:
     * - account (najbardziej stabilne),
     * - id (np. NIP),
     * - nazwa (znormalizowana)
     *
     * @param input - dane do fingerprintu
     */
    static computeFingerprint(input: {
        name?: string;
        account?: string;
        id?: string;
    }): string;
}
//# sourceMappingURL=Counterparty.d.ts.map
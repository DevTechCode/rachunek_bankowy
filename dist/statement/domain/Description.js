/**
 * Wynik parsowania pola description/opis.
 *
 * - `raw`: oryginalny tekst (po minimalnym trimie)
 * - `items`: lista elementów w kolejności występowania
 * - `details`: słownik znormalizowanych kluczy do listy wartości (gdy klucz występuje wielokrotnie)
 */
export class ParsedDescription {
    raw;
    items;
    details;
    /**
     * @param raw - surowy opis
     * @param items - elementy w kolejności
     * @param details - map klucz -> lista wartości
     */
    constructor(raw, items, details) {
        this.raw = raw;
        this.items = items;
        this.details = details;
    }
    /**
     * Pobiera pierwszą wartość dla danego klucza.
     *
     * @param key - klucz do wyszukania (może być w formie oryginalnej, np. "Tytuł")
     */
    getFirst(key) {
        const arr = this.details.get(ParsedDescription.normalizeLookupKey(key));
        return arr && arr.length > 0 ? arr[0] : undefined;
    }
    /**
     * Pobiera wszystkie wartości dla klucza.
     */
    getAll(key) {
        return this.details.get(ParsedDescription.normalizeLookupKey(key)) ?? [];
    }
    /**
     * Normalizacja klucza do lookupu w `details`.
     *
     * Cel: ergonomia użycia. Detektory/serwisy mogą pytać o "Tytuł" lub "tytul"
     * i dostaną ten sam wynik.
     *
     * @param key - wejściowy klucz
     */
    static normalizeLookupKey(key) {
        return (key ?? "")
            .toString()
            .trim()
            .replace(/\s+/g, " ")
            .normalize("NFKD")
            .replace(/\p{Diacritic}/gu, "")
            // Polski "ł" wymaga ręcznego mapowania (nie zawsze jest diakrytykiem).
            .replace(/[łŁ]/g, "l")
            .toLowerCase();
    }
}
//# sourceMappingURL=Description.js.map
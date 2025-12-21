/**
 * Element opisu (zachowujemy kolejność).
 *
 * Parser opisu działa heurystycznie:
 * - wyciąga pary klucz-wartość (KV),
 * - zachowuje "luźny tekst" między segmentami,
 * - potrafi tworzyć "sekcje" (np. "Lokalizacja" jako kontener dla Adres/Miasto/Kraj).
 */
export type DescriptionItem = {
    kind: "text";
    value: string;
} | {
    kind: "kv";
    key: string;
    value: string;
} | {
    kind: "section";
    title: string;
};
/**
 * Wynik parsowania pola description/opis.
 *
 * - `raw`: oryginalny tekst (po minimalnym trimie)
 * - `items`: lista elementów w kolejności występowania
 * - `details`: słownik znormalizowanych kluczy do listy wartości (gdy klucz występuje wielokrotnie)
 */
export declare class ParsedDescription {
    readonly raw: string;
    readonly items: ReadonlyArray<DescriptionItem>;
    readonly details: ReadonlyMap<string, ReadonlyArray<string>>;
    /**
     * @param raw - surowy opis
     * @param items - elementy w kolejności
     * @param details - map klucz -> lista wartości
     */
    constructor(raw: string, items: ReadonlyArray<DescriptionItem>, details: ReadonlyMap<string, ReadonlyArray<string>>);
    /**
     * Pobiera pierwszą wartość dla danego klucza.
     *
     * @param key - klucz do wyszukania (może być w formie oryginalnej, np. "Tytuł")
     */
    getFirst(key: string): string | undefined;
    /**
     * Pobiera wszystkie wartości dla klucza.
     */
    getAll(key: string): ReadonlyArray<string>;
    /**
     * Normalizacja klucza do lookupu w `details`.
     *
     * Cel: ergonomia użycia. Detektory/serwisy mogą pytać o "Tytuł" lub "tytul"
     * i dostaną ten sam wynik.
     *
     * @param key - wejściowy klucz
     */
    private static normalizeLookupKey;
}
//# sourceMappingURL=Description.d.ts.map
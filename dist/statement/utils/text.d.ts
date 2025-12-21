/**
 * Utility: dekodowanie podstawowych encji XML/HTML.
 *
 * W praktyce opisy w XML potrafią zawierać encje (np. &apos;).
 * Nie chcemy dorzucać ciężkiej biblioteki, więc implementujemy minimalny zestaw,
 * wystarczający dla danych bankowych.
 *
 * @param input - tekst wejściowy
 */
export declare function decodeBasicEntities(input: string): string;
/**
 * Utility: normalizacja białych znaków (spacje/tabs/newline) do pojedynczych spacji.
 *
 * Stosujemy do wartości pól, kiedy chcemy porównań lub fingerprintów,
 * ale surowy tekst i kolejność trzymamy osobno.
 *
 * @param input - tekst wejściowy
 */
export declare function collapseWhitespace(input: string): string;
/**
 * Utility: bezpieczne parsowanie daty w formacie YYYY-MM-DD (format z XML wyciągu).
 *
 * @param ymd - tekst daty
 */
export declare function parseYmdDate(ymd: string): Date;
//# sourceMappingURL=text.d.ts.map
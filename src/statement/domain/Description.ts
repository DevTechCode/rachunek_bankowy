/**
 * Element opisu (zachowujemy kolejność).
 *
 * Parser opisu działa heurystycznie:
 * - wyciąga pary klucz-wartość (KV),
 * - zachowuje "luźny tekst" między segmentami,
 * - potrafi tworzyć "sekcje" (np. "Lokalizacja" jako kontener dla Adres/Miasto/Kraj).
 */
export type DescriptionItem =
  | { kind: "text"; value: string }
  | { kind: "kv"; key: string; value: string }
  | { kind: "section"; title: string };

/**
 * Wynik parsowania pola description/opis.
 *
 * - `raw`: oryginalny tekst (po minimalnym trimie)
 * - `items`: lista elementów w kolejności występowania
 * - `details`: słownik znormalizowanych kluczy do listy wartości (gdy klucz występuje wielokrotnie)
 */
export class ParsedDescription {
  public readonly raw: string;
  public readonly items: ReadonlyArray<DescriptionItem>;
  public readonly details: ReadonlyMap<string, ReadonlyArray<string>>;

  /**
   * @param raw - surowy opis
   * @param items - elementy w kolejności
   * @param details - map klucz -> lista wartości
   */
  public constructor(
    raw: string,
    items: ReadonlyArray<DescriptionItem>,
    details: ReadonlyMap<string, ReadonlyArray<string>>
  ) {
    this.raw = raw;
    this.items = items;
    this.details = details;
  }

  /**
   * Pobiera pierwszą wartość dla danego klucza.
   *
   * @param key - klucz do wyszukania (może być w formie oryginalnej, np. "Tytuł")
   */
  public getFirst(key: string): string | undefined {
    const arr = this.details.get(ParsedDescription.normalizeLookupKey(key));
    return arr && arr.length > 0 ? arr[0] : undefined;
  }

  /**
   * Pobiera wszystkie wartości dla klucza.
   */
  public getAll(key: string): ReadonlyArray<string> {
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
  private static normalizeLookupKey(key: string): string {
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

import { CardInfo } from "../domain/CardInfo.js";
import { LocationInfo } from "../domain/LocationInfo.js";
import { ParsedDescription } from "../domain/Description.js";
import { ReferenceInfo } from "../domain/ReferenceInfo.js";
import type { Currency } from "../domain/Currency.js";
/**
 * Parser pola `description/opis` z wyciągu bankowego.
 *
 * Najważniejsze wymagania:
 * - wykrywać pary klucz:wartość, także jeśli wartość jest w następnej linii,
 * - łączyć wartości wieloliniowe,
 * - zachować surowy tekst (`raw`) oraz dać ustrukturyzowane `details`,
 * - zachować kolejność elementów (items) do debugowania.
 *
 * Heurystyka kluczy:
 * - W praktyce PKO używa formatu "Klucz : Wartość" (z odstępami),
 * - ale czasem występuje "Klucz:\nWartość" (bez spacji przed dwukropkiem),
 * - nie chcemy łapać "BPID:API..." (dwukropek bez białych znaków),
 * dlatego dopuszczamy dwukropek tylko gdy przylega do whitespace po jednej ze stron.
 */
export declare class DescriptionParser {
    /**
     * Lista znanych kluczy w opisach bankowych (w wersji znormalizowanej).
     *
     * To jest kluczowy element "inteligencji" parsera: pozwala uniknąć fałszywych dopasowań,
     * gdzie fragment wartości przypadkowo wygląda jak "klucz :".
     *
     * Przykład problemu: "Nazwa odbiorcy : AUTOPAY SA Tytuł : ..." – bez whitelisty
     * regex mógłby uznać "AUTOPAY SA Tytuł" za klucz.
     */
    private readonly knownKeys;
    /**
     * Parsuje tekst opisu do `ParsedDescription`.
     *
     * @param raw - surowy tekst z XML/HTML
     */
    parse(raw: string): ParsedDescription;
    /**
     * Próbuje z opisu wyciągnąć dane lokalizacyjne (Adres/Miasto/Kraj).
     *
     * @param desc - sparsowany opis
     */
    extractLocationInfo(desc: ParsedDescription): LocationInfo | undefined;
    /**
     * Próbuje z opisu wyciągnąć dane kartowe.
     *
     * @param desc - sparsowany opis
     * @param statementCurrency - waluta wyciągu (dla "Oryginalna kwota operacji")
     */
    extractCardInfo(desc: ParsedDescription, statementCurrency: Currency): CardInfo | undefined;
    /**
     * Próbuje z opisu wyciągnąć informacje referencyjne (numery referencyjne/telefon itp.).
     *
     * @param desc - sparsowany opis
     */
    extractReferenceInfo(desc: ParsedDescription): ReferenceInfo | undefined;
    /**
     * Wyszukuje markery "klucz: wartość" w tekście.
     *
     * Zwraca listę w kolejności występowania; każdy marker ma:
     * - `keyStart`: index początku klucza,
     * - `valueStart`: index początku wartości,
     * - `key`: wyłuskany klucz.
     *
     * @param text - tekst opisu
     */
    private findKeyMarkers;
    /**
     * Heurystyczny test, czy `key` wygląda jak sensowny klucz.
     *
     * @param key - kandydat na klucz
     */
    private isProbablyKey;
    /**
     * Sprawdza, czy `candidate` zawiera `known` jako osobny token/ciąg tokenów (z separatorami whitespace).
     *
     * To jest bardziej odporne niż proste `includes(" "+known+" ")`, bo opisy mogą mieć
     * nietypowe whitespace (np. NBSP) mimo wstępnej normalizacji.
     *
     * @param candidate - znormalizowany kandydat
     * @param known - znormalizowany znany klucz
     */
    private containsKnownKeyAsTokenSequence;
    /**
     * Escapuje tekst do użycia w RegExp.
     *
     * @param s - tekst
     */
    private escapeRegex;
    /**
     * Normalizuje klucz do postaci, która nadaje się jako klucz mapy `details`.
     *
     * Zasady:
     * - lowercase,
     * - usuwamy diakrytyki,
     * - upraszczamy spacje,
     * - upraszczamy polskie znaki (dla stabilności porównań).
     *
     * @param key - klucz z opisu
     */
    private normalizeKey;
    /**
     * Normalizuje wartość:
     * - zachowujemy semantykę, ale upraszczamy whitespace,
     * - usuwa nadmiarowe spacje/nowe linie.
     *
     * @param valueRaw - surowa wartość (może zawierać newline)
     */
    private normalizeValue;
    /**
     * Rozpoznaje "sekcyjny" klucz (nagłówek grupy).
     *
     * @param key - klucz z opisu
     */
    private isSectionKey;
    /**
     * Dodaje wartość do mapy `details` (wspiera wielokrotne wystąpienia klucza).
     *
     * @param map - details
     * @param key - znormalizowany klucz
     * @param value - znormalizowana wartość
     */
    private appendDetail;
    /**
     * Jeśli fragment tekstu zawiera niepusty content, dodaje go jako item typu "text".
     *
     * @param items - lista elementów opisu
     * @param text - tekst do ewentualnego dodania
     */
    private pushTextIfAny;
    /**
     * Próba parsowania daty z opisu.
     *
     * W opisie kartowym pojawia się format YYYY-MM-DD.
     *
     * @param raw - tekst daty
     */
    private tryParseDate;
    /**
     * Parsuje kwotę w formie "126,95 PLN" lub "126.95 PLN".
     *
     * Jeśli waluta nie jest podana, używa `fallbackCurrency`.
     *
     * @param raw - tekst kwoty
     * @param fallbackCurrency - waluta, gdy brak w polu
     */
    private tryParseMoneyWithCurrency;
}
//# sourceMappingURL=DescriptionParser.d.ts.map
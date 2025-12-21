import type { StatementParseOptions, StatementParseResult, StatementParser } from "./StatementParser.js";
/**
 * Parser HTML (fallback) dla zestawienia w formie tabeli.
 *
 * Założenie: wejście zawiera tabelę z wierszami transakcji i nagłówkami kolumn.
 * Ponieważ nie mamy jednego gwarantowanego formatu, parser działa heurystycznie:
 * - wybiera pierwszą tabelę, która ma rozpoznawalne nagłówki,
 * - mapuje kolumny po nazwach (case-insensitive, bez polskich znaków),
 * - każde <tr> po nagłówku traktuje jako transakcję.
 *
 * Oczekiwane pola (różne warianty nazw):
 * - data operacji / order date
 * - data waluty / data realizacji / exec date
 * - typ
 * - opis / description
 * - kwota (+ waluta)
 * - saldo po / ending balance
 */
export declare class HtmlStatementParser implements StatementParser {
    private readonly descriptionParser;
    private readonly vatDetector;
    private readonly counterpartyExtractor;
    private readonly categoryEngine;
    /**
     * Parsuje HTML do modelu domenowego.
     *
     * @param input - pełna treść pliku HTML
     * @param options - tryb best-effort
     */
    parse(input: string, options?: StatementParseOptions): Promise<StatementParseResult>;
    /**
     * Próbuje znaleźć tabelę, która wygląda jak tabela transakcji.
     *
     * @param $ - cheerio root
     */
    private findBestTable;
    /**
     * Buduje mapę nagłówków -> indeks kolumny.
     *
     * @param $ - cheerio
     * @param table - element <table>
     */
    private buildHeaderMap;
    /**
     * Parsuje pojedynczy wiersz tabeli do `Transaction`.
     *
     * @param $ - cheerio
     * @param cells - tablica <td>
     * @param headerMap - map nagłówków -> indeks
     */
    private parseRow;
    /**
     * Pobiera tekst komórki po możliwych nazwach nagłówka.
     *
     * @param $ - cheerio
     * @param cells - komórki <td>
     * @param headerMap - map nagłówków -> indeks
     * @param keys - możliwe nazwy nagłówków (już w znormalizowanej formie)
     */
    private getCell;
    /**
     * Normalizuje tekst nagłówka:
     * - usuwa spacje,
     * - usuwa diakrytyki,
     * - lowercase.
     */
    private normHeader;
    /**
     * Sprawdza, czy mapa zawiera którykolwiek z kluczy.
     */
    private anyHeader;
    /**
     * Parsuje datę z komórki (obsługa najczęstszych formatów).
     *
     * @param raw - tekst komórki
     */
    private parseDateCell;
    /**
     * Próbuje wykryć walutę z tekstu kwoty (np. "100,00 PLN").
     */
    private detectCurrency;
    /**
     * Usuwa kod waluty z tekstu kwoty, jeśli jest.
     */
    private stripCurrency;
}
//# sourceMappingURL=HtmlStatementParser.d.ts.map
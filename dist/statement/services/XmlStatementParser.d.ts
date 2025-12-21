import type { StatementParseOptions, StatementParseResult, StatementParser } from "./StatementParser.js";
/**
 * Parser XML zestawienia operacji bankowych.
 *
 * Obsługuje format jak w Twoim `Zestawienie.xml`:
 *
 * `<account-history>`
 *   `<search> ... </search>`
 *   `<operations>`
 *     `<operation>`
 *        <order-date>YYYY-MM-DD</order-date>
 *        <exec-date>YYYY-MM-DD</exec-date>
 *        <type>...</type>
 *        <description>...</description>
 *        <amount curr="PLN">-95.80</amount>
 *        <ending-balance curr="PLN">+2641.40</ending-balance>
 *     </operation>
 *   </operations>`
 */
export declare class XmlStatementParser implements StatementParser {
    private readonly descriptionParser;
    private readonly vatDetector;
    private readonly counterpartyExtractor;
    private readonly categoryEngine;
    /**
     * Parsuje XML do modelu domenowego.
     *
     * @param input - pełna treść pliku XML
     * @param options - tryb best-effort
     */
    parse(input: string, options?: StatementParseOptions): Promise<StatementParseResult>;
    /**
     * Parsuje pojedynczy węzeł `<operation>` do `Transaction`.
     *
     * @param op - JSONowy obiekt z fast-xml-parser
     */
    private parseOperation;
    /**
     * Parsuje węzeł kwotowy (np. `<amount curr="PLN">-95.80</amount>`).
     *
     * @param node - obiekt z XML parsera
     * @param path - nazwa pola (dla komunikatu błędu)
     * @param fallbackCurrency - gdyby brakowało atrybutu curr
     */
    private parseMoneyNode;
}
//# sourceMappingURL=XmlStatementParser.d.ts.map
import type { StatementParseOptions, StatementParseResult, StatementParser } from "./StatementParser.js";
/**
 * Parser "auto": wybiera XML lub HTML na podstawie treści wejścia.
 *
 * Wymaganie: HTML fallback jeśli wejście nie jest XML.
 */
export declare class AutoStatementParser implements StatementParser {
    private readonly xml;
    private readonly html;
    /**
     * Wykrywa format i deleguje do odpowiedniego parsera.
     *
     * @param input - treść pliku
     * @param options - tryb best-effort
     */
    parse(input: string, options?: StatementParseOptions): Promise<StatementParseResult>;
}
//# sourceMappingURL=AutoStatementParser.d.ts.map
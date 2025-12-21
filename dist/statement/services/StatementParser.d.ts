import type { ParseError } from "../errors/ParseError.js";
import type { Transaction } from "../domain/Transaction.js";
/**
 * Wynik parsowania wyciągu / zestawienia.
 *
 * - `transactions`: lista transakcji (best-effort możliwe)
 * - `errors`: błędy, które wystąpiły (opcjonalnie; w best-effort nie przerywamy)
 * - `meta`: dane pomocnicze (konto, zakres dat)
 */
export type StatementParseResult = {
    transactions: Transaction[];
    errors: ParseError[];
    meta?: {
        account?: string;
        dateSince?: string;
        dateTo?: string;
        sourceFormat: "xml" | "html";
    };
};
/**
 * Opcje parsowania.
 */
export type StatementParseOptions = {
    /**
     * Jeśli true, parser próbuje sparsować "ile się da", a błędy zbiera w `errors`.
     * Jeśli false, pierwszy poważny błąd kończy parsowanie wyjątkiem.
     */
    bestEffort?: boolean;
};
/**
 * Interfejs parsera zestawienia.
 *
 * Wymaganie: StatementParser (interfejs) + XmlStatementParser + HtmlStatementParser.
 */
export interface StatementParser {
    /**
     * Parsuje wejście (cały plik jako string).
     *
     * @param input - treść pliku (XML lub HTML)
     * @param options - tryb pracy
     */
    parse(input: string, options?: StatementParseOptions): Promise<StatementParseResult>;
}
//# sourceMappingURL=StatementParser.d.ts.map
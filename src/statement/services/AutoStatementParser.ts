import { ParseError } from "../errors/ParseError.js";
import type { StatementParseOptions, StatementParseResult, StatementParser } from "./StatementParser.js";
import { HtmlStatementParser } from "./HtmlStatementParser.js";
import { XmlStatementParser } from "./XmlStatementParser.js";

/**
 * Parser "auto": wybiera XML lub HTML na podstawie treści wejścia.
 *
 * Wymaganie: HTML fallback jeśli wejście nie jest XML.
 */
export class AutoStatementParser implements StatementParser {
  private readonly xml = new XmlStatementParser();
  private readonly html = new HtmlStatementParser();

  /**
   * Wykrywa format i deleguje do odpowiedniego parsera.
   *
   * @param input - treść pliku
   * @param options - tryb best-effort
   */
  public async parse(input: string, options?: StatementParseOptions): Promise<StatementParseResult> {
    const head = (input ?? "").toString().trim().slice(0, 2000).toLowerCase();

    if (head.includes("<account-history") || head.includes("<?xml")) {
      return await this.xml.parse(input, options);
    }
    if (head.includes("<table") || head.includes("<html")) {
      return await this.html.parse(input, options);
    }

    throw new ParseError("Nie rozpoznano formatu wejścia (oczekiwano XML lub HTML)", {
      snippet: (input ?? "").toString().slice(0, 400)
    });
  }
}

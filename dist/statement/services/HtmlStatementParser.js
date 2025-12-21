import * as cheerio from "cheerio";
import { ParseError } from "../errors/ParseError.js";
import { Money } from "../domain/Money.js";
import { Transaction } from "../domain/Transaction.js";
import { DescriptionParser } from "./DescriptionParser.js";
import { VatDetector } from "./VatDetector.js";
import { CounterpartyExtractor } from "./CounterpartyExtractor.js";
import { CategoryRuleEngine } from "./CategoryRuleEngine.js";
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
export class HtmlStatementParser {
    descriptionParser = new DescriptionParser();
    vatDetector = new VatDetector();
    counterpartyExtractor = new CounterpartyExtractor();
    categoryEngine = new CategoryRuleEngine();
    /**
     * Parsuje HTML do modelu domenowego.
     *
     * @param input - pełna treść pliku HTML
     * @param options - tryb best-effort
     */
    async parse(input, options) {
        const bestEffort = options?.bestEffort ?? false;
        const errors = [];
        const $ = cheerio.load(input);
        const table = this.findBestTable($);
        if (!table) {
            throw new ParseError("Nie znaleziono tabeli z transakcjami w HTML", { snippet: input.slice(0, 400) });
        }
        const { headerMap, headerRowIndex } = this.buildHeaderMap($, table);
        if (!headerMap) {
            throw new ParseError("Nie udało się rozpoznać nagłówków tabeli w HTML", {
                snippet: $.html(table).slice(0, 400)
            });
        }
        const rows = $(table).find("tr").toArray().slice(headerRowIndex + 1);
        const transactions = [];
        for (let i = 0; i < rows.length; i++) {
            const tr = rows[i];
            const cells = $(tr).find("td").toArray();
            if (cells.length === 0)
                continue;
            try {
                const tx = this.parseRow($, cells, headerMap);
                transactions.push(tx);
            }
            catch (e) {
                const pe = e instanceof ParseError
                    ? e
                    : new ParseError("Błąd parsowania wiersza HTML", {
                        cause: e,
                        path: `table.row[${i}]`,
                        snippet: $(tr).text().trim().slice(0, 400)
                    });
                if (!bestEffort)
                    throw pe;
                errors.push(pe);
            }
        }
        return { transactions, errors, meta: { sourceFormat: "html" } };
    }
    /**
     * Próbuje znaleźć tabelę, która wygląda jak tabela transakcji.
     *
     * @param $ - cheerio root
     */
    findBestTable($) {
        const tables = $("table").toArray();
        for (const t of tables) {
            const { headerMap } = this.buildHeaderMap($, t);
            if (headerMap)
                return t;
        }
        return undefined;
    }
    /**
     * Buduje mapę nagłówków -> indeks kolumny.
     *
     * @param $ - cheerio
     * @param table - element <table>
     */
    buildHeaderMap($, table) {
        const rows = $(table).find("tr").toArray();
        for (let r = 0; r < rows.length; r++) {
            const ths = $(rows[r]).find("th").toArray();
            if (ths.length === 0)
                continue;
            const map = new Map();
            for (let i = 0; i < ths.length; i++) {
                const txt = this.normHeader($(ths[i]).text());
                if (!txt)
                    continue;
                map.set(txt, i);
            }
            // Minimalne wymagane kolumny (w praktyce różne nazwy).
            const hasDate = this.anyHeader(map, ["dataoperacji", "orderdate", "data"]);
            const hasType = this.anyHeader(map, ["typ", "type"]);
            const hasDesc = this.anyHeader(map, ["opis", "description"]);
            const hasAmount = this.anyHeader(map, ["kwota", "amount"]);
            if (hasDate && hasType && hasDesc && hasAmount) {
                return { headerMap: map, headerRowIndex: r };
            }
        }
        return { headerRowIndex: -1 };
    }
    /**
     * Parsuje pojedynczy wiersz tabeli do `Transaction`.
     *
     * @param $ - cheerio
     * @param cells - tablica <td>
     * @param headerMap - map nagłówków -> indeks
     */
    parseRow($, cells, headerMap) {
        const operationDate = this.parseDateCell(this.getCell($, cells, headerMap, ["dataoperacji", "orderdate", "data"]));
        const valueDate = this.parseDateCell(this.getCell($, cells, headerMap, ["datawaluty", "datarealizacji", "execdate", "valuedate"]) ??
            this.getCell($, cells, headerMap, ["dataoperacji", "orderdate", "data"]));
        const type = this.getCell($, cells, headerMap, ["typ", "type"]) ?? "";
        const descriptionRaw = this.getCell($, cells, headerMap, ["opis", "description"]) ?? "";
        const amountRaw = this.getCell($, cells, headerMap, ["kwota", "amount"]) ?? "";
        const endingRaw = this.getCell($, cells, headerMap, ["saldopo", "endingbalance", "saldo"]) ?? "";
        // Waluta: jeśli tabela ma osobną kolumnę, użyjemy; w przeciwnym razie spróbujemy z tekstu.
        const currencyRaw = this.getCell($, cells, headerMap, ["waluta", "currency"]) ?? "";
        const currency = (currencyRaw.trim().toUpperCase() || this.detectCurrency(amountRaw) || "PLN");
        const amount = Money.parse(this.stripCurrency(amountRaw), currency);
        const endingBalance = endingRaw ? Money.parse(this.stripCurrency(endingRaw), currency) : Money.parse("0", currency);
        const desc = this.descriptionParser.parse(descriptionRaw);
        const locationInfo = this.descriptionParser.extractLocationInfo(desc);
        const cardInfo = this.descriptionParser.extractCardInfo(desc, currency);
        const referenceInfo = this.descriptionParser.extractReferenceInfo(desc);
        const vatInfo = this.vatDetector.detectVatInfo(type, desc, currency);
        const splitPayment = this.vatDetector.detectSplitPayment(type, amount.minor, vatInfo);
        const counterparty = this.counterpartyExtractor.extractCounterparty(desc, amount.minor);
        const category = this.categoryEngine.categorize(type, amount.minor, desc);
        return new Transaction({
            operationDate,
            valueDate,
            type,
            description: desc,
            amount,
            endingBalance,
            counterparty,
            vatInfo,
            splitPayment,
            locationInfo,
            cardInfo,
            referenceInfo,
            category
        });
    }
    /**
     * Pobiera tekst komórki po możliwych nazwach nagłówka.
     *
     * @param $ - cheerio
     * @param cells - komórki <td>
     * @param headerMap - map nagłówków -> indeks
     * @param keys - możliwe nazwy nagłówków (już w znormalizowanej formie)
     */
    getCell($, cells, headerMap, keys) {
        for (const k of keys) {
            const idx = headerMap.get(k);
            if (idx === undefined)
                continue;
            const el = cells[idx];
            if (!el)
                continue;
            const txt = $(el).text().trim();
            if (txt)
                return txt;
        }
        return undefined;
    }
    /**
     * Normalizuje tekst nagłówka:
     * - usuwa spacje,
     * - usuwa diakrytyki,
     * - lowercase.
     */
    normHeader(h) {
        return (h ?? "")
            .toString()
            .normalize("NFKD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/\s+/g, "")
            .toLowerCase();
    }
    /**
     * Sprawdza, czy mapa zawiera którykolwiek z kluczy.
     */
    anyHeader(map, keys) {
        return keys.some((k) => map.has(k));
    }
    /**
     * Parsuje datę z komórki (obsługa najczęstszych formatów).
     *
     * @param raw - tekst komórki
     */
    parseDateCell(raw) {
        const s = (raw ?? "").trim();
        // YYYY-MM-DD
        let m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m)
            return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        // DD.MM.YYYY
        m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (m)
            return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        const d = new Date(s);
        if (Number.isNaN(d.getTime())) {
            throw new ParseError("Niepoprawna data w HTML", { snippet: s });
        }
        return d;
    }
    /**
     * Próbuje wykryć walutę z tekstu kwoty (np. "100,00 PLN").
     */
    detectCurrency(raw) {
        const m = (raw ?? "").toUpperCase().match(/\b([A-Z]{3})\b/);
        return m?.[1];
    }
    /**
     * Usuwa kod waluty z tekstu kwoty, jeśli jest.
     */
    stripCurrency(raw) {
        return (raw ?? "").toString().replace(/\b[A-Z]{3}\b/g, "").trim();
    }
}
//# sourceMappingURL=HtmlStatementParser.js.map
import { XMLParser } from "fast-xml-parser";
import { ParseError } from "../errors/ParseError.js";
import { Money } from "../domain/Money.js";
import { Transaction } from "../domain/Transaction.js";
import { DescriptionParser } from "./DescriptionParser.js";
import { VatDetector } from "./VatDetector.js";
import { CounterpartyExtractor } from "./CounterpartyExtractor.js";
import { CategoryRuleEngine } from "./CategoryRuleEngine.js";
import { parseYmdDate } from "../utils/text.js";
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
export class XmlStatementParser {
    descriptionParser = new DescriptionParser();
    vatDetector = new VatDetector();
    counterpartyExtractor = new CounterpartyExtractor();
    categoryEngine = new CategoryRuleEngine();
    /**
     * Parsuje XML do modelu domenowego.
     *
     * @param input - pełna treść pliku XML
     * @param options - tryb best-effort
     */
    async parse(input, options) {
        const bestEffort = options?.bestEffort ?? false;
        const errors = [];
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "",
            textNodeName: "text",
            trimValues: true,
            parseTagValue: false
        });
        let json;
        try {
            json = parser.parse(input);
        }
        catch (e) {
            throw new ParseError("Nie udało się sparsować XML", { cause: e, snippet: input.slice(0, 400) });
        }
        const root = json?.["account-history"];
        if (!root) {
            throw new ParseError("XML nie wygląda jak account-history (brak <account-history>)", {
                snippet: input.slice(0, 400)
            });
        }
        const searchNode = root?.search ?? {};
        const account = searchNode?.account?.toString?.() ?? undefined;
        const since = searchNode?.date?.since ?? undefined;
        const to = searchNode?.date?.to ?? undefined;
        const opsNode = root?.operations?.operation ?? [];
        const opsArray = Array.isArray(opsNode) ? opsNode : [opsNode];
        const transactions = [];
        for (let i = 0; i < opsArray.length; i++) {
            const op = opsArray[i];
            try {
                const tx = this.parseOperation(op);
                transactions.push(tx);
            }
            catch (e) {
                const pe = e instanceof ParseError
                    ? e
                    : new ParseError("Błąd parsowania pojedynczej operacji", {
                        cause: e,
                        path: `operations.operation[${i}]`,
                        snippet: JSON.stringify(op).slice(0, 400)
                    });
                if (!bestEffort)
                    throw pe;
                errors.push(pe);
            }
        }
        return {
            transactions,
            errors,
            meta: { account, dateSince: since, dateTo: to, sourceFormat: "xml" }
        };
    }
    /**
     * Parsuje pojedynczy węzeł `<operation>` do `Transaction`.
     *
     * @param op - JSONowy obiekt z fast-xml-parser
     */
    parseOperation(op) {
        const orderDateRaw = (op?.["order-date"] ?? "").toString();
        const execDateRaw = (op?.["exec-date"] ?? "").toString();
        const type = (op?.type ?? "").toString();
        const descriptionRaw = (op?.description ?? "").toString();
        const operationDate = parseYmdDate(orderDateRaw);
        const valueDate = parseYmdDate(execDateRaw);
        if (Number.isNaN(operationDate.getTime()) || Number.isNaN(valueDate.getTime())) {
            throw new ParseError("Niepoprawna data w operacji", {
                snippet: `${orderDateRaw} | ${execDateRaw}`
            });
        }
        const { amount, currency } = this.parseMoneyNode(op?.amount, "amount");
        const { amount: endingBalance } = this.parseMoneyNode(op?.["ending-balance"], "ending-balance", currency);
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
     * Parsuje węzeł kwotowy (np. `<amount curr="PLN">-95.80</amount>`).
     *
     * @param node - obiekt z XML parsera
     * @param path - nazwa pola (dla komunikatu błędu)
     * @param fallbackCurrency - gdyby brakowało atrybutu curr
     */
    parseMoneyNode(node, path, fallbackCurrency) {
        const curr = (node?.curr ?? fallbackCurrency ?? "PLN").toString();
        const raw = (node?.text ?? node ?? "").toString().trim();
        if (!raw) {
            throw new ParseError(`Brak kwoty w polu ${path}`, { snippet: JSON.stringify(node).slice(0, 200) });
        }
        const amount = Money.parse(raw, curr);
        return { amount, currency: curr };
    }
}
//# sourceMappingURL=XmlStatementParser.js.map
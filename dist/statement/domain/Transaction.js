import crypto from "node:crypto";
import { TransactionCategory } from "./TransactionCategory.js";
/**
 * Model domenowy pojedynczej transakcji.
 *
 * Pola bazowe pochodzą bezpośrednio z wyciągu:
 * - dataOperacji (order-date)
 * - dataWaluty (exec-date)
 * - typ (type)
 * - description (opis, surowy + rozbity)
 * - amount + currency
 * - saldoPo (ending balance)
 *
 * Pola wzbogacone:
 * - counterparty (kontrahent)
 * - vatInfo / splitPayment
 * - cardInfo / locationInfo / referenceInfo
 * - category (heurystyczna)
 * - dedupHash (stabilny hash do wykrywania duplikatów)
 */
export class Transaction {
    operationDate;
    valueDate;
    type;
    description;
    amount;
    endingBalance;
    counterparty;
    vatInfo;
    splitPayment;
    locationInfo;
    cardInfo;
    referenceInfo;
    category;
    dedupHash;
    /**
     * @param init - wszystkie pola potrzebne do utworzenia transakcji
     */
    constructor(init) {
        this.operationDate = init.operationDate;
        this.valueDate = init.valueDate;
        this.type = init.type;
        this.description = init.description;
        this.amount = init.amount;
        this.endingBalance = init.endingBalance;
        this.counterparty = init.counterparty;
        this.vatInfo = init.vatInfo;
        this.splitPayment = init.splitPayment ?? false;
        this.locationInfo = init.locationInfo;
        this.cardInfo = init.cardInfo;
        this.referenceInfo = init.referenceInfo;
        this.category = init.category ?? TransactionCategory.OTHER;
        this.dedupHash = Transaction.computeDedupHash(this);
    }
    /**
     * Czy transakcja jest przychodem.
     */
    isIncome() {
        return this.amount.minor > 0n;
    }
    /**
     * Czy transakcja jest kosztem.
     */
    isExpense() {
        return this.amount.minor < 0n;
    }
    /**
     * Stabilny hash do deduplikacji.
     *
     * Używamy pól, które w praktyce są najbardziej stabilne:
     * - data operacji (YYYY-MM-DD)
     * - kwota w minor units + waluta
     * - fingerprint kontrahenta (jeśli jest)
     * - numer referencyjny / własne referencje (jeśli są)
     *
     * @param t - transakcja
     */
    static computeDedupHash(t) {
        const d = Transaction.toDateKey(t.operationDate);
        const amount = `${t.amount.minor.toString()}|${t.amount.currency}`;
        const cp = t.counterparty?.fingerprint ?? "";
        const ref = [
            t.referenceInfo?.referenceNumber ?? "",
            t.referenceInfo?.ownReference ?? "",
            t.referenceInfo?.operationId ?? ""
        ]
            .filter(Boolean)
            .join("|");
        const base = `d=${d}|a=${amount}|cp=${cp}|ref=${ref}`;
        return crypto.createHash("sha256").update(base, "utf8").digest("hex").slice(0, 24);
    }
    /**
     * Formatuje datę do postaci YYYY-MM-DD (dla hashy/agregacji).
     */
    static toDateKey(d) {
        const yyyy = d.getFullYear().toString().padStart(4, "0");
        const mm = (d.getMonth() + 1).toString().padStart(2, "0");
        const dd = d.getDate().toString().padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }
}
//# sourceMappingURL=Transaction.js.map
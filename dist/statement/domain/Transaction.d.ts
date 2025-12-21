import { CardInfo } from "./CardInfo.js";
import { Counterparty } from "./Counterparty.js";
import { LocationInfo } from "./LocationInfo.js";
import { Money } from "./Money.js";
import { ParsedDescription } from "./Description.js";
import { ReferenceInfo } from "./ReferenceInfo.js";
import { TransactionCategory } from "./TransactionCategory.js";
import { VatInfo } from "./VatInfo.js";
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
export declare class Transaction {
    readonly operationDate: Date;
    readonly valueDate: Date;
    readonly type: string;
    readonly description: ParsedDescription;
    readonly amount: Money;
    readonly endingBalance: Money;
    readonly counterparty?: Counterparty;
    readonly vatInfo?: VatInfo;
    readonly splitPayment: boolean;
    readonly locationInfo?: LocationInfo;
    readonly cardInfo?: CardInfo;
    readonly referenceInfo?: ReferenceInfo;
    readonly category: TransactionCategory;
    readonly dedupHash: string;
    /**
     * @param init - wszystkie pola potrzebne do utworzenia transakcji
     */
    constructor(init: {
        operationDate: Date;
        valueDate: Date;
        type: string;
        description: ParsedDescription;
        amount: Money;
        endingBalance: Money;
        counterparty?: Counterparty;
        vatInfo?: VatInfo;
        splitPayment?: boolean;
        locationInfo?: LocationInfo;
        cardInfo?: CardInfo;
        referenceInfo?: ReferenceInfo;
        category?: TransactionCategory;
    });
    /**
     * Czy transakcja jest przychodem.
     */
    isIncome(): boolean;
    /**
     * Czy transakcja jest kosztem.
     */
    isExpense(): boolean;
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
    static computeDedupHash(t: Transaction): string;
    /**
     * Formatuje datę do postaci YYYY-MM-DD (dla hashy/agregacji).
     */
    private static toDateKey;
}
//# sourceMappingURL=Transaction.d.ts.map
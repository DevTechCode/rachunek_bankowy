import { TransactionCategory } from "../domain/TransactionCategory.js";
import type { ParsedDescription } from "../domain/Description.js";
/**
 * Prosty silnik reguł kategoryzacji.
 *
 * Wymaganie: "Klasyfikacja kategorii transakcji regułami + prosty rule engine".
 *
 * Podejście:
 * - reguły są deterministyczne i łatwe do rozbudowy,
 * - bazujemy na `type` z banku + wybranych polach z opisu.
 */
export declare class CategoryRuleEngine {
    /**
     * Klasyfikuje transakcję do kategorii.
     *
     * @param type - typ transakcji z wyciągu
     * @param amountMinor - znak/kwota (dla rozróżnienia TRANSFER_IN/OUT)
     * @param desc - sparsowany opis
     */
    categorize(type: string, amountMinor: bigint, desc: ParsedDescription): TransactionCategory;
}
//# sourceMappingURL=CategoryRuleEngine.d.ts.map
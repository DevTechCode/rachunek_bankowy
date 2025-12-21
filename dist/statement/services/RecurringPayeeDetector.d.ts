import { Money } from "../domain/Money.js";
import type { Transaction } from "../domain/Transaction.js";
/**
 * Wynik agregacji stałych odbiorców.
 */
export type RecurringPayee = {
    fingerprint: string;
    name?: string;
    account?: string;
    id?: string;
    count: number;
    totalAbs: Money;
    firstDate: Date;
    lastDate: Date;
};
/**
 * Detektor stałych odbiorców (recurring payees).
 *
 * Wymaganie: findRecurringPayees():
 * - grupowanie po fingerprint,
 * - uwzględnienie podobieństwa nazw / rachunku / NIP,
 * - policzenie częstotliwości i łącznej kwoty.
 *
 * Uwaga: fingerprint w `Counterparty` już uwzględnia konto/NIP/nazwę.
 * Dodatkowo w tej wersji robimy "soft merge" nazw bardzo podobnych, jeśli fingerprinty
 * różnią się, ale konto lub NIP jest to samo.
 */
export declare class RecurringPayeeDetector {
    /**
     * Wykrywa stałych odbiorców w zbiorze transakcji.
     *
     * Domyślnie analizujemy tylko koszty (amount < 0), bo "odbiorca" ma sens dla wydatków.
     *
     * @param transactions - lista transakcji
     * @param options - parametry filtrowania
     */
    findRecurringPayees(transactions: Transaction[], options?: {
        minCount?: number;
        expensesOnly?: boolean;
    }): RecurringPayee[];
}
//# sourceMappingURL=RecurringPayeeDetector.d.ts.map
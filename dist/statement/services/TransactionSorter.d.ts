import type { Transaction } from "../domain/Transaction.js";
/**
 * Sortowanie transakcji tak, aby kolejność była "logiczna" dla salda.
 *
 * Problem:
 * - bank potrafi zwrócić wiele transakcji z tą samą datą (operationDate/valueDate),
 * - jeśli posortujemy je tylko po dacie, saldo po może wyglądać "nielogicznie"
 *   (np. w obrębie jednego dnia saldo skacze w złej kolejności).
 *
 * Rozwiązanie:
 * - dla grupy (operationDate) budujemy łańcuch po zależności:
 *   saldo_przed = saldo_po - kwota
 * - jeśli uda się złożyć łańcuch, to jest on najlepszą kolejnością.
 * - jeśli nie da się jednoznacznie złożyć (braki/cykle), robimy deterministyczny fallback.
 */
export declare class TransactionSorter {
    /**
     * Sortuje transakcje:
     * - rosnąco po operationDate,
     * - w obrębie dnia układa "łańcuch sald" (best-effort).
     *
     * @param transactions - lista transakcji
     */
    sortByBalanceChain(transactions: Transaction[]): Transaction[];
    /**
     * Układa transakcje w obrębie jednego dnia wg łańcucha sald.
     *
     * @param txs - transakcje z tą samą datą operationDate
     */
    private chainWithinDay;
    /**
     * Układa łańcuch w obrębie jednej waluty.
     *
     * @param currency - waluta
     * @param txs - lista transakcji
     */
    private chainCurrencyGroup;
    /**
     * Date key YYYY-MM-DD.
     */
    private dateKey;
    /**
     * Klucz Money do mapowania (waluta + minor).
     */
    private moneyKey;
    /**
     * Odejmowanie Money: a - b (wymaga tej samej waluty).
     */
    private sub;
}
//# sourceMappingURL=TransactionSorter.d.ts.map
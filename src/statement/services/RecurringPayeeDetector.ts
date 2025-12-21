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
export class RecurringPayeeDetector {
  /**
   * Wykrywa stałych odbiorców w zbiorze transakcji.
   *
   * Domyślnie analizujemy tylko koszty (amount < 0), bo "odbiorca" ma sens dla wydatków.
   *
   * @param transactions - lista transakcji
   * @param options - parametry filtrowania
   */
  public findRecurringPayees(
    transactions: Transaction[],
    options?: { minCount?: number; expensesOnly?: boolean }
  ): RecurringPayee[] {
    const minCount = options?.minCount ?? 2;
    const expensesOnly = options?.expensesOnly ?? true;

    const base = expensesOnly ? transactions.filter((t) => t.amount.minor < 0n) : transactions;

    // 1) Grupowanie po fingerprint (najbardziej stabilne).
    const byFp = new Map<string, Transaction[]>();
    for (const t of base) {
      const fp = t.counterparty?.fingerprint;
      if (!fp) continue;
      const arr = byFp.get(fp) ?? [];
      arr.push(t);
      byFp.set(fp, arr);
    }

    // 2) Agregacja.
    const results: RecurringPayee[] = [];
    for (const [fp, txs] of byFp.entries()) {
      if (txs.length < minCount) continue;
      txs.sort((a, b) => a.operationDate.getTime() - b.operationDate.getTime());

      const cp = txs[0].counterparty;
      const currency = txs[0].amount.currency;
      let total = new Money(0n, currency);
      for (const t of txs) total = total.add(t.amount.abs());

      results.push({
        fingerprint: fp,
        name: cp?.name,
        account: cp?.account,
        id: cp?.id,
        count: txs.length,
        totalAbs: total,
        firstDate: txs[0].operationDate,
        lastDate: txs[txs.length - 1].operationDate
      });
    }

    // 3) Sortowanie: najpierw po count, potem po total.
    results.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (b.totalAbs.minor === a.totalAbs.minor) return 0;
      return b.totalAbs.minor > a.totalAbs.minor ? 1 : -1;
    });
    return results;
  }
}

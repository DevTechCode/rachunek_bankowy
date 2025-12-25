import { Money } from "../domain/Money.js";
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
export class TransactionSorter {
    /**
     * Sortuje transakcje:
     * - rosnąco po operationDate,
     * - w obrębie dnia układa "łańcuch sald" (best-effort).
     *
     * @param transactions - lista transakcji
     */
    sortByBalanceChain(transactions) {
        const groups = new Map();
        for (const t of transactions) {
            const key = this.dateKey(t.operationDate);
            const arr = groups.get(key) ?? [];
            arr.push(t);
            groups.set(key, arr);
        }
        const sortedKeys = [...groups.keys()].sort();
        const out = [];
        for (const day of sortedKeys) {
            const txs = groups.get(day);
            const chained = this.chainWithinDay(txs);
            out.push(...chained);
        }
        return out;
    }
    /**
     * Układa transakcje w obrębie jednego dnia wg łańcucha sald.
     *
     * @param txs - transakcje z tą samą datą operationDate
     */
    chainWithinDay(txs) {
        if (txs.length <= 1)
            return [...txs];
        // Grupujemy per waluta (saldo/kwota powinny być w tej samej walucie).
        const byCurr = new Map();
        for (const t of txs) {
            const c = t.endingBalance.currency;
            const arr = byCurr.get(c) ?? [];
            arr.push(t);
            byCurr.set(c, arr);
        }
        const out = [];
        for (const [curr, list] of byCurr.entries()) {
            out.push(...this.chainCurrencyGroup(curr, list));
        }
        // deterministyczne dosortowanie w obrębie dnia po valueDate jako tie-breaker,
        // zachowując łańcuchy już ułożone.
        out.sort((a, b) => {
            const ad = a.valueDate.getTime() - b.valueDate.getTime();
            if (ad !== 0)
                return ad;
            return a.dedupHash.localeCompare(b.dedupHash);
        });
        return out;
    }
    /**
     * Układa łańcuch w obrębie jednej waluty.
     *
     * @param currency - waluta
     * @param txs - lista transakcji
     */
    chainCurrencyGroup(currency, txs) {
        // startBalance = endingBalance - amount
        const startKey = (t) => this.moneyKey(this.sub(t.endingBalance, t.amount));
        const endKey = (t) => this.moneyKey(t.endingBalance);
        const byStart = new Map();
        const endSet = new Set();
        for (const t of txs) {
            const s = startKey(t);
            const e = endKey(t);
            const arr = byStart.get(s) ?? [];
            arr.push(t);
            byStart.set(s, arr);
            endSet.add(e);
        }
        // kandydaci na początek łańcucha: startBalance nie występuje jako czyjeś endBalance
        const heads = [...byStart.keys()].filter((s) => !endSet.has(s)).sort();
        const used = new Set();
        const out = [];
        const takeNext = (candidates) => {
            // deterministycznie wybieramy jedną transakcję, jeśli jest konflikt
            return [...candidates].sort((a, b) => a.dedupHash.localeCompare(b.dedupHash))[0];
        };
        const walkFrom = (start) => {
            let cursor = start;
            let guard = 0;
            while (guard++ < txs.length + 5) {
                const candidates = (byStart.get(cursor) ?? []).filter((t) => !used.has(t.dedupHash));
                if (candidates.length === 0)
                    break;
                const next = takeNext(candidates);
                used.add(next.dedupHash);
                out.push(next);
                cursor = endKey(next);
            }
        };
        // Najpierw budujemy "główne" łańcuchy od headów.
        for (const h of heads)
            walkFrom(h);
        // Reszta (cykle/braki): fallback po startBalance->endBalance.
        const remaining = txs.filter((t) => !used.has(t.dedupHash));
        remaining.sort((a, b) => {
            const sa = startKey(a).localeCompare(startKey(b));
            if (sa !== 0)
                return sa;
            const ea = endKey(a).localeCompare(endKey(b));
            if (ea !== 0)
                return ea;
            return a.dedupHash.localeCompare(b.dedupHash);
        });
        out.push(...remaining);
        return out;
    }
    /**
     * Date key YYYY-MM-DD.
     */
    dateKey(d) {
        const yyyy = d.getFullYear().toString().padStart(4, "0");
        const mm = (d.getMonth() + 1).toString().padStart(2, "0");
        const dd = d.getDate().toString().padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }
    /**
     * Klucz Money do mapowania (waluta + minor).
     */
    moneyKey(m) {
        return `${m.currency}:${m.minor.toString()}`;
    }
    /**
     * Odejmowanie Money: a - b (wymaga tej samej waluty).
     */
    sub(a, b) {
        if (a.currency !== b.currency) {
            throw new Error(`Currency mismatch in balance chain: ${a.currency} vs ${b.currency}`);
        }
        return new Money(a.minor - b.minor, a.currency);
    }
}
//# sourceMappingURL=TransactionSorter.js.map
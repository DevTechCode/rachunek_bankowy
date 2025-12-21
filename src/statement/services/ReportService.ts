import { Money } from "../domain/Money.js";
import type { Transaction } from "../domain/Transaction.js";

/**
 * Raport miesięczny (income/expense/net).
 */
export type MonthlySummary = {
  month: string; // YYYY-MM
  income: Money;
  expense: Money;
  net: Money;
};

/**
 * Raport VAT (sumy VAT + podział po formularzu).
 */
export type VatSummary = {
  month: string; // YYYY-MM
  vatTotal: Money;
  byTaxForm: Record<string, string>; // taxForm -> money string
};

/**
 * Top kontrahenci po łącznej kwocie (abs) i liczbie transakcji.
 */
export type TopCounterparty = {
  fingerprint: string;
  name?: string;
  count: number;
  totalAbs: Money;
};

/**
 * Serwis raportów.
 *
 * Wymaganie: raporty miesięczne, top kontrahenci, VAT summary.
 */
export class ReportService {
  /**
   * Zamienia raporty na obiekty bez BigInt (JSON-friendly).
   *
   * Cel: `Money` zawiera `bigint`, którego `JSON.stringify` nie serializuje.
   * Eksporty do plików powinny używać tych metod, albo własnych serializerów.
   */
  public toJsonMonthly(summary: MonthlySummary[]): Array<Record<string, unknown>> {
    return summary.map((s) => ({
      month: s.month,
      income: s.income.toString(true),
      expense: s.expense.toString(true),
      net: s.net.toString(true)
    }));
  }

  /**
   * JSON-friendly VAT summary.
   */
  public toJsonVat(summary: VatSummary[]): Array<Record<string, unknown>> {
    return summary.map((s) => ({
      month: s.month,
      vatTotal: s.vatTotal.toString(true),
      byTaxForm: s.byTaxForm
    }));
  }

  /**
   * JSON-friendly top counterparties.
   */
  public toJsonTop(top: TopCounterparty[]): Array<Record<string, unknown>> {
    return top.map((t) => ({
      fingerprint: t.fingerprint,
      name: t.name,
      count: t.count,
      totalAbs: t.totalAbs.toString(true)
    }));
  }

  /**
   * Buduje miesięczne podsumowanie przychodów i rozchodów.
   *
   * @param transactions - lista transakcji
   */
  public monthlySummary(transactions: Transaction[]): MonthlySummary[] {
    const byMonth = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const k = this.monthKey(t.operationDate);
      const arr = byMonth.get(k) ?? [];
      arr.push(t);
      byMonth.set(k, arr);
    }

    const res: MonthlySummary[] = [];
    for (const [month, txs] of byMonth.entries()) {
      const currency = txs[0]?.amount.currency ?? "PLN";
      let income = new Money(0n, currency);
      let expense = new Money(0n, currency);
      for (const t of txs) {
        if (t.amount.minor > 0n) income = income.add(t.amount);
        if (t.amount.minor < 0n) expense = expense.add(t.amount.abs());
      }
      const net = income.add(new Money(-expense.minor, expense.currency));
      res.push({ month, income, expense, net });
    }

    res.sort((a, b) => a.month.localeCompare(b.month));
    return res;
  }

  /**
   * Buduje zestawienie VAT per miesiąc.
   *
   * @param transactions - lista transakcji
   */
  public vatSummary(transactions: Transaction[]): VatSummary[] {
    const vatTx = transactions.filter((t) => t.vatInfo?.vatAmount);
    const byMonth = new Map<string, Transaction[]>();
    for (const t of vatTx) {
      const k = this.monthKey(t.operationDate);
      const arr = byMonth.get(k) ?? [];
      arr.push(t);
      byMonth.set(k, arr);
    }

    const res: VatSummary[] = [];
    for (const [month, txs] of byMonth.entries()) {
      const currency = txs[0].vatInfo!.vatAmount!.currency;
      let total = new Money(0n, currency);
      const byForm = new Map<string, Money>();

      for (const t of txs) {
        const vat = t.vatInfo?.vatAmount;
        if (!vat) continue;
        total = total.add(vat.abs());

        const form = (t.vatInfo?.taxForm ?? "UNKNOWN").toUpperCase();
        const prev = byForm.get(form) ?? new Money(0n, currency);
        byForm.set(form, prev.add(vat.abs()));
      }

      res.push({
        month,
        vatTotal: total,
        byTaxForm: Object.fromEntries(Array.from(byForm.entries()).map(([k, v]) => [k, v.toString(true)]))
      });
    }

    res.sort((a, b) => a.month.localeCompare(b.month));
    return res;
  }

  /**
   * Zwraca top kontrahentów po łącznej kwocie (abs).
   *
   * @param transactions - lista transakcji
   * @param limit - ile wyników zwrócić
   */
  public topCounterparties(transactions: Transaction[], limit = 10): TopCounterparty[] {
    const byFp = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const fp = t.counterparty?.fingerprint;
      if (!fp) continue;
      const arr = byFp.get(fp) ?? [];
      arr.push(t);
      byFp.set(fp, arr);
    }

    const res: TopCounterparty[] = [];
    for (const [fp, txs] of byFp.entries()) {
      const currency = txs[0]?.amount.currency ?? "PLN";
      let total = new Money(0n, currency);
      for (const t of txs) total = total.add(t.amount.abs());
      res.push({ fingerprint: fp, name: txs[0].counterparty?.name, count: txs.length, totalAbs: total });
    }

    res.sort((a, b) => {
      if (a.totalAbs.minor === b.totalAbs.minor) return b.count - a.count;
      return b.totalAbs.minor > a.totalAbs.minor ? 1 : -1;
    });
    return res.slice(0, limit);
  }

  /**
   * Buduje klucz miesiąca w formacie YYYY-MM.
   *
   * @param d - data
   */
  private monthKey(d: Date): string {
    const yyyy = d.getFullYear().toString().padStart(4, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    return `${yyyy}-${mm}`;
  }
}

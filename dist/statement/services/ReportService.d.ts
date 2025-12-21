import { Money } from "../domain/Money.js";
import type { Transaction } from "../domain/Transaction.js";
/**
 * Raport miesięczny (income/expense/net).
 */
export type MonthlySummary = {
    month: string;
    income: Money;
    expense: Money;
    net: Money;
};
/**
 * Raport VAT (sumy VAT + podział po formularzu).
 */
export type VatSummary = {
    month: string;
    vatTotal: Money;
    byTaxForm: Record<string, string>;
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
export declare class ReportService {
    /**
     * Zamienia raporty na obiekty bez BigInt (JSON-friendly).
     *
     * Cel: `Money` zawiera `bigint`, którego `JSON.stringify` nie serializuje.
     * Eksporty do plików powinny używać tych metod, albo własnych serializerów.
     */
    toJsonMonthly(summary: MonthlySummary[]): Array<Record<string, unknown>>;
    /**
     * JSON-friendly VAT summary.
     */
    toJsonVat(summary: VatSummary[]): Array<Record<string, unknown>>;
    /**
     * JSON-friendly top counterparties.
     */
    toJsonTop(top: TopCounterparty[]): Array<Record<string, unknown>>;
    /**
     * Buduje miesięczne podsumowanie przychodów i rozchodów.
     *
     * @param transactions - lista transakcji
     */
    monthlySummary(transactions: Transaction[]): MonthlySummary[];
    /**
     * Buduje zestawienie VAT per miesiąc.
     *
     * @param transactions - lista transakcji
     */
    vatSummary(transactions: Transaction[]): VatSummary[];
    /**
     * Zwraca top kontrahentów po łącznej kwocie (abs).
     *
     * @param transactions - lista transakcji
     * @param limit - ile wyników zwrócić
     */
    topCounterparties(transactions: Transaction[], limit?: number): TopCounterparty[];
    /**
     * Buduje klucz miesiąca w formacie YYYY-MM.
     *
     * @param d - data
     */
    private monthKey;
}
//# sourceMappingURL=ReportService.d.ts.map
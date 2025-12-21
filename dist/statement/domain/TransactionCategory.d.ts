/**
 * Kategoria transakcji nadawana heurystycznie (rule engine).
 *
 * Cel: dać spójne agregacje w raportach niezależnie od "typ" z banku.
 */
export declare enum TransactionCategory {
    TAX = "TAX",
    ZUS = "ZUS",
    CARD_PAYMENT = "CARD_PAYMENT",
    TRANSFER_OUT = "TRANSFER_OUT",
    TRANSFER_IN = "TRANSFER_IN",
    FEES = "FEES",
    CASH = "CASH",
    OTHER = "OTHER"
}
//# sourceMappingURL=TransactionCategory.d.ts.map
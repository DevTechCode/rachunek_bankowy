/**
 * Kategoria transakcji nadawana heurystycznie (rule engine).
 *
 * Cel: dać spójne agregacje w raportach niezależnie od "typ" z banku.
 */
export var TransactionCategory;
(function (TransactionCategory) {
    TransactionCategory["TAX"] = "TAX";
    TransactionCategory["ZUS"] = "ZUS";
    TransactionCategory["CARD_PAYMENT"] = "CARD_PAYMENT";
    TransactionCategory["TRANSFER_OUT"] = "TRANSFER_OUT";
    TransactionCategory["TRANSFER_IN"] = "TRANSFER_IN";
    TransactionCategory["FEES"] = "FEES";
    TransactionCategory["CASH"] = "CASH";
    TransactionCategory["OTHER"] = "OTHER";
})(TransactionCategory || (TransactionCategory = {}));
//# sourceMappingURL=TransactionCategory.js.map
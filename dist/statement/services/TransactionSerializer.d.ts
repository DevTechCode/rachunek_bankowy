import type { Transaction } from "../domain/Transaction.js";
/**
 * Serializuje `Transaction` (z klasami, Mapami, bigint) do obiektu JSON-friendly.
 *
 * Powód: `JSON.stringify` nie wspiera bigint i Map bez custom logiki.
 * Dzięki temu eksport JSON/CSV oraz raporty są przewidywalne.
 */
export declare class TransactionSerializer {
    /**
     * Zamienia transakcję na obiekt gotowy do JSON.
     *
     * @param t - transakcja
     */
    toJsonObject(t: Transaction): Record<string, unknown>;
}
//# sourceMappingURL=TransactionSerializer.d.ts.map
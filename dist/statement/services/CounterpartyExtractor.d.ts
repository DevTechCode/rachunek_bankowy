import { Counterparty } from "../domain/Counterparty.js";
import type { ParsedDescription } from "../domain/Description.js";
/**
 * Ekstraktor kontrahenta (nadawca/odbiorca) z opisu.
 *
 * Wymaganie: extractCounterparty():
 * - normalizuje kontrahenta (nazwa, NIP/identyfikator, rachunek),
 * - robi fingerprint kontrahenta.
 *
 * Heurystyka kierunku:
 * - jeśli amountMinor < 0: zwykle płatność wychodząca -> kontrahent = odbiorca,
 * - jeśli amountMinor > 0: zwykle wpływ -> kontrahent = nadawca.
 *
 * Uwaga: dla przelewów podatkowych/ZUS pola mogą mieć inną nomenklaturę:
 * - "Nazwa i nr identyfikatora : NIP, 777..."
 */
export declare class CounterpartyExtractor {
    /**
     * Buduje obiekt `Counterparty` na podstawie opisu i kierunku transakcji.
     *
     * @param desc - sparsowany opis
     * @param amountMinor - kwota w minor units (znak określa kierunek)
     */
    extractCounterparty(desc: ParsedDescription, amountMinor: bigint): Counterparty | undefined;
    /**
     * Wyciąga cyfry (np. NIP) lub zwraca oryginalny tekst jeśli nie ma sensownego dopasowania.
     *
     * @param raw - wejściowy identyfikator
     */
    private extractDigitsOrFallback;
}
//# sourceMappingURL=CounterpartyExtractor.d.ts.map
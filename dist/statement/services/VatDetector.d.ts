import { VatInfo } from "../domain/VatInfo.js";
import type { ParsedDescription } from "../domain/Description.js";
import type { Currency } from "../domain/Currency.js";
/**
 * Detektor VAT / przelewów podatkowych.
 *
 * Wymaganie: detectVatInfo() ma:
 * - wykrywać, czy transakcja ma informacje o VAT,
 * - wyciągać: vatAmount, vatCurrency, invoiceNumber, taxForm, okresPłatności.
 *
 * Źródła danych w opisie (na podstawie Twoich XML):
 * - "Kwota VAT : 2139,00 PLN"
 * - "Numer faktury VAT lub okres płatności zbiorczej : FV/16/2025" albo "12/2025"
 * - "Symbol formularza : VAT-7" / "PIT-4"
 * - "Okres płatności : 25M10"
 */
export declare class VatDetector {
    /**
     * Wykrywa i buduje `VatInfo` na podstawie typu transakcji i sparsowanego opisu.
     *
     * @param type - typ transakcji z banku (np. "Przelew podatkowy")
     * @param desc - sparsowany opis
     * @param statementCurrency - waluta wyciągu (fallback, jeśli w polu VAT nie ma waluty)
     */
    detectVatInfo(type: string, desc: ParsedDescription, statementCurrency: Currency): VatInfo | undefined;
    /**
     * Heurystycznie wykrywa split payment.
     *
     * Sygnały:
     * - obecność "Kwota VAT" (typowe dla split payment),
     * - typ jest przelewem,
     * - transakcja jest "outgoing" (kwota ujemna) - w praktyce split payment jest wykonywany przy płatności.
     *
     * @param type - typ transakcji z banku
     * @param amountMinor - kwota transakcji w minor units (znak mówi o kierunku)
     * @param vatInfo - wykryte info VAT (może być undefined)
     */
    detectSplitPayment(type: string, amountMinor: bigint, vatInfo?: VatInfo): boolean;
    /**
     * Wyciąga kwotę VAT (np. "2139,00 PLN").
     *
     * @param desc - opis
     * @param statementCurrency - fallback waluty
     */
    private extractVatAmount;
    /**
     * Wyciąga z pola "Numer faktury VAT lub okres płatności zbiorczej"
     * informację o numerze faktury albo o okresie (gdy pole ma np. "12/2025").
     *
     * @param desc - opis
     */
    private extractInvoiceOrPeriod;
    /**
     * Wyciąga symbol formularza podatkowego.
     *
     * W przykładach: "Symbol formularza : VAT-7" / "PIT-4".
     *
     * @param type - typ transakcji
     * @param desc - opis
     */
    private extractTaxForm;
    /**
     * Wyciąga "Okres płatności".
     *
     * @param desc - opis
     */
    private extractPaymentPeriod;
}
//# sourceMappingURL=VatDetector.d.ts.map
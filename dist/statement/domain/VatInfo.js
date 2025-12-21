/**
 * Informacje o podatku VAT / przelewach podatkowych.
 *
 * Ten model jest celowo elastyczny:
 * - czasem mamy "Kwota VAT" (split payment),
 * - czasem "Symbol formularza: VAT-7 / PIT-4",
 * - czasem faktura/okres w polu "Numer faktury VAT lub okres płatności zbiorczej".
 */
export class VatInfo {
    vatAmount;
    invoiceNumber;
    taxForm;
    paymentPeriod;
    /**
     * @param init - inicjalizacja; klasa immutable
     */
    constructor(init) {
        this.vatAmount = init?.vatAmount;
        this.invoiceNumber = init?.invoiceNumber?.trim() || undefined;
        this.taxForm = init?.taxForm?.trim() || undefined;
        this.paymentPeriod = init?.paymentPeriod?.trim() || undefined;
    }
    /**
     * Szybki check, czy obiekt realnie niesie dane.
     */
    isEmpty() {
        return !this.vatAmount && !this.invoiceNumber && !this.taxForm && !this.paymentPeriod;
    }
}
//# sourceMappingURL=VatInfo.js.map
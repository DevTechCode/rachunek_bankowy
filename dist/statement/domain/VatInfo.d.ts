import { Money } from "./Money.js";
/**
 * Informacje o podatku VAT / przelewach podatkowych.
 *
 * Ten model jest celowo elastyczny:
 * - czasem mamy "Kwota VAT" (split payment),
 * - czasem "Symbol formularza: VAT-7 / PIT-4",
 * - czasem faktura/okres w polu "Numer faktury VAT lub okres płatności zbiorczej".
 */
export declare class VatInfo {
    readonly vatAmount?: Money;
    readonly invoiceNumber?: string;
    readonly taxForm?: string;
    readonly paymentPeriod?: string;
    /**
     * @param init - inicjalizacja; klasa immutable
     */
    constructor(init?: {
        vatAmount?: Money;
        invoiceNumber?: string;
        taxForm?: string;
        paymentPeriod?: string;
    });
    /**
     * Szybki check, czy obiekt realnie niesie dane.
     */
    isEmpty(): boolean;
}
//# sourceMappingURL=VatInfo.d.ts.map
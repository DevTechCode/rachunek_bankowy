import { Money } from "./Money.js";

/**
 * Informacje o podatku VAT / przelewach podatkowych.
 *
 * Ten model jest celowo elastyczny:
 * - czasem mamy "Kwota VAT" (split payment),
 * - czasem "Symbol formularza: VAT-7 / PIT-4",
 * - czasem faktura/okres w polu "Numer faktury VAT lub okres płatności zbiorczej".
 */
export class VatInfo {
  public readonly vatAmount?: Money;
  public readonly invoiceNumber?: string;
  public readonly taxForm?: string;
  public readonly paymentPeriod?: string;

  /**
   * @param init - inicjalizacja; klasa immutable
   */
  public constructor(init?: {
    vatAmount?: Money;
    invoiceNumber?: string;
    taxForm?: string;
    paymentPeriod?: string;
  }) {
    this.vatAmount = init?.vatAmount;
    this.invoiceNumber = init?.invoiceNumber?.trim() || undefined;
    this.taxForm = init?.taxForm?.trim() || undefined;
    this.paymentPeriod = init?.paymentPeriod?.trim() || undefined;
  }

  /**
   * Szybki check, czy obiekt realnie niesie dane.
   */
  public isEmpty(): boolean {
    return !this.vatAmount && !this.invoiceNumber && !this.taxForm && !this.paymentPeriod;
  }
}

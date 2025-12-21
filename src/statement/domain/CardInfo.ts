import { Money } from "./Money.js";

/**
 * Dane dotyczące transakcji kartowej.
 *
 * W wyciągach często pojawiają się pola:
 * - "Numer karty"
 * - "Data wykonania operacji"
 * - "Oryginalna kwota operacji"
 */
export class CardInfo {
  public readonly cardNumberMasked?: string;
  public readonly operationDate?: Date;
  public readonly originalAmount?: Money;

  /**
   * @param init - inicjalizacja; klasa immutable
   */
  public constructor(init?: {
    cardNumberMasked?: string;
    operationDate?: Date;
    originalAmount?: Money;
  }) {
    this.cardNumberMasked = init?.cardNumberMasked?.trim() || undefined;
    this.operationDate = init?.operationDate;
    this.originalAmount = init?.originalAmount;
  }
}

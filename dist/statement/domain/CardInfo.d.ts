import { Money } from "./Money.js";
/**
 * Dane dotyczące transakcji kartowej.
 *
 * W wyciągach często pojawiają się pola:
 * - "Numer karty"
 * - "Data wykonania operacji"
 * - "Oryginalna kwota operacji"
 */
export declare class CardInfo {
    readonly cardNumberMasked?: string;
    readonly operationDate?: Date;
    readonly originalAmount?: Money;
    /**
     * @param init - inicjalizacja; klasa immutable
     */
    constructor(init?: {
        cardNumberMasked?: string;
        operationDate?: Date;
        originalAmount?: Money;
    });
}
//# sourceMappingURL=CardInfo.d.ts.map
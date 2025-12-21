/**
 * Dane dotyczące transakcji kartowej.
 *
 * W wyciągach często pojawiają się pola:
 * - "Numer karty"
 * - "Data wykonania operacji"
 * - "Oryginalna kwota operacji"
 */
export class CardInfo {
    cardNumberMasked;
    operationDate;
    originalAmount;
    /**
     * @param init - inicjalizacja; klasa immutable
     */
    constructor(init) {
        this.cardNumberMasked = init?.cardNumberMasked?.trim() || undefined;
        this.operationDate = init?.operationDate;
        this.originalAmount = init?.originalAmount;
    }
}
//# sourceMappingURL=CardInfo.js.map
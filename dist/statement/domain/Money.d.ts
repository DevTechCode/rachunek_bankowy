import { type Currency } from "./Currency.js";
/**
 * Niezmienna wartość pieniężna.
 *
 * Cel: unikamy błędów floatów (np. 0.1 + 0.2 !== 0.3) przechowując kwotę w "minor units"
 * (np. grosze dla PLN) jako integer.
 *
 * W wyciągach bankowych często występują kwoty w formatach:
 * - "-95.80" (kropka)
 * - "-95,80" (przecinek)
 * - "+2641.40" (plus)
 * - "16.948,96" (separator tysięcy i przecinek jako decimal)
 */
export declare class Money {
    readonly currency: Currency;
    readonly minor: bigint;
    readonly minorUnits: number;
    /**
     * Tworzy Money z kwoty w minor units.
     *
     * @param minor - kwota w minor units (np. grosze)
     * @param currency - kod waluty
     */
    constructor(minor: bigint, currency: Currency);
    /**
     * Parsuje kwotę z tekstu bankowego do Money.
     *
     * Heurystyki:
     * - toleruje "+" i "-"
     * - usuwa spacje
     * - rozpoznaje separator dziesiętny jako ostatnie wystąpienie "." lub ","
     * - wcześniejsze separatory traktuje jako tysięczne i usuwa
     *
     * @param raw - surowy tekst kwoty
     * @param currency - waluta
     */
    static parse(raw: string, currency: Currency): Money;
    /**
     * Tworzy Money z liczby (UWAGA: tylko jeśli wiesz, że nie tracisz precyzji).
     *
     * @param amount - kwota jako number
     * @param currency - waluta
     */
    static fromNumber(amount: number, currency: Currency): Money;
    /**
     * Zwraca kwotę jako number (może tracić precyzję dla bardzo dużych kwot).
     */
    toNumber(): number;
    /**
     * Formatowanie do stringa (np. "-95.80 PLN").
     *
     * @param withCurrency - czy dopisać kod waluty
     */
    toString(withCurrency?: boolean): string;
    /**
     * Dodawanie Money (wymaga tej samej waluty).
     *
     * @param other - składnik
     */
    add(other: Money): Money;
    /**
     * Wartość bezwzględna.
     */
    abs(): Money;
    /**
     * Sprawdza znak (przychód/rozchód).
     */
    isNegative(): boolean;
    /**
     * Normalizuje tekst liczbowy do formy, którą da się bezpiecznie sparsować.
     *
     * @param raw - wejście
     */
    private static cleanNumberLike;
    /**
     * Rozdziela część całkowitą i dziesiętną, obsługując zarówno "," jak i ".".
     *
     * @param unsigned - liczba bez znaku (np. "16.948,96")
     */
    private static splitDecimal;
    /**
     * Wymusza zgodność waluty.
     */
    private static assertSameCurrency;
}
//# sourceMappingURL=Money.d.ts.map
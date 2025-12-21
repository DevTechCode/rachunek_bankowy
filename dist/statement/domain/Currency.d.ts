/**
 * Waluta w systemie.
 *
 * Uwaga: w wyciągach bankowych zwykle pojawiają się kody ISO 4217 (np. PLN, EUR).
 * Trzymamy to jako typ string z preferowanymi stałymi, bo bank może w przyszłości
 * dodać walutę, której nie przewidzieliśmy.
 */
export type Currency = "PLN" | "EUR" | "USD" | "GBP" | (string & {});
/**
 * Liczba miejsc po przecinku dla walut.
 *
 * @param currency - kod waluty
 * @returns ilość miejsc dziesiętnych (np. 2 dla PLN)
 */
export declare function currencyMinorUnits(currency: Currency): number;
//# sourceMappingURL=Currency.d.ts.map
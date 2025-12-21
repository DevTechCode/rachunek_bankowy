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
export function currencyMinorUnits(currency: Currency): number {
  // Produkcyjnie: można użyć pełnej tabeli ISO; tutaj trzymamy rozsądny default.
  // Dla typowych operacji PKO: 2.
  switch (currency) {
    default:
      return 2;
  }
}

/**
 * Liczba miejsc po przecinku dla walut.
 *
 * @param currency - kod waluty
 * @returns ilość miejsc dziesiętnych (np. 2 dla PLN)
 */
export function currencyMinorUnits(currency) {
    // Produkcyjnie: można użyć pełnej tabeli ISO; tutaj trzymamy rozsądny default.
    // Dla typowych operacji PKO: 2.
    switch (currency) {
        default:
            return 2;
    }
}
//# sourceMappingURL=Currency.js.map
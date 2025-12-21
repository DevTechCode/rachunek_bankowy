/**
 * Błąd parsowania z kontekstem.
 *
 * W praktyce parsery (XML/HTML/Description) często muszą działać w trybie "best-effort":
 * - próbują zinterpretować dane mimo nieidealnego formatu,
 * - ale chcemy zachować maksymalnie dużo informacji o tym, co poszło nie tak.
 *
 * Ta klasa umożliwia dołączenie:
 * - fragmentu wejścia (`snippet`),
 * - ścieżki/sekcji (`path`),
 * - oraz opcjonalnej przyczyny (`cause`).
 */
export class ParseError extends Error {
    path;
    snippet;
    cause;
    /**
     * Tworzy błąd parsowania.
     *
     * @param message - czytelny opis problemu
     * @param options - dodatkowy kontekst (ścieżka, snippet, przyczyna)
     */
    constructor(message, options) {
        super(message);
        this.name = "ParseError";
        this.path = options?.path;
        this.snippet = options?.snippet;
        this.cause = options?.cause;
    }
}
//# sourceMappingURL=ParseError.js.map
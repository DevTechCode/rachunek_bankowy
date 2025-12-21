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
export declare class ParseError extends Error {
    readonly path?: string;
    readonly snippet?: string;
    readonly cause?: unknown;
    /**
     * Tworzy błąd parsowania.
     *
     * @param message - czytelny opis problemu
     * @param options - dodatkowy kontekst (ścieżka, snippet, przyczyna)
     */
    constructor(message: string, options?: {
        path?: string;
        snippet?: string;
        cause?: unknown;
    });
}
//# sourceMappingURL=ParseError.d.ts.map
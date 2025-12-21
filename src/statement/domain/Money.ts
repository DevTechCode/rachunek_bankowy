import { currencyMinorUnits, type Currency } from "./Currency.js";

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
export class Money {
  public readonly currency: Currency;
  public readonly minor: bigint;
  public readonly minorUnits: number;

  /**
   * Tworzy Money z kwoty w minor units.
   *
   * @param minor - kwota w minor units (np. grosze)
   * @param currency - kod waluty
   */
  public constructor(minor: bigint, currency: Currency) {
    this.currency = currency;
    this.minorUnits = currencyMinorUnits(currency);
    this.minor = minor;
  }

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
  public static parse(raw: string, currency: Currency): Money {
    const minorUnits = currencyMinorUnits(currency);
    const cleaned = Money.cleanNumberLike(raw);
    if (!cleaned) return new Money(0n, currency);

    const sign = cleaned.startsWith("-") ? -1n : 1n;
    const unsigned = cleaned.replace(/^[+-]/, "");

    const { intPart, fracPart } = Money.splitDecimal(unsigned);
    const frac = (fracPart ?? "").padEnd(minorUnits, "0").slice(0, minorUnits);
    const minor = BigInt(intPart || "0") * BigInt(10 ** minorUnits) + BigInt(frac || "0");
    return new Money(sign * minor, currency);
  }

  /**
   * Tworzy Money z liczby (UWAGA: tylko jeśli wiesz, że nie tracisz precyzji).
   *
   * @param amount - kwota jako number
   * @param currency - waluta
   */
  public static fromNumber(amount: number, currency: Currency): Money {
    const minorUnits = currencyMinorUnits(currency);
    const factor = 10 ** minorUnits;
    const minor = BigInt(Math.round(amount * factor));
    return new Money(minor, currency);
  }

  /**
   * Zwraca kwotę jako number (może tracić precyzję dla bardzo dużych kwot).
   */
  public toNumber(): number {
    const factor = 10 ** this.minorUnits;
    return Number(this.minor) / factor;
  }

  /**
   * Formatowanie do stringa (np. "-95.80 PLN").
   *
   * @param withCurrency - czy dopisać kod waluty
   */
  public toString(withCurrency = true): string {
    const sign = this.minor < 0n ? "-" : "";
    const abs = this.minor < 0n ? -this.minor : this.minor;
    const factor = BigInt(10 ** this.minorUnits);
    const i = abs / factor;
    const f = (abs % factor).toString().padStart(this.minorUnits, "0");
    const amount = this.minorUnits > 0 ? `${sign}${i.toString()}.${f}` : `${sign}${i.toString()}`;
    return withCurrency ? `${amount} ${this.currency}` : amount;
  }

  /**
   * Dodawanie Money (wymaga tej samej waluty).
   *
   * @param other - składnik
   */
  public add(other: Money): Money {
    Money.assertSameCurrency(this, other);
    return new Money(this.minor + other.minor, this.currency);
  }

  /**
   * Wartość bezwzględna.
   */
  public abs(): Money {
    return new Money(this.minor < 0n ? -this.minor : this.minor, this.currency);
  }

  /**
   * Sprawdza znak (przychód/rozchód).
   */
  public isNegative(): boolean {
    return this.minor < 0n;
  }

  /**
   * Normalizuje tekst liczbowy do formy, którą da się bezpiecznie sparsować.
   *
   * @param raw - wejście
   */
  private static cleanNumberLike(raw: string): string {
    if (!raw) return "";
    return raw
      .toString()
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^\d.,+-]/g, "");
  }

  /**
   * Rozdziela część całkowitą i dziesiętną, obsługując zarówno "," jak i ".".
   *
   * @param unsigned - liczba bez znaku (np. "16.948,96")
   */
  private static splitDecimal(unsigned: string): { intPart: string; fracPart?: string } {
    const lastDot = unsigned.lastIndexOf(".");
    const lastComma = unsigned.lastIndexOf(",");
    const idx = Math.max(lastDot, lastComma);

    if (idx === -1) {
      // Brak części dziesiętnej; usuwamy separatory tysięcy jeśli są.
      return { intPart: unsigned.replace(/[.,]/g, "") };
    }

    const intPart = unsigned.slice(0, idx).replace(/[.,]/g, "");
    const fracPart = unsigned.slice(idx + 1).replace(/[.,]/g, "");
    return { intPart, fracPart };
  }

  /**
   * Wymusza zgodność waluty.
   */
  private static assertSameCurrency(a: Money, b: Money): void {
    if (a.currency !== b.currency) {
      throw new Error(`Currency mismatch: ${a.currency} vs ${b.currency}`);
    }
  }
}

import { Counterparty } from "../domain/Counterparty.js";
import type { ParsedDescription } from "../domain/Description.js";

/**
 * Ekstraktor kontrahenta (nadawca/odbiorca) z opisu.
 *
 * Wymaganie: extractCounterparty():
 * - normalizuje kontrahenta (nazwa, NIP/identyfikator, rachunek),
 * - robi fingerprint kontrahenta.
 *
 * Heurystyka kierunku:
 * - jeśli amountMinor < 0: zwykle płatność wychodząca -> kontrahent = odbiorca,
 * - jeśli amountMinor > 0: zwykle wpływ -> kontrahent = nadawca.
 *
 * Uwaga: dla przelewów podatkowych/ZUS pola mogą mieć inną nomenklaturę:
 * - "Nazwa i nr identyfikatora : NIP, 777..."
 */
export class CounterpartyExtractor {
  /**
   * Buduje obiekt `Counterparty` na podstawie opisu i kierunku transakcji.
   *
   * @param desc - sparsowany opis
   * @param amountMinor - kwota w minor units (znak określa kierunek)
   */
  public extractCounterparty(desc: ParsedDescription, amountMinor: bigint): Counterparty | undefined {
    const outgoing = amountMinor < 0n;

    const account = outgoing
      ? desc.getFirst("rachunek odbiorcy")
      : desc.getFirst("rachunek nadawcy");

    const name = outgoing ? desc.getFirst("nazwa odbiorcy") : desc.getFirst("nazwa nadawcy");

    const address = outgoing ? desc.getFirst("adres odbiorcy") : desc.getFirst("adres nadawcy");

    // Identyfikatory występują pod różnymi nazwami.
    const id =
      desc.getFirst("identyfikator odbiorcy") ??
      desc.getFirst("nazwa i nr identyfikatora") ??
      desc.getFirst("nazwa i nr identyfikatora :") ??
      undefined;

    // Jeżeli nie mamy nic, nie tworzymy kontrahenta.
    if (!account && !name && !id) return undefined;

    // "Nazwa i nr identyfikatora : NIP, 7773444530" -> wyciągamy cyfry
    const idNormalized = id ? this.extractDigitsOrFallback(id) : undefined;

    return new Counterparty({
      account: account ?? undefined,
      name: name ?? undefined,
      address: address ?? undefined,
      id: idNormalized
    });
  }

  /**
   * Wyciąga cyfry (np. NIP) lub zwraca oryginalny tekst jeśli nie ma sensownego dopasowania.
   *
   * @param raw - wejściowy identyfikator
   */
  private extractDigitsOrFallback(raw: string): string {
    const digits = raw.replace(/[^\d]/g, "");
    if (digits.length >= 8) return digits;
    return raw.trim();
  }
}

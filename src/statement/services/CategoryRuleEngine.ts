import { TransactionCategory } from "../domain/TransactionCategory.js";
import type { ParsedDescription } from "../domain/Description.js";

/**
 * Prosty silnik reguł kategoryzacji.
 *
 * Wymaganie: "Klasyfikacja kategorii transakcji regułami + prosty rule engine".
 *
 * Podejście:
 * - reguły są deterministyczne i łatwe do rozbudowy,
 * - bazujemy na `type` z banku + wybranych polach z opisu.
 */
export class CategoryRuleEngine {
  /**
   * Klasyfikuje transakcję do kategorii.
   *
   * @param type - typ transakcji z wyciągu
   * @param amountMinor - znak/kwota (dla rozróżnienia TRANSFER_IN/OUT)
   * @param desc - sparsowany opis
   */
  public categorize(type: string, amountMinor: bigint, desc: ParsedDescription): TransactionCategory {
    const t = (type ?? "").toString().toLowerCase();
    const outgoing = amountMinor < 0n;

    if (t.includes("przelew podatkowy") || desc.getFirst("symbol formularza")) {
      return TransactionCategory.TAX;
    }
    if (t.includes("przelew do zus") || /zus/i.test(desc.getFirst("nazwa odbiorcy") ?? "")) {
      return TransactionCategory.ZUS;
    }
    if (t.includes("płatność kartą") || t.includes("zakup w terminalu")) {
      return TransactionCategory.CARD_PAYMENT;
    }
    if (t.includes("opłata")) {
      return TransactionCategory.FEES;
    }

    // Przelewy
    if (t.includes("przelew")) {
      return outgoing ? TransactionCategory.TRANSFER_OUT : TransactionCategory.TRANSFER_IN;
    }

    return TransactionCategory.OTHER;
  }
}

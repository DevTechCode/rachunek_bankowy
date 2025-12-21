import crypto from "node:crypto";
import { CardInfo } from "./CardInfo.js";
import { Counterparty } from "./Counterparty.js";
import { LocationInfo } from "./LocationInfo.js";
import { Money } from "./Money.js";
import { ParsedDescription } from "./Description.js";
import { ReferenceInfo } from "./ReferenceInfo.js";
import { TransactionCategory } from "./TransactionCategory.js";
import { VatInfo } from "./VatInfo.js";

/**
 * Model domenowy pojedynczej transakcji.
 *
 * Pola bazowe pochodzą bezpośrednio z wyciągu:
 * - dataOperacji (order-date)
 * - dataWaluty (exec-date)
 * - typ (type)
 * - description (opis, surowy + rozbity)
 * - amount + currency
 * - saldoPo (ending balance)
 *
 * Pola wzbogacone:
 * - counterparty (kontrahent)
 * - vatInfo / splitPayment
 * - cardInfo / locationInfo / referenceInfo
 * - category (heurystyczna)
 * - dedupHash (stabilny hash do wykrywania duplikatów)
 */
export class Transaction {
  public readonly operationDate: Date;
  public readonly valueDate: Date;
  public readonly type: string;
  public readonly description: ParsedDescription;
  public readonly amount: Money;
  public readonly endingBalance: Money;

  public readonly counterparty?: Counterparty;
  public readonly vatInfo?: VatInfo;
  public readonly splitPayment: boolean;
  public readonly locationInfo?: LocationInfo;
  public readonly cardInfo?: CardInfo;
  public readonly referenceInfo?: ReferenceInfo;
  public readonly category: TransactionCategory;

  public readonly dedupHash: string;

  /**
   * @param init - wszystkie pola potrzebne do utworzenia transakcji
   */
  public constructor(init: {
    operationDate: Date;
    valueDate: Date;
    type: string;
    description: ParsedDescription;
    amount: Money;
    endingBalance: Money;
    counterparty?: Counterparty;
    vatInfo?: VatInfo;
    splitPayment?: boolean;
    locationInfo?: LocationInfo;
    cardInfo?: CardInfo;
    referenceInfo?: ReferenceInfo;
    category?: TransactionCategory;
  }) {
    this.operationDate = init.operationDate;
    this.valueDate = init.valueDate;
    this.type = init.type;
    this.description = init.description;
    this.amount = init.amount;
    this.endingBalance = init.endingBalance;

    this.counterparty = init.counterparty;
    this.vatInfo = init.vatInfo;
    this.splitPayment = init.splitPayment ?? false;
    this.locationInfo = init.locationInfo;
    this.cardInfo = init.cardInfo;
    this.referenceInfo = init.referenceInfo;
    this.category = init.category ?? TransactionCategory.OTHER;

    this.dedupHash = Transaction.computeDedupHash(this);
  }

  /**
   * Czy transakcja jest przychodem.
   */
  public isIncome(): boolean {
    return this.amount.minor > 0n;
  }

  /**
   * Czy transakcja jest kosztem.
   */
  public isExpense(): boolean {
    return this.amount.minor < 0n;
  }

  /**
   * Stabilny hash do deduplikacji.
   *
   * Używamy pól, które w praktyce są najbardziej stabilne:
   * - data operacji (YYYY-MM-DD)
   * - kwota w minor units + waluta
   * - fingerprint kontrahenta (jeśli jest)
   * - numer referencyjny / własne referencje (jeśli są)
   *
   * @param t - transakcja
   */
  public static computeDedupHash(t: Transaction): string {
    const d = Transaction.toDateKey(t.operationDate);
    const amount = `${t.amount.minor.toString()}|${t.amount.currency}`;
    const cp = t.counterparty?.fingerprint ?? "";
    const ref = [
      t.referenceInfo?.referenceNumber ?? "",
      t.referenceInfo?.ownReference ?? "",
      t.referenceInfo?.operationId ?? ""
    ]
      .filter(Boolean)
      .join("|");

    const base = `d=${d}|a=${amount}|cp=${cp}|ref=${ref}`;
    return crypto.createHash("sha256").update(base, "utf8").digest("hex").slice(0, 24);
  }

  /**
   * Formatuje datę do postaci YYYY-MM-DD (dla hashy/agregacji).
   */
  private static toDateKey(d: Date): string {
    const yyyy = d.getFullYear().toString().padStart(4, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
}

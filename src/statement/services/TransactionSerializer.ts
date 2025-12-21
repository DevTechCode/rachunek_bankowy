import type { Transaction } from "../domain/Transaction.js";

/**
 * Serializuje `Transaction` (z klasami, Mapami, bigint) do obiektu JSON-friendly.
 *
 * Powód: `JSON.stringify` nie wspiera bigint i Map bez custom logiki.
 * Dzięki temu eksport JSON/CSV oraz raporty są przewidywalne.
 */
export class TransactionSerializer {
  /**
   * Zamienia transakcję na obiekt gotowy do JSON.
   *
   * @param t - transakcja
   */
  public toJsonObject(t: Transaction): Record<string, unknown> {
    return {
      operationDate: t.operationDate.toISOString().slice(0, 10),
      valueDate: t.valueDate.toISOString().slice(0, 10),
      type: t.type,
      descriptionRaw: t.description.raw,
      descriptionDetails: Object.fromEntries(
        Array.from(t.description.details.entries()).map(([k, v]) => [k, [...v]])
      ),
      amount: {
        currency: t.amount.currency,
        minor: t.amount.minor.toString(),
        minorUnits: t.amount.minorUnits,
        number: t.amount.toNumber()
      },
      endingBalance: {
        currency: t.endingBalance.currency,
        minor: t.endingBalance.minor.toString(),
        minorUnits: t.endingBalance.minorUnits,
        number: t.endingBalance.toNumber()
      },
      counterparty: t.counterparty
        ? {
            name: t.counterparty.name,
            account: t.counterparty.account,
            id: t.counterparty.id,
            address: t.counterparty.address,
            fingerprint: t.counterparty.fingerprint
          }
        : undefined,
      vatInfo: t.vatInfo
        ? {
            vatAmount: t.vatInfo.vatAmount
              ? {
                  currency: t.vatInfo.vatAmount.currency,
                  minor: t.vatInfo.vatAmount.minor.toString(),
                  minorUnits: t.vatInfo.vatAmount.minorUnits,
                  number: t.vatInfo.vatAmount.toNumber()
                }
              : undefined,
            invoiceNumber: t.vatInfo.invoiceNumber,
            taxForm: t.vatInfo.taxForm,
            paymentPeriod: t.vatInfo.paymentPeriod
          }
        : undefined,
      splitPayment: t.splitPayment,
      locationInfo: t.locationInfo
        ? { address: t.locationInfo.address, city: t.locationInfo.city, country: t.locationInfo.country }
        : undefined,
      cardInfo: t.cardInfo
        ? {
            cardNumberMasked: t.cardInfo.cardNumberMasked,
            operationDate: t.cardInfo.operationDate?.toISOString().slice(0, 10),
            originalAmount: t.cardInfo.originalAmount
              ? {
                  currency: t.cardInfo.originalAmount.currency,
                  minor: t.cardInfo.originalAmount.minor.toString(),
                  minorUnits: t.cardInfo.originalAmount.minorUnits,
                  number: t.cardInfo.originalAmount.toNumber()
                }
              : undefined
          }
        : undefined,
      referenceInfo: t.referenceInfo
        ? {
            referenceNumber: t.referenceInfo.referenceNumber,
            ownReference: t.referenceInfo.ownReference,
            phoneNumber: t.referenceInfo.phoneNumber,
            operationId: t.referenceInfo.operationId
          }
        : undefined,
      category: t.category,
      dedupHash: t.dedupHash
    };
  }
}

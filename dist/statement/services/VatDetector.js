import { Money } from "../domain/Money.js";
import { VatInfo } from "../domain/VatInfo.js";
/**
 * Detektor VAT / przelewów podatkowych.
 *
 * Wymaganie: detectVatInfo() ma:
 * - wykrywać, czy transakcja ma informacje o VAT,
 * - wyciągać: vatAmount, vatCurrency, invoiceNumber, taxForm, okresPłatności.
 *
 * Źródła danych w opisie (na podstawie Twoich XML):
 * - "Kwota VAT : 2139,00 PLN"
 * - "Numer faktury VAT lub okres płatności zbiorczej : FV/16/2025" albo "12/2025"
 * - "Symbol formularza : VAT-7" / "PIT-4"
 * - "Okres płatności : 25M10"
 */
export class VatDetector {
    /**
     * Wykrywa i buduje `VatInfo` na podstawie typu transakcji i sparsowanego opisu.
     *
     * @param type - typ transakcji z banku (np. "Przelew podatkowy")
     * @param desc - sparsowany opis
     * @param statementCurrency - waluta wyciągu (fallback, jeśli w polu VAT nie ma waluty)
     */
    detectVatInfo(type, desc, statementCurrency) {
        const vatAmount = this.extractVatAmount(desc, statementCurrency);
        const { invoiceNumber, paymentPeriodFromInvoiceField } = this.extractInvoiceOrPeriod(desc);
        const taxForm = this.extractTaxForm(type, desc);
        const paymentPeriod = this.extractPaymentPeriod(desc) ?? paymentPeriodFromInvoiceField;
        const vat = new VatInfo({
            vatAmount: vatAmount ?? undefined,
            invoiceNumber: invoiceNumber ?? undefined,
            taxForm: taxForm ?? undefined,
            paymentPeriod: paymentPeriod ?? undefined
        });
        return vat.isEmpty() ? undefined : vat;
    }
    /**
     * Heurystycznie wykrywa split payment.
     *
     * Sygnały:
     * - obecność "Kwota VAT" (typowe dla split payment),
     * - typ jest przelewem,
     * - transakcja jest "outgoing" (kwota ujemna) - w praktyce split payment jest wykonywany przy płatności.
     *
     * @param type - typ transakcji z banku
     * @param amountMinor - kwota transakcji w minor units (znak mówi o kierunku)
     * @param vatInfo - wykryte info VAT (może być undefined)
     */
    detectSplitPayment(type, amountMinor, vatInfo) {
        if (!vatInfo?.vatAmount)
            return false;
        const isTransfer = /przelew/i.test(type);
        const isOutgoing = amountMinor < 0n;
        return isTransfer && isOutgoing;
    }
    /**
     * Wyciąga kwotę VAT (np. "2139,00 PLN").
     *
     * @param desc - opis
     * @param statementCurrency - fallback waluty
     */
    extractVatAmount(desc, statementCurrency) {
        const raw = desc.getFirst("kwota vat");
        if (!raw)
            return undefined;
        const m = raw.match(/^([+-]?[0-9\s.,]+)\s*([A-Z]{3})?$/);
        if (!m)
            return undefined;
        const amount = m[1];
        const currency = m[2] ?? statementCurrency;
        const money = Money.parse(amount, currency);
        return money.minor === 0n ? money : money;
    }
    /**
     * Wyciąga z pola "Numer faktury VAT lub okres płatności zbiorczej"
     * informację o numerze faktury albo o okresie (gdy pole ma np. "12/2025").
     *
     * @param desc - opis
     */
    extractInvoiceOrPeriod(desc) {
        // Klucz jest normalizowany przez DescriptionParser (bez diakrytyków).
        const raw = desc.getFirst("numer faktury vat lub okres platnosci zbiorczej");
        if (!raw)
            return {};
        const v = raw.trim();
        // Jeśli wygląda jak FV/xxx lub zawiera "FV" / "FAKTURA" -> traktujemy jako numer faktury.
        if (/(^|[\s/])fv\b/i.test(v) || /faktura/i.test(v)) {
            return { invoiceNumber: v };
        }
        // Jeśli wygląda jak "12/2025" albo "25M10" - to raczej okres.
        if (/^\d{1,2}\/\d{4}$/.test(v) || /^\d{2}M\d{2}$/.test(v)) {
            return { paymentPeriodFromInvoiceField: v };
        }
        // Fallback: jeśli zawiera "/" i cyfry, najczęściej jest fakturą.
        if (/[A-Za-z]/.test(v) || /\d+\/\d+/.test(v)) {
            return { invoiceNumber: v };
        }
        return {};
    }
    /**
     * Wyciąga symbol formularza podatkowego.
     *
     * W przykładach: "Symbol formularza : VAT-7" / "PIT-4".
     *
     * @param type - typ transakcji
     * @param desc - opis
     */
    extractTaxForm(type, desc) {
        const fromDesc = desc.getFirst("symbol formularza");
        if (fromDesc)
            return fromDesc.trim();
        // Czasem formularz pojawia się w tytule, np. "N 777... 25M10 VAT-7"
        const title = desc.getFirst("tytuł");
        if (title) {
            const m = title.match(/\b(VAT-7|PIT-4)\b/i);
            if (m)
                return m[1].toUpperCase();
        }
        // Typ "Przelew podatkowy" jest silnym sygnałem, ale bez symbolu nie wiemy który.
        if (/podatkow/i.test(type))
            return undefined;
        return undefined;
    }
    /**
     * Wyciąga "Okres płatności".
     *
     * @param desc - opis
     */
    extractPaymentPeriod(desc) {
        const raw = desc.getFirst("okres platnosci");
        return raw?.trim() || undefined;
    }
}
//# sourceMappingURL=VatDetector.js.map
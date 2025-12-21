import { describe, expect, it } from "vitest";
import { DescriptionParser } from "../services/DescriptionParser.js";
import { VatDetector } from "../services/VatDetector.js";

/**
 * Testy wykrywania VAT i split payment.
 */
describe("VatDetector", () => {
  it("extracts VAT amount and invoice number", () => {
    const dp = new DescriptionParser();
    const vd = new VatDetector();

    const desc = dp.parse(
      "Numer faktury VAT lub okres płatności zbiorczej : FV/16/2025 Kwota VAT : 2139,00 PLN"
    );
    const vat = vd.detectVatInfo("Przelew z rachunku", desc, "PLN");

    expect(vat).toBeDefined();
    expect(vat?.invoiceNumber).toBe("FV/16/2025");
    expect(vat?.vatAmount?.currency).toBe("PLN");
    expect(vat?.vatAmount?.toNumber()).toBeCloseTo(2139.0, 2);
  });

  it("detects split payment for outgoing transfer with VAT", () => {
    const dp = new DescriptionParser();
    const vd = new VatDetector();

    const desc = dp.parse("Kwota VAT : 261,05 PLN");
    const vat = vd.detectVatInfo("Przelew z rachunku", desc, "PLN");
    const isSplit = vd.detectSplitPayment("Przelew z rachunku", -1000n, vat);

    expect(isSplit).toBe(true);
  });

  it("extracts tax form and payment period", () => {
    const dp = new DescriptionParser();
    const vd = new VatDetector();

    const desc = dp.parse("Symbol formularza : VAT-7 Okres płatności : 25M10");
    const vat = vd.detectVatInfo("Przelew podatkowy", desc, "PLN");

    expect(vat?.taxForm).toBe("VAT-7");
    expect(vat?.paymentPeriod).toBe("25M10");
  });
});

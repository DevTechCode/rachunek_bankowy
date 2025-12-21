import { describe, expect, it } from "vitest";
import { DescriptionParser } from "../services/DescriptionParser.js";
/**
 * Testy parsera opisu.
 *
 * Najważniejsze przypadki:
 * - wykrywanie par klucz:wartość,
 * - obsługa wartości w kolejnej linii,
 * - sekcja "Lokalizacja :" + subpola,
 * - brak fałszywych trafień dla "BPID:API..." (dwukropek bez whitespace).
 */
describe("DescriptionParser", () => {
    it("parses key-value pairs and preserves details", () => {
        const p = new DescriptionParser();
        const desc = p.parse("Rachunek odbiorcy : 02102010260000190207153234 Nazwa odbiorcy : AUTOPAY SA Tytuł : /OPT/X///// BPID:API73ZZKSK");
        expect(desc.getFirst("rachunek odbiorcy")).toBe("02102010260000190207153234");
        expect(desc.getFirst("nazwa odbiorcy")).toBe("AUTOPAY SA");
        expect(desc.getFirst("tytuł")).toBe("/OPT/X///// BPID:API73ZZKSK");
        // BPID:... powinno zostać częścią wartości, a nie osobnym kluczem.
        expect(desc.getFirst("bpid")).toBeUndefined();
    });
    it("handles key with value in next line and location section", () => {
        const p = new DescriptionParser();
        const desc = p.parse([
            "Numer telefonu :",
            "48722069584",
            "Lokalizacja :",
            "Adres : SECOND SKIN",
            "Miasto : POZNAŃ",
            "Kraj : POLSKA"
        ].join("\n"));
        expect(desc.getFirst("numer telefonu")).toBe("48722069584");
        expect(desc.getFirst("adres")).toBe("SECOND SKIN");
        expect(desc.getFirst("miasto")).toBe("POZNAŃ");
        expect(desc.getFirst("kraj")).toBe("POLSKA");
        const loc = p.extractLocationInfo(desc);
        expect(loc?.city).toBe("POZNAŃ");
    });
});
//# sourceMappingURL=descriptionParser.test.js.map
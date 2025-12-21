import crypto from "node:crypto";
/**
 * Kontrahent (nadawca/odbiorca) po normalizacji.
 *
 * Założenia:
 * - bankowe opisy potrafią być niespójne (spacje, wielkość liter, łamanie linii),
 * - czasem mamy konto (IBAN/NRB), czasem NIP, czasem tylko nazwę,
 * - potrzebujemy stabilnego fingerprint do agregacji (recurring payees, top kontrahenci).
 */
export class Counterparty {
    name;
    account;
    id; // np. NIP, "Nazwa i nr identyfikatora" itp.
    address;
    fingerprint;
    /**
     * @param init - dane kontrahenta (część może być undefined)
     */
    constructor(init) {
        this.name = init?.name?.trim() || undefined;
        this.account = Counterparty.normalizeAccount(init?.account);
        this.id = Counterparty.normalizeId(init?.id);
        this.address = init?.address?.trim() || undefined;
        this.fingerprint = Counterparty.computeFingerprint({
            name: this.name,
            account: this.account,
            id: this.id
        });
    }
    /**
     * Zwraca "kanoniczną" nazwę do porównań (bez diakrytyków, znormalizowane spacje).
     */
    normalizedName() {
        return Counterparty.normalizeName(this.name);
    }
    /**
     * Normalizacja nazwy (pomaga w grupowaniu podobnych nazw).
     *
     * @param name - nazwa wejściowa
     */
    static normalizeName(name) {
        if (!name)
            return "";
        return name
            .normalize("NFKD")
            .replace(/\p{Diacritic}/gu, "")
            .replace(/[^\p{L}\p{N}\s]/gu, " ")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
    }
    /**
     * Normalizacja rachunku: usuwamy spacje, zostawiamy cyfry, akceptujemy NRB/IBAN.
     *
     * @param account - tekst rachunku
     */
    static normalizeAccount(account) {
        if (!account)
            return undefined;
        const cleaned = account.toString().replace(/\s+/g, "").trim();
        // PKO w opisie daje zwykle NRB (26 cyfr), ale czasem bywa z prefiksem.
        const digits = cleaned.replace(/[^\d]/g, "");
        if (digits.length >= 20)
            return digits;
        return cleaned || undefined;
    }
    /**
     * Normalizacja identyfikatora (np. NIP).
     *
     * @param id - wejście
     */
    static normalizeId(id) {
        if (!id)
            return undefined;
        const cleaned = id.toString().trim();
        const digits = cleaned.replace(/[^\d]/g, "");
        // NIP ma 10 cyfr, ale bywają inne identyfikatory.
        if (digits.length >= 8)
            return digits;
        return cleaned || undefined;
    }
    /**
     * Oblicza fingerprint kontrahenta. Priorytet:
     * - account (najbardziej stabilne),
     * - id (np. NIP),
     * - nazwa (znormalizowana)
     *
     * @param input - dane do fingerprintu
     */
    static computeFingerprint(input) {
        const nameN = Counterparty.normalizeName(input.name);
        const accountN = Counterparty.normalizeAccount(input.account) ?? "";
        const idN = Counterparty.normalizeId(input.id) ?? "";
        const key = `acc=${accountN}|id=${idN}|name=${nameN}`;
        return crypto.createHash("sha256").update(key, "utf8").digest("hex").slice(0, 24);
    }
}
//# sourceMappingURL=Counterparty.js.map
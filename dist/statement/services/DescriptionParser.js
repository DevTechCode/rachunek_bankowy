import { CardInfo } from "../domain/CardInfo.js";
import { LocationInfo } from "../domain/LocationInfo.js";
import { Money } from "../domain/Money.js";
import { ParsedDescription } from "../domain/Description.js";
import { ReferenceInfo } from "../domain/ReferenceInfo.js";
import { decodeBasicEntities, collapseWhitespace } from "../utils/text.js";
/**
 * Parser pola `description/opis` z wyciągu bankowego.
 *
 * Najważniejsze wymagania:
 * - wykrywać pary klucz:wartość, także jeśli wartość jest w następnej linii,
 * - łączyć wartości wieloliniowe,
 * - zachować surowy tekst (`raw`) oraz dać ustrukturyzowane `details`,
 * - zachować kolejność elementów (items) do debugowania.
 *
 * Heurystyka kluczy:
 * - W praktyce PKO używa formatu "Klucz : Wartość" (z odstępami),
 * - ale czasem występuje "Klucz:\nWartość" (bez spacji przed dwukropkiem),
 * - nie chcemy łapać "BPID:API..." (dwukropek bez białych znaków),
 * dlatego dopuszczamy dwukropek tylko gdy przylega do whitespace po jednej ze stron.
 */
export class DescriptionParser {
    /**
     * Lista znanych kluczy w opisach bankowych (w wersji znormalizowanej).
     *
     * To jest kluczowy element "inteligencji" parsera: pozwala uniknąć fałszywych dopasowań,
     * gdzie fragment wartości przypadkowo wygląda jak "klucz :".
     *
     * Przykład problemu: "Nazwa odbiorcy : AUTOPAY SA Tytuł : ..." – bez whitelisty
     * regex mógłby uznać "AUTOPAY SA Tytuł" za klucz.
     */
    knownKeys = new Set([
        "rachunek odbiorcy",
        "rachunek nadawcy",
        "nazwa odbiorcy",
        "nazwa nadawcy",
        "adres odbiorcy",
        "adres nadawcy",
        "tytul",
        "numer faktury vat lub okres platnosci zbiorczej",
        "kwota vat",
        "identyfikator odbiorcy",
        "nazwa i nr identyfikatora",
        "symbol formularza",
        "okres platnosci",
        "dodatkowy opis",
        "referencje wlasne zleceniodawcy",
        "numer karty",
        "numer referencyjny",
        "numer telefonu",
        "operacja",
        "lokalizacja",
        "adres",
        "miasto",
        "kraj",
        "data wykonania operacji",
        "oryginalna kwota operacji"
    ]);
    /**
     * Parsuje tekst opisu do `ParsedDescription`.
     *
     * @param raw - surowy tekst z XML/HTML
     */
    parse(raw) {
        const rawTrimmed = (raw ?? "").toString().replace(/\r\n/g, "\n").trim();
        const decoded = decodeBasicEntities(rawTrimmed);
        const items = [];
        const details = new Map();
        const markers = this.findKeyMarkers(decoded);
        if (markers.length === 0) {
            // Brak wykrytych KV: traktujemy wszystko jako tekst.
            const text = collapseWhitespace(decoded);
            if (text)
                items.push({ kind: "text", value: text });
            return new ParsedDescription(rawTrimmed, items, details);
        }
        // Budujemy elementy w kolejności: tekst przed pierwszym kluczem, potem KV-y.
        let cursor = 0;
        for (let i = 0; i < markers.length; i++) {
            const cur = markers[i];
            const next = markers[i + 1];
            const pre = decoded.slice(cursor, cur.keyStart);
            this.pushTextIfAny(items, pre);
            const valueEnd = next ? next.keyStart : decoded.length;
            const valueRaw = decoded.slice(cur.valueStart, valueEnd);
            const key = cur.key;
            const valueNormalized = this.normalizeValue(valueRaw);
            // Sekcje: część wyciągów ma "Lokalizacja :" i dopiero potem Adres/Miasto/Kraj.
            // Jeśli sekcyjny klucz ma pustą wartość, zapisujemy go jako "section".
            if (this.isSectionKey(key) && !valueNormalized) {
                items.push({ kind: "section", title: key });
            }
            else {
                items.push({ kind: "kv", key, value: valueNormalized });
                this.appendDetail(details, this.normalizeKey(key), valueNormalized);
            }
            cursor = valueEnd;
        }
        // Tekst po ostatnim KV (jeśli jest)
        const tail = decoded.slice(cursor);
        this.pushTextIfAny(items, tail);
        return new ParsedDescription(rawTrimmed, items, details);
    }
    /**
     * Próbuje z opisu wyciągnąć dane lokalizacyjne (Adres/Miasto/Kraj).
     *
     * @param desc - sparsowany opis
     */
    extractLocationInfo(desc) {
        const address = desc.getFirst("adres");
        const city = desc.getFirst("miasto");
        const country = desc.getFirst("kraj");
        if (!address && !city && !country)
            return undefined;
        return new LocationInfo({ address, city, country });
    }
    /**
     * Próbuje z opisu wyciągnąć dane kartowe.
     *
     * @param desc - sparsowany opis
     * @param statementCurrency - waluta wyciągu (dla "Oryginalna kwota operacji")
     */
    extractCardInfo(desc, statementCurrency) {
        const cardNumber = desc.getFirst("numer karty");
        const opDateRaw = desc.getFirst("data wykonania operacji");
        const originalRaw = desc.getFirst("oryginalna kwota operacji");
        const operationDate = opDateRaw ? this.tryParseDate(opDateRaw) : undefined;
        const originalAmount = originalRaw ? this.tryParseMoneyWithCurrency(originalRaw, statementCurrency) : undefined;
        if (!cardNumber && !operationDate && !originalAmount)
            return undefined;
        return new CardInfo({ cardNumberMasked: cardNumber, operationDate, originalAmount });
    }
    /**
     * Próbuje z opisu wyciągnąć informacje referencyjne (numery referencyjne/telefon itp.).
     *
     * @param desc - sparsowany opis
     */
    extractReferenceInfo(desc) {
        const refNumber = desc.getFirst("numer referencyjny");
        const ownRef = desc.getFirst("referencje wlasne zleceniodawcy");
        const phone = desc.getFirst("numer telefonu");
        // W transakcjach kartowych czasem występuje pole "Operacja : <id>".
        const opId = desc.getFirst("operacja");
        if (!refNumber && !ownRef && !phone && !opId)
            return undefined;
        return new ReferenceInfo({
            referenceNumber: refNumber,
            ownReference: ownRef,
            phoneNumber: phone,
            operationId: opId
        });
    }
    /**
     * Wyszukuje markery "klucz: wartość" w tekście.
     *
     * Zwraca listę w kolejności występowania; każdy marker ma:
     * - `keyStart`: index początku klucza,
     * - `valueStart`: index początku wartości,
     * - `key`: wyłuskany klucz.
     *
     * @param text - tekst opisu
     */
    findKeyMarkers(text) {
        const markers = [];
        // Klucz zaczyna się literą, ma do ~80 znaków i może zawierać spacje oraz typowe separatory.
        // Dwukropek akceptujemy tylko gdy ma whitespace po lewej lub prawej stronie.
        const re = /([\p{L}][\p{L}\p{N} \/\(\)\.,-]{0,80}?)(?:\s+:\s*|:\s+)(?=\S|\n)/gu;
        let match;
        while ((match = re.exec(text)) !== null) {
            const full = match[0];
            const key = match[1].trim();
            const keyStart = match.index;
            const valueStart = match.index + full.length;
            // Dodatkowe filtry jakości: odrzucamy klucze zbyt krótkie lub "śmieci".
            if (!this.isProbablyKey(key)) {
                // Krytyczne: jeśli odrzucimy dopasowanie, cofamy "kursor" regexa,
                // żeby umożliwić znalezienie klucza wewnątrz tego samego fragmentu.
                // Przykład: "Nazwa odbiorcy : AUTOPAY SA Tytuł : ..." – regex może
                // najpierw znaleźć "AUTOPAY SA Tytuł", odrzucimy to, ale chcemy jeszcze
                // znaleźć poprawne "Tytuł".
                re.lastIndex = keyStart + 1;
                continue;
            }
            markers.push({ keyStart, valueStart, key });
        }
        return markers;
    }
    /**
     * Heurystyczny test, czy `key` wygląda jak sensowny klucz.
     *
     * @param key - kandydat na klucz
     */
    isProbablyKey(key) {
        const k = collapseWhitespace(key);
        if (k.length < 2)
            return false;
        if (k.length > 80)
            return false;
        // Nie chcemy np. "000483849" jako klucza.
        if (/^\d{3,}$/.test(k))
            return false;
        // Jeśli klucz jest znany (po normalizacji), ufamy mu.
        const nk = this.normalizeKey(k);
        if (this.knownKeys.has(nk))
            return true;
        // W trybie fallback dopuszczamy tylko krótkie, "kluczowe" frazy (maks 3 słowa),
        // żeby nie łapać fragmentów wartości.
        const wordCount = k.split(/\s+/).filter(Boolean).length;
        if (wordCount > 2)
            return false;
        // Jeśli kandydat zawiera w sobie znany klucz (np. "AUTOPAY SA Tytul"),
        // to prawie na pewno jest to fragment wartości + właściwy klucz -> odrzucamy.
        for (const known of this.knownKeys) {
            if (nk === known)
                continue;
            if (this.containsKnownKeyAsTokenSequence(nk, known)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Sprawdza, czy `candidate` zawiera `known` jako osobny token/ciąg tokenów (z separatorami whitespace).
     *
     * To jest bardziej odporne niż proste `includes(" "+known+" ")`, bo opisy mogą mieć
     * nietypowe whitespace (np. NBSP) mimo wstępnej normalizacji.
     *
     * @param candidate - znormalizowany kandydat
     * @param known - znormalizowany znany klucz
     */
    containsKnownKeyAsTokenSequence(candidate, known) {
        const re = new RegExp(`(^|\\s)${this.escapeRegex(known)}($|\\s)`, "u");
        return re.test(candidate);
    }
    /**
     * Escapuje tekst do użycia w RegExp.
     *
     * @param s - tekst
     */
    escapeRegex(s) {
        return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    /**
     * Normalizuje klucz do postaci, która nadaje się jako klucz mapy `details`.
     *
     * Zasady:
     * - lowercase,
     * - usuwamy diakrytyki,
     * - upraszczamy spacje,
     * - upraszczamy polskie znaki (dla stabilności porównań).
     *
     * @param key - klucz z opisu
     */
    normalizeKey(key) {
        return collapseWhitespace(key)
            .normalize("NFKD")
            .replace(/\p{Diacritic}/gu, "")
            // Polski "ł" nie zawsze dekomponuje się do "l" + diakrytyk, więc mapujemy ręcznie.
            .replace(/[łŁ]/g, "l")
            .toLowerCase();
    }
    /**
     * Normalizuje wartość:
     * - zachowujemy semantykę, ale upraszczamy whitespace,
     * - usuwa nadmiarowe spacje/nowe linie.
     *
     * @param valueRaw - surowa wartość (może zawierać newline)
     */
    normalizeValue(valueRaw) {
        return collapseWhitespace(decodeBasicEntities(valueRaw));
    }
    /**
     * Rozpoznaje "sekcyjny" klucz (nagłówek grupy).
     *
     * @param key - klucz z opisu
     */
    isSectionKey(key) {
        const k = this.normalizeKey(key);
        return k === "lokalizacja";
    }
    /**
     * Dodaje wartość do mapy `details` (wspiera wielokrotne wystąpienia klucza).
     *
     * @param map - details
     * @param key - znormalizowany klucz
     * @param value - znormalizowana wartość
     */
    appendDetail(map, key, value) {
        const arr = map.get(key) ?? [];
        arr.push(value);
        map.set(key, arr);
    }
    /**
     * Jeśli fragment tekstu zawiera niepusty content, dodaje go jako item typu "text".
     *
     * @param items - lista elementów opisu
     * @param text - tekst do ewentualnego dodania
     */
    pushTextIfAny(items, text) {
        const v = collapseWhitespace(text);
        if (v)
            items.push({ kind: "text", value: v });
    }
    /**
     * Próba parsowania daty z opisu.
     *
     * W opisie kartowym pojawia się format YYYY-MM-DD.
     *
     * @param raw - tekst daty
     */
    tryParseDate(raw) {
        const m = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m)
            return undefined;
        const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
        return Number.isNaN(d.getTime()) ? undefined : d;
    }
    /**
     * Parsuje kwotę w formie "126,95 PLN" lub "126.95 PLN".
     *
     * Jeśli waluta nie jest podana, używa `fallbackCurrency`.
     *
     * @param raw - tekst kwoty
     * @param fallbackCurrency - waluta, gdy brak w polu
     */
    tryParseMoneyWithCurrency(raw, fallbackCurrency) {
        const s = collapseWhitespace(raw);
        if (!s)
            return undefined;
        const m = s.match(/^([+-]?[0-9\s.,]+)\s*([A-Z]{3})?$/);
        if (!m)
            return undefined;
        const amount = m[1];
        const currency = m[2] ?? fallbackCurrency;
        return Money.parse(amount, currency);
    }
}
//# sourceMappingURL=DescriptionParser.js.map
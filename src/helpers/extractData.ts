// src/helpers/extractData.ts
/**
 * Wyciąga dane z pola "opisSurowy" bazując na etykietach bankowych.
 * Na razie koncentrujemy się na Rachunku (nadawcy / odbiorcy)
 * i prostym walidowaniu numerów kont.
 */

export interface ExtractedData {
  rachunek: string; // zwalidowany numer rachunku lub "-"
  source: "nadawca" | "odbiorca" | "brak";
  rawValue?: string; // oryginalna wartość po dwukropku
}

/**
 * Główna funkcja do parsowania pola opisSurowy.
 */
export function extractDataFromOpis(raw: string): ExtractedData {
  if (!raw || typeof raw !== "string") {
    return { rachunek: "-", source: "brak" };
  }

  // Normalizacja tekstu — usuwamy podwójne spacje
  const text = raw.replace(/\s{2,}/g, " ").trim();

  // Szukamy wzorców typu: "Rachunek nadawcy : <wartość>" lub "Rachunek odbiorcy : <wartość>"
  const match = text.match(
    /(Rachunek (nadawcy|odbiorcy))\s*:\s*([A-Z0-9\s]+)/i
  );

  if (!match) {
    return { rachunek: "-", source: "brak" };
  }

  const label = match[1].toLowerCase();
  const value = match[3].replace(/\s+/g, "").trim(); // usuwamy spacje wewnątrz konta

  const isValid = isValidAccountNumber(value);
  return {
    rachunek: isValid ? value : "-",
    source: label.includes("nadawcy") ? "nadawca" : "odbiorca",
    rawValue: value,
  };
}

/**
 * Walidacja numeru rachunku bankowego (PL / NRB)
 * - dopuszcza 26 cyfr (NRB)
 * - dopuszcza "PL" + 26 cyfr
 */
export function isValidAccountNumber(account: string): boolean {
  if (!account) return false;

  const normalized = account.replace(/\s+/g, "").toUpperCase();

  // Format PLxxxxxxxxxxxxxxxxxxxxxxxxxx (28 znaków)
  if (/^PL\d{26}$/.test(normalized)) return true;

  // Format 26 cyfr (NRB)
  if (/^\d{26}$/.test(normalized)) return true;

  return false;
}

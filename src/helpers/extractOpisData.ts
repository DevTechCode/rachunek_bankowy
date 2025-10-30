/**
 * Wyciąga rachunek bankowy z opisu (description)
 * Szuka "Rachunek odbiorcy" lub "Rachunek nadawcy"
 * i waliduje czy numer wygląda jak 26 cyfr bez spacji.
 */
export function extractOpisData(raw: string): { rachunekKontrahenta?: string } {
  if (!raw) return {};

  const regex = /(Rachunek (?:odbiorcy|nadawcy))\s*:\s*([0-9 ]{10,34})/i;
  const match = raw.match(regex);

  if (!match) return {};

  // normalizujemy (usuwamy spacje)
  const rachunek = match[2].replace(/\s+/g, "");

  // prosta walidacja — polski rachunek bankowy to 26 cyfr
  const isValid = /^[0-9]{26}$/.test(rachunek);

  if (!isValid) {
    console.warn(`⚠️ Nieprawidłowy numer rachunku: ${rachunek}`);
    return {};
  }

  return { rachunekKontrahenta: rachunek };
}

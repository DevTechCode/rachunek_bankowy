/**
 * Ekstrakcja danych z pola `opisSurowy` (np. z XML).
 * Wyszukuje kluczowe informacje typu numer rachunku, NIP, kwota VAT itd.
 */
export function extractOpisData(raw: string, kontaMap?: Map<string, string>) {
  const result: Record<string, string> = {};

  if (!raw || typeof raw !== "string") return result;

  const clean = raw.replace(/\s{2,}/g, " ").trim();

  // 🔹 Rachunek nadawcy / odbiorcy
  const mRachunek = clean.match(
    /(?:Rachunek odbiorcy|Rachunek nadawcy)\s*:\s*([0-9]{20,26})/
  );
  if (mRachunek) {
    const rachunek = mRachunek[1];
    result.rachunekKontrahenta = rachunek;

    // ✅ Jeśli mamy mapę kont – sprawdzamy, czy istnieje
    if (kontaMap) {
      if (kontaMap.has(rachunek)) {
        result.kontrahent = kontaMap.get(rachunek)!;
      } else {
        throw new Error(`❌ Nie ma tego nr konta w mapie: ${rachunek}`);
      }
    }
  }

  // 🔹 Nazwa odbiorcy / nadawcy
  const mNazwa = clean.match(
    /(?:Nazwa odbiorcy|Nazwa nadawcy)\s*:\s*([^:]+?)(?=\s+\w+\s*:|$)/
  );
  if (mNazwa) result.nazwaKontrahenta = mNazwa[1].trim();

  // 🔹 Adres nadawcy / odbiorcy
  const mAdres = clean.match(
    /(?:Adres odbiorcy|Adres nadawcy)\s*:\s*([^:]+?)(?=\s+\w+\s*:|$)/
  );
  if (mAdres) result.adresKontrahenta = mAdres[1].trim();

  // 🔹 Kwota VAT
  const mVat = clean.match(/Kwota VAT\s*:\s*([0-9\s.,]+)/);
  if (mVat) result.kwotaVat = mVat[1].replace(/\s/g, "").replace(",", ".");

  // 🔹 Identyfikator odbiorcy
  const mId = clean.match(/Identyfikator odbiorcy\s*:\s*([^:]+?)(?=\s+\w+\s*:|$)/);
  if (mId) result.identyfikatorOdbiorcy = mId[1].trim();

  // 🔹 Numer faktury / okres płatności
  const mFaktura = clean.match(
    /(?:Numer faktury VAT lub okres płatności zbiorczej)\s*:\s*([^:]+?)(?=\s+\w+\s*:|$)/
  );
  if (mFaktura) result.fakturaLubOkres = mFaktura[1].trim();

  return result;
}

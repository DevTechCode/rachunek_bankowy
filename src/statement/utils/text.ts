/**
 * Utility: dekodowanie podstawowych encji XML/HTML.
 *
 * W praktyce opisy w XML potrafią zawierać encje (np. &apos;).
 * Nie chcemy dorzucać ciężkiej biblioteki, więc implementujemy minimalny zestaw,
 * wystarczający dla danych bankowych.
 *
 * @param input - tekst wejściowy
 */
export function decodeBasicEntities(input: string): string {
  if (!input) return "";
  return input
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    // czasem encje przychodzą jako &#39;
    .replace(/&#(\d+);/g, (_, code: string) => {
      const n = Number(code);
      return Number.isFinite(n) ? String.fromCharCode(n) : _;
    });
}

/**
 * Utility: normalizacja białych znaków (spacje/tabs/newline) do pojedynczych spacji.
 *
 * Stosujemy do wartości pól, kiedy chcemy porównań lub fingerprintów,
 * ale surowy tekst i kolejność trzymamy osobno.
 *
 * @param input - tekst wejściowy
 */
export function collapseWhitespace(input: string): string {
  if (!input) return "";
  return input.replace(/\s+/g, " ").trim();
}

/**
 * Utility: bezpieczne parsowanie daty w formacie YYYY-MM-DD (format z XML wyciągu).
 *
 * @param ymd - tekst daty
 */
export function parseYmdDate(ymd: string): Date {
  // Bank w XML daje zwykle "2025-12-18" bez strefy.
  // Tworzymy Date w lokalnej strefie (wystarczające do raportów miesięcznych).
  const s = (ymd ?? "").toString().trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return new Date(NaN);
  const yyyy = Number(m[1]);
  const mm = Number(m[2]);
  const dd = Number(m[3]);
  return new Date(yyyy, mm - 1, dd);
}

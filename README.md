# `rachunek` — parser zestawień bankowych (XML + HTML fallback) + CLI

## Szybkie komendy (wszystko co możesz uruchomić w tym folderze)

Poniżej jest komplet “entrypointów” w `rachunek/` — najczęściej będziesz używać CLI z `dist/cli.js`.

### Komendy npm (development/build/test)

- **Instalacja zależności**:

```bash
npm install
```

- **Testy jednostkowe** (parser opisu + VAT/split):

```bash
npm test
```

- **Build do `dist/`**:

```bash
npm run build
```

- **Lint**:

```bash
npm run lint
```

- **Dev (uruchamia CLI z TS bez kompilacji)**:

```bash
npm run dev -- <argumenty CLI>
```

- **Start (uruchamia skompilowane CLI)**:

```bash
npm start -- <argumenty CLI>
```

### Komendy CLI (Node)

Wszystkie komendy poniżej uruchamiasz tak:

```bash
node dist/cli.js <command> [options]
```

- **`parse`**: parsuje XML/HTML do modelu domenowego i eksportuje do **CSV lub JSON**.
  - **Wejście**: `--in <plik.xml|plik.html>`
  - **Wyjście**: `--out <out.csv|out.json>`
  - **Opcje**: `--best-effort` (parsuj mimo błędów), `--dedup` (usuń duplikaty)

- **`report`**: generuje raporty do JSON.
  - `--type monthly|vat|top` (opcjonalnie `--top <n>` dla top)

- **`recurring`**: wykrywa stałych odbiorców (recurring payees) i zapisuje do JSON.
  - `--min-count <n>`

- **`gss:replace`**: upload CSV do Google Sheets (ten sam plik CSV, który generuje `parse`).
  - `--spreadsheet <id>` (ID skoroszytu), `--sheet <nazwa>` (np. `Historia`)
  - **Tryb**: `--mode append|replace`
    - domyślnie: **append**
  - **Nagłówek**:
    - domyślnie append pomija header (pierwszy wiersz CSV)
    - `--include-header` dopisuje header także w append

- **`gss:rachunki`**: buduje i wgrywa (replace) tabelę **`Rachunki`** w tym samym skoroszycie.
  - Tworzy tabelę: **Rachunek odbiorcy**, **Kontrahent**, **isPracownik**, **isZarzad**, **Mapowanie**
  - Dane są deduplikowane i sortowane

Ten katalog zawiera **produkcyjny parser** zestawień operacji bankowych (docelowo XML) z **fallbackiem dla HTML tabelarycznego**, który mapuje dane do wspólnego modelu domenowego (`Transaction`, `Money`, `Counterparty`, `VatInfo`, itd.), a potem pozwala:

- eksportować transakcje do **JSON** i **CSV**
- generować raporty (**monthly**, **VAT**, **top kontrahenci**)
- wykrywać **stałych odbiorców** (recurring payees)
- działać w trybie **best-effort** (parsuj co się da, a błędy zbieraj do listy)
- robić **dedup** po stabilnym hashu transakcji (`dedupHash`)

Kod jest w `src/statement/**`, a CLI w `src/cli.ts`.

---

## Wymagania

- Node.js **20+**
- TypeScript **5+**

Projekt jest w ESM (`"type": "module"`), a build produkuje `dist/` (NodeNext).

---

## Instalacja / build / test

W katalogu `rachunek/`:

```bash
npm install
npm test
npm run build
```

---

## CLI — dostępne komendy

Po buildzie uruchamiasz:

```bash
node dist/cli.js <command> [options]
```

### `parse` — parsowanie + eksport

XML/HTML jest wykrywany automatycznie.

```bash
node dist/cli.js parse --in <file.xml|file.html> --out <out.json|out.csv> [--best-effort] [--dedup]
```

- `--best-effort`: nie przerywa na pierwszym błędzie (zbiera błędy do listy)
- `--dedup`: usuwa duplikaty po `dedupHash`

Przykład (Twoje `Zestawienie.xml`):

```bash
node dist/cli.js parse \
  --in "/home/jakubbasinski/Playground/ZBDS/Bankowe transakcje/rachunek_github/.qodo/Zestawienie.xml" \
  --out "./out/parsed.json" \
  --best-effort --dedup
```

### `report` — raporty

```bash
node dist/cli.js report --in <file> --out <out.json> --type <monthly|vat|top> [--top <n>] [--best-effort]
```

Przykłady:

```bash
node dist/cli.js report --in "./in.xml" --out "./out/report_monthly.json" --type monthly --best-effort
node dist/cli.js report --in "./in.xml" --out "./out/report_vat.json" --type vat --best-effort
node dist/cli.js report --in "./in.xml" --out "./out/report_top.json" --type top --top 20 --best-effort
```

### `recurring` — stałe płatności / odbiorcy

```bash
node dist/cli.js recurring --in <file> --out <out.json> [--min-count <n>] [--best-effort]
```

Przykład:

```bash
node dist/cli.js recurring --in "./in.xml" --out "./out/recurring.json" --min-count 2 --best-effort
```

---

### `gss:replace` — upload do Google Sheets (replace lub append)

Komenda wgrywa dane z CSV (separator `;`) do Google Sheets.

Wymagane: skoroszyt musi być udostępniony na `client_email` z `service-account.json` jako **Editor**.

Uwaga: `service-account.json` jest **celowo ignorowany przez git** (sekret). Umieść go lokalnie obok `package.json`
lub podaj ścieżkę parametrem `--service-account`.

Szybki start:

- skopiuj `service-account.example.json` → `service-account.json`
- wklej wartości z klucza konta serwisowego (Google Cloud)

```bash
node dist/cli.js gss:replace \
  --in "./out/parsed.csv" \
  --spreadsheet "<SPREADSHEET_ID>" \
  --sheet "Historia" \
  --mode replace|append \
  --skip-header
```

- `--mode replace` (domyślnie): czyści arkusz i wstawia dane od `A1`
- `--mode append`: dopisuje wiersze na końcu
- `--skip-header` (domyślnie true): dla append pomija pierwszy wiersz CSV (nagłówek)

---

## Co wychodzi w JSON/CSV (najważniejsze pola)

### `Money`

W domenie `Money` trzyma kwotę jako:

- `minor: bigint` — np. grosze (dla PLN)
- `currency: string` — np. `PLN`

Na wyjściu JSON jest to serializowane bezpiecznie:

- `minor` jako **string**
- `number` jako **number** (do wygodnego podglądu)

### `Transaction`

Każda transakcja ma m.in.:

- `operationDate`, `valueDate`
- `type` (typ z banku)
- `amount`, `endingBalance`
- `descriptionRaw` + `descriptionDetails`
- `counterparty` (z fingerprintem)
- `vatInfo` + `splitPayment`
- `category` (rule engine)
- `dedupHash` (do deduplikacji)

---

## Jak działa “inteligentny” parser `description`

Opis z banku jest tekstowo “płaski”, ale semantycznie zawiera strukturę typu:

- `Rachunek odbiorcy : ...`
- `Nazwa odbiorcy : ...`
- `Tytuł : ...`
- `Numer faktury VAT lub okres płatności zbiorczej : ...`
- `Kwota VAT : ... PLN`
- `Lokalizacja : Adres : ... Miasto : ... Kraj : ...`

`DescriptionParser` robi:

- wykrycie par `klucz : wartość` (także gdy wartość jest w następnej linii)
- łączenie wartości wieloliniowych
- zachowanie kolejności elementów (`items`)
- normalizację kluczy (bez diakrytyków, plus specjalne `ł -> l`)
- ochronę przed fałszywymi kluczami typu `BPID:API...`

Na tej strukturze pracują detektory VAT/split payment oraz ekstraktor kontrahenta.

---

## Struktura katalogów (najważniejsze)

- `src/statement/domain/**` — klasy domenowe (`Transaction`, `Money`, `Counterparty`, …)
- `src/statement/services/**` — parsery i serwisy (XML/HTML/description/VAT/raporty/eksport)
- `src/cli.ts` — CLI (parse/report/recurring)
- `dist/` — wynik kompilacji `npm run build`

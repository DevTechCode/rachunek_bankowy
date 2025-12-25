#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";
import { parse as parseCsv } from "csv-parse/sync";
import { AutoStatementParser } from "./statement/services/AutoStatementParser.js";
import { ExportService } from "./statement/services/ExportService.js";
import { ReportService } from "./statement/services/ReportService.js";
import { RecurringPayeeDetector } from "./statement/services/RecurringPayeeDetector.js";
import { ParseError } from "./statement/errors/ParseError.js";
import { GoogleSheetsService } from "./gss/GoogleSheetsService.js";
import { RachunkiTableBuilder } from "./gss/RachunkiTableBuilder.js";
import { TransactionSorter } from "./statement/services/TransactionSorter.js";

/**
 * CLI narzędzie do parsowania i raportowania zestawień bankowych.
 *
 * Wymaganie:
 * - `node dist/cli.js parse --in file.xml --out out.json`
 * - dodatkowe komendy: report + recurring
 *
 * Uwaga: CLI zakłada, że plik wejściowy jest w całości czytany do pamięci.
 * Dla typowych wyciągów (setki/tysiące operacji) jest to OK.
 */
async function main(): Promise<void> {
  const program = new Command();
  program.name("bank-statement").description("Parser zestawień bankowych (XML + HTML fallback)").version("1.0.0");

  program
    .command("parse")
    .description("Parsuje XML/HTML do JSON lub CSV")
    .requiredOption("--in <file>", "Plik wejściowy (XML lub HTML)")
    .requiredOption("--out <file>", "Plik wyjściowy (np. out.json lub out.csv)")
    .option("--format <format>", "json|csv (domyślnie po rozszerzeniu out)", "")
    .option("--best-effort", "Nie przerywaj na błędach, zbierz je do listy", false)
    .option("--dedup", "Usuń duplikaty po dedupHash", false)
    .option(
      "--sort-balance-chain",
      "Sortuj transakcje w obrębie dnia tak, aby saldo po układało się logicznie (łańcuch sald)",
      true
    )
    .action(async (opts) => {
      const inputPath = path.resolve(opts.in);
      const outPath = path.resolve(opts.out);
      const raw = await fs.readFile(inputPath, "utf8");

      const parser = new AutoStatementParser();
      const res = await parser.parse(raw, { bestEffort: Boolean(opts.bestEffort) });

      let transactions = opts.dedup ? dedupByHash(res.transactions) : res.transactions;
      // Zawsze sortujemy rosnąco po dacie operacji (najwcześniejsze -> najpóźniejsze),
      // aby wyjście było stabilne nawet bez balance-chain.
      transactions = sortByDatesAscending(transactions);

      // Opcjonalnie (domyślnie true) układamy kolejność w obrębie dnia tak,
      // żeby saldo po "miało sens" (łańcuch sald).
      if (Boolean(opts.sortBalanceChain)) {
        const sorter = new TransactionSorter();
        transactions = sorter.sortByBalanceChain(transactions);
      }
      const exportService = new ExportService();

      const format = (opts.format || guessFormat(outPath)).toLowerCase();
      if (format === "csv") {
        await exportService.exportCsv(outPath, transactions);
      } else {
        await exportService.exportJson(outPath, transactions);
      }

      if (res.errors.length > 0) {
        // W trybie best-effort logujemy, ale nie psujemy exit code (można zmienić według preferencji).
        console.error(`Parsed with ${res.errors.length} error(s). First error:`, formatError(res.errors[0]));
      }
      console.log(`OK. Transactions: ${transactions.length}. Out: ${outPath}`);
    });

  program
    .command("report")
    .description("Generuje raporty (monthly, vat, top)")
    .requiredOption("--in <file>", "Plik wejściowy (XML lub HTML)")
    .requiredOption("--out <file>", "Plik wyjściowy JSON")
    .option("--type <type>", "monthly|vat|top (domyślnie monthly)", "monthly")
    .option("--best-effort", "Nie przerywaj na błędach, zbierz je do listy", false)
    .option("--top <n>", "Limit dla report=top", "10")
    .action(async (opts) => {
      const inputPath = path.resolve(opts.in);
      const outPath = path.resolve(opts.out);
      const raw = await fs.readFile(inputPath, "utf8");

      const parser = new AutoStatementParser();
      const res = await parser.parse(raw, { bestEffort: Boolean(opts.bestEffort) });

      const reportService = new ReportService();
      const type = (opts.type ?? "monthly").toLowerCase();
      const payload =
        type === "vat"
          ? reportService.toJsonVat(reportService.vatSummary(res.transactions))
          : type === "top"
            ? reportService.toJsonTop(reportService.topCounterparties(res.transactions, Number(opts.top) || 10))
            : reportService.toJsonMonthly(reportService.monthlySummary(res.transactions));

      await fs.mkdir(path.dirname(outPath), { recursive: true });
      await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");

      if (res.errors.length > 0) {
        console.error(`Parsed with ${res.errors.length} error(s). First error:`, formatError(res.errors[0]));
      }
      console.log(`OK. Report=${type}. Out: ${outPath}`);
    });

  program
    .command("recurring")
    .description("Wykrywa stałych odbiorców (recurring payees)")
    .requiredOption("--in <file>", "Plik wejściowy (XML lub HTML)")
    .requiredOption("--out <file>", "Plik wyjściowy JSON")
    .option("--min-count <n>", "Minimalna liczba transakcji", "2")
    .option("--best-effort", "Nie przerywaj na błędach, zbierz je do listy", false)
    .action(async (opts) => {
      const inputPath = path.resolve(opts.in);
      const outPath = path.resolve(opts.out);
      const raw = await fs.readFile(inputPath, "utf8");

      const parser = new AutoStatementParser();
      const res = await parser.parse(raw, { bestEffort: Boolean(opts.bestEffort) });

      const detector = new RecurringPayeeDetector();
      const recurring = detector.findRecurringPayees(res.transactions, { minCount: Number(opts.minCount) || 2 });

      await fs.mkdir(path.dirname(outPath), { recursive: true });
      // Serializujemy Money do stringów, żeby JSON był prosty
      const payload = recurring.map((r) => ({
        ...r,
        totalAbs: r.totalAbs.toString(true),
        firstDate: r.firstDate.toISOString().slice(0, 10),
        lastDate: r.lastDate.toISOString().slice(0, 10)
      }));
      await fs.writeFile(outPath, JSON.stringify(payload, null, 2), "utf8");

      if (res.errors.length > 0) {
        console.error(`Parsed with ${res.errors.length} error(s). First error:`, formatError(res.errors[0]));
      }
      console.log(`OK. Recurring: ${payload.length}. Out: ${outPath}`);
    });

  program
    .command("gss:replace")
    .description("Wgrywa CSV do Google Sheets (replace: czyści arkusz i wstawia dane od A1)")
    .requiredOption("--in <file>", "Plik wejściowy CSV (np. ./out/parsed.csv)")
    .requiredOption("--spreadsheet <id>", "ID skoroszytu Google Sheets")
    .requiredOption("--sheet <name>", "Nazwa arkusza (np. Historia)")
    .option("--mode <mode>", "replace|append (domyślnie append)", "append")
    .option("--skip-header", "Dla append: pomiń pierwszy wiersz CSV (nagłówek)", true)
    .option("--include-header", "Dla append: dopisz także nagłówek (ustawia skip-header=false)", false)
    .option(
      "--service-account <file>",
      "Ścieżka do service-account.json",
      path.resolve("./service-account.json")
    )
    .action(async (opts) => {
      const inPath = path.resolve(opts.in);
      const spreadsheetId = String(opts.spreadsheet);
      const sheetTitle = String(opts.sheet);
      const saPath = path.resolve(opts.serviceAccount);

      const csvText = await fs.readFile(inPath, "utf8");
      const records = parseCsv(csvText, {
        delimiter: ";",
        relax_quotes: true,
        relax_column_count: true
      }) as string[][];

      let values = records.map((r) => r.map((c) => (c ?? "").toString()));
      if (values.length === 0) throw new ParseError("CSV jest pusty", { snippet: inPath });

      const gss = new GoogleSheetsService();
      // Automatyczne mapowanie flag isPracownik / isZarząd na podstawie arkusza Rachunki_Mapa.
      // Wymaganie:
      // - w skoroszycie istnieje arkusz "Rachunki_Mapa", zakres A1:G
      // - kol1 (A): Rachunek odbiorcy
      // - kol3 (C): wartość dla isPracownik (truthy -> ustaw true)
      // - kol5 (E): wartość dla isZarzad (truthy -> ustaw true)
      //
      // Jeśli arkusza/range nie ma, działamy dalej bez mapowania (best-effort).
      values = await applyRachunkiMapa({
        gss,
        spreadsheetId,
        serviceAccountPath: saPath,
        csvValues: values
      });

      const mode = String(opts.mode ?? "replace").toLowerCase();
      const includeHeader = Boolean(opts.includeHeader);
      const skipHeader = includeHeader ? false : Boolean(opts.skipHeader);

      if (mode === "append" && skipHeader && values.length > 0) {
        values = values.slice(1);
      }
      if (values.length === 0) {
        throw new ParseError("Po zastosowaniu skip-header nie ma danych do wysłania", { snippet: inPath });
      }

      if (mode === "append") {
        await gss.appendSheetValues({
          spreadsheetId,
          sheetTitle,
          values,
          serviceAccountPath: saPath
        });
        console.log(`OK. Appended ${values.length} row(s) to ${spreadsheetId} / ${sheetTitle}`);
      } else {
        await gss.replaceSheetValues({
          spreadsheetId,
          sheetTitle,
          values,
          serviceAccountPath: saPath
        });
        // w replace zwykle pierwszy wiersz to header
        console.log(`OK. Replaced with ${Math.max(values.length - 1, 0)} row(s) to ${spreadsheetId} / ${sheetTitle}`);
      }
    });

  program
    .command("gss:rachunki")
    .description(
      "Buduje tabelę 'Rachunki' (Rachunek odbiorcy + Kontrahent + flagi) i wgrywa ją do Google Sheets (replace)"
    )
    .requiredOption("--in <file>", "Plik wejściowy XML/HTML (zestawienie operacji)")
    .requiredOption("--spreadsheet <id>", "ID skoroszytu Google Sheets")
    .option("--sheet <name>", "Nazwa arkusza (domyślnie Rachunki)", "Rachunki")
    .option("--best-effort", "Nie przerywaj na błędach, zbierz je do listy", false)
    .option(
      "--service-account <file>",
      "Ścieżka do service-account.json",
      path.resolve("./service-account.json")
    )
    .action(async (opts) => {
      const inputPath = path.resolve(opts.in);
      const spreadsheetId = String(opts.spreadsheet);
      const sheetTitle = String(opts.sheet);
      const saPath = path.resolve(opts.serviceAccount);

      const raw = await fs.readFile(inputPath, "utf8");
      const parser = new AutoStatementParser();
      const res = await parser.parse(raw, { bestEffort: Boolean(opts.bestEffort) });

      const builder = new RachunkiTableBuilder();
      const values = builder.build(res.transactions);

      const gss = new GoogleSheetsService();
      await gss.replaceSheetValues({
        spreadsheetId,
        sheetTitle,
        values,
        serviceAccountPath: saPath
      });

      console.log(`OK. Rachunki rows: ${Math.max(values.length - 1, 0)}. Out: ${spreadsheetId} / ${sheetTitle}`);
    });

  await program.parseAsync(process.argv);
}

/**
 * Mapuje flagi isPracownik / isZarząd w danych CSV na podstawie arkusza "Rachunki_Mapa".
 *
 * Mechanika:
 * - pobieramy `Rachunki_Mapa!A1:G` (w tym samym spreadsheetId),
 * - tworzymy mapę po rachunku (kol A),
 * - dla każdej linii CSV, jeśli `Rachunek odbiorcy` pasuje:
 *   - ustawiamy `isPracownik` na "true" gdy kol C jest truthy
 *   - ustawiamy `isZarząd` na "true" gdy kol E jest truthy
 *
 * @param params - parametry
 */
async function applyRachunkiMapa(params: {
  gss: GoogleSheetsService;
  spreadsheetId: string;
  serviceAccountPath: string;
  csvValues: string[][];
}): Promise<string[][]> {
  const { gss, spreadsheetId, serviceAccountPath } = params;
  const values = params.csvValues.map((r) => [...r]);
  if (values.length === 0) return values;

  const header = values[0];
  const idxRachunek = findHeaderIndex(header, "Rachunek odbiorcy");
  const idxPracownik = findHeaderIndex(header, "isPracownik");
  const idxZarzad = findHeaderIndex(header, "isZarząd") ?? findHeaderIndex(header, "isZarzad");
  if (idxRachunek == null || idxPracownik == null || idxZarzad == null) return values;

  let mapa: string[][];
  try {
    mapa = await gss.getSheetValues({
      spreadsheetId,
      range: "Rachunki_Mapa!A1:G",
      serviceAccountPath
    });
  } catch {
    // brak uprawnień / brak arkusza / brak range -> ignorujemy
    return values;
  }
  if (mapa.length <= 1) return values;

  const byAcc = new Map<string, { pracownik: boolean; zarzad: boolean }>();
  for (const row of mapa.slice(1)) {
    const acc = (row[0] ?? "").toString().trim();
    if (!acc) continue;
    const prac = isTruthy(row[2]);
    const zarz = isTruthy(row[4]);
    byAcc.set(acc, { pracownik: prac, zarzad: zarz });
  }

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const acc = (row[idxRachunek] ?? "").toString().trim();
    if (!acc) continue;
    const m = byAcc.get(acc);
    if (!m) continue;
    if (m.pracownik) row[idxPracownik] = "true";
    if (m.zarzad) row[idxZarzad] = "true";
  }

  return values;
}

/**
 * Znajduje indeks kolumny po nazwie nagłówka (dopasowanie "po trimie").
 */
function findHeaderIndex(header: string[], name: string): number | undefined {
  const n = name.trim();
  const idx = header.findIndex((h) => (h ?? "").toString().trim() === n);
  return idx >= 0 ? idx : undefined;
}

/**
 * Parser wartości truthy z arkusza (np. "TRUE", "true", "1", "tak", "x").
 */
function isTruthy(v: unknown): boolean {
  const s = (v ?? "").toString().trim().toLowerCase();
  return s === "true" || s === "1" || s === "tak" || s === "t" || s === "x" || s === "yes";
}

/**
 * Deduplikuje transakcje po dedupHash, zachowując pierwsze wystąpienie.
 *
 * @param transactions - wejście
 */
function dedupByHash<T extends { dedupHash: string }>(transactions: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const t of transactions) {
    if (seen.has(t.dedupHash)) continue;
    seen.add(t.dedupHash);
    out.push(t);
  }
  return out;
}

/**
 * Zgaduję format po rozszerzeniu pliku wyjściowego.
 *
 * @param outPath - ścieżka pliku
 */
function guessFormat(outPath: string): "json" | "csv" {
  const ext = path.extname(outPath).toLowerCase();
  if (ext === ".csv") return "csv";
  return "json";
}

/**
 * Formatuje `ParseError` do krótkiej, czytelnej postaci na stderr.
 *
 * @param e - błąd
 */
function formatError(e: ParseError): string {
  const parts = [e.name + ": " + e.message];
  if (e.path) parts.push(`path=${e.path}`);
  if (e.snippet) parts.push(`snippet=${e.snippet}`);
  if (e.cause) {
    const c = e.cause as any;
    const msg = typeof c?.message === "string" ? c.message : String(c);
    parts.push(`cause=${msg}`);
    if (typeof c?.stack === "string") parts.push(`causeStack=${c.stack.split("\n").slice(0, 5).join(" | ")}`);
  }
  return parts.join(" | ");
}

/**
 * Stabilne sortowanie po datach:
 * - operationDate asc,
 * - valueDate asc,
 * - dedupHash asc (stabilny tie-breaker).
 */
function sortByDatesAscending<T extends { operationDate: Date; valueDate: Date; dedupHash: string }>(
  transactions: T[]
): T[] {
  return [...transactions].sort((a, b) => {
    const od = a.operationDate.getTime() - b.operationDate.getTime();
    if (od !== 0) return od;
    const vd = a.valueDate.getTime() - b.valueDate.getTime();
    if (vd !== 0) return vd;
    return a.dedupHash.localeCompare(b.dedupHash);
  });
}

main().catch((e) => {
  const pe = e instanceof ParseError ? e : new ParseError("CLI crashed", { cause: e });
  console.error(formatError(pe));
  process.exit(1);
});

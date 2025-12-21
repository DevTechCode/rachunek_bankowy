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
async function main() {
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
        .action(async (opts) => {
        const inputPath = path.resolve(opts.in);
        const outPath = path.resolve(opts.out);
        const raw = await fs.readFile(inputPath, "utf8");
        const parser = new AutoStatementParser();
        const res = await parser.parse(raw, { bestEffort: Boolean(opts.bestEffort) });
        const transactions = opts.dedup ? dedupByHash(res.transactions) : res.transactions;
        const exportService = new ExportService();
        const format = (opts.format || guessFormat(outPath)).toLowerCase();
        if (format === "csv") {
            await exportService.exportCsv(outPath, transactions);
        }
        else {
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
        const payload = type === "vat"
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
        .option("--mode <mode>", "replace|append (domyślnie replace)", "replace")
        .option("--skip-header", "Dla append: pomiń pierwszy wiersz CSV (nagłówek)", true)
        .option("--service-account <file>", "Ścieżka do service-account.json", path.resolve("./service-account.json"))
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
        });
        let values = records.map((r) => r.map((c) => (c ?? "").toString()));
        if (values.length === 0)
            throw new ParseError("CSV jest pusty", { snippet: inPath });
        const gss = new GoogleSheetsService();
        const mode = String(opts.mode ?? "replace").toLowerCase();
        const skipHeader = Boolean(opts.skipHeader);
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
        }
        else {
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
    await program.parseAsync(process.argv);
}
/**
 * Deduplikuje transakcje po dedupHash, zachowując pierwsze wystąpienie.
 *
 * @param transactions - wejście
 */
function dedupByHash(transactions) {
    const seen = new Set();
    const out = [];
    for (const t of transactions) {
        if (seen.has(t.dedupHash))
            continue;
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
function guessFormat(outPath) {
    const ext = path.extname(outPath).toLowerCase();
    if (ext === ".csv")
        return "csv";
    return "json";
}
/**
 * Formatuje `ParseError` do krótkiej, czytelnej postaci na stderr.
 *
 * @param e - błąd
 */
function formatError(e) {
    const parts = [e.name + ": " + e.message];
    if (e.path)
        parts.push(`path=${e.path}`);
    if (e.snippet)
        parts.push(`snippet=${e.snippet}`);
    if (e.cause) {
        const c = e.cause;
        const msg = typeof c?.message === "string" ? c.message : String(c);
        parts.push(`cause=${msg}`);
        if (typeof c?.stack === "string")
            parts.push(`causeStack=${c.stack.split("\n").slice(0, 5).join(" | ")}`);
    }
    return parts.join(" | ");
}
main().catch((e) => {
    const pe = e instanceof ParseError ? e : new ParseError("CLI crashed", { cause: e });
    console.error(formatError(pe));
    process.exit(1);
});
//# sourceMappingURL=cli.js.map
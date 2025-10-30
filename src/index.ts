import { GSSClient } from "./lib/GSSClient.ts";
import { parseAccountHistoryXml } from "./models/xml/parse.ts";
import { operacjeToRows } from "./helpers/mapToRows.ts";
import { loadKontaMap } from "./helpers/loadKontaMap.ts";
import { Operacja } from "./models/Operacja.ts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=== START ===");

  const xmlPath = path.join(__dirname, "../account-history.xml");
  const xml = fs.readFileSync(xmlPath, "utf-8");

  // 🟢 Połączenie z Google Sheets
  const gss = new GSSClient("service-account.json");
  const spreadsheetId = "1X8xIjaB2wRuO4MCUXUCP8Hx-OHwQ8cwIhTanM2JZDjo";
  const rangeKonta = "Konta!B2:C"

  await gss.login(spreadsheetId);

  // 🟢 Pobierz mapę kont z zakładki "Konta"
  const kontaMap = await loadKontaMap(gss, rangeKonta);
  console.log(kontaMap);
  // 🟢 Parsowanie XML → Operacja[]
  // const parsed = parseAccountHistoryXml(xml);
  // const ops: Operacja[] = [];

  const parsed = parseAccountHistoryXml(xml, kontaMap);
  const ops = parsed.operations;

  console.log(ops);

  // 🟢 Mapowanie do arkusza
  const rows = operacjeToRows(ops);
  // 🟢 Zapis do GSS
  await gss.append("Bare Metal!A1", rows);

  console.log("✅ Wysłano dane do GSS.");
}

main().catch(e => {
  console.error("E:", e);
  process.exit(1);
});

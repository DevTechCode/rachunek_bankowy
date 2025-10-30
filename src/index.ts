import { GSSClient } from "./lib/GSSClient.ts";
import { parseAccountHistoryXml } from "./models/xml/parse.ts";
import { operacjeToRows } from "./helpers/mapToRows.ts";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { collectKeysFromOpis, updateConfigWithKeys } from "./helpers/collectKeys.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("=== START ===");

  // 1) Parsowanie XML → Operacja[]
  const xmlPath = path.join(__dirname, "../account-history.xml"); // podmień na swój plik
  const xml = fs.readFileSync(xmlPath, "utf-8");
  const parsed = parseAccountHistoryXml(xml);
  const ops = parsed.operations.map(o => o as unknown as import("./models/Operacja.ts").Operacja); // jeśli masz strict typy, usuń ten cast
  // ↑ Jeżeli parseAccountHistoryXml już zwraca Operacja[], to po prostu: const ops = parsed.operations;

  // 2) Mapowanie → rows (z HEADER)
  const rows = operacjeToRows(ops);

  for (const op of ops.slice(0, 5)) { // pokaż tylko pierwsze 5
  console.log("───────────────");
  console.log({
    dataZlecenia: op.dataZlecenia,
    kwota: op.kwota,
    typ: op.typ,
    rachunekKontrahenta: op.rachunekKontrahenta,
    nazwaKontrahenta: op.nazwaKontrahenta,
    adresKontrahenta: op.adresKontrahenta,
    kwotaVat: op.kwotaVat,
    fakturaLubOkres: op.fakturaLubOkres,
    identyfikatorOdbiorcy: op.identyfikatorOdbiorcy,
    opisSurowy: op.opisSurowy?.slice(0, 120) + "...", // tylko fragment, żeby nie zalać konsoli
  });
}
  // 3) Append do GSS (od A1 — wstawi header + dane)
  const gss = new GSSClient("service-account.json");
  await gss.login("1X8xIjaB2wRuO4MCUXUCP8Hx-OHwQ8cwIhTanM2JZDjo"); // albo wprost ID: "1X8xIjaB2wRuO4MCUXUCP8Hx-OHwQ8cwIhTanM2JZDjo"
  await gss.append("Bare Metal!A1", rows);

   console.log("✅ Wysłano do GSS.");
}

main().catch(e => {
  console.error("E:", e);
  process.exit(1);
});

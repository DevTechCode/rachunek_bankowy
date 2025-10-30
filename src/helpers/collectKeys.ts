// src/helpers/collectKeys.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Operacja } from "../models/Operacja.js"; // <-- .js przy ESM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* -------------------- Core -------------------- */

/**
 * Prosty parser "Klucz : wartość" dla surowych opisów.
 * Działa niezależnie od Operacja.ts, tylko do celów analizy.
 */
function parsePolishLabeledPairs(raw: string): Record<string, string> {
  const map: Record<string, string> = {};

  if (!raw?.trim()) return map;

  const text = raw.replace(/\s{2,}/g, " ").trim();

  const re =
    /([A-Za-zĄąĆćĘęŁłŃńÓóŚśŻżŹź0-9 \-./,&']+?)\s*:\s*([^:]*?)(?=(?:[A-Za-zĄąĆćĘęŁłŃńÓóŚśŻżŹź0-9 \-./,&']+?\s*:\s*)|$)/g;

  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const key = m[1].trim().replace(/\s+/g, " ").replace(/\s*:\s*$/, "");
    const val = m[2].trim();
    if (key) {
      if (map[key]) map[key] = `${map[key]} ${val}`.trim();
      else map[key] = val;
    }
  }

  return map;
}

/**
 * Zbiera wszystkie unikalne etykiety ("klucze") z opisów operacji.
 */
export function collectKeysFromOpis(ops: Operacja[]): Set<string> {
  const set = new Set<string>();

  for (const op of ops) {
    if (!op.opisSurowy) continue;
    const pairs = parsePolishLabeledPairs(op.opisSurowy);
    for (const key of Object.keys(pairs)) {
      const trimmed = key.trim();
      if (trimmed) set.add(trimmed);
    }
  }

  return set;
}

/**
 * Aktualizuje config.json — sekcję "additional_keys"
 */
export function updateConfigWithKeys(newKeys: Set<string>) {
  const configPath = path.join(__dirname, "../../config.json");

  if (!fs.existsSync(configPath)) {
    throw new Error(`❌ config.json not found at ${configPath}`);
  }

  const raw = fs.readFileSync(configPath, "utf-8");
  const cfg = JSON.parse(raw);

  const existing: string[] = Array.isArray(cfg.additional_keys)
    ? cfg.additional_keys
    : [];

  const merged = new Set([...existing, ...newKeys]);
  cfg.additional_keys = Array.from(merged).sort();

  fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), "utf-8");

  console.log(`✅ Zaktualizowano config.json — ${cfg.additional_keys.length} kluczy.`);
}

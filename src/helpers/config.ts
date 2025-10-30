import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// wczytaj config.json raz, przy starcie
const configPath = path.join(__dirname, "../../config.json");
const raw = fs.readFileSync(configPath, "utf-8");
console.log("=== RAW CONFIG FILE ===");
console.log(raw);
console.log("=== END RAW ===");
const cfg = JSON.parse(raw);

// helper
export class Config {
  static GSS_KONTA_ID(): string {
    return cfg.GSS.Konta.id;
  }

  static GSS_KONTA_RANGE(): string {
    return cfg.GSS.Konta.range;
  }

  static raw(): any {
    return cfg;
  }
}

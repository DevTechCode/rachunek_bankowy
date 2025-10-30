import { extractOpisData } from "../helpers/extractOpisData.ts";

export type Rodzaj = "wydatek" | "przychod";

export class Operacja {
  dataZlecenia!: Date;
  dataRealizacji!: Date;
  typ!: string;
  kwota!: number;
  saldoKoncowe!: number;
  walutaKwoty!: string;
  walutaSalda!: string;
  rodzaj!: Rodzaj;

  opisSurowy!: string;
  innePola!: Record<string, string>;

  rachunekKontrahenta!: string;
  nazwaKontrahenta!: string;
  adresKontrahenta!: string;

  tytul!: string;
  fakturaLubOkres!: string;
  identyfikatorOdbiorcy!: string;
  kwotaVat!: number;
  symbolFormularza!: string;
  okresPlatnosci!: string;
  dodatkowyOpis!: string;
  referencjeWlasne!: string;

  lokalizacjaAdres!: string;
  lokalizacjaMiasto!: string;
  kraj!: string;
  dataOperacjiKarty?: Date;
  kwotaOryginalna!: number;
  numerKarty!: string;

  constructor(init?: Partial<Operacja>) {
    Object.assign(this, {
      kwota: 0,
      saldoKoncowe: 0,
      kwotaVat: 0,
      kwotaOryginalna: 0,
      walutaKwoty: "",
      walutaSalda: "",
      dataZlecenia: new Date(0),
      dataRealizacji: new Date(0),
      typ: "",
      opisSurowy: "",
      rachunekKontrahenta: "",
      nazwaKontrahenta: "",
      adresKontrahenta: "",
      tytul: "",
      fakturaLubOkres: "",
      identyfikatorOdbiorcy: "",
      symbolFormularza: "",
      okresPlatnosci: "",
      dodatkowyOpis: "",
      referencjeWlasne: "",
      lokalizacjaAdres: "",
      lokalizacjaMiasto: "",
      kraj: "",
      numerKarty: "",
      innePola: {},
      rodzaj: "wydatek",
      ...init,
    });
  }

  static fromXml(opJson: any, kontaMap  ?: Map<string, string>): Operacja {

    const orderDate = stringToDate(opJson["order-date"]);
    const execDate = stringToDate(opJson["exec-date"]);

    const { value: kwota, curr: walutaKwoty } = extractAmount(opJson.amount);
    const { value: saldoKoncowe, curr: walutaSalda } = extractAmount(opJson["ending-balance"]);

    const rodzaj: Rodzaj = kwota < 0 ? "wydatek" : "przychod";

    const inst = new Operacja({
      dataZlecenia: orderDate,
      dataRealizacji: execDate,
      typ: opJson.type ?? "",
      kwota,
      saldoKoncowe,
      walutaKwoty,
      walutaSalda,
      rodzaj,
      opisSurowy: opJson.description ?? "",
    });

    inst.parseOpis(kontaMap); // 👈 analiza opisu

    return inst;
  }

  /** 🔍 Analiza pola opisSurowy */

parseOpis(kontaMap?: Map<string, string>) {
  const dane = extractOpisData(this.opisSurowy, kontaMap);

  this.rachunekKontrahenta = dane.rachunekKontrahenta ?? "-";
  this.nazwaKontrahenta = dane.kontrahent ?? dane.nazwaKontrahenta ?? "";
  this.adresKontrahenta = dane.adresKontrahenta ?? "";
  this.kwotaVat = dane.kwotaVat ? parseFloat(dane.kwotaVat) : 0;
  this.fakturaLubOkres = dane.fakturaLubOkres ?? "";
  this.identyfikatorOdbiorcy = dane.identyfikatorOdbiorcy ?? "";
  this.innePola = dane;
}

}

/* -------------------- Helpers -------------------- */

function stringToDate(s: string): Date {
  return new Date(s);
}

function extractAmount(node: any): { value: number; curr: string } {
  const curr = (node?.curr ?? "").toString();
  const raw = (node?.text ?? node ?? "").toString().trim();
  const value = parseFloat(raw.replace(",", "."));
  return { value: isNaN(value) ? 0 : value, curr };
}

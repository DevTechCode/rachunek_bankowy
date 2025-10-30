import fs from "fs";
import { google, sheets_v4 } from "googleapis";

export class GSSClient {
  private serviceAccountPath: string;
  private auth: any | null;
  private sheets: sheets_v4.Sheets | null;
  private spreadsheetId: string | null;

  constructor(serviceAccountPath: string = "service-account.json") {
    this.serviceAccountPath = serviceAccountPath;
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = null;
  }

  async login(spreadsheetId: string): Promise<void> {
    if (!spreadsheetId) {
      throw new Error("❌ Nie podano ID arkusza do logowania (spreadsheetId).");
    }

    const credentials = JSON.parse(fs.readFileSync(this.serviceAccountPath, "utf-8"));
    const scopes = ["https://www.googleapis.com/auth/spreadsheets"];

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes,
    });

    const sheets = google.sheets({ version: "v4", auth });

    this.auth = auth;
    this.sheets = sheets;
    this.spreadsheetId = spreadsheetId;

    console.log(`✅ Zalogowano do Google Sheets: ${spreadsheetId}`);
  }

  async read(range: string): Promise<string[][]> {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error("❌ Użyj najpierw .login(spreadsheetId) przed odczytem.");
    }

    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range,
    });

    const values = res.data.values || [];
    if (!values.length) {
      console.warn(`⚠️ Arkusz ${this.spreadsheetId} (${range}) jest pusty.`);
      return [];
    }

    // pomijamy nagłówek
    return values.slice(1);
  }

  async write(range: string, values: (string|number|null)[][]): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error("❌ Użyj najpierw .login(spreadsheetId) przed zapisem.");
    }

        await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId!,
        range,
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
        });


    console.log(`✅ Zapisano dane do zakresu ${range}`);
  }

  async append(range: string, values: (string|number|null)[][]): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) {
      throw new Error("❌ Użyj najpierw .login(spreadsheetId) przed dopisywaniem.");
    }

        await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId!,
        range,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
            values,
        },
        });

    console.log(`✅ Dopisano dane do ${range}`);
  }
}

import fs from "node:fs/promises";
import { google } from "googleapis";
/**
 * Serwis do pracy z Google Sheets (Sheets API v4) z użyciem service account.
 *
 * Dlaczego osobna klasa?
 * - CLI ma pozostać cienkie: parsuje argumenty i deleguje do serwisów
 * - tutaj trzymamy logikę: autoryzacja, tworzenie arkusza, clear/replace danych
 *
 * UWAGA: wymagane jest udostępnienie arkusza (Share) na adres `client_email`
 * z pliku `service-account.json` (co najmniej uprawnienia edycji).
 */
export class GoogleSheetsService {
    /**
     * Wgrywa dane do arkusza:
     * - tworzy arkusz jeśli nie istnieje,
     * - czyści zakres,
     * - wstawia wartości od A1.
     *
     * @param params - parametry uploadu
     */
    async replaceSheetValues(params) {
        const auth = await this.createAuth(params.serviceAccountPath);
        const sheets = google.sheets({ version: "v4", auth });
        await this.ensureSheetExists(sheets, params.spreadsheetId, params.sheetTitle);
        // Czyścimy cały arkusz (w praktyce wystarczy duży zakres).
        await sheets.spreadsheets.values.clear({
            spreadsheetId: params.spreadsheetId,
            range: `${params.sheetTitle}!A:Z`
        });
        // Wstaw dane od A1.
        await sheets.spreadsheets.values.update({
            spreadsheetId: params.spreadsheetId,
            range: `${params.sheetTitle}!A1`,
            valueInputOption: "RAW",
            requestBody: { values: params.values }
        });
    }
    /**
     * Dopisuje wiersze do istniejącego arkusza (append).
     *
     * Zachowanie:
     * - tworzy arkusz jeśli nie istnieje,
     * - dopisuje na końcu danych w `sheetTitle` (Sheets API wybiera "next available row"),
     * - NIE czyści istniejących danych.
     *
     * @param params - parametry append
     */
    async appendSheetValues(params) {
        const auth = await this.createAuth(params.serviceAccountPath);
        const sheets = google.sheets({ version: "v4", auth });
        await this.ensureSheetExists(sheets, params.spreadsheetId, params.sheetTitle);
        await sheets.spreadsheets.values.append({
            spreadsheetId: params.spreadsheetId,
            range: `${params.sheetTitle}!A:Z`,
            valueInputOption: "RAW",
            insertDataOption: "INSERT_ROWS",
            requestBody: { values: params.values }
        });
    }
    /**
     * Tworzy JWT auth z pliku service-account.json.
     *
     * @param serviceAccountPath - ścieżka do JSON (zawiera client_email i private_key)
     */
    async createAuth(serviceAccountPath) {
        const raw = await fs.readFile(serviceAccountPath, "utf8");
        const json = JSON.parse(raw);
        if (!json.client_email || !json.private_key) {
            throw new Error("service-account.json nie zawiera client_email/private_key");
        }
        return new google.auth.JWT({
            email: json.client_email,
            key: json.private_key,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"]
        });
    }
    /**
     * Upewnia się, że arkusz o danym tytule istnieje.
     * Jeśli nie istnieje — tworzy go przez batchUpdate.
     *
     * @param sheets - klient Sheets API
     * @param spreadsheetId - ID skoroszytu
     * @param sheetTitle - nazwa arkusza
     */
    async ensureSheetExists(sheets, spreadsheetId, sheetTitle) {
        const meta = await sheets.spreadsheets.get({
            spreadsheetId,
            includeGridData: false
        });
        const exists = (meta.data.sheets ?? []).some((s) => s.properties?.title === sheetTitle);
        if (exists)
            return;
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{ addSheet: { properties: { title: sheetTitle } } }]
            }
        });
    }
}
//# sourceMappingURL=GoogleSheetsService.js.map
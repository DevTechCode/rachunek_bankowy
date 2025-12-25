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
export declare class GoogleSheetsService {
    /**
     * Pobiera wartości z arkusza (range A1 notation).
     *
     * @param params - parametry odczytu
     */
    getSheetValues(params: {
        spreadsheetId: string;
        range: string;
        serviceAccountPath: string;
    }): Promise<string[][]>;
    /**
     * Wgrywa dane do arkusza:
     * - tworzy arkusz jeśli nie istnieje,
     * - czyści zakres,
     * - wstawia wartości od A1.
     *
     * @param params - parametry uploadu
     */
    replaceSheetValues(params: {
        spreadsheetId: string;
        sheetTitle: string;
        values: any[][];
        serviceAccountPath: string;
    }): Promise<void>;
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
    appendSheetValues(params: {
        spreadsheetId: string;
        sheetTitle: string;
        values: any[][];
        serviceAccountPath: string;
    }): Promise<void>;
    /**
     * Wersja z jawnie podaną ścieżką service account (używana przez CLI).
     */
    setCheckboxColumnWithAuth(params: {
        spreadsheetId: string;
        sheetTitle: string;
        columnIndex0: number;
        startRowIndex0?: number;
        serviceAccountPath: string;
    }): Promise<void>;
    /**
     * Tworzy JWT auth z pliku service-account.json.
     *
     * @param serviceAccountPath - ścieżka do JSON (zawiera client_email i private_key)
     */
    private createAuth;
    /**
     * Upewnia się, że arkusz o danym tytule istnieje.
     * Jeśli nie istnieje — tworzy go przez batchUpdate.
     *
     * @param sheets - klient Sheets API
     * @param spreadsheetId - ID skoroszytu
     * @param sheetTitle - nazwa arkusza
     */
    private ensureSheetExists;
}
//# sourceMappingURL=GoogleSheetsService.d.ts.map
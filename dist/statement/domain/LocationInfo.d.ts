/**
 * Dane lokalizacji (często dla płatności kartą/terminal).
 */
export declare class LocationInfo {
    readonly address?: string;
    readonly city?: string;
    readonly country?: string;
    /**
     * @param init - inicjalizacja pól; klasa jest immutable
     */
    constructor(init?: {
        address?: string;
        city?: string;
        country?: string;
    });
}
//# sourceMappingURL=LocationInfo.d.ts.map
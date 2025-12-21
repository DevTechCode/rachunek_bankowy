/**
 * Dane lokalizacji (często dla płatności kartą/terminal).
 */
export class LocationInfo {
    address;
    city;
    country;
    /**
     * @param init - inicjalizacja pól; klasa jest immutable
     */
    constructor(init) {
        this.address = init?.address?.trim() || undefined;
        this.city = init?.city?.trim() || undefined;
        this.country = init?.country?.trim() || undefined;
    }
}
//# sourceMappingURL=LocationInfo.js.map
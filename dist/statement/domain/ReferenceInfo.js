/**
 * Informacje referencyjne (identyfikatory, numery referencyjne itd.).
 */
export class ReferenceInfo {
    referenceNumber;
    ownReference;
    phoneNumber;
    operationId;
    /**
     * @param init - inicjalizacja; klasa immutable
     */
    constructor(init) {
        this.referenceNumber = init?.referenceNumber?.trim() || undefined;
        this.ownReference = init?.ownReference?.trim() || undefined;
        this.phoneNumber = init?.phoneNumber?.trim() || undefined;
        this.operationId = init?.operationId?.trim() || undefined;
    }
}
//# sourceMappingURL=ReferenceInfo.js.map
/**
 * Informacje referencyjne (identyfikatory, numery referencyjne itd.).
 */
export declare class ReferenceInfo {
    readonly referenceNumber?: string;
    readonly ownReference?: string;
    readonly phoneNumber?: string;
    readonly operationId?: string;
    /**
     * @param init - inicjalizacja; klasa immutable
     */
    constructor(init?: {
        referenceNumber?: string;
        ownReference?: string;
        phoneNumber?: string;
        operationId?: string;
    });
}
//# sourceMappingURL=ReferenceInfo.d.ts.map
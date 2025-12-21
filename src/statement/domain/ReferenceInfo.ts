/**
 * Informacje referencyjne (identyfikatory, numery referencyjne itd.).
 */
export class ReferenceInfo {
  public readonly referenceNumber?: string;
  public readonly ownReference?: string;
  public readonly phoneNumber?: string;
  public readonly operationId?: string;

  /**
   * @param init - inicjalizacja; klasa immutable
   */
  public constructor(init?: {
    referenceNumber?: string;
    ownReference?: string;
    phoneNumber?: string;
    operationId?: string;
  }) {
    this.referenceNumber = init?.referenceNumber?.trim() || undefined;
    this.ownReference = init?.ownReference?.trim() || undefined;
    this.phoneNumber = init?.phoneNumber?.trim() || undefined;
    this.operationId = init?.operationId?.trim() || undefined;
  }
}

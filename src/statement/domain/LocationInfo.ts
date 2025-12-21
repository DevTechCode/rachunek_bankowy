/**
 * Dane lokalizacji (często dla płatności kartą/terminal).
 */
export class LocationInfo {
  public readonly address?: string;
  public readonly city?: string;
  public readonly country?: string;

  /**
   * @param init - inicjalizacja pól; klasa jest immutable
   */
  public constructor(init?: { address?: string; city?: string; country?: string }) {
    this.address = init?.address?.trim() || undefined;
    this.city = init?.city?.trim() || undefined;
    this.country = init?.country?.trim() || undefined;
  }
}

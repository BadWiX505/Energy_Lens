// DTOs for Preferences Module
export interface CreatePreferenceDto {
  homeId: string;
  maxPowerThreshold?: number;
  nightThreshold?: number;
  pricePerKwh?: number;
  currency?: string;
  billingStart?: number;
  enableNotifications?: boolean;
}

export interface PreferenceResponseDto {
  id: string;
  homeId: string;
  maxPowerThreshold: number | null;
  nightThreshold: number | null;
  pricePerKwh: number | null;
  currency: string | null;
  billingStart: number | null;
  enableNotifications: boolean | null;
  createdAt: Date | null;
}

export interface GetPreferenceByHomeIdDto {
  homeId: string;
}

export interface GetPreferencesByDateRangeDto {
  startDate: Date;
  endDate: Date;
}

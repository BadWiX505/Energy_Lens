// DTOs for Device Module
export interface AssociateDeviceDto {
  deviceId: string;  // Existing device ID from external system
  homeId: string;
  name: string;
}

export interface UpdateDeviceDto {
  name?: string;
}

export interface DeviceResponseDto {
  id: string;
  homeId: string;
  name: string | null;
  deviceType: string | null;
  createdAt: Date;
}

export interface GetDevicesQueryDto {
  homeId: string;
  skip?: number;
  take?: number;
}

export interface GetDeviceByIdDto {
  id: string;
  homeId: string;
}

export interface DeleteDeviceDto {
  id: string;
  homeId: string;
}

import { DevicesRepository } from './devices.repo';
import { AssociateDeviceDto, UpdateDeviceDto, GetDevicesQueryDto, GetDeviceByIdDto, DeleteDeviceDto } from './devices.types';

export class DevicesService {
  private devicesRepo = new DevicesRepository();

  async associateDevice(associateDeviceDto: AssociateDeviceDto) {
    if (!associateDeviceDto.deviceId) {
      throw new Error('Device ID is required');
    }

    if (!associateDeviceDto.homeId) {
      throw new Error('Home ID is required');
    }

    if (!associateDeviceDto.name || associateDeviceDto.name.trim().length === 0) {
      throw new Error('Device name is required');
    }

    const device = await this.devicesRepo.associateDevice(associateDeviceDto);
    return { 
      message: 'Device associated successfully', 
      device 
    };
  }

  async getDeviceById(getDeviceByIdDto: GetDeviceByIdDto) {
    if (!getDeviceByIdDto.id) {
      throw new Error('Device ID is required');
    }

    if (!getDeviceByIdDto.homeId) {
      throw new Error('Home ID is required');
    }

    const device = await this.devicesRepo.getDeviceById(getDeviceByIdDto);
    if (!device) {
      throw new Error('Device not found');
    }

    return device;
  }

  async getDevicesByHomeId(getDevicesQueryDto: GetDevicesQueryDto) {
    if (!getDevicesQueryDto.homeId) {
      throw new Error('Home ID is required');
    }

    const devices = await this.devicesRepo.getDevicesByHomeId(getDevicesQueryDto);
    return devices;
  }

  async updateDevice(id: string, homeId: string, updateDeviceDto: UpdateDeviceDto) {
    if (!id) {
      throw new Error('Device ID is required');
    }

    if (!homeId) {
      throw new Error('Home ID is required');
    }

    const device = await this.devicesRepo.updateDevice(id, homeId, updateDeviceDto);
    if (!device) {
      throw new Error('Device not found or you do not have permission to update it');
    }

    return {
      message: 'Device updated successfully',
      device,
    };
  }

  async disassociateDevice(deleteDeviceDto: DeleteDeviceDto) {
    if (!deleteDeviceDto.id) {
      throw new Error('Device ID is required');
    }

    if (!deleteDeviceDto.homeId) {
      throw new Error('Home ID is required');
    }

    const device = await this.devicesRepo.disassociateDevice(deleteDeviceDto);
    if (!device) {
      throw new Error('Device not found or you do not have permission to disassociate it');
    }

    return {
      message: 'Device disassociated successfully',
      device,
    };
  }
}

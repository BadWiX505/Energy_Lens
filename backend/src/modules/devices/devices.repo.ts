import { prisma } from '../../common/config/prisma';
import { AssociateDeviceDto, UpdateDeviceDto, GetDevicesQueryDto, GetDeviceByIdDto, DeleteDeviceDto } from './devices.types';

export class DevicesRepository {
  
  async associateDevice(associateDeviceDto: AssociateDeviceDto) {
    // Verify device exists first
    const existingDevice = await prisma.device.findUnique({
      where: { id: associateDeviceDto.deviceId },
    });

    if (!existingDevice) {
      throw new Error(`Device with ID ${associateDeviceDto.deviceId} not found`);
    }

    // Associate device to home by updating it
    return await prisma.device.update({
      where: { id: associateDeviceDto.deviceId },
      data: {
        homeId: associateDeviceDto.homeId,
        name: associateDeviceDto.name,
      },
    });
  }

  async getDeviceById(getDeviceByIdDto: GetDeviceByIdDto) {
    return await prisma.device.findFirst({
      where: {
        id: getDeviceByIdDto.id,
        homeId: getDeviceByIdDto.homeId, // Ensure home owns this device
      },
    });
  }

  async getDevicesByHomeId(getDevicesQueryDto: GetDevicesQueryDto) {
    const { homeId, skip = 0, take = 10 } = getDevicesQueryDto;
    
    return await prisma.device.findMany({
      where: {
        homeId,
      },
      skip,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateDevice(id: string, homeId: string, updateDeviceDto: UpdateDeviceDto) {
    // Verify ownership before updating
    const device = await prisma.device.findFirst({
      where: {
        id,
        homeId,
      },
    });

    if (!device) {
      return null;
    }

    return await prisma.device.update({
      where: { id },
      data: {
        name: updateDeviceDto.name,
      },
    });
  }

  async disassociateDevice(deleteDeviceDto: DeleteDeviceDto) {
    // Verify ownership before disassociating
    const device = await prisma.device.findFirst({
      where: {
        id: deleteDeviceDto.id,
        homeId: deleteDeviceDto.homeId,
      },
    });

    if (!device) {
      return null;
    }

    // Disassociate by setting homeId and name to null
    return await prisma.device.update({
      where: { id: deleteDeviceDto.id },
      data: {
        homeId: null,
        name: null,
      },
    });
  }

  async countDevicesForHome(homeId: string) {
    return await prisma.device.count({
      where: { homeId },
    });
  }
}

import { PrismaClient } from '@prisma/client';
import { CreateHomeDto, UpdateHomeDto, GetHomesQueryDto, GetHomeByIdDto, DeleteHomeDto } from './homes.types';

const prisma = new PrismaClient();

export class HomesRepository {
  
  async createHome(createHomeDto: CreateHomeDto) {
    return await prisma.home.create({
      data: {
        userId: createHomeDto.userId,
        name: createHomeDto.name,
        location: createHomeDto.location,
      },
    });
  }

  async getHomeById(getHomeByIdDto: GetHomeByIdDto) {
    return await prisma.home.findFirst({
      where: {
        id: getHomeByIdDto.id,
        userId: getHomeByIdDto.userId, // Ensure user owns this home
      },
      include: {
        devices: true,
        preferences: true,
        alerts: true,
        energyGoals: true,
        energyScores: true,
      },
    });
  }

  async getHomesByUserId(getHomesQueryDto: GetHomesQueryDto) {
    const { userId, skip = 0, take = 10 } = getHomesQueryDto;
    
    return await prisma.home.findMany({
      where: {
        userId,
      },
      skip,
      take,
      include: {
        devices: true,
        preferences: true,
        alerts: true,
        energyGoals: true,
        energyScores: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateHome(id: string, userId: string, updateHomeDto: UpdateHomeDto) {
    // Verify ownership before updating
    const home = await prisma.home.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!home) {
      return null;
    }

    return await prisma.home.update({
      where: { id },
      data: {
        name: updateHomeDto.name,
        location: updateHomeDto.location,
      },
    });
  }

  async deleteHome(deleteHomeDto: DeleteHomeDto) {
    // Verify ownership before deleting
    const home = await prisma.home.findFirst({
      where: {
        id: deleteHomeDto.id,
        userId: deleteHomeDto.userId,
      },
    });

    if (!home) {
      return null;
    }

    return await prisma.home.delete({
      where: { id: deleteHomeDto.id },
    });
  }

  async countHomesForUser(userId: string) {
    return await prisma.home.count({
      where: { userId },
    });
  }
}

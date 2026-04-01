import { HomesRepository } from './homes.repo';
import { CreateHomeDto, UpdateHomeDto, GetHomesQueryDto, GetHomeByIdDto, DeleteHomeDto } from './homes.types';

export class HomesService {
  private homesRepo = new HomesRepository();

  async createHome(createHomeDto: CreateHomeDto) {
    if (!createHomeDto.name || createHomeDto.name.trim().length === 0) {
      throw new Error('Home name is required');
    }

    if (!createHomeDto.userId) {
      throw new Error('User ID is required');
    }

    const home = await this.homesRepo.createHome(createHomeDto);
    return { 
      message: 'Home created successfully', 
      home 
    };
  }

  async getHomeById(getHomeByIdDto: GetHomeByIdDto) {
    if (!getHomeByIdDto.id) {
      throw new Error('Home ID is required');
    }

    if (!getHomeByIdDto.userId) {
      throw new Error('User ID is required');
    }

    const home = await this.homesRepo.getHomeById(getHomeByIdDto);
    if (!home) {
      throw new Error('Home not found');
    }

    return home;
  }

  async getHomesByUserId(getHomesQueryDto: GetHomesQueryDto) {
    if (!getHomesQueryDto.userId) {
      throw new Error('User ID is required');
    }

    const homes = await this.homesRepo.getHomesByUserId(getHomesQueryDto);
    const count = await this.homesRepo.countHomesForUser(getHomesQueryDto.userId);

    return homes;
  }

  async updateHome(id: string, userId: string, updateHomeDto: UpdateHomeDto) {
    if (!id) {
      throw new Error('Home ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    const home = await this.homesRepo.updateHome(id, userId, updateHomeDto);
    if (!home) {
      throw new Error('Home not found or you do not have permission to update it');
    }

    return {
      message: 'Home updated successfully',
      home,
    };
  }

  async deleteHome(deleteHomeDto: DeleteHomeDto) {
    if (!deleteHomeDto.id) {
      throw new Error('Home ID is required');
    }

    if (!deleteHomeDto.userId) {
      throw new Error('User ID is required');
    }

    const home = await this.homesRepo.deleteHome(deleteHomeDto);
    if (!home) {
      throw new Error('Home not found or you do not have permission to delete it');
    }

    return {
      message: 'Home deleted successfully',
      home,
    };
  }
}

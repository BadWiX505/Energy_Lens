import { prisma } from '../../common/config/prisma';
import { CreatePreferenceDto, GetPreferenceByHomeIdDto, GetPreferencesByDateRangeDto } from './preferences.types';

export class PreferencesRepository {
  
  async createPreference(createPreferenceDto: CreatePreferenceDto) {

    // Create new preferences
    return await prisma.preference.create({
      data: {
        homeId: createPreferenceDto.homeId,
        maxPowerThreshold: createPreferenceDto.maxPowerThreshold,
        nightThreshold: createPreferenceDto.nightThreshold,
        pricePerKwh: createPreferenceDto.pricePerKwh,
        currency: createPreferenceDto.currency,
        billingStart: createPreferenceDto.billingStart,
        enableNotifications: createPreferenceDto.enableNotifications ?? true,
      },
    });
  }

  async getPreferenceByHomeId(getPreferenceByHomeIdDto: GetPreferenceByHomeIdDto) {
    const preferences = await prisma.preference.findMany({
      where: { homeId: getPreferenceByHomeIdDto.homeId },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    return preferences.length > 0 ? preferences[0] : null;
  }

  async getPreferencesByDateRange(getPreferencesByDateRangeDto: GetPreferencesByDateRangeDto) {
    const { startDate, endDate } = getPreferencesByDateRangeDto;

    return await prisma.preference.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

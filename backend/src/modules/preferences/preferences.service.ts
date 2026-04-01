import { PreferencesRepository } from './preferences.repo';
import { CreatePreferenceDto, GetPreferenceByHomeIdDto, GetPreferencesByDateRangeDto } from './preferences.types';

export class PreferencesService {
  private preferencesRepo = new PreferencesRepository();

  async createPreference(createPreferenceDto: CreatePreferenceDto) {
    if (!createPreferenceDto.homeId) {
      throw new Error('Home ID is required');
    }

    const preference = await this.preferencesRepo.createPreference(createPreferenceDto);
    return { 
      message: 'Preferences created successfully', 
      preference 
    };
  }

  async getPreferenceByHomeId(getPreferenceByHomeIdDto: GetPreferenceByHomeIdDto) {
    if (!getPreferenceByHomeIdDto.homeId) {
      throw new Error('Home ID is required');
    }

    const preference = await this.preferencesRepo.getPreferenceByHomeId(getPreferenceByHomeIdDto);
    if (!preference) {
      throw new Error('Preferences not found for this home');
    }

    return preference;
  }

  async getPreferencesByDateRange(getPreferencesByDateRangeDto: GetPreferencesByDateRangeDto) {
    if (!getPreferencesByDateRangeDto.startDate) {
      throw new Error('Start date is required');
    }

    if (!getPreferencesByDateRangeDto.endDate) {
      throw new Error('End date is required');
    }

    if (getPreferencesByDateRangeDto.startDate > getPreferencesByDateRangeDto.endDate) {
      throw new Error('Start date must be before end date');
    }

    const preferences = await this.preferencesRepo.getPreferencesByDateRange(getPreferencesByDateRangeDto);
    return preferences;
  }
}

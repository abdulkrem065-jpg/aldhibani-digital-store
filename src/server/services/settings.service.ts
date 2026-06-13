import { SettingsRepository } from '../repositories/settings.repository';

export class SettingsService {
  public static async getConfig() {
    return await SettingsRepository.getConfig();
  }

  public static async saveConfig(config: any) {
    return await SettingsRepository.saveConfig(config);
  }

  public static async getBanners() {
    return await SettingsRepository.getBanners();
  }

  public static async saveBanner(banner: any) {
    return await SettingsRepository.upsertBanner(banner);
  }

  public static async deleteBanner(id: string) {
    return await SettingsRepository.deleteBanner(id);
  }
}

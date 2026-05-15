import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@downlink_settings';

export interface AppSettings {
  downloadQuality: string;
  theme: 'dark' | 'light' | 'system';
  notificationsEnabled: boolean;
  maxConcurrentDownloads: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  downloadQuality: 'mp4_1080p',
  theme: 'dark',
  notificationsEnabled: true,
  maxConcurrentDownloads: 3,
};

export const SettingsSync = {
  /**
   * Load settings from local storage
   */
  async loadSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('[Settings] Failed to load:', error);
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Save settings to local storage and sync with desktop if companion app
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      console.log('[Settings] Saved successfully');
      
      // TODO: If this is a companion app, push these settings via RustBridge/WebSocket to Desktop
      // RustBridge.syncSettings(settings);
    } catch (error) {
      console.error('[Settings] Failed to save:', error);
    }
  },
  
  /**
   * Update a specific setting property
   */
  async updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    const currentSettings = await this.loadSettings();
    currentSettings[key] = value;
    await this.saveSettings(currentSettings);
  }
};

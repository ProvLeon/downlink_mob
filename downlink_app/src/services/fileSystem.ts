import * as FileSystem from 'expo-file-system';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// Define background tasks
const BACKGROUND_DOWNLOAD_TASK = 'background-download-task';

TaskManager.defineTask(BACKGROUND_DOWNLOAD_TASK, async () => {
  try {
    console.log('[Background Task] Executing background download check...');
    // In a real app, you would communicate with Rust or resume downloads here
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const DownlinkFileSystem = {
  /**
   * Initializes the application directory structure.
   */
  async initialize() {
    const downlinkDir = `${FileSystem.documentDirectory}Downlink/`;
    const exists = await FileSystem.getInfoAsync(downlinkDir);
    
    if (!exists.exists) {
      await FileSystem.makeDirectoryAsync(downlinkDir, { intermediates: true });
    }
    return downlinkDir;
  },

  /**
   * Registers background fetch to keep downloads alive if possible.
   */
  async registerBackgroundService() {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_DOWNLOAD_TASK, {
        minimumInterval: 15 * 60, // 15 minutes
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Background service registered successfully');
    } catch (err) {
      console.error('Task Register failed:', err);
    }
  },

  /**
   * Read the list of local files
   */
  async getLocalFiles() {
    const downlinkDir = await this.initialize();
    return await FileSystem.readDirectoryAsync(downlinkDir);
  }
};

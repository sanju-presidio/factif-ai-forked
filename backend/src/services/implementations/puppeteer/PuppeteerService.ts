import { BaseStreamingService } from '../../base/BaseStreamingService';
import { ServiceConfig } from '../../../types/stream.types';
import { ActionResponse } from '../../../types/action.types';
import { PuppeteerActions } from './PuppeteerActions';

export class PuppeteerService extends BaseStreamingService {
  private isConnected: boolean = false;

  constructor(serviceConfig: ServiceConfig) {
    super(serviceConfig);
    PuppeteerActions.initialize(serviceConfig.io);
  }

  async initialize(url: string): Promise<ActionResponse> {
    try {
      this.emitConsoleLog('info', 'Initializing Puppeteer browser...');
      
      // Launch browser with URL
      const result = await PuppeteerActions.launch(url);
      if (result.status === 'success') {
        this.isConnected = true;
        this.isInitialized = true;
        this.startScreenshotStream();
      }
      return result;
    } catch (error: any) {
      this.emitConsoleLog('error', `Browser initialization error: ${error.message || 'Unknown error'}`);
      await this.cleanup();
      throw error;
    }
  }

  async performAction(action: string, params?: any): Promise<ActionResponse> {
    try {
      this.emitConsoleLog('info', `Performing browser action: ${action}`);
      
      switch (action) {
        case 'launch':
          return this.initialize(params?.url);
        case 'click':
          return await PuppeteerActions.click(params?.x, params?.y);
        case 'type':
          return await PuppeteerActions.type(params?.text);
        case 'scroll_up':
          return await PuppeteerActions.scroll('up');
        case 'scroll_down':
          return await PuppeteerActions.scroll('down');
        case 'scroll':
          return await PuppeteerActions.scroll(params?.direction);
        case 'keyPress':
          return await PuppeteerActions.keyPress(params?.key);
        case 'back':
          return await PuppeteerActions.back();
        default:
          return {
            status: 'error',
            message: `Unknown action: ${action}`,
            screenshot: '',
          };
      }
    } catch (error: any) {
      this.emitConsoleLog('error', `Browser action error: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }

  protected screenshotInterval: NodeJS.Timeout | null = null;

  startScreenshotStream(interval: number = 1000): void {
    // Stop any existing stream first
    this.stopScreenshotStream();

    // Only start streaming if browser is initialized
    if (!this.isInitialized || !this.isConnected) {
      this.emitConsoleLog('info', 'Cannot start streaming: Browser not initialized');
      return;
    }

    this.screenshotInterval = setInterval(async () => {
      // Check if browser is still running before attempting to get screenshot
      if (!this.isInitialized || !this.isConnected) {
        this.stopScreenshotStream();
        return;
      }

      try {
        const screenshot = await PuppeteerActions.getScreenshot();
        if (screenshot) {
          this.io.emit('screenshot-stream', screenshot);
        }
      } catch (error) {
        // If we get an error, the browser might have been closed
        // Stop the stream and update state
        this.stopScreenshotStream();
        this.isConnected = false;
        this.isInitialized = false;
      }
    }, interval);

    this.emitConsoleLog('info', 'Screenshot stream started');
  }

  stopScreenshotStream(): void {
    if (this.screenshotInterval) {
      clearInterval(this.screenshotInterval);
      this.screenshotInterval = null;
    }
  }

  async takeScreenshot(): Promise<string | null> {
    // Screenshots are handled by PuppeteerActions after each action
    return null;
  }

  async cleanup(): Promise<void> {
    this.emitConsoleLog('info', 'Cleaning up Puppeteer browser resources...');
    
    // Stop streaming before closing browser
    this.stopScreenshotStream();
    
    // Just reset state since browser cleanup is handled in PuppeteerActions launch
    this.isInitialized = false;
    this.isConnected = false;
    this.emitConsoleLog('info', 'Browser resources cleaned up');
  }
}

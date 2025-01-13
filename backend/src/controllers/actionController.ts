import { Request, Response } from 'express';
import { ActionRequest } from '../types/action.types';
import { actionExecutorService } from '../server';
import { screenshotController } from './screenshotController';
import { StreamingSource } from '../types/stream.types';
import OmniParserService from '../services/OmniParserService';

interface ActionQueryParams {
  chatId?: string;
  folderPath?: string;
  source?: StreamingSource;
}

class ActionController {
  async executeAction(req: Request<{}, {}, ActionRequest, ActionQueryParams>, res: Response) {
    try {
      const { chatId, folderPath, source } = req.query;
      const { action } = req.body;

      if (!action || !source) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required parameters',
          screenshot: '',
        });
      }

      // Execute the action
      const result = await actionExecutorService.executeAction({
        ...req.body,
        source,
      });

      // Process through omni parser if screenshot exists
      if (result.screenshot) {
        try {
          // Convert base64 to buffer for omni parser
          const imageBuffer = Buffer.from(result.screenshot, 'base64');
          const omniParserResult = await OmniParserService.processImage(imageBuffer);

          if (omniParserResult) {
            result.omniParserResult = omniParserResult;
          }

          // Save screenshot if chatId and folderPath provided
          if (chatId && folderPath) {
            const screenshotPath = await screenshotController.saveScreenshot({
              chatId,
              folderPath,
              source,
              screenshot: result.screenshot,
            });
            result.screenshotPath = screenshotPath;
          }
        } catch (error) {
          console.error('Failed to process or save screenshot:', error);
        }
      }

      return res.json(result);
    } catch (error) {
      console.error('Action execution error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to execute action',
        screenshot: '',
        error: (error as Error).message,
      });
    }
  }
}

export const actionController = new ActionController();

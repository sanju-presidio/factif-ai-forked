import { Request, Response } from "express";
import { ChatService } from "../services/chatService";
import { StreamingSource } from "../types/stream.types";
import { TestcaseController } from "./testcaseController";
import { getLatestScreenshot, saveScreenshot } from "../utils/screenshotUtils";
import { modernizeOutput } from "../prompts/modernize-output.prompt";

export class ExploreController {
  static async handleExploreMessage(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      // Get data from request body
      const { message, imageData, history, omniParserResult } = req.body;

      // Get remaining params from query string
      const folderPath = req.query.folderPath as string;
      const currentChatId = req.query.currentChatId as string;
      const source = req.query.source as StreamingSource | undefined;
      const saveScreenshots = req.query.saveScreenshots as string;
      const type = req.query.type as "action" | "explore";

      if (!message || !Array.isArray(history)) {
        res.status(400).json({
          status: "error",
          message: "Message and valid history array are required",
        });
        return;
      }

      // Get latest screenshot if available
      const latestScreenshot = await getLatestScreenshot(source);
      const finalImageData = latestScreenshot || imageData;

      await Promise.all([
        folderPath &&
          saveScreenshots === "true" &&
          saveScreenshot(finalImageData, folderPath, currentChatId),
        folderPath &&
          TestcaseController.downloadTestcase(
            history,
            currentChatId,
            folderPath,
          ),
        ChatService.processMessage(
          res,
          message,
          history,
          "explore",
          "explore",
          finalImageData,
          source,
          omniParserResult,
        ),
      ]);
    } catch (error) {
      console.error("Explore message error:", error);
      res.status(500).json({
        status: "error",
        message: "Error processing explore message",
      });
    }
  }

  static healthCheck(_req: Request, res: Response): void {
    res.json({
      status: "ok",
      message: "Explore mode is running",
    });
  }
}

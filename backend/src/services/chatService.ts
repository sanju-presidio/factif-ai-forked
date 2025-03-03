import { Response } from "express";
import { config } from "../config";
import { StreamResponse } from "../types";
import { ChatMessage } from "../types/chat.types";
import { StreamingSource } from "../types/stream.types";
import { OmniParserResult } from "../types/action.types";
import { LLMProvider } from "./llm/LLMProvider";
import { AnthropicProvider } from "./llm/AnthropicProvider";
import { OpenAIProvider } from "./llm/OpenAIProvider";
import { GeminiProvider } from "./llm/GeminiProvider";
import { trimHistory } from "../utils/historyManager";
import { IProcessedScreenshot } from "./interfaces/BrowserService";

export class ChatService {
  private static provider: LLMProvider;

  static {
    switch (config.llm.provider) {
      case "openai":
        this.provider = new OpenAIProvider("openai");
        break;
      case "azure-openai":
        this.provider = new OpenAIProvider("azure");
        break;
      case "gemini":
        this.provider = new GeminiProvider();
        break;
      case "anthropic":
      default:
        this.provider = new AnthropicProvider();
        break;
    }
  }

  private static sendStreamResponse(res: Response, data: StreamResponse) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  static async processMessage(
    res: Response,
    message: string,
    history: ChatMessage[] = [],
    imageData: IProcessedScreenshot,
    source?: StreamingSource,
    omniParserResult?: OmniParserResult,
  ): Promise<void> {
    // Get the current model based on provider
    const model = (() => {
      switch (config.llm.provider) {
        case "openai":
        case "azure-openai":
          return config.llm.openai.model;
        case "anthropic":
          return config.llm.anthropic.model;
        case "gemini":
          return config.llm.gemini.model;
      }
    })();

    // Use dynamic history trimming based on token counting
    const trimmedHistory = trimHistory(history, config.llm.provider, model);

    // Initialize SSE connection
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Set up keep-alive interval
    const keepAliveInterval = setInterval(() => {
      res.write(": keepalive\n\n");
    }, config.streamConfig.keepAliveInterval);

    try {
      // Stream the response from the LLM provider with optional image data
      await this.provider.streamResponse(
        res,
        message,
        trimmedHistory,
        source,
        imageData,
        omniParserResult,
      );
    } catch (error) {
      console.error("Error streaming response:", error);
      this.sendStreamResponse(res, {
        message: "Error processing message",
        isComplete: true,
        timestamp: Date.now(),
        isError: true,
      });
    } finally {
      // Clean up
      clearInterval(keepAliveInterval);
      res.end();
    }
  }
}

import { Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { config } from "../../config";
import { StreamResponse } from "../../types";
import { OmniParserResult } from "../../types/action.types";
import { ChatMessage } from "../../types/chat.types";
import { StreamingSource } from "../../types/stream.types";
import { LLMProvider } from "./LLMProvider";
import fs from "fs";
import path from "path";
import {
  exploreModePrompt,
  getPerformActionPrompt,
} from "../../prompts/explore-mode";
import { PuppeteerActions } from "../implementations/puppeteer/PuppeteerActions";

export class ExploreModeAnthropicProvider implements LLMProvider {
  private logMessageRequest(messageRequest: any) {
    try {
      // Create logs directory if it doesn't exist
      const logsDir = path.join(__dirname, "../../../logs");
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Create a log file with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const logFile = path.join(logsDir, `message-request-${timestamp}.json`);

      fs.writeFileSync(logFile, JSON.stringify(messageRequest, null, 2));
    } catch (error) {
      console.error("Error logging message request:", error);
    }
  }

  private client: Anthropic | AnthropicBedrock;

  constructor() {
    if (config.llm.anthropic.useBedrock) {
      this.client = new AnthropicBedrock({
        awsRegion: config.llm.anthropic.bedrock.region,
        awsAccessKey: config.llm.anthropic.bedrock.credentials.accessKeyId,
        awsSecretKey: config.llm.anthropic.bedrock.credentials.secretAccessKey,
      });
    } else {
      this.client = new Anthropic({
        apiKey: config.llm.anthropic.apiKey,
      });
    }
  }

  private sendStreamResponse(res: Response, data: StreamResponse) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  private getLastUserMessage(messages: ChatMessage[]): string {
    let message = "";
    if (messages.length > 0) {
      message = messages[0].text;
    }
    return message;
  }

  private formatMessagesWithHistory(
    currentMessage: string,
    history: ChatMessage[],
    imageData?: string,
    source?: StreamingSource,
    mode: "explore" | "regression" = "regression",
    type: "action" | "explore" = "explore",
    currentPageUrl: string = "",
  ): { role: "user" | "assistant"; content: string | any[] }[] {
    console.log("======= Current message: ", currentMessage);
    const formattedMessages: {
      role: "user" | "assistant";
      content: string | any[];
    }[] = [
      ...this.chooseSystemPrompt(
        type,
        source as StreamingSource,
        type === "action" ? this.getLastUserMessage(history) : "",
        currentPageUrl,
      ),
    ];

    if (type === "action") {
      // Add all history messages
      history.forEach((msg) => {
        formattedMessages.push({
          role: msg.isUser ? "user" : ("assistant" as const),
          content: msg.text,
        });
      });
    }

    // Add current message with image if present
    if (imageData) {
      formattedMessages.push({
        role: "user",
        content: [
          { type: "text", text: currentMessage },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageData,
            },
          },
        ],
      });
    } else {
      formattedMessages.push({
        role: "user",
        content: currentMessage,
      });
    }

    return formattedMessages;
  }

  getModelId(): string {
    return config.llm.anthropic.useBedrock
      ? config.llm.anthropic.bedrock.modelId
      : config.llm.anthropic.model;
  }

  buildMessageRequest(
    modelId: string,
    messages: any[],
    stream: boolean = true,
  ): any {
    const maxTokens =
      config.llm.anthropic.contextConfig?.modelContextWindows[modelId] || 8192;
    return {
      model: modelId,
      max_tokens: maxTokens,
      messages,
      stream,
    };
  }

  addOmniParserResults(
    messages: any[],
    omniParserResult: OmniParserResult,
    userRole: string,
  ): void {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === userRole) {
      const content = Array.isArray(lastMessage.content)
        ? lastMessage.content[0].text
        : lastMessage.content;
      const updatedContent = `${content}\n\nOmni Parser Results:\n${JSON.stringify(
        {
          label_coordinates: omniParserResult.label_coordinates,
          parsed_content: omniParserResult.parsed_content,
        },
        null,
        2,
      )}`;
      if (Array.isArray(lastMessage.content)) {
        lastMessage.content[0].text = updatedContent;
      } else {
        lastMessage.content = updatedContent;
      }
    }
  }

  async processStreamResponse(stream: any, res: Response): Promise<void> {
    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta?.text) {
        this.sendStreamResponse(res, {
          message: chunk.delta.text,
          timestamp: Date.now(),
        });
      }
    }
    this.sendStreamResponse(res, {
      message: "",
      timestamp: Date.now(),
      isComplete: true,
    });
  }

  async streamResponse(
    res: Response,
    message: string,
    history: ChatMessage[] = [],
    mode: "explore" | "regression" = "regression",
    type: "action" | "explore" = "explore",
    source?: StreamingSource,
    imageData?: string,
    omniParserResult?: OmniParserResult,
    retryCount: number = config.retryAttemptCount,
  ): Promise<void> {
    const retryArray = new Array(retryCount).fill(0);
    let isRetrySuccessful = false;
    for (let _ of retryArray) {
      isRetrySuccessful = await this.processStream(
        res,
        message,
        history,
        mode,
        type,
        source,
        imageData,
        omniParserResult,
      );
      if (isRetrySuccessful) {
        return;
      }
      console.log("Attempting to retry");
    }
    if (!isRetrySuccessful) {
      this.sendStreamResponse(res, {
        message: "Error processing message. Please try again later.",
        timestamp: Date.now(),
        isError: true,
      });
    }
  }

  async processStream(
    res: Response,
    message: string,
    history: ChatMessage[] = [],
    mode: "explore" | "regression" = "regression",
    type: "action" | "explore" = "explore",
    source?: StreamingSource,
    imageData?: string,
    omniParserResult?: OmniParserResult,
  ) {
    console.log("Processing message with history length:", history.length);
    const USER_ROLE = "user";
    try {
      const modelId = this.getModelId();
      const currentPageUrl = await PuppeteerActions.getCurrentUrl();
      // Format messages with history and image if present
      const formattedMessage = this.formatMessagesWithHistory(
        message,
        history,
        imageData,
        source,
        mode,
        type,
        currentPageUrl,
      );
      // If omni parser is enabled and we have results, add them to the last user message
      if (config.omniParser.enabled && omniParserResult) {
        this.addOmniParserResults(
          formattedMessage,
          omniParserResult,
          USER_ROLE,
        );
      }

      const messageRequest = this.buildMessageRequest(
        modelId,
        formattedMessage,
      );
      // Log the message request before sending
      this.logMessageRequest(messageRequest);

      const stream = await this.client.messages.create(messageRequest);
      await this.processStreamResponse(stream, res);
      return true;
    } catch (error) {
      this.sendStreamResponse(res, {
        message: "Error processing message re-tyring",
        timestamp: Date.now(),
        isError: false,
      });

      return false;
    }
  }

  chooseSystemPrompt(
    action: "action" | "explore",
    source: StreamingSource,
    task: string,
    currentPageUrl: string,
  ): {
    role: "user" | "assistant";
    content: string | any[];
  }[] {
    const message: {
      role: "user" | "assistant";
      content: string | any[];
    }[] = [
      {
        role: "user",
        content:
          action === "explore"
            ? exploreModePrompt
            : getPerformActionPrompt(source, task, currentPageUrl),
      },
    ];
    if (action === "action") {
      message.push({
        role: "assistant",
        content:
          "I understand. Before each response, I will:\n\n1. Verify only ONE tool use exists\n2. Check no tool XML in markdown\n3. Validate all parameters\n4. Never combine multiple actions\n\nWhat would you like me to do?",
      });
    }

    return message;
  }
}

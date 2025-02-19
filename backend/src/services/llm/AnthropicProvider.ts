import { Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { config } from "../../config";
import { StreamResponse } from "../../types";
import { SYSTEM_PROMPT } from "../../prompts/systemPrompts";
import { ChatMessage } from "../../types/chat.types";
import { StreamingSource } from "../../types/stream.types";
import { LLMProvider } from "./LLMProvider";
import fs from "fs";
import path from "path";
import { OmniParserResponse } from "../interfaces/BrowserService";
import { getOmniParserSystemPrompt } from "../../prompts/omniParserSystemPrompt";

export class AnthropicProvider implements LLMProvider {
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

  private formatMessagesWithHistory(
    currentMessage: string,
    history: ChatMessage[],
    imageData?: string,
    source?: StreamingSource,
    omniParserResponse?: OmniParserResponse | null,
  ): { role: "user" | "assistant"; content: string | any[] }[] {
    const formattedMessages: {
      role: "user" | "assistant";
      content: string | any[];
    }[] = [
      {
        role: "user",
        content: omniParserResponse
          ? getOmniParserSystemPrompt(
              source as string,
              this.addOmniParserResults(omniParserResponse),
            )
          : SYSTEM_PROMPT(source),
      },
      {
        role: "assistant",
        content:
          "I understand. Before each response, I will:\n\n1. Verify only ONE tool use exists\n2. Check no tool XML in markdown\n3. Validate all parameters\n4. Never combine multiple actions\n\nWhat would you like me to do?",
      },
    ];

    // Add all history messages
    history.forEach((msg) => {
      formattedMessages.push({
        role: msg.isUser ? "user" : ("assistant" as const),
        content: msg.text,
      });
    });

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
              data: omniParserResponse
                ? omniParserResponse.processedImage
                : imageData,
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

  buildMessageRequest(modelId: string, messages: any[]): any {
    const maxTokens =
      config.llm.anthropic.contextConfig?.modelContextWindows[modelId] || 8192;
    return {
      model: modelId,
      max_tokens: maxTokens,
      messages,
      stream: true as const,
    };
  }

  addOmniParserResults(omniParserResult: OmniParserResponse): string {
    const response = omniParserResult.elements
      .map((element, index) => {
        return `
        <element>
          <maker_number>${index}</marker_number>
          <coordinates>${element.coordinates}</coordinates>
          <content>${element.content}</content>
          <is_interactable>${element.interactivity}</is_interactable>
        </element>`;
      })
      .join("\n\n");
    console.log(response);
    return response;
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
    source?: StreamingSource,
    imageData?: string,
    omniParserResult?: OmniParserResponse,
    retryCount: number = config.retryAttemptCount,
  ): Promise<void> {
    const retryArray = new Array(retryCount).fill(0);
    let isRetrySuccessful = false;
    for (let _ of retryArray) {
      isRetrySuccessful = await this.processStream(
        res,
        message,
        history,
        source,
        imageData,
        omniParserResult as OmniParserResponse,
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
    source?: StreamingSource,
    imageData?: string,
    omniParserResult?: OmniParserResponse,
  ) {
    console.log("Processing message with history length:", history.length);
    const USER_ROLE = "user";
    try {
      const modelId = this.getModelId();
      // Format messages with history and image if present
      const formattedMessage = this.formatMessagesWithHistory(
        message,
        history,
        imageData,
        source,
        omniParserResult || null,
      );

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
}

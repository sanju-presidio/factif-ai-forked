import { Response } from "express";
import { ChatMessage } from "../../types/chat.types";
import { StreamingSource } from "../../types/stream.types";
import { OmniParserResult } from "../../types/action.types";
import { OmniParserResponse } from "../interfaces/BrowserService";

export interface LLMProvider {
  streamResponse(
    res: Response,
    message: string,
    history: ChatMessage[],
    source?: StreamingSource,
    imageData?: string,
    omniParserResult?: OmniParserResponse | OmniParserResult,
  ): Promise<void>;
}

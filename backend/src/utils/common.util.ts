import path from "path";
import fs from "fs";
import { OmniParserResult } from "../types/action.types";

export function logMessageRequest(messageRequest: any) {
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

export function addOmniParserResults(
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

import path from "path";
import fs from "fs";
import { StreamingSource } from "../types/stream.types";
import { PuppeteerActions } from "../services/implementations/puppeteer/PuppeteerActions";
import { DockerCommands } from "../services/implementations/docker/DockerCommands";
import { DockerActions } from "../services/implementations/docker/DockerActions";
import { IClickableElement, OmniParserResponse } from "../services/interfaces/BrowserService";
import { convertElementsToInput } from "./prompt.util";

/**
 * Logs the provided message request to a JSON file in the logs directory.
 *
 * @param {any} messageRequest - The message request object to be logged. It will be converted to a JSON string format and stored in the log file.
 * @return {void} This function does not return a value.
 */
export function logMessageRequest(messageRequest: any): void {
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


export async function getCurrentUrlBasedOnSource(source: StreamingSource) {
  let pageUrl = "";
  console.log("coming here");
  if (source === "chrome-puppeteer") {
    pageUrl = await PuppeteerActions.getCurrentUrl();
  } else if (source === "ubuntu-docker-vnc") {
    try {
      const containerName = "factif-vnc";
      const containerStatus =
        await DockerCommands.checkContainerStatus(containerName);
      console.log("containerStatus", containerStatus);
      if (
        containerStatus.exists &&
        containerStatus.running &&
        containerStatus.id
      ) {
        pageUrl = await DockerActions.getUrl(containerStatus.id);
        console.log("pageUrl", pageUrl);
      }
    } catch (error) {
      console.log("No active Docker VNC session");
    }
  }
  return pageUrl;
}

export const addOmniParserResults = (omniParserResult: OmniParserResponse): string => {
  return omniParserResult.elements
    .map((element, index) => {
      return `
        <element>
          <maker_number>${index}</marker_number>
          <coordinates>${element.coordinates}</coordinates>
          <content>${element.content}</content>
          <is_intractable>${element.interactivity}</is_intractable>
        </element>`;
    })
    .join("\n\n");
};

export const addElementsList = (elements: IClickableElement[]) => {
  return `## Elements List:\n ${convertElementsToInput(elements)}`;
};

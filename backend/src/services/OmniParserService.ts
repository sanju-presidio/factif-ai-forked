import axios from "axios";
import FormData from "form-data";
import { config } from "../config";

export class OmniParserService {
  private serverUrl: string;
  private enabled: boolean;

  constructor() {
    this.serverUrl = config.omniParser.serverUrl;
    this.enabled = config.omniParser.enabled;
  }

  async processImage(imageBuffer: Buffer): Promise<any> {
    if (!this.enabled) {
      return null;
    }

    const formData = new FormData();
    formData.append("image", imageBuffer, {
      filename: "screenshot.png",
      contentType: "image/png",
    });

    try {
      const response = await axios.post(`${this.serverUrl}/process`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("OmniParser processing failed:", error);
      return null;
    }
  }
}

export default new OmniParserService();

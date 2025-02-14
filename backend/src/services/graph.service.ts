import fs from 'fs';
import path from 'path';
import { SaveGraphRequest, SaveGraphResponse } from '../types/graph.types';

export class GraphService {
  private static outputDir = path.join(__dirname, '../../output/graphs');

  private static ensureOutputDirExists() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  static async saveGraph(data: SaveGraphRequest): Promise<SaveGraphResponse> {
    try {
      this.ensureOutputDirExists();

      // Remove the data URL prefix to get just the base64 data
      const base64Data = data.dataUrl.replace(/^data:image\/png;base64,/, '');
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `graph-${timestamp}.png`;
      const filePath = path.join(this.outputDir, filename);
      
      // Write the file
      fs.writeFileSync(filePath, buffer);
      
      return {
        success: true,
        filePath: filename
      };
    } catch (error) {
      console.error('Error saving graph:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

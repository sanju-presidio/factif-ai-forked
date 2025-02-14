import { Request, Response } from 'express';
import { GraphService } from '../services/graph.service';
import { SaveGraphRequest } from '../types/graph.types';

export class GraphController {
  static async saveGraph(req: Request, res: Response) {
    try {
      const data = req.body as SaveGraphRequest;
      
      // Validate request
      if (!data.dataUrl || !data.dataUrl.startsWith('data:image/png;base64,')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid data URL format. Must be a PNG base64 data URL.'
        });
      }

      // Save graph using service
      const result = await GraphService.saveGraph(data);
      
      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error in saveGraph controller:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }
}

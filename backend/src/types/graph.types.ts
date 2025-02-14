export interface SaveGraphRequest {
  dataUrl: string;
}

export interface SaveGraphResponse {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  screenshot: string;
  error?: string;
}

export interface BrowserService {
  launch(url: string): Promise<ActionResult>;
  click(x: number, y: number): Promise<ActionResult>;
  type(text: string): Promise<ActionResult>;
  scrollUp(): Promise<ActionResult>;
  scrollDown(): Promise<ActionResult>;
  close(): Promise<ActionResult>;
}

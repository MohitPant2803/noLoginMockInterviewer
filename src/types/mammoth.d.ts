declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface ExtractRawTextInput {
    arrayBuffer?: ArrayBuffer;
    buffer?: ArrayBuffer;
    path?: string;
  }

  export function extractRawText(input: ExtractRawTextInput): Promise<MammothResult>;
  export function convertToHtml(input: ExtractRawTextInput): Promise<MammothResult>;
}

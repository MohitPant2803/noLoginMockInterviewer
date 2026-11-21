import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';
import { APP_CONFIG } from '@/lib/constants';
import type { ResumeData } from '@/types';

// Set up pdfjs worker using Vite asset URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const resumeService = {
  /**
   * Validate whether a selected file is supported (PDF, DOCX) and within size limits.
   * Explicitly disallows legacy .doc files.
   */
  validateFile(file: File): FileValidationResult {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;

    if (extension === '.doc') {
      return {
        valid: false,
        error: 'Legacy .doc format is not supported. Please convert your file to .docx or .pdf.',
      };
    }

    const isValidType =
      APP_CONFIG.supportedFileTypes.includes(extension as '.pdf' | '.docx') ||
      APP_CONFIG.supportedMimeTypes.includes(file.type as (typeof APP_CONFIG.supportedMimeTypes)[number]);

    if (!isValidType) {
      return {
        valid: false,
        error: 'Unsupported file type. Please upload a PDF (.pdf) or Word document (.docx).',
      };
    }

    if (file.size > APP_CONFIG.maxFileSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'The uploaded file is 0 bytes (empty). Please upload a valid document.',
      };
    }

    return { valid: true };
  },

  /**
   * Extract readable plain text from a PDF file in the browser using pdfjs-dist.
   */
  async extractTextFromPdf(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        useSystemFonts: true,
      });

      const pdf = await loadingTask.promise;
      const pagesText: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ');

        if (pageText.trim()) {
          pagesText.push(pageText.trim());
        }
      }

      const fullText = pagesText.join('\n\n').trim();

      if (!fullText) {
        throw new Error(
          'No readable text found in this PDF. It may be a scanned image or protected document. Please paste your resume text instead.'
        );
      }

      return fullText;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('No readable text')) {
          throw err;
        }
        throw new Error(`Failed to parse PDF document: ${err.message}`);
      }
      throw new Error('Failed to parse PDF document. Please verify the file is not corrupted.');
    }
  },

  /**
   * Extract readable plain text from a DOCX file in the browser using mammoth.
   */
  async extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      const fullText = result.value.trim();

      if (!fullText) {
        throw new Error(
          'No readable text found in this DOCX file. The document may be empty or contain only non-text elements.'
        );
      }

      return fullText;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes('No readable text')) {
          throw err;
        }
        throw new Error(`Failed to parse DOCX document: ${err.message}`);
      }
      throw new Error('Failed to parse Word document. Please ensure it is a valid .docx file.');
    }
  },

  /**
   * Client-side text extraction from PDF / DOCX files.
   * Runs entirely in-browser without sending files to any server.
   */
  async extractTextFromFile(file: File): Promise<ResumeData> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }

    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const arrayBuffer = await file.arrayBuffer();
    let extractedText = '';

    if (extension === '.pdf' || file.type === 'application/pdf') {
      extractedText = await this.extractTextFromPdf(arrayBuffer);
    } else if (
      extension === '.docx' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      extractedText = await this.extractTextFromDocx(arrayBuffer);
    } else {
      throw new Error('Unsupported file extension. Only .pdf and .docx are supported.');
    }

    return {
      source: 'file',
      fileName: file.name,
      fileSize: file.size,
      fileType: extension.replace('.', '').toUpperCase(),
      rawText: extractedText,
    };
  },
};

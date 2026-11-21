import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  AlertCircle,
  X,
  Loader2,
  RefreshCw,
  Edit3,
  FileCheck,
} from 'lucide-react';
import { resumeService } from '@/services';
import { formatBytes } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';

interface ResumeInputProps {
  source: 'file' | 'paste';
  onSourceChange: (source: 'file' | 'paste') => void;
  rawText: string;
  onRawTextChange: (text: string) => void;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
}

export const ResumeInput: React.FC<ResumeInputProps> = ({
  source,
  onSourceChange,
  rawText,
  onRawTextChange,
  selectedFile,
  onFileSelect,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    const validation = resumeService.validateFile(file);
    if (!validation.valid) {
      setExtractError(validation.error || 'Invalid file');
      onFileSelect(null);
      return;
    }

    setExtractError(null);
    setIsExtracting(true);

    try {
      const extractedData = await resumeService.extractTextFromFile(file);
      onFileSelect(file);
      onRawTextChange(extractedData.rawText);
    } catch (err: unknown) {
      onFileSelect(null);
      if (err instanceof Error) {
        setExtractError(err.message);
      } else {
        setExtractError('An unexpected error occurred while reading the document.');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    onRawTextChange('');
    setExtractError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const charCount = rawText.trim().length;
  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-3">
      {/* Header with mode tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-medium text-text-secondary">
            Candidate resume <span className="text-status-danger">*</span>
          </label>
          <p className="text-xs text-text-muted mt-0.5">
            Upload document or paste text. The AI extracts projects, skills, and background.
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex self-start sm:self-auto rounded bg-surface-elevated p-0.5 border border-border-subtle text-xs">
          <button
            type="button"
            onClick={() => onSourceChange('file')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              source === 'file'
                ? 'bg-surface text-text-primary border border-border-subtle'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Upload file
          </button>
          <button
            type="button"
            onClick={() => onSourceChange('paste')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              source === 'paste'
                ? 'bg-surface text-text-primary border border-border-subtle'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Paste text
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {source === 'file' ? (
        <div className="space-y-3">
          {/* Upload Dropzone */}
          {!selectedFile && !isExtracting && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded p-7 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-accent bg-accent-surface'
                  : 'border-border-strong hover:border-border-focus bg-surface'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="h-9 w-9 rounded bg-surface-muted flex items-center justify-center text-text-secondary">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="text-xs font-medium text-text-primary">
                  Click to select file or drag and drop
                </div>
                <p className="text-xs text-text-muted">
                  Supports PDF (.pdf) and Word (.docx) up to 5MB. Legacy .doc is not supported.
                </p>
              </div>
            </div>
          )}

          {/* Extracting Loading State */}
          {isExtracting && (
            <div className="border border-border-subtle rounded p-5 bg-surface text-center space-y-2">
              <div className="flex justify-center">
                <Loader2 className="h-5 w-5 text-accent animate-spin" />
              </div>
              <p className="text-xs font-medium text-text-primary">
                Extracting text from document in browser memory...
              </p>
            </div>
          )}

          {/* Uploaded File Summary */}
          {selectedFile && !isExtracting && (
            <div className="rounded border border-border-subtle bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-8 w-8 rounded bg-status-success-bg border border-status-success-border flex items-center justify-center text-status-success shrink-0">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-text-primary truncate">
                        {selectedFile.name}
                      </p>
                      <Badge variant="success" className="text-[10px]">
                        Extracted
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                      <span>{formatBytes(selectedFile.size)}</span>
                      <span>/</span>
                      <span>{charCount.toLocaleString()} characters extracted</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    title="Replace with a different file"
                    leftIcon={<RefreshCw className="h-3 w-3" />}
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    title="Remove file"
                    className="text-text-muted hover:text-status-danger"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Editable Extracted Text */}
              <div className="border-t border-border-subtle pt-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="flex items-center gap-1.5 font-normal text-text-secondary">
                    <Edit3 className="h-3.5 w-3.5 text-text-muted" />
                    Review and edit extracted resume content
                  </span>
                  <span>{wordCount} words</span>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => onRawTextChange(e.target.value)}
                  rows={5}
                  className="w-full rounded border border-border-subtle bg-canvas p-3 text-xs text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none font-mono leading-relaxed"
                  placeholder="Extracted text preview..."
                />
              </div>
            </div>
          )}

          {/* Extraction Error */}
          {extractError && (
            <div className="p-3 rounded border border-status-danger-border bg-status-danger-bg text-xs text-status-danger flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{extractError}</span>
            </div>
          )}
        </div>
      ) : (
        /* Manual Text Paste View */
        <div className="space-y-1.5">
          <textarea
            value={rawText}
            onChange={(e) => onRawTextChange(e.target.value)}
            placeholder="Paste your resume text here (experience, technical skills, projects, and education)..."
            rows={8}
            className="w-full rounded border border-border-subtle bg-surface p-3 text-xs text-text-primary placeholder:text-text-muted focus:border-border-focus focus:outline-none leading-relaxed"
          />
          <div className="flex justify-between items-center text-xs text-text-muted px-0.5">
            <span className={charCount >= 50 ? 'text-status-success' : 'text-text-muted'}>
              {charCount >= 50
                ? `${charCount.toLocaleString()} characters (${wordCount} words)`
                : `Minimum 50 characters required (${charCount}/50)`}
            </span>
            <span>Plain text</span>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
};

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
    // 1. Initial client-side validation
    const validation = resumeService.validateFile(file);
    if (!validation.valid) {
      setExtractError(validation.error || 'Invalid file');
      onFileSelect(null);
      return;
    }

    setExtractError(null);
    setIsExtracting(true);

    try {
      // 2. Browser-native extraction using pdfjs-dist or mammoth
      const extractedData = await resumeService.extractTextFromFile(file);

      // 3. Update parent state
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
    <div className="space-y-4">
      {/* Header with mode tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <label className="block text-sm font-semibold text-slate-200">
            Candidate Resume <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload your document or paste raw text. The AI extracts projects, skills, and experience.
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex self-start sm:self-auto rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onSourceChange('file')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              source === 'file'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => onSourceChange('paste')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              source === 'paste'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste Text
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
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-slate-800/80 flex items-center justify-center text-indigo-400 shadow-inner">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-200">
                    Click to choose a file or drag and drop
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Accepts <span className="font-semibold text-slate-300">PDF (.pdf)</span> and{' '}
                    <span className="font-semibold text-slate-300">Word (.docx)</span> up to 5MB
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-400/90 bg-amber-950/30 px-2.5 py-1 rounded border border-amber-900/40">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>Legacy .doc files are not supported. Convert to .docx or .pdf.</span>
                </div>
              </div>
            </div>
          )}

          {/* Extracting Loading State */}
          {isExtracting && (
            <div className="border border-indigo-900/50 rounded-xl p-6 bg-indigo-950/20 text-center space-y-3">
              <div className="flex justify-center">
                <Loader2 className="h-7 w-7 text-indigo-400 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-200">
                  Extracting text from document...
                </p>
                <p className="text-xs text-indigo-300/70 mt-0.5">
                  Parsing in browser memory. No files are uploaded to any server.
                </p>
              </div>
            </div>
          )}

          {/* Uploaded File Summary Card */}
          {selectedFile && !isExtracting && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 rounded-lg bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {selectedFile.name}
                      </p>
                      <Badge variant="success" className="text-[10px] shrink-0">
                        Extracted
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>{formatBytes(selectedFile.size)}</span>
                      <span>•</span>
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
                    leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                  >
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    title="Remove file"
                    className="text-slate-400 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Editable Extracted Text Preview Accordion / Box */}
              <div className="border-t border-slate-800/80 pt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-300">
                    <Edit3 className="h-3.5 w-3.5 text-indigo-400" />
                    Review & Edit Extracted Resume Content
                  </span>
                  <span>{wordCount} words</span>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => onRawTextChange(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                  placeholder="Extracted text preview..."
                />
              </div>
            </div>
          )}

          {/* Extraction Error */}
          {extractError && (
            <div className="p-3.5 rounded-lg border border-red-900/60 bg-red-950/30 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-200">Document Extraction Error</p>
                <p className="mt-0.5 leading-relaxed text-red-300/90">{extractError}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Manual Text Paste View */
        <div className="space-y-2">
          <textarea
            value={rawText}
            onChange={(e) => onRawTextChange(e.target.value)}
            placeholder="Paste your resume text here (Work experience, technical skills, projects, and education)..."
            rows={9}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/80 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
          />
          <div className="flex justify-between items-center text-xs text-slate-400 px-1">
            <span className={charCount >= 50 ? 'text-emerald-400' : 'text-slate-500'}>
              {charCount >= 50
                ? `✓ Ready (${charCount.toLocaleString()} chars, ${wordCount} words)`
                : `Minimum 50 characters required (${charCount}/50)`}
            </span>
            <span className="text-slate-500">Plain text format</span>
          </div>
        </div>
      )}

      {/* Main Validation Error */}
      {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
    </div>
  );
};

import React, { useRef, useState } from 'react';
import { UploadCloud, FileImage, Trash2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, Callout } from '../shared/index.js';

export default function UploadPanel({
  uploadedFile,
  filePreviewUrl,
  onFileSelect,
  onFileRemove,
  onLoadSample,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSet = (file) => {
    setErrorMsg('');
    if (!file) return;

    // Reject non-image files
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Invalid format. Please upload a standard PNG or JPEG chest radiograph.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File exceeds 25MB limit.');
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSet(e.target.files[0]);
    }
  };

  return (
    <Card padding="p-4" className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Image Ingestion & Validation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload single-view frontal chest radiograph (PA/AP)
          </p>
        </div>
        <button
          onClick={onLoadSample}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Load Real Test Radiograph
        </button>
      </div>

      {/* Upload Dropzone or File Preview Card */}
      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Click to upload or drag & drop chest X-ray
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            PNG or JPEG up to 25MB (512x512 recommended)
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-start gap-3">
            {filePreviewUrl ? (
              <img
                src={filePreviewUrl}
                alt="Uploaded Preview"
                className="w-20 h-20 rounded-lg object-cover border border-slate-300 dark:border-slate-600 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 flex-shrink-0">
                <FileImage className="w-8 h-8" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validated & Ready</span>
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {uploadedFile.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • {uploadedFile.type || 'image/png'}
              </p>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                <span>View: PA Frontal</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-1.5 px-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Replace Image
            </button>
            <button
              onClick={onFileRemove}
              className="py-1.5 px-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 text-xs font-medium hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <Callout icon={AlertCircle} variant="error" className="mt-2.5">
          {errorMsg}
        </Callout>
      )}

      {/* Medical Format Notes */}
      <div className="mt-3 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-start gap-1.5">
          <span className="text-indigo-500 font-bold">•</span>
          <span>DICOM preview requires DICOM viewer integration — not yet available in current build.</span>
        </div>
        <div className="flex items-start gap-1.5">
          <span className="text-indigo-500 font-bold">•</span>
          <span>Automatic normalization (CLAHE + min-max stretch) will be applied across 5 model views.</span>
        </div>
      </div>
    </Card>
  );
}

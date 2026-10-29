import React, { useRef, useState } from 'react';
import { UploadCloud, FileImage, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, Callout } from '../shared/index.js';

export default function UploadPanel({ uploadedFile, filePreviewUrl, onFileSelect, onFileRemove }) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const validateAndSet = file => {
    setErrorMsg('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) return setErrorMsg('Upload a PNG or JPEG chest radiograph.');
    if (file.size > 25 * 1024 * 1024) return setErrorMsg('File exceeds 25MB limit.');
    onFileSelect(file);
  };

  const handleDrop = event => {
    event.preventDefault();
    setIsDragging(false);
    validateAndSet(event.dataTransfer.files?.[0]);
  };

  return (
    <Card padding="p-4" className="flex flex-col h-full min-h-0">
      <div className="mb-3"><h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Image Ingestion & Validation</h2><p className="text-xs text-slate-500 dark:text-slate-400">Upload single-view frontal chest radiograph (PA/AP)</p></div>
      {!uploadedFile ? (
        <div onDragOver={event=>{event.preventDefault();setIsDragging(true);}} onDragLeave={()=>setIsDragging(false)} onDrop={handleDrop} onClick={()=>fileInputRef.current?.click()} className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer ${isDragging?'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20':'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'}`}>
          <UploadCloud className="w-6 h-6 mb-3 text-indigo-500"/>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Click to upload or drag & drop chest X-ray</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">PNG or JPEG up to 25MB</p>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={event=>validateAndSet(event.target.files?.[0])} className="hidden"/>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-start gap-3">
            {filePreviewUrl ? <img src={filePreviewUrl} alt="Uploaded radiograph preview" className="w-20 h-20 rounded-lg object-cover border border-slate-300 dark:border-slate-600"/> : <FileImage className="w-8 h-8 text-slate-500"/>}
            <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium mb-1"><CheckCircle2 className="w-3.5 h-3.5"/>Validated & Ready</div><p className="text-xs font-semibold truncate">{uploadedFile.name}</p><p className="text-[11px] text-slate-500 mt-0.5">{(uploadedFile.size/1048576).toFixed(2)} MB • {uploadedFile.type}</p></div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button onClick={()=>fileInputRef.current?.click()} className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-600 text-xs">Replace Image</button>
            <button onClick={onFileRemove} className="py-1.5 px-3 rounded-lg text-red-500 border border-red-200 dark:border-red-900/40 text-xs flex items-center gap-1"><Trash2 className="w-3.5 h-3.5"/>Remove</button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={event=>validateAndSet(event.target.files?.[0])} className="hidden"/>
        </div>
      )}
      {errorMsg && <Callout icon={AlertCircle} variant="error" className="mt-2.5">{errorMsg}</Callout>}
      <p className="mt-3 text-[11px] text-slate-500">DICOM preview is not yet supported in this build.</p>
    </Card>
  );
}

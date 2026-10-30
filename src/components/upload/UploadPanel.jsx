import React, { useRef, useState } from 'react';
import { UploadCloud, FileImage, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, Callout } from '../shared/index.js';
import './upload.css';

export default function UploadPanel({ uploadedFile, filePreviewUrl, onFileSelect, onFileRemove, disabled = false }) {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);
  const validateAndSet = file => {
    if (disabled) return;
    setErrorMsg('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) return setErrorMsg('Upload a PNG or JPEG chest radiograph.');
    if (file.size > 20 * 1024 * 1024) return setErrorMsg('File exceeds 20 MiB limit.');
    onFileSelect(file);
  };
  const handleDrop = event => {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) validateAndSet(event.dataTransfer.files?.[0]);
  };
  return <Card padding="p-4" className="upload-panel">
    <div className="upload-heading"><h2>Image Ingestion & Validation</h2><p>Upload single-view frontal chest radiograph (PA/AP)</p></div>
    {!uploadedFile ? <div onDragOver={event=>{if (!disabled) {event.preventDefault();setIsDragging(true);}}} onDragLeave={()=>setIsDragging(false)} onDrop={handleDrop} onClick={()=>!disabled && fileInputRef.current?.click()} aria-disabled={disabled} className={`upload-dropzone ${isDragging?'upload-dropzone--active':''}`}>
      <UploadCloud/><p>{disabled ? 'Analysis in progress…' : 'Click to upload or drag & drop chest X-ray'}</p><span>PNG or JPEG up to 20 MiB</span><input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={event=>{validateAndSet(event.target.files?.[0]);event.target.value='';}} disabled={disabled} hidden/>
    </div> : <div className="upload-selected">
      <div className="upload-file-summary">{filePreviewUrl ? <img src={filePreviewUrl} alt="Uploaded radiograph preview"/> : <FileImage/>}<div><div className="upload-valid"><CheckCircle2/>Validated & Ready</div><p className="upload-filename">{uploadedFile.name}</p><p className="upload-file-meta">{(uploadedFile.size/1048576).toFixed(2)} MB • {uploadedFile.type}</p></div></div>
      <div className="upload-file-actions"><button disabled={disabled} onClick={()=>fileInputRef.current?.click()}>Replace Image</button><button disabled={disabled} onClick={onFileRemove}><Trash2/>Remove</button></div>
      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" onChange={event=>{validateAndSet(event.target.files?.[0]);event.target.value='';}} disabled={disabled} hidden/>
    </div>}
    {errorMsg && <Callout icon={AlertCircle} variant="error" className="upload-error">{errorMsg}</Callout>}
    <p className="upload-footnote">DICOM preview is not yet supported in this build.</p>
  </Card>;
}

import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  RefreshCw,
  FileCheck,
  X,
  FileSpreadsheet
} from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf'
];

const SCAN_STAGES = [
  'Uploading receipt image to secure vault...',
  'Analyzing visual geometry & receipt boundaries...',
  'Running Llama Vision OCR engine...',
  'Extracting vendor, line items & amounts...'
];

const InvoiceScanner = ({ onScanned, onScanningChange }) => {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Rotate through scan stages to provide meaningful feedback
  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setStageIndex(prev => (prev + 1) % SCAN_STAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [scanning]);

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 10MB limit. Please select a smaller receipt.`);
      setFile(null);
      return;
    }

    // Check file type
    const isAllowedType = ALLOWED_MIME_TYPES.includes(selectedFile.type) || 
      selectedFile.name.toLowerCase().endsWith('.pdf') ||
      selectedFile.name.toLowerCase().endsWith('.jpg') ||
      selectedFile.name.toLowerCase().endsWith('.jpeg') ||
      selectedFile.name.toLowerCase().endsWith('.png') ||
      selectedFile.name.toLowerCase().endsWith('.webp');

    if (!isAllowedType) {
      setError('Unsupported file type. Please upload a JPG, PNG, WebP, or PDF receipt.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStageIndex(0);
    setScanning(true);
    if (onScanningChange) onScanningChange(true);
    setError(null);

    const formData = new FormData();
    formData.append('invoice', file);

    try {
      const response = await axios.post('/api/v1/invoices/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      onScanned(response.data.data, response.data.tempFilePath);
    } catch (err) {
      console.error('Scan Error:', err);
      const msg = err.response?.data?.message || err.message || '';
      if (err.response?.status === 429 || msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit')) {
        setError('AI vision service rate limit reached. Please wait 30-60 seconds before trying again.');
      } else if (err.response?.status === 413) {
        setError('Document is too large for the OCR service. Please compress or crop the file.');
      } else {
        setError(msg || 'Failed to extract receipt data. Please verify the image is readable and try again.');
      }
    } finally {
      setScanning(false);
      if (onScanningChange) onScanningChange(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="p-6 sm:p-8 max-w-2xl mx-auto border border-border shadow-token-md transition-colors">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-radius flex items-center justify-center border border-primary/20 shadow-sm flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground font-display">AI Extraction Vault</h2>
              <Badge variant="secondary" className="text-[10px]">Llama Vision</Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Upload vendor receipts or bills to automatically extract financial ledger records.
            </p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div 
        role="button"
        tabIndex={scanning ? -1 : 0}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && !scanning && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-radius p-8 sm:p-10 text-center transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          dragActive 
            ? 'border-primary bg-primary/10 scale-[1.01]' 
            : 'border-border bg-surface-secondary/20 hover:border-primary/50 hover:bg-surface-secondary/40'
        } ${scanning ? 'pointer-events-none opacity-90' : 'cursor-pointer'}`}
        aria-label="Upload receipt dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          id="receipt-file-upload"
          className="hidden"
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
          disabled={scanning}
        />
        
        {scanning ? (
          /* Scanning Laser Animation State */
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="relative w-full max-w-[280px] h-40 border border-border rounded-radius bg-surface overflow-hidden flex items-center justify-center shadow-token-lg">
              <FileText size={52} className="text-primary/20 animate-pulse" />
              {/* Laser line sweep animation */}
              <div className="scanner-laser-line" />
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <Loader2 className="animate-spin text-primary flex-shrink-0" size={18} />
              <span className="text-sm font-bold text-foreground font-display">
                {SCAN_STAGES[stageIndex]}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider animate-pulse">
              Running neural OCR pipeline
            </p>
          </div>
        ) : file ? (
          /* Selected File Preview */
          <div className="flex flex-col items-center justify-center py-4 space-y-3">
            <div className="w-14 h-14 bg-primary/10 text-primary border border-primary/20 rounded-radius flex items-center justify-center shadow-sm">
              {file.name.toLowerCase().endsWith('.pdf') ? <FileSpreadsheet size={28} /> : <FileCheck size={28} />}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground max-w-md truncate font-mono">
                {file.name}
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] font-mono">
                  {formatFileSize(file.size)}
                </Badge>
                <span className="text-xs text-muted-foreground font-medium">Ready for AI Extraction</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors pt-1"
            >
              <X size={14} /> Remove and choose another file
            </button>
          </div>
        ) : (
          /* Empty Dropzone State */
          <div className="flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-surface border border-border text-primary rounded-radius flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-foreground">
              Drag your receipt here or click to browse
            </span>
            <span className="text-xs text-muted-foreground mt-1.5 font-medium">
              Supports JPG, PNG, WebP, and PDF documents (Max 10MB)
            </span>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="mt-4 gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload size={14} /> Choose Document
            </Button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-radius flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            onClick={() => setError(null)}
            className="text-xs h-7 text-destructive hover:bg-destructive/10 p-1"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      {file && !scanning && (
        <div className="flex items-center gap-3 mt-6">
          <Button
            type="button"
            onClick={handleUpload}
            variant="primary"
            size="lg"
            className="flex-1 gap-2 shadow-token-sm"
          >
            <Sparkles size={16} />
            <span>Run AI Vision Extractor</span>
          </Button>
          <Button
            type="button"
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            variant="outline"
            size="lg"
            className="px-4"
            title="Reset file selection"
            aria-label="Reset file selection"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
      )}
    </Card>
  );
};

export default InvoiceScanner;

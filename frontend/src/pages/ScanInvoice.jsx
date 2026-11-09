import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import InvoiceScanner from '../components/InvoiceScanner';
import InvoiceVerification from '../components/InvoiceVerification';
import { Button } from '../components/ui/Button';

// Pure Step Indicator Subcomponent
const StepIndicator = ({ currentStep }) => {
  const steps = [
    { number: 1, label: 'Upload' },
    { number: 2, label: 'AI Extract' },
    { number: 3, label: 'Review & Edit' },
    { number: 4, label: 'Recorded' }
  ];

  return (
    <div className="w-full max-w-xl mx-auto mb-8 bg-card border border-border p-4 rounded-radius flex items-center justify-between shadow-token-sm relative overflow-hidden transition-colors">
      {/* Background connector line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0 max-w-[80%] mx-auto hidden sm:block" />
      
      {steps.map((s) => {
        const isActive = currentStep === s.number;
        const isCompleted = currentStep > s.number;
        return (
          <div key={s.number} className="flex flex-col items-center gap-1.5 z-10 flex-1 relative">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${
              isCompleted 
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                : isActive 
                  ? 'bg-primary border-primary text-primary-foreground shadow-token-md scale-105' 
                  : 'bg-surface border-border text-muted-foreground'
            }`}>
              {isCompleted ? <Check size={14} className="stroke-[3]" /> : s.number}
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider text-center ${
              isActive 
                ? 'text-primary font-extrabold' 
                : isCompleted 
                  ? 'text-emerald-500' 
                  : 'text-muted-foreground'
            }`}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const ScanInvoice = ({ scanResult, tempPath, onScanned, onComplete, onCancel }) => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Derived current step (no effect or synchronous setState required!)
  const currentStep = isSaving ? 4 : scanResult ? 3 : isScanning ? 2 : 1;

  // Crucial: Handle completion after successful single database save
  const handleScanComplete = (savedData) => {
    // 1. Clear session state in parent
    onComplete();

    // 2. Extract valid invoice ID from the real backend response
    const targetInvoiceId = savedData?._id || savedData?.id;
    const vendorName = savedData?.vendorName || savedData?.vendor?.name || savedData?.vendor || 'Vendor';

    // 3. Direct navigation to /invoices with auto-opening view state and success toast!
    // (Never navigates to /generate to prevent duplicate creation)
    navigate('/invoices', { 
      state: { 
        viewInvoiceId: targetInvoiceId, 
        toastMessage: `Receipt for ${vendorName} verified and recorded into ledger!`,
        toastType: 'success'
      } 
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 w-full min-w-0 max-w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight">
              AI Receipt Scanner
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              <Sparkles size={11} /> Neural OCR
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Automate financial document capture and metadata extraction using Llama Vision OCR.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => navigate('/invoices')}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
        >
          <ArrowLeft size={14} /> Back to Invoices
        </Button>
      </div>

      {/* Visual Step Indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Main Workflow Area */}
      <div className="max-w-4xl mx-auto w-full">
        {scanResult ? (
          <InvoiceVerification 
            data={scanResult} 
            tempFilePath={tempPath} 
            onComplete={handleScanComplete}
            onCancel={() => {
              onCancel();
              setIsSaving(false);
            }}
            onSavingChange={(saving) => {
              setIsSaving(saving);
            }}
          />
        ) : (
          <InvoiceScanner 
            onScanned={onScanned}
            onScanningChange={(scanning) => {
              setIsScanning(scanning);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ScanInvoice;

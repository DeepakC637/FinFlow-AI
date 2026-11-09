import { useState, useMemo } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Printer, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Building2, 
  User, 
  FileText, 
  CreditCard, 
  Receipt,
  AlertCircle,
  Eye,
  Edit3
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '../components/ui';

const TAX_PRESETS = [0, 5, 12, 18, 28];
const PAYMENT_METHODS = ['Bank Transfer', 'UPI / QR Code', 'Credit / Debit Card', 'Net Banking', 'Cash / Cheque'];

const InvoiceGenerator = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editInvoice;
  const isEditMode = Boolean(editData);

  // Notifications & UI states
  const [toast, setToast] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'
  const [validationErrors, setValidationErrors] = useState({});

  // 1. Merchant / Shop Details
  const [shopName, setShopName] = useState(() => editData?.vendor?.name || editData?.vendorName || editData?.vendor || '');
  const [shopAddress, setShopAddress] = useState(() => editData?.vendor?.address || editData?.shopAddress || '');
  const [contactInfo, setContactInfo] = useState(() => editData?.vendor?.contact || editData?.contactInfo || '');
  const [bankDetails, setBankDetails] = useState(() => editData?.bankDetails || '');
  const [accountNumber, setAccountNumber] = useState(() => editData?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(() => editData?.ifscCode || '');

  // 2. Invoice Meta Details
  const [invoiceNumber] = useState(() => {
    if (editData?.invoiceNumber) return editData.invoiceNumber;
    if (editData?._id) return editData._id;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `INV-${dateStr}-${randomNum}`;
  });

  const [date, setDate] = useState(() => {
    if (editData?.date) {
      return editData.date.split('T')[0];
    }
    return new Date().toISOString().slice(0, 10);
  });

  const [dueDate, setDueDate] = useState(() => {
    if (editData?.dueDate) {
      return editData.dueDate.split('T')[0];
    }
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  const [paymentMethod, setPaymentMethod] = useState(() => editData?.paymentMethod || 'Bank Transfer');
  const [invoiceType, setInvoiceType] = useState(() => editData?.type || 'Income');

  // 3. Client Details
  const [customerName, setCustomerName] = useState(() => editData?.user?.name || editData?.customerName || editData?.user || '');
  const [customerAddress, setCustomerAddress] = useState(() => editData?.customerAddress || '');
  const [customerContact, setCustomerContact] = useState(() => editData?.customerContact || editData?.customerEmail || '');

  // 4. Line Items
  const [items, setItems] = useState(() => {
    if (editData?.items && Array.isArray(editData.items) && editData.items.length > 0) {
      return editData.items.map(item => ({
        name: item.description || item.name || '',
        qty: item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 1),
        price: item.price !== undefined ? item.price : 0,
      }));
    }
    if (editData?.totalAmount || editData?.amount) {
      const raw = editData.amount || editData.totalAmount || 0;
      const clean = Number(String(raw).replace(/,/g, '')) || 0;
      return [{ name: 'Professional Services', qty: 1, price: clean }];
    }
    return [{ name: '', qty: 1, price: 0 }];
  });

  // 5. Tax
  const [taxRate, setTaxRate] = useState(() => (editData?.tax !== undefined ? String(editData.tax) : '0'));

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = Number(item.qty) || 0;
      const p = Number(item.price) || 0;
      return sum + (q * p);
    }, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    const rate = Number(taxRate) || 0;
    return (subtotal * rate) / 100;
  }, [subtotal, taxRate]);

  const grandTotal = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  // Form manipulation
  const handleAddItem = () => {
    setItems(prev => [...prev, { name: '', qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      if (field === 'qty') {
        const sanitized = value.replace(/[^0-9]/g, '');
        updated[index] = { ...updated[index], qty: sanitized };
      } else if (field === 'price') {
        const sanitized = value.replace(/[^0-9.]/g, '');
        updated[index] = { ...updated[index], price: sanitized };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });

    if (validationErrors.items) {
      setValidationErrors(prev => ({ ...prev, items: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!shopName.trim()) {
      errors.shopName = 'Merchant / Business name is required';
    }
    if (!customerName.trim()) {
      errors.customerName = 'Client / Customer name is required';
    }
    if (!date) {
      errors.date = 'Issue date is required';
    }

    const itemErrors = [];
    let hasItemError = false;
    items.forEach((it, idx) => {
      const err = {};
      if (!it.name.trim()) {
        err.name = 'Description is required';
        hasItemError = true;
      }
      const q = Number(it.qty);
      if (isNaN(q) || q <= 0) {
        err.qty = 'Must be > 0';
        hasItemError = true;
      }
      const p = Number(it.price);
      if (isNaN(p) || p < 0) {
        err.price = 'Must be ≥ 0';
        hasItemError = true;
      }
      itemErrors[idx] = err;
    });

    if (hasItemError) {
      errors.items = itemErrors;
    }

    if (grandTotal <= 0) {
      errors.total = 'Invoice total must be greater than ₹0';
    }

    setValidationErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const handleSendInvoice = async () => {
    if (isSaving) return;

    const { isValid, errors } = validateForm();
    if (!isValid) {
      const firstMsg = errors.shopName || 
                       errors.customerName || 
                       (errors.items ? 'Please complete all line item descriptions with valid quantities and prices' : null) || 
                       errors.total || 
                       'Please fill in all required fields';
      setToast({ message: firstMsg, type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        vendorName: shopName.trim(),
        date: date,
        dueDate: dueDate,
        items: items.map(item => ({
          description: item.name.trim(),
          quantity: Number(item.qty) || 1,
          price: Number(item.price) || 0,
          total: (Number(item.qty) || 1) * (Number(item.price) || 0)
        })),
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round(grandTotal * 100) / 100,
        type: invoiceType,
        category: invoiceType === 'Income' ? 'Client Billing' : 'Commercial Invoice'
      };

      const targetId = editData?._id || editData?.id;
      if (isEditMode && targetId) {
        await axios.put(`/api/v1/invoices/${targetId}`, { ...payload, id: targetId }, { withCredentials: true });
      } else {
        await axios.post('/api/v1/invoices/confirm', payload, { withCredentials: true });
      }

      navigate('/invoices', { 
        state: { 
          toastMessage: isEditMode 
            ? `Invoice #${invoiceNumber} successfully updated and recorded!` 
            : `Invoice #${invoiceNumber} successfully created and saved to records!`, 
          toastType: 'success' 
        } 
      });
    } catch (err) {
      console.error('Failed to save invoice:', err);
      const errMsg = err.response?.data?.message || 'Failed to save invoice to database';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 invoice-workstation-container max-w-7xl mx-auto px-4 sm:px-6">
      {/* Scoped Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-paper, #printable-paper * {
            visibility: visible !important;
          }
          #printable-paper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 32px !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/invoices')}
              leftIcon={ArrowLeft}
              className="text-muted-foreground hover:text-foreground -ml-2 h-8 px-2"
            >
              Invoices
            </Button>
            <span className="text-muted-foreground text-xs">•</span>
            {isEditMode ? (
              <Badge variant="primary">
                Edit Mode: {invoiceNumber}
              </Badge>
            ) : (
              <Badge variant="secondary">
                New Invoice Draft
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-display">
            Invoice Workstation
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Design itemized invoices, merchant details, and preview billing documents in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button 
            onClick={handlePrint}
            variant="secondary"
            size="md"
            leftIcon={Printer}
            className="text-xs sm:text-sm"
          >
            Print Document
          </Button>
          <Button 
            onClick={handleSendInvoice}
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={Save}
            className="text-xs sm:text-sm shadow-md"
          >
            {isEditMode ? 'Update & Confirm' : 'Confirm & Save'}
          </Button>
        </div>
      </div>

      {/* Mobile Tab Switcher (< lg screens) */}
      <div className="lg:hidden flex rounded-radius bg-surface-secondary p-1 border border-border no-print">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mobileTab === 'editor'
              ? 'bg-surface text-foreground shadow-token'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Edit3 size={14} />
          Editor Form
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            mobileTab === 'preview'
              ? 'bg-surface text-foreground shadow-token'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye size={14} />
          Live Preview
          <span className="text-[10px] font-mono text-primary font-bold">₹{grandTotal.toLocaleString('en-IN')}</span>
        </button>
      </div>

      {/* Main Grid: Editor on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ============================================================== */}
        {/* LEFT PANEL: Editor Forms */}
        {/* ============================================================== */}
        <div className={`lg:col-span-7 space-y-6 no-print ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          
          {/* Section 1: Merchant & Bank Information */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Building2 size={16} />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-display">1. Merchant & Bank Information</CardTitle>
                  <p className="text-xs text-muted-foreground">Your business identity and remittance wire coordinates</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Merchant / Business Name <span className="text-destructive">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. FinFlow Global Merchant LLC" 
                    className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all ${
                      validationErrors.shopName 
                        ? 'border-destructive focus:ring-2 focus:ring-destructive/20' 
                        : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                    }`}
                    value={shopName}
                    onChange={(e) => {
                      setShopName(e.target.value);
                      if (validationErrors.shopName) {
                        setValidationErrors(prev => ({ ...prev, shopName: undefined }));
                      }
                    }}
                  />
                  {validationErrors.shopName && (
                    <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {validationErrors.shopName}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Merchant Address
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 101 Innovation Blvd, Suite 400, Financial District" 
                    className="w-full bg-surface text-foreground placeholder:text-muted-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all"
                    value={shopAddress}
                    onChange={(e) => setShopAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Merchant Contact (Email / Phone)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. billing@finflow.io or +1 (555) 019-2834" 
                    className="w-full bg-surface text-foreground placeholder:text-muted-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Bank Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Silicon Valley Bank / HDFC" 
                    className="w-full bg-surface text-foreground placeholder:text-muted-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all"
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Account Number
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 9840 2201 4450 1192" 
                    className="w-full bg-surface text-foreground placeholder:text-muted-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all font-mono"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Routing / IFSC / SWIFT Code
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. SVBLUS33 / HDFC0001234" 
                    className="w-full bg-surface text-foreground placeholder:text-muted-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all font-mono"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Invoice & Classification Settings */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <FileText size={16} />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-display">2. Invoice Settings & Classification</CardTitle>
                  <p className="text-xs text-muted-foreground">Document serial identifier, ledger classification, and timeline</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Invoice Serial Number
                  </label>
                  <div className="flex items-center bg-surface-secondary border border-border rounded-radius px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-primary">
                    {invoiceNumber}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Ledger Classification
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-secondary border border-border rounded-radius">
                    <button 
                      type="button"
                      onClick={() => setInvoiceType('Income')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        invoiceType === 'Income' 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Income (Receivable)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setInvoiceType('Expense')}
                      className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                        invoiceType === 'Expense' 
                          ? 'bg-rose-600 text-white shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Expense (Payable)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Issue Date <span className="text-destructive">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="w-full bg-surface text-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Due Date
                  </label>
                  <input 
                    type="date" 
                    className="w-full bg-surface text-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map(method => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`px-3 py-2 text-xs font-semibold rounded-radius border text-left transition-all ${
                          paymentMethod === method
                            ? 'bg-primary/10 border-primary text-primary font-bold'
                            : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-surface-secondary'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Client Details */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <User size={16} />
                </div>
                <div>
                  <CardTitle className="text-base font-bold font-display">3. Client (Billed To) Details</CardTitle>
                  <p className="text-xs text-muted-foreground">Recipient identity, billing address, and point of contact</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Client Full Name <span className="text-destructive">*</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Johnathan Doe or Enterprise Client Corp" 
                    className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all ${
                      validationErrors.customerName 
                        ? 'border-destructive focus:ring-2 focus:ring-destructive/20' 
                        : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                    }`}
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (validationErrors.customerName) {
                        setValidationErrors(prev => ({ ...prev, customerName: undefined }));
                      }
                    }}
                  />
                  {validationErrors.customerName && (
                    <p className="text-[11px] text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> {validationErrors.customerName}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Client Billing Address
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Suite 8B, Tech Park Towers, Bengaluru 560100" 
                    className="w-full bg-surface text-foreground placeholder:text-muted-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-foreground font-display mb-1.5">
                    Client Contact (Email / Phone)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. accounts@clientcorp.com or +91 98765 43210" 
                    className="w-full bg-surface text-foreground placeholder:text-muted-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3.5 py-2.5 text-xs sm:text-sm outline-none transition-all"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Line Items Grid & Taxes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold font-display">4. Line Items Grid</CardTitle>
                    <p className="text-xs text-muted-foreground">Itemized billable services, quantities, rates, and tax</p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  variant="outline"
                  size="sm"
                  leftIcon={Plus}
                  className="text-xs"
                >
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
              <div className="space-y-3">
                {items.map((item, index) => {
                  const rowErr = validationErrors.items?.[index];
                  const itemTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);

                  return (
                    <div 
                      key={index} 
                      className="p-3 sm:p-3.5 bg-surface-secondary/70 border border-border rounded-radius space-y-2.5 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row gap-2.5 items-start sm:items-center">
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            Item #{index + 1} Description <span className="text-destructive">*</span>
                          </label>
                          <input 
                            type="text" 
                            placeholder="e.g. Cloud Architecture Consulting" 
                            className={`w-full bg-surface text-foreground placeholder:text-muted-foreground border rounded-radius px-3 py-2 text-xs sm:text-sm outline-none transition-all ${
                              rowErr?.name
                                ? 'border-destructive focus:ring-2 focus:ring-destructive/20'
                                : 'border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring'
                            }`}
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          />
                          {rowErr?.name && (
                            <p className="text-[10px] text-destructive mt-0.5">{rowErr.name}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <div className="w-20 sm:w-20">
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                              Qty
                            </label>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              className={`w-full bg-surface text-foreground border rounded-radius px-2.5 py-2 text-xs sm:text-sm text-center font-mono outline-none transition-all ${
                                rowErr?.qty
                                  ? 'border-destructive'
                                  : 'border-input focus:border-primary focus:ring-2 focus:ring-ring'
                              }`}
                              value={item.qty}
                              onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                            />
                          </div>

                          <div className="w-28 sm:w-28">
                            <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                              Price (₹)
                            </label>
                            <input 
                              type="text" 
                              inputMode="numeric"
                              className={`w-full bg-surface text-foreground border rounded-radius px-2.5 py-2 text-xs sm:text-sm text-right font-mono outline-none transition-all ${
                                rowErr?.price
                                  ? 'border-destructive'
                                  : 'border-input focus:border-primary focus:ring-2 focus:ring-ring'
                              }`}
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            />
                          </div>

                          <div className="w-24 sm:w-28 text-right hidden sm:block">
                            <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                              Total
                            </span>
                            <span className="block py-2 text-xs sm:text-sm font-mono font-bold text-foreground">
                              ₹{itemTotal.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="pt-5 sm:pt-4">
                            <button 
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              disabled={items.length === 1}
                              aria-label={`Remove item ${index + 1}`}
                              className="p-2 text-destructive hover:bg-destructive/10 rounded-radius disabled:opacity-30 disabled:pointer-events-none transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Row Total */}
                      <div className="flex sm:hidden justify-between items-center pt-1 border-t border-border/50 text-xs">
                        <span className="text-muted-foreground font-medium">Row Total:</span>
                        <span className="font-mono font-bold text-foreground">₹{itemTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tax & Summary Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border mt-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-foreground font-display">
                    Tax / GST Rate (%)
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {TAX_PRESETS.map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setTaxRate(String(rate))}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                          taxRate === String(rate)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-surface border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Custom tax %" 
                      className="w-full bg-surface text-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius px-3 py-2 text-xs font-mono outline-none"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value.replace(/[^0-9.]/g, ''))}
                    />
                    <span className="absolute right-3 top-2 text-xs text-muted-foreground font-mono">%</span>
                  </div>
                </div>

                {/* Calculation Summary Card */}
                <div className="p-4 rounded-radius bg-surface-secondary/80 border border-border space-y-2 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="font-medium">Pre-tax Subtotal:</span>
                    <span className="font-mono font-bold text-foreground">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="font-medium">Tax / GST ({taxRate || 0}%):</span>
                    <span className="font-mono font-bold text-foreground">₹{taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground font-display">Net Payable Total:</span>
                    <span className="text-lg font-black text-primary font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {validationErrors.total && (
                    <p className="text-[11px] text-destructive text-right font-medium">
                      {validationErrors.total}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ============================================================== */}
        {/* RIGHT PANEL: Live Document Preview */}
        {/* ============================================================== */}
        <div className={`lg:col-span-5 flex flex-col items-center w-full ${mobileTab === 'editor' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between w-full mb-3 no-print">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <Eye size={14} className="text-primary" /> Live Document Preview
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Auto-syncs as you type
            </span>
          </div>
          
          {/* Printable Invoice Sheet */}
          <div 
            id="printable-paper" 
            className="w-full bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200 min-h-[680px] flex flex-col justify-between relative overflow-hidden"
          >
            {/* Stamp indicator */}
            <div className="absolute top-24 right-6 border-4 border-dashed border-indigo-600/30 text-indigo-600/30 rounded-full px-4 py-1.5 font-black text-xs uppercase tracking-widest select-none rotate-12 pointer-events-none">
              {isEditMode ? 'FinFlow Revised' : 'FinFlow Draft'}
            </div>

            <div className="space-y-6">
              {/* Header: Merchant info & Invoice Title */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <h2 className="text-xl font-black tracking-tight text-slate-950 font-display">
                    {shopName || 'FinFlow Merchant LLC'}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium whitespace-pre-line leading-relaxed max-w-[260px]">
                    {shopAddress || '101 Global Boulevard, Suite 500\nCity Center, Financial District'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold font-mono">
                    {contactInfo || 'billing@finflowmerchant.com'}
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                    {invoiceType} Invoice
                  </div>
                  <h3 className="text-base font-black text-slate-900 font-mono tracking-tight">
                    {invoiceNumber}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-medium">
                    <span>Issue: </span>
                    <strong className="text-slate-800 font-mono">{date}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    <span>Due: </span>
                    <strong className="text-slate-800 font-mono">{dueDate}</strong>
                  </div>
                </div>
              </div>

              {/* Billed To / Client section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-200 text-xs">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Billed To (Client)
                  </p>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {customerName || 'John Doe Enterprises'}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5 whitespace-pre-line leading-relaxed max-w-[220px]">
                    {customerAddress || 'Client Registered Business Billing Address\nMain Street, Tech Park'}
                  </p>
                  {customerContact && (
                    <p className="text-[10px] text-slate-500 font-medium mt-1 font-mono">
                      {customerContact}
                    </p>
                  )}
                </div>

                <div className="sm:text-right space-y-1 text-[11px]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Payment Terms
                  </p>
                  <p className="font-bold text-slate-800">
                    Method: {paymentMethod}
                  </p>
                  <p className="text-slate-500 font-medium">
                    Ledger: <span className="font-bold text-indigo-600">{invoiceType}</span>
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-2 pr-3">Item & Description</th>
                      <th className="py-2 px-2 text-center">Qty</th>
                      <th className="py-2 px-2 text-right">Price</th>
                      <th className="py-2 pl-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {items.map((item, idx) => (
                      <tr key={idx} className="text-[11px]">
                        <td className="py-2.5 pr-3 max-w-[160px] truncate font-medium text-slate-900" title={item.name}>
                          {item.name || 'Professional Services Delivery'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono">
                          {item.qty || 1}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">
                          ₹{Number(item.price || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 pl-3 text-right font-mono font-bold text-slate-900">
                          ₹{((Number(item.qty) || 1) * (Number(item.price) || 0)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Document Totals & Remittance Wire */}
            <div className="pt-6 border-t border-slate-200 mt-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="text-[10px] text-slate-500 font-medium max-w-[220px] space-y-1">
                  <p className="font-black text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <CreditCard size={12} className="text-indigo-600" /> Remittance Wire
                  </p>
                  <p className="font-mono">Account: {accountNumber || '1029 3840 4721'}</p>
                  <p>Bank: {bankDetails || 'Global Commerce Central'}</p>
                  <p className="font-mono">Routing / IFSC: {ifscCode || 'CHASIN55X'}</p>
                </div>

                <div className="w-full sm:w-56 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Pre-tax Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax / GST ({taxRate}%):</span>
                    <span className="font-mono font-semibold text-slate-900">₹{taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-950 font-bold">
                    <span className="text-xs uppercase tracking-wider">Net Payable:</span>
                    <span className="text-base font-black text-indigo-600 font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Document Footer Note */}
              <div className="text-center pt-4 border-t border-slate-100 flex flex-col items-center gap-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Thank you for your business
                </p>
                <p className="text-[9px] text-slate-400 font-medium">
                  FinFlow Secure Invoicing Engine • Standard Commercial Terms Apply
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default InvoiceGenerator;

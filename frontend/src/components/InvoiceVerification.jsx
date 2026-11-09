import { useState, useMemo } from 'react';
import { 
  Save, 
  X, 
  Edit3, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Calculator
} from 'lucide-react';
import axios from 'axios';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

const CATEGORY_OPTIONS = [
  'Office Supplies',
  'Software & SaaS',
  'Infrastructure',
  'Travel & Transit',
  'Utilities & Bills',
  'Food & Meals',
  'Marketing & Growth',
  'Hardware',
  'Other'
];

const InvoiceVerification = ({ data, tempFilePath, onComplete, onCancel, onSavingChange }) => {
  // Normalize initial data
  const initialItems = useMemo(() => {
    if (Array.isArray(data?.items) && data.items.length > 0) {
      return data.items.map((item, idx) => ({
        id: item._id || item.id || `item-${idx}`,
        description: item.description || 'Receipt Item',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price || item.unit_price) || 0,
        total: Number(item.total) || ((Number(item.quantity) || 1) * (Number(item.price || item.unit_price) || 0))
      }));
    }
    return [];
  }, [data]);

  const [formData, setFormData] = useState({
    vendorName: data?.vendorName || data?.vendor?.name || data?.vendor || '',
    date: data?.date ? new Date(data.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    category: data?.category || 'Office Supplies',
    totalAmount: data?.totalAmount || data?.amount || 0,
    taxAmount: data?.taxAmount || data?.tax || 0,
    type: data?.type || 'Expense',
    status: data?.status || 'Paid',
    items: initialItems
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  // Compute calculated line items subtotal
  const itemsSum = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  }, [formData.items]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Line Items Handlers
  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      const targetItem = { ...updatedItems[index], [field]: value };
      
      if (field === 'quantity' || field === 'price') {
        const qty = field === 'quantity' ? Number(value) || 0 : targetItem.quantity;
        const prc = field === 'price' ? Number(value) || 0 : targetItem.price;
        targetItem.total = parseFloat((qty * prc).toFixed(2));
      }

      updatedItems[index] = targetItem;
      return { ...prev, items: updatedItems };
    });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          description: '',
          quantity: 1,
          price: 0,
          total: 0
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSyncTotalWithItems = () => {
    if (itemsSum > 0) {
      setFormData(prev => ({ ...prev, totalAmount: itemsSum }));
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor / Entity name is required';
    }
    if (!formData.date) {
      newErrors.date = 'Invoice date is required';
    }
    const totalNum = Number(formData.totalAmount);
    if (isNaN(totalNum) || totalNum <= 0) {
      newErrors.totalAmount = 'Total value must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Confirm and Save to Database (Exactly once!)
  const handleSave = async () => {
    if (saving) return; // Prevent duplicate clicks
    if (!validateForm()) return;

    setSaving(true);
    setApiError(null);
    if (onSavingChange) onSavingChange(true);

    const payload = {
      vendorName: formData.vendorName.trim(),
      date: formData.date,
      totalAmount: Number(formData.totalAmount),
      taxAmount: Number(formData.taxAmount || 0),
      category: formData.category || 'Other',
      type: formData.type || 'Expense',
      status: formData.status || 'Paid',
      items: formData.items.length > 0 
        ? formData.items.map(it => ({
            description: it.description || 'Item',
            quantity: Number(it.quantity) || 1,
            price: Number(it.price) || 0,
            total: Number(it.total) || 0
          }))
        : [{
            description: formData.vendorName.trim(),
            quantity: 1,
            price: Number(formData.totalAmount),
            total: Number(formData.totalAmount)
          }],
      tempFilePath
    };

    try {
      const response = await axios.post('/api/v1/invoices/confirm', payload, { 
        withCredentials: true 
      });
      
      const savedInvoice = response.data?.data || payload;
      // Trigger completion callback with saved ledger record
      onComplete(savedInvoice);
    } catch (err) {
      console.error('Confirmation Error:', err);
      setApiError(err.response?.data?.message || err.message || 'Failed to save confirmed invoice to ledger. Please try again.');
      if (onSavingChange) onSavingChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 max-w-4xl mx-auto border border-border shadow-token-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 text-primary border border-primary/20 rounded-radius flex items-center justify-center shadow-sm">
            <Edit3 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground font-display">Review & Verify Ledger</h2>
              <Badge variant="outline" className="text-[10px] gap-1 text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle2 size={12} /> AI Extracted
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Review OCR-captured metadata, make any corrections, and commit to the financial ledger.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={onCancel}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1.5"
          disabled={saving}
        >
          <X size={16} /> Discard Scan
        </Button>
      </div>

      {/* API Error Alert */}
      {apiError && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold rounded-radius flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{apiError}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setApiError(null)}
            className="text-xs text-destructive hover:bg-destructive/10 p-1 h-7"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Main Metadata Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Vendor & Date & Category */}
        <div className="space-y-4">
          {/* Vendor Name */}
          <div className="space-y-1.5">
            <label htmlFor="verify-vendor" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Vendor / Payee Entity *
            </label>
            <input
              id="verify-vendor"
              type="text"
              name="vendorName"
              value={formData.vendorName}
              onChange={handleChange}
              disabled={saving}
              placeholder="e.g. AWS Cloud, Office Depot"
              className={`w-full bg-background border rounded-radius px-3.5 py-2.5 text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                errors.vendorName ? 'border-destructive' : 'border-input'
              }`}
            />
            {errors.vendorName && (
              <p className="text-[11px] font-semibold text-destructive">{errors.vendorName}</p>
            )}
          </div>

          {/* Invoice Date */}
          <div className="space-y-1.5">
            <label htmlFor="verify-date" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Invoice Date *
            </label>
            <input
              id="verify-date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              disabled={saving}
              className={`w-full bg-background border rounded-radius px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                errors.date ? 'border-destructive' : 'border-input'
              }`}
            />
            {errors.date && (
              <p className="text-[11px] font-semibold text-destructive">{errors.date}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label htmlFor="verify-category" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Expense Category
            </label>
            <select
              id="verify-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={saving}
              className="w-full bg-background border border-input rounded-radius px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            >
              {CATEGORY_OPTIONS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Column: Total Amount & Tax & Type */}
        <div className="space-y-4">
          {/* Total Value */}
          <div className="space-y-1.5">
            <label htmlFor="verify-total" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                ₹
              </span>
              <input
                id="verify-total"
                type="number"
                step="0.01"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                disabled={saving}
                className={`w-full bg-background border rounded-radius pl-8 pr-3.5 py-2.5 text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                  errors.totalAmount ? 'border-destructive' : 'border-input'
                }`}
              />
            </div>
            {errors.totalAmount && (
              <p className="text-[11px] font-semibold text-destructive">{errors.totalAmount}</p>
            )}
          </div>

          {/* Tax Amount */}
          <div className="space-y-1.5">
            <label htmlFor="verify-tax" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Tax / VAT Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">
                ₹
              </span>
              <input
                id="verify-tax"
                type="number"
                step="0.01"
                name="taxAmount"
                value={formData.taxAmount}
                onChange={handleChange}
                disabled={saving}
                className="w-full bg-background border border-input rounded-radius pl-8 pr-3.5 py-2.5 text-xs font-mono font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>

          {/* Ledger Type Toggle */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Transaction Classification
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'Expense' }))}
                disabled={saving}
                className={`py-2 px-3 rounded-radius text-xs font-bold transition-all border ${
                  formData.type === 'Expense'
                    ? 'bg-destructive/10 border-destructive/30 text-destructive shadow-sm'
                    : 'bg-surface border-border text-muted-foreground hover:bg-surface-secondary'
                }`}
              >
                Expense (Outflow)
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'Income' }))}
                disabled={saving}
                className={`py-2 px-3 rounded-radius text-xs font-bold transition-all border ${
                  formData.type === 'Income'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-sm'
                    : 'bg-surface border-border text-muted-foreground hover:bg-surface-secondary'
                }`}
              >
                Income (Receivable)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table Section */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
              Itemized Line Details
              <Badge variant="secondary" className="text-[10px] font-mono">
                {formData.items.length} {formData.items.length === 1 ? 'item' : 'items'}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Review individual items extracted by AI Vision. You can add, edit, or remove rows.
            </p>
          </div>

          <Button
            type="button"
            onClick={handleAddItem}
            variant="outline"
            size="sm"
            disabled={saving}
            className="gap-1.5 text-xs"
          >
            <Plus size={14} /> Add Line Item
          </Button>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto rounded-radius border border-border">
          <table className="w-full text-left text-xs border-collapse min-w-[580px]">
            <thead>
              <tr className="bg-surface-secondary/40 text-muted-foreground border-b border-border text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-center w-20">Qty</th>
                <th className="py-3 px-4 text-right w-28">Unit Price</th>
                <th className="py-3 px-4 text-right w-32">Total</th>
                <th className="py-3 px-4 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {formData.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-surface-secondary/20">
                  {/* Description Input */}
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      disabled={saving}
                      placeholder="Item description"
                      className="w-full bg-background border border-input rounded-radius px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>

                  {/* Qty Input */}
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      disabled={saving}
                      className="w-full bg-background border border-input rounded-radius px-2 py-1.5 text-xs font-mono text-center text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>

                  {/* Unit Price Input */}
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                      disabled={saving}
                      className="w-full bg-background border border-input rounded-radius px-2.5 py-1.5 text-xs font-mono text-right text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>

                  {/* Line Total */}
                  <td className="py-2 px-4 text-right font-mono font-bold text-foreground">
                    ₹{Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Delete Item */}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={saving}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-radius transition-colors"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}

              {formData.items.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-xs text-muted-foreground italic">
                    No individual line items parsed by AI. Saved as a single consolidated record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Items Subtotal vs Document Total Reconciliation */}
        {formData.items.length > 0 && Math.abs(itemsSum - Number(formData.totalAmount)) > 0.01 && (
          <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-radius flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-warning">
              <Calculator size={16} className="flex-shrink-0" />
              <span>
                Line items total (<strong>₹{itemsSum.toLocaleString('en-IN')}</strong>) differs from Grand Total (<strong>₹{Number(formData.totalAmount).toLocaleString('en-IN')}</strong>).
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncTotalWithItems}
              disabled={saving}
              className="text-xs h-7 text-foreground"
            >
              Sync Grand Total with Items
            </Button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 pt-6 border-t border-border">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          isLoading={saving}
          variant="primary"
          size="lg"
          className="w-full sm:flex-1 gap-2 shadow-token-sm"
        >
          <Save size={16} />
          <span>Confirm & Record to Ledger</span>
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          disabled={saving}
          variant="outline"
          size="lg"
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
};

export default InvoiceVerification;

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Plus, 
  Eye, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Edit,
  Trash2,
  X,
  Printer,
  RefreshCw,
  Scan,
  Layers,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import axios from 'axios';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import Toast from '../components/Toast';

// Top-level subcomponent: Metric Stat Card
const StatCard = ({ title, value, subValue, icon: Icon, iconBg, badge, badgeVariant = 'default' }) => (
  <Card className="p-5 sm:p-6 transition-all duration-200 hover:shadow-token-md border border-border">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2.5 flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-radius flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon size={18} />
          </div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">{title}</p>
        </div>
        <div>
          <h3 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight truncate">
            {value}
          </h3>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {badge && (
              <Badge variant={badgeVariant} className="text-[10px]">
                {badge}
              </Badge>
            )}
            <span className="text-[11px] font-medium text-muted-foreground truncate">{subValue}</span>
          </div>
        </div>
      </div>
    </div>
  </Card>
);

// Top-level subcomponent: Empty State
const EmptyState = ({ title, description, actionLabel, onAction, secondaryActionLabel, onSecondaryAction }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-surface-secondary/20 border border-dashed border-border rounded-radius p-8 my-auto w-full">
    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground mb-3.5 shadow-sm">
      <FileText size={22} />
    </div>
    <p className="text-sm font-bold text-foreground">{title}</p>
    <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed font-medium">
      {description}
    </p>
    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
      {actionLabel && (
        <Button onClick={onAction} size="sm" variant="primary">
          {actionLabel}
        </Button>
      )}
      {secondaryActionLabel && (
        <Button onClick={onSecondaryAction} size="sm" variant="secondary">
          {secondaryActionLabel}
        </Button>
      )}
    </div>
  </div>
);

// Top-level subcomponent: Invoice Detail Modal (Full Bill View)
const InvoiceDetailModal = ({ invoice, onClose, onPrint }) => {
  if (!invoice) return null;

  const totalAmt = Number(invoice.totalAmount || invoice.amount || 0);
  const taxAmt = Number(invoice.tax || invoice.taxAmount || 0);
  const subTotal = totalAmt - taxAmt;
  const vendorName = invoice.vendor?.name || invoice.vendor || 'Vendor Partner';
  const vendorAddress = invoice.vendor?.address || 'Billing Partner Address';
  const customerName = invoice.user?.name || invoice.user || 'Acme Registered Member';
  const formattedDate = invoice.date 
    ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';
  const invoiceIdDisplay = invoice.invoiceNumber || (invoice._id || invoice.id || '').toString().slice(-8).toUpperCase();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-bill-title"
    >
      <div 
        id="invoice-bill-modal" 
        className="w-full max-w-3xl bg-card border border-border rounded-radius shadow-token-xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Header / Actions (Hidden during print) */}
        <div className="p-5 sm:p-6 border-b border-border flex justify-between items-center bg-surface sticky top-0 z-10 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary border border-primary/20 rounded-radius flex items-center justify-center shadow-sm">
              <FileText size={20} />
            </div>
            <div>
              <h3 id="invoice-bill-title" className="text-base font-bold text-foreground font-display">
                Invoice Bill Document
              </h3>
              <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                {invoiceIdDisplay}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={onPrint} 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              title="Print Invoice"
              aria-label="Print Invoice"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print Document</span>
            </Button>
            <button 
              onClick={onClose} 
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface-secondary rounded-radius transition-all"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Bill Content */}
        <div className="p-6 sm:p-10 space-y-8 overflow-y-auto flex-1 bg-card text-foreground" id="invoice-bill">
          {/* Top Billing Entities */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-border">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Billing Entity (From)
                </p>
                <h4 className="text-xl font-bold text-foreground font-display">{vendorName}</h4>
                <p className="text-xs text-muted-foreground font-medium max-w-xs mt-1">{vendorAddress}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Customer Details (To)
                </p>
                <h5 className="text-sm font-bold text-foreground">{customerName}</h5>
                <p className="text-xs text-muted-foreground font-medium">Internal Corporate Account</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-4 w-full sm:w-auto">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Issue Date
                </p>
                <p className="text-xs font-semibold text-foreground font-mono">{formattedDate}</p>
              </div>
              <div className="bg-surface-secondary/40 p-4 rounded-radius border border-border sm:inline-block sm:min-w-[180px]">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Grand Total
                </p>
                <h2 className="text-2xl font-black text-primary font-mono">
                  ₹{totalAmt.toLocaleString('en-IN')}
                </h2>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4">
            <div className="rounded-radius overflow-hidden border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-secondary/50 text-muted-foreground border-b border-border text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, i) => (
                      <tr key={item._id || i} className="font-medium">
                        <td className="py-3.5 px-4 text-foreground">{item.description}</td>
                        <td className="py-3.5 px-4 text-center text-muted-foreground font-mono">{item.quantity || 1}</td>
                        <td className="py-3.5 px-4 text-right text-muted-foreground font-mono">₹{Number(item.price || item.unit_price || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-foreground font-mono">₹{Number(item.total || ((item.quantity || 1) * (item.price || item.unit_price || 0))).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="font-medium">
                      <td className="py-3.5 px-4 text-foreground">{invoice.category || 'Direct Extracted Invoice Document'}</td>
                      <td className="py-3.5 px-4 text-center text-muted-foreground font-mono">1</td>
                      <td className="py-3.5 px-4 text-right text-muted-foreground font-mono">₹{totalAmt.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-foreground font-mono">₹{totalAmt.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Subtotal</span>
                  <span className="font-semibold text-foreground font-mono">₹{subTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Tax / VAT</span>
                  <span className="font-semibold text-foreground font-mono">₹{taxAmt.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Net Total</span>
                  <span className="text-lg font-black text-primary font-mono">₹{totalAmt.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification & System Signature */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Document Status
              </p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={invoice.status === 'Paid' ? 'success' : invoice.status === 'Pending' ? 'warning' : 'secondary'}
                >
                  {invoice.status || 'Verified'}
                </Badge>
                {invoice.type === 'Scanned' && (
                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                    <CheckCircle2 size={14} /> AI Vision Extracted
                  </span>
                )}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Authorization Verification
              </p>
              <div className="w-28 h-0.5 bg-border ml-0 sm:ml-auto mb-1.5" />
              <p className="text-[11px] font-medium text-muted-foreground italic">FinFlow Secured Cloud Record</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface-secondary/40 border-t border-border text-center no-print">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            FinFlow Cloud Document Storage System
          </p>
        </div>
      </div>
    </div>
  );
};

// Top-level subcomponent: Delete Confirmation Modal
const DeleteConfirmationModal = ({ item, isDeleting, onCancel, onConfirm }) => {
  if (!item) return null;

  const vendor = item.vendor?.name || item.vendor || 'Unknown Entity';
  const amount = Number(item.totalAmount || item.amount || 0).toLocaleString('en-IN');
  const invoiceId = item.invoiceNumber || (item._id || item.id || '').toString().slice(-8).toUpperCase();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-invoice-title"
    >
      <div className="w-full max-w-md bg-card border border-border rounded-radius p-6 shadow-token-xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
            <AlertCircle size={22} />
          </div>
          <div>
            <h3 id="delete-invoice-title" className="text-base font-bold text-foreground font-display">
              Delete Invoice Record?
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Are you sure you want to delete invoice <span className="font-mono font-bold text-foreground">{invoiceId}</span> for <strong className="text-foreground">{vendor}</strong> of <span className="font-mono font-bold text-foreground">₹{amount}</span>? This record will be permanently removed.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            size="sm" 
            onClick={onConfirm}
            isLoading={isDeleting}
          >
            Delete Invoice
          </Button>
        </div>
      </div>
    </div>
  );
};

const Invoices = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types'); // All Types, Income, Expense
  const [statusFilter, setStatusFilter] = useState('All Statuses'); // All Statuses, Paid, Unpaid, Pending
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, amount-desc, amount-asc
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Modals & Active Records
  const [viewInvoice, setViewInvoice] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const exportRef = useRef(null);
  const menuRef = useRef(null);

  // Handle incoming router state (toast notification or auto-viewing invoice)
  useEffect(() => {
    if (location.state?.toastMessage) {
      const timer = setTimeout(() => {
        setToast({ 
          message: location.state.toastMessage, 
          type: location.state.toastType || 'success' 
        });
        window.history.replaceState({}, document.title);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Invoices
  const fetchInvoices = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get('/api/v1/invoices', { withCredentials: true });
      setInvoices(response.data?.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      setError(err.response?.data?.message || 'Unable to connect to invoice ledger. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;
    axios.get('/api/v1/invoices', { withCredentials: true })
      .then(res => {
        if (isMounted) {
          setInvoices(res.data?.data || []);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Failed to load initial invoices:', err);
          setError(err.response?.data?.message || 'Failed to retrieve invoice ledger.');
          setIsLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  // Handle auto-viewing target invoice from location state
  useEffect(() => {
    if (location.state?.viewInvoiceId && invoices.length > 0) {
      const target = invoices.find(inv => (inv._id || inv.id) === location.state.viewInvoiceId);
      if (target) {
        const timer = setTimeout(() => {
          setViewInvoice(target);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [location.state, invoices]);

  // Extract unique categories for filter
  const availableCategories = useMemo(() => {
    const set = new Set();
    invoices.forEach(inv => {
      if (inv.category && typeof inv.category === 'string') {
        set.add(inv.category);
      }
    });
    return ['All Categories', ...Array.from(set).sort()];
  }, [invoices]);

  // Compute Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = invoices.length;
    let grossVolume = 0;
    let incomeVolume = 0;
    let expenseVolume = 0;
    let paidCount = 0;
    let pendingCount = 0;

    invoices.forEach(inv => {
      const amt = Number(inv.totalAmount || inv.amount || 0);
      grossVolume += amt;

      const isExpense = inv.type === 'Expense' || inv.type === 'Scanned';
      if (isExpense) {
        expenseVolume += amt;
      } else {
        incomeVolume += amt;
      }

      const status = (inv.status || 'Paid').toLowerCase();
      if (status === 'paid') {
        paidCount++;
      } else {
        pendingCount++;
      }
    });

    const settlementRatio = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

    return {
      totalCount,
      grossVolume,
      incomeVolume,
      expenseVolume,
      paidCount,
      pendingCount,
      settlementRatio
    };
  }, [invoices]);

  // Filter & Sort Invoices
  const filteredInvoices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const matches = invoices.filter(inv => {
      const vendorName = (inv.vendor?.name || inv.vendor || '').toLowerCase();
      const invoiceId = (inv.invoiceNumber || inv._id || inv.id || '').toLowerCase();
      const userName = (inv.user?.name || inv.user || '').toLowerCase();
      const category = (inv.category || '').toLowerCase();

      const matchesSearch = !query || 
        vendorName.includes(query) || 
        invoiceId.includes(query) || 
        userName.includes(query) || 
        category.includes(query);

      // Type Filter
      let matchesType = true;
      if (typeFilter === 'Income') {
        matchesType = (inv.type || 'Income') === 'Income';
      } else if (typeFilter === 'Expense') {
        matchesType = inv.type === 'Expense' || inv.type === 'Scanned';
      }

      // Status Filter
      let matchesStatus = true;
      if (statusFilter !== 'All Statuses') {
        matchesStatus = (inv.status || 'Paid').toLowerCase() === statusFilter.toLowerCase();
      }

      // Category Filter
      let matchesCategory = true;
      if (categoryFilter !== 'All Categories') {
        matchesCategory = inv.category === categoryFilter;
      }

      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });

    // Sorting
    return matches.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      const amtA = Number(a.totalAmount || a.amount || 0);
      const amtB = Number(b.totalAmount || b.amount || 0);

      switch (sortBy) {
        case 'date-asc':
          return dateA - dateB;
        case 'amount-desc':
          return amtB - amtA;
        case 'amount-asc':
          return amtA - amtB;
        case 'date-desc':
        default:
          return dateB - dateA;
      }
    });
  }, [invoices, searchTerm, typeFilter, statusFilter, categoryFilter, sortBy]);

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

  const hasActiveFilters = searchTerm !== '' || typeFilter !== 'All Types' || statusFilter !== 'All Statuses' || categoryFilter !== 'All Categories';

  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('All Types');
    setStatusFilter('All Statuses');
    setCategoryFilter('All Categories');
    setCurrentPage(1);
  };

  // Delete Action
  const handleDeleteInvoice = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const id = itemToDelete._id || itemToDelete.id;
      await axios.delete(`/api/v1/invoices/${id}`, { withCredentials: true });
      setInvoices(prev => prev.filter(inv => (inv._id || inv.id) !== id));
      setItemToDelete(null);
      setActiveMenuId(null);
      setToast({ message: 'Invoice record successfully deleted', type: 'success' });
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      setToast({ 
        message: err.response?.data?.message || 'Failed to delete invoice. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Edit Action (Reuses existing /generate workflow)
  const handleEdit = (inv) => {
    setActiveMenuId(null);
    navigate('/generate', { state: { editInvoice: inv } });
  };

  // Export Handlers (PDF, Excel, Word, CSV)
  const handleExport = (format) => {
    const filename = `finflow_invoices_${new Date().toISOString().slice(0, 10)}`;
    const headers = ["Invoice ID", "Vendor / Payee", "Type", "Category", "Date", "Status", "Amount (INR)"];
    
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNumber || (inv._id || inv.id || "").toString().slice(-8).toUpperCase(),
      inv.vendor?.name || inv.vendor || 'Unknown Entity',
      inv.type === 'Scanned' ? 'Expense (Scanned)' : (inv.type || 'Income'),
      inv.category || 'General',
      inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : 'N/A',
      inv.status || 'Paid',
      (Number(inv.totalAmount || inv.amount || 0)).toString()
    ]);

    if (format === 'PDF') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("FinFlow Invoices Ledger Report", 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')} | Total Records: ${rows.length}`, 14, 26);
      
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 32,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
      doc.save(`${filename}.pdf`);
    } else if (format === 'Excel') {
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices Ledger");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else if (format === 'Word') {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: "FinFlow Invoices Ledger Report", heading: "Heading1" }),
            new Paragraph({ text: `Generated: ${new Date().toLocaleDateString('en-IN')} | Records: ${rows.length}`, spacing: { after: 200 } }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: headers.map(h => new TableCell({
                    children: [new Paragraph({ text: h })],
                    shading: { fill: "4F46E5" }
                  }))
                }),
                ...rows.map(row => new TableRow({
                  children: row.map(cell => new TableCell({
                    children: [new Paragraph(cell.toString())]
                  }))
                }))
              ]
            })
          ],
        }],
      });
      Packer.toBlob(doc).then(blob => saveAs(blob, `${filename}.docx`));
    } else {
      // CSV
      const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
    }

    setShowExportMenu(false);
    setToast({ message: `Exported ${rows.length} invoices to ${format}`, type: 'success' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 w-full min-w-0 max-w-full">
      {/* Print stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-bill-modal, #invoice-bill-modal * {
            visibility: visible;
          }
          #invoice-bill-modal {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 20mm !important;
            background: white !important;
            color: black !important;
            z-index: 99999;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal 
        invoice={viewInvoice} 
        onClose={() => setViewInvoice(null)} 
        onPrint={handlePrint} 
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        item={itemToDelete} 
        isDeleting={isDeleting} 
        onCancel={() => setItemToDelete(null)} 
        onConfirm={handleDeleteInvoice} 
      />

      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight">
              Invoices & Receipts
            </h1>
            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
              Ledger
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Search, filter, view and export company billing documents and AI-scanned receipts.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Action */}
          <Button
            onClick={fetchInvoices}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="gap-2"
            title="Sync Ledger"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <Button
              onClick={() => setShowExportMenu(prev => !prev)}
              variant="outline"
              size="sm"
              className="gap-2"
              aria-expanded={showExportMenu}
              aria-haspopup="true"
            >
              <Download size={14} />
              <span>Export</span>
            </Button>
            {showExportMenu && (
              <div 
                className="absolute top-full right-0 mt-2 w-44 bg-surface border border-border rounded-radius shadow-token-lg z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                role="menu"
              >
                <button 
                  onClick={() => handleExport('PDF')}
                  className="w-full flex items-center gap-2.5 p-2 rounded-radius text-xs font-semibold text-foreground hover:bg-surface-secondary text-left transition-all"
                  role="menuitem"
                >
                  <FileText size={14} className="text-primary" />
                  <span>Export as PDF</span>
                </button>
                <button 
                  onClick={() => handleExport('Excel')}
                  className="w-full flex items-center gap-2.5 p-2 rounded-radius text-xs font-semibold text-foreground hover:bg-surface-secondary text-left transition-all"
                  role="menuitem"
                >
                  <FileSpreadsheet size={14} className="text-emerald-500" />
                  <span>Export as Excel</span>
                </button>
                <button 
                  onClick={() => handleExport('Word')}
                  className="w-full flex items-center gap-2.5 p-2 rounded-radius text-xs font-semibold text-foreground hover:bg-surface-secondary text-left transition-all"
                  role="menuitem"
                >
                  <FileCheck size={14} className="text-blue-500" />
                  <span>Export as Word</span>
                </button>
                <button 
                  onClick={() => handleExport('CSV')}
                  className="w-full flex items-center gap-2.5 p-2 rounded-radius text-xs font-semibold text-foreground hover:bg-surface-secondary text-left transition-all"
                  role="menuitem"
                >
                  <Layers size={14} className="text-amber-500" />
                  <span>Export as CSV</span>
                </button>
              </div>
            )}
          </div>

          {/* Secondary Action: Create Invoice */}
          <Button
            onClick={() => navigate('/generate')}
            variant="secondary"
            size="sm"
            className="gap-2"
          >
            <Plus size={15} />
            <span>New Invoice</span>
          </Button>

          {/* Primary Action: Scan Receipt (OCR Workflow) */}
          <Button
            onClick={() => navigate('/scan')}
            variant="primary"
            size="sm"
            className="gap-2 shadow-token-sm"
          >
            <Scan size={15} />
            <span>Scan Receipt</span>
          </Button>
        </div>
      </header>

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-radius flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-destructive flex-shrink-0" />
            <span className="font-semibold text-destructive">{error}</span>
          </div>
          <Button 
            onClick={fetchInvoices} 
            variant="outline" 
            size="sm" 
            className="border-destructive/30 text-destructive hover:bg-destructive/10 text-xs"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Summary KPI Metrics (4-Column Grid) */}
      <section aria-label="Invoice Statistics">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Documents" 
            value={isLoading ? '—' : metrics.totalCount} 
            subValue={hasActiveFilters ? `${filteredInvoices.length} matching filter` : 'Full ledger scope'}
            icon={FileText} 
            iconBg="bg-primary/10 text-primary border border-primary/20"
            badge="Ledger"
            badgeVariant="secondary"
          />
          <StatCard 
            title="Gross Invoiced Value" 
            value={isLoading ? '—' : `₹${metrics.grossVolume.toLocaleString('en-IN')}`} 
            subValue="Recorded book volume"
            icon={Layers} 
            iconBg="bg-surface-secondary text-foreground border border-border"
            badge="Total"
            badgeVariant="outline"
          />
          <StatCard 
            title="Income / Receivables" 
            value={isLoading ? '—' : `₹${metrics.incomeVolume.toLocaleString('en-IN')}`} 
            subValue={`Outflows: ₹${metrics.expenseVolume.toLocaleString('en-IN')}`}
            icon={ArrowUpRight} 
            iconBg="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            badge="Receivable"
            badgeVariant="success"
          />
          <StatCard 
            title="Settlement Rate" 
            value={isLoading ? '—' : `${metrics.settlementRatio}%`} 
            subValue={`${metrics.paidCount} Paid • ${metrics.pendingCount} Pending`}
            icon={CheckCircle2} 
            iconBg="bg-blue-500/10 text-blue-500 border border-blue-500/20"
            badge={metrics.settlementRatio >= 75 ? 'Optimal' : 'Active'}
            badgeVariant={metrics.settlementRatio >= 75 ? 'success' : 'warning'}
          />
        </div>
      </section>

      {/* Invoices Ledger Card */}
      <Card className="border border-border overflow-hidden">
        {/* Filter and Search Toolbar */}
        <CardHeader className="border-b border-border p-4 sm:p-5 bg-surface-secondary/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search vendor, ID, payee, category..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-background border border-input rounded-radius py-2 pl-10 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                aria-label="Search invoices"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase hidden sm:inline">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-background border border-input rounded-radius py-2 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  aria-label="Filter by invoice type"
                >
                  <option value="All Types">All Types</option>
                  <option value="Income">Income (Receivables)</option>
                  <option value="Expense">Expense (Payables)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase hidden sm:inline">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-background border border-input rounded-radius py-2 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  aria-label="Filter by payment status"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase hidden sm:inline">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-background border border-input rounded-radius py-2 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all max-w-[140px] truncate"
                  aria-label="Filter by category"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sort Selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-background border border-input rounded-radius py-2 px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                aria-label="Sort invoices"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="amount-asc">Amount: Low to High</option>
              </select>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button
                  onClick={handleClearFilters}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Table Content */}
        <CardContent className="p-0">
          {isLoading ? (
            /* Loading Skeletons */
            <div className="p-6 space-y-4 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-surface-secondary/40 rounded-radius w-full" />
              ))}
            </div>
          ) : invoices.length === 0 ? (
            /* Empty State: No Invoices in System or Storage Unavailable */
            <EmptyState 
              title={error ? "Persistent Storage Unavailable" : "No Invoices Recorded Yet"}
              description={error 
                ? "Persistent database storage has been removed. You can generate professional invoices and export them directly to PDF, Excel, or Word, or scan receipts with AI Vision, but saving records to a database ledger is currently disabled."
                : "Upload and scan paper receipts with AI Vision or generate professional invoices to populate your financial ledger."}
              actionLabel="Create Invoice (Export PDF)"
              onAction={() => navigate('/generate')}
              secondaryActionLabel="Scan Receipt (AI Vision)"
              onSecondaryAction={() => navigate('/scan')}
            />
          ) : filteredInvoices.length === 0 ? (
            /* Filtered Empty State */
            <EmptyState 
              title="No Matching Invoices Found"
              description="No documents match your current filter criteria. Adjust your search keywords or clear active filters."
              actionLabel="Clear All Filters"
              onAction={handleClearFilters}
            />
          ) : (
            /* Data Table */
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-surface-secondary/40 text-muted-foreground border-b border-border text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-5">Invoice ID</th>
                    <th className="py-3.5 px-5">Vendor / Payee</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">Date</th>
                    <th className="py-3.5 px-5">Type</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Amount</th>
                    <th className="py-3.5 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedInvoices.map((inv) => {
                    const id = inv._id || inv.id;
                    const vendorName = inv.vendor?.name || inv.vendor || 'Unknown Entity';
                    const invoiceIdDisplay = inv.invoiceNumber || (id || '').toString().slice(-8).toUpperCase();
                    const isExpense = inv.type === 'Expense' || inv.type === 'Scanned';
                    const amount = Number(inv.totalAmount || inv.amount || 0);
                    const formattedDate = inv.date 
                      ? new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'N/A';
                    const isMenuOpen = activeMenuId === id;

                    return (
                      <tr 
                        key={id}
                        className="group hover:bg-surface-secondary/40 transition-colors"
                      >
                        {/* Invoice ID */}
                        <td className="py-4 px-5">
                          <span className="font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-radius text-[11px]">
                            {invoiceIdDisplay}
                          </span>
                        </td>

                        {/* Vendor / Payee */}
                        <td className="py-4 px-5">
                          <div>
                            <p className="font-bold text-foreground text-xs truncate max-w-xs">{vendorName}</p>
                            <p className="text-[11px] text-muted-foreground font-medium truncate max-w-xs mt-0.5">
                              {inv.user?.name || inv.user || 'Corporate Account'}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-5">
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {inv.category || 'General'}
                          </Badge>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-5 text-muted-foreground font-mono text-[11px]">
                          {formattedDate}
                        </td>

                        {/* Type */}
                        <td className="py-4 px-5">
                          <Badge 
                            variant={isExpense ? 'destructive' : 'success'} 
                            className="text-[10px] font-bold"
                          >
                            {inv.type === 'Scanned' ? 'Expense (OCR)' : (inv.type || 'Income')}
                          </Badge>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          <Badge 
                            variant={
                              (inv.status || 'Paid').toLowerCase() === 'paid' ? 'success' : 
                              (inv.status || '').toLowerCase() === 'pending' ? 'warning' : 'secondary'
                            }
                            className="text-[10px]"
                          >
                            {inv.status || 'Paid'}
                          </Badge>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-5 text-right font-mono font-bold text-foreground text-sm">
                          <span className={isExpense ? 'text-foreground' : 'text-emerald-500'}>
                            {isExpense ? '- ' : '+ '}₹{amount.toLocaleString('en-IN')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5 relative">
                            {/* View Bill Button */}
                            <Button
                              onClick={() => setViewInvoice(inv)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                              title="View Document"
                              aria-label={`View invoice ${invoiceIdDisplay}`}
                            >
                              <Eye size={15} />
                            </Button>

                            {/* Dropdown Menu Toggle */}
                            <div className="relative" ref={isMenuOpen ? menuRef : null}>
                              <Button
                                onClick={() => setActiveMenuId(isMenuOpen ? null : id)}
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 ${isMenuOpen ? 'bg-surface-secondary text-foreground' : 'text-muted-foreground'}`}
                                aria-label="More actions"
                              >
                                <MoreVertical size={15} />
                              </Button>

                              {isMenuOpen && (
                                <div 
                                  className="absolute top-full right-0 mt-1 w-36 bg-surface border border-border rounded-radius shadow-token-lg z-50 p-1 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                                  role="menu"
                                >
                                  <button
                                    onClick={() => handleEdit(inv)}
                                    className="w-full flex items-center gap-2 p-2 text-xs font-semibold text-foreground hover:bg-surface-secondary rounded-radius transition-all text-left"
                                    role="menuitem"
                                  >
                                    <Edit size={13} className="text-primary" />
                                    <span>Edit Record</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setItemToDelete(inv);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 p-2 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-radius transition-all text-left"
                                    role="menuitem"
                                  >
                                    <Trash2 size={13} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer & Pagination */}
          {!isLoading && filteredInvoices.length > 0 && (
            <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-secondary/20">
              <p className="text-xs text-muted-foreground font-medium">
                Showing <span className="font-bold text-foreground">{startIndex + 1}</span>-
                <span className="font-bold text-foreground">{Math.min(startIndex + itemsPerPage, filteredInvoices.length)}</span> of{' '}
                <span className="font-bold text-foreground">{filteredInvoices.length}</span> documents
                {hasActiveFilters && ' (filtered)'}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={safePage === 1}
                  variant="outline"
                  size="sm"
                  className="gap-1 px-3 text-xs"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </Button>

                <span className="text-xs font-bold text-foreground px-2">
                  Page {safePage} of {totalPages}
                </span>

                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={safePage === totalPages || totalPages === 0}
                  variant="outline"
                  size="sm"
                  className="gap-1 px-3 text-xs"
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toast Feedback */}
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

export default Invoices;

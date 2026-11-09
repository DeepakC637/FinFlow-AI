import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Search, 
  Plus, 
  Edit2, 
  X, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Scan, 
  IndianRupee,
  Layers,
  Building2
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import Toast from '../components/Toast';

const CATEGORY_PRESETS = [
  'Office Supplies',
  'Infrastructure',
  'Software & SaaS',
  'Travel & Transit',
  'Meals & Entertainment',
  'Utilities & Bills',
  'Marketing & Growth',
  'Direct AI',
  'Other'
];

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

const EmptyState = ({ title, description, actionLabel, onAction, secondaryActionLabel, onSecondaryAction }) => (
  <div className="flex flex-col items-center justify-center py-14 px-6 text-center bg-surface-secondary/30 border border-dashed border-border rounded-radius p-8 my-auto w-full">
    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground mb-3.5 shadow-sm">
      <Wallet size={22} />
    </div>
    <p className="text-sm font-bold text-foreground">{title}</p>
    <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed font-medium">
      {description}
    </p>
    <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
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

const Expenses = () => {
  const navigate = useNavigate();

  // State
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Budget State
  const [budget, setBudget] = useState(() => {
    return parseInt(localStorage.getItem('monthlyBudget'), 10) || 50000;
  });
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newBudgetValue, setNewBudgetValue] = useState(budget);

  // Search, Filter, Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, amount-desc, amount-asc

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    vendorName: '',
    totalAmount: '',
    category: 'Office Supplies',
    date: new Date().toISOString().slice(0, 10),
    status: 'Paid',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Delete State
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Data Processing
  const processExpenseData = useCallback((data) => {
    const expenseItems = data.filter(inv => inv.type === 'Expense' || inv.type === 'Scanned');
    setExpenses(expenseItems);
  }, []);

  // Fetch Expenses
  const fetchExpenses = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get('/api/v1/invoices', { withCredentials: true });
      processExpenseData(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setError(err.response?.data?.message || 'Unable to connect to financial ledger. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [processExpenseData]);

  useEffect(() => {
    let isMounted = true;
    axios.get('/api/v1/invoices', { withCredentials: true })
      .then(response => {
        if (!isMounted) return;
        processExpenseData(response.data.data || []);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Initial fetch failed:', err);
        setError(err.response?.data?.message || 'Unable to load company expenses.');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [processExpenseData]);

  // Derived Calculations
  const totalSpent = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + (Number(curr.totalAmount) || Number(curr.amount) || 0), 0);
  }, [expenses]);

  const remaining = useMemo(() => {
    return budget - totalSpent;
  }, [budget, totalSpent]);

  const spendPercentage = useMemo(() => {
    if (budget <= 0) return 0;
    return (totalSpent / budget) * 100;
  }, [budget, totalSpent]);

  const avgExpense = useMemo(() => {
    return expenses.length > 0 ? totalSpent / expenses.length : 0;
  }, [expenses, totalSpent]);

  const topCategory = useMemo(() => {
    const categoryTotals = expenses.reduce((acc, exp) => {
      const cat = exp.category || 'Direct AI';
      acc[cat] = (acc[cat] || 0) + (Number(exp.totalAmount) || Number(exp.amount) || 0);
      return acc;
    }, {});

    let top = { name: 'None', amount: 0 };
    Object.entries(categoryTotals).forEach(([name, amount]) => {
      if (amount > top.amount) {
        top = { name, amount };
      }
    });

    const percentOfTotal = totalSpent > 0 ? Math.round((top.amount / totalSpent) * 100) : 0;
    return { ...top, percentOfTotal };
  }, [expenses, totalSpent]);

  const availableCategories = useMemo(() => {
    const present = expenses.map(e => e.category).filter(Boolean);
    const combined = Array.from(new Set([...CATEGORY_PRESETS, ...present]));
    return ['All Categories', ...combined];
  }, [expenses]);

  // Filtered and Sorted Expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(item => {
        const vendor = (item.vendor?.name || item.vendor || item.user || '').toLowerCase();
        const cat = (item.category || 'Direct AI').toLowerCase();
        const invoiceNum = (item.invoiceNumber || '').toLowerCase();
        const query = searchQuery.trim().toLowerCase();

        const matchesQuery = !query || vendor.includes(query) || cat.includes(query) || invoiceNum.includes(query);
        const matchesCategory = selectedCategory === 'All Categories' || (item.category || 'Direct AI') === selectedCategory;

        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        const amountA = Number(a.totalAmount || a.amount || 0);
        const amountB = Number(b.totalAmount || b.amount || 0);

        if (sortBy === 'date-asc') return dateA - dateB;
        if (sortBy === 'amount-desc') return amountB - amountA;
        if (sortBy === 'amount-asc') return amountA - amountB;
        return dateB - dateA; // date-desc (default)
      });
  }, [expenses, searchQuery, selectedCategory, sortBy]);

  // Budget Handlers
  const handleSaveBudget = (e) => {
    e.preventDefault();
    const parsed = parseInt(newBudgetValue, 10);
    if (isNaN(parsed) || parsed < 0) {
      setToast({ message: 'Please enter a valid positive budget amount.', type: 'error' });
      return;
    }
    setBudget(parsed);
    try {
      localStorage.setItem('monthlyBudget', parsed.toString());
      setToast({ message: `Monthly allowance updated to ₹${parsed.toLocaleString('en-IN')}`, type: 'success' });
    } catch {
      setToast({ message: 'Unable to save to local storage.', type: 'error' });
    }
    setIsBudgetModalOpen(false);
  };

  // Add Expense Validation & Submit
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!expenseForm.vendorName.trim()) {
      errors.vendorName = 'Vendor or description is required';
    }
    const amountVal = parseFloat(expenseForm.totalAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      errors.totalAmount = 'Amount must be greater than 0';
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});
    try {
      const payload = {
        vendorName: expenseForm.vendorName.trim(),
        date: expenseForm.date ? new Date(expenseForm.date) : new Date(),
        totalAmount: amountVal,
        category: expenseForm.category || 'Other',
        type: 'Expense',
        status: expenseForm.status || 'Paid',
        items: [{ description: expenseForm.notes || expenseForm.vendorName.trim(), quantity: 1, unit_price: amountVal, total: amountVal }]
      };

      await axios.post('/api/v1/invoices/confirm', payload, { withCredentials: true });
      await fetchExpenses();
      setToast({ message: `Recorded outflow of ₹${amountVal.toLocaleString('en-IN')} for ${payload.vendorName}`, type: 'success' });
      setIsAddModalOpen(false);
      setExpenseForm({
        vendorName: '',
        totalAmount: '',
        category: 'Office Supplies',
        date: new Date().toISOString().slice(0, 10),
        status: 'Paid',
        notes: ''
      });
    } catch (err) {
      console.error('Failed to save expense:', err);
      setToast({ message: err.response?.data?.message || 'Failed to record expense. Please try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense Handler
  const handleDeleteExpense = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const id = itemToDelete._id || itemToDelete.id;
      await axios.delete(`/api/v1/invoices/${id}`, { withCredentials: true });
      setExpenses(prev => prev.filter(item => (item._id || item.id) !== id));
      setToast({ message: 'Expense record successfully deleted', type: 'success' });
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete expense:', err);
      setToast({ message: err.response?.data?.message || 'Failed to delete expense.', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Format Helper
  const formatCurrency = (val) => {
    return `₹ ${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  // Loading Skeletons
  if (isLoading) {
    return (
      <div className="space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-muted rounded-radius animate-pulse" />
            <div className="h-4 w-72 bg-surface-secondary rounded-radius animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted rounded-radius animate-pulse" />
            <div className="h-10 w-32 bg-muted rounded-radius animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="h-32 bg-surface border border-border rounded-radius animate-pulse" />
          <div className="h-32 bg-surface border border-border rounded-radius animate-pulse" />
          <div className="h-32 bg-surface border border-border rounded-radius animate-pulse" />
          <div className="h-32 bg-surface border border-border rounded-radius animate-pulse" />
        </div>

        <div className="h-28 bg-surface border border-border rounded-radius animate-pulse" />
        <div className="h-96 bg-surface border border-border rounded-radius animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Expenses Vault</h1>
          <p className="section-subtitle">Track company outflows, manage monthly allocations, and categorize budgets.</p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="md"
            onClick={fetchExpenses}
            isLoading={isRefreshing}
            leftIcon={RefreshCw}
            title="Refresh records"
            className="flex-1 sm:flex-none"
          >
            Sync
          </Button>

          <Button 
            onClick={() => navigate('/scan')}
            variant="outline"
            size="md"
            leftIcon={Scan}
            className="flex-1 sm:flex-none"
          >
            Scan Receipt (AI)
          </Button>

          <Button 
            onClick={() => {
              setFormErrors({});
              setIsAddModalOpen(true);
            }}
            variant="primary"
            size="md"
            leftIcon={Plus}
            className="w-full sm:w-auto shadow-sm"
          >
            Record Outflow
          </Button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-radius bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 flex items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="destructive" size="sm" onClick={fetchExpenses}>
            Retry
          </Button>
        </div>
      )}

      {/* KPI Summary Cards (4-Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Monthly Budget */}
        <Card className="p-5 sm:p-6 transition-all duration-200 hover:shadow-token-md border border-border relative group">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-radius flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                  <Wallet size={16} />
                </div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">Monthly Allowance</p>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground font-display tracking-tight truncate">
                {formatCurrency(budget)}
              </h3>
              <p className="text-[11px] font-semibold text-muted-foreground">
                {spendPercentage.toFixed(1)}% consumed
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewBudgetValue(budget);
                setIsBudgetModalOpen(true);
              }}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-surface-secondary rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Edit monthly budget"
              aria-label="Edit monthly budget"
            >
              <Edit2 size={15} />
            </button>
          </div>
        </Card>

        {/* Total Spent */}
        <StatCard 
          title="Total Outflows" 
          value={formatCurrency(totalSpent)} 
          subValue={`${expenses.length} recorded bills`} 
          icon={IndianRupee} 
          iconBg="bg-rose-500/10 text-rose-700 dark:text-rose-400" 
          badge={totalSpent > 0 ? `Avg ₹${Math.round(avgExpense).toLocaleString('en-IN')}` : undefined}
          badgeVariant="destructive"
        />

        {/* Remaining Balance */}
        <StatCard 
          title="Available Balance" 
          value={`${remaining < 0 ? '-' : ''}${formatCurrency(Math.abs(remaining))}`} 
          subValue={remaining < 0 ? 'Exceeded allowance' : 'Available to deploy'} 
          icon={remaining < 0 ? ArrowDownRight : ArrowUpRight} 
          iconBg={remaining < 0 ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'} 
          badge={remaining < 0 ? 'Over limit' : 'Safe status'}
          badgeVariant={remaining < 0 ? 'destructive' : 'success'}
        />

        {/* Top Spending Category */}
        <StatCard 
          title="Top Category" 
          value={topCategory.name} 
          subValue={topCategory.amount > 0 ? `${formatCurrency(topCategory.amount)} total` : 'No category spend'} 
          icon={Layers} 
          iconBg="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" 
          badge={topCategory.amount > 0 ? `${topCategory.percentOfTotal}% share` : undefined}
          badgeVariant="primary"
        />
      </div>

      {/* Budget Utilization Panel */}
      <Card className="border border-border p-5 sm:p-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground font-display flex items-center gap-2">
              <span>Budget Health & Utilization</span>
              <Badge 
                variant={spendPercentage >= 100 ? 'destructive' : spendPercentage >= 75 ? 'warning' : 'success'}
                className="text-[10px]"
              >
                {spendPercentage >= 100 ? 'Limit Exceeded' : spendPercentage >= 75 ? 'High Alert (75–99%)' : 'Within Budget'}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatCurrency(totalSpent)} spent out of {formatCurrency(budget)} monthly allocation
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-foreground">
              {spendPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-surface-secondary border border-border rounded-full h-3 overflow-hidden p-0.5 relative">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              spendPercentage >= 100 
                ? 'bg-destructive' 
                : spendPercentage >= 75 
                  ? 'bg-amber-500' 
                  : 'bg-primary'
            }`}
            style={{ width: `${Math.min(spendPercentage, 100)}%` }}
            role="progressbar"
            aria-valuenow={Math.round(spendPercentage)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>

        {/* Status footnote */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-0.5">
          <span>0%</span>
          <span className="text-center font-medium">
            {remaining >= 0 ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                ✓ {formatCurrency(remaining)} remaining before limit
              </span>
            ) : (
              <span className="text-destructive font-semibold">
                ⚠️ Budget exceeded by {formatCurrency(Math.abs(remaining))}
              </span>
            )}
          </span>
          <span>100% ({formatCurrency(budget)})</span>
        </div>
      </Card>

      {/* Expenses Ledger Card */}
      <Card className="border border-border">
        
        {/* Toolbar Header (Search, Filters, Sort) */}
        <CardHeader className="border-b border-border p-4 sm:p-5 bg-surface-secondary/30">
          <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor, category, ID..." 
                className="w-full bg-surface border border-input rounded-radius py-2 pl-10 pr-8 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                aria-label="Search expenses"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded"
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Category Filter */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto bg-surface border border-input rounded-radius px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                  aria-label="Filter by category"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto bg-surface border border-input rounded-radius px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                  aria-label="Sort expenses"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Amount: High to Low</option>
                  <option value="amount-asc">Amount: Low to High</option>
                </select>
              </div>

              {/* Reset Filters (if active) */}
              {(searchQuery || selectedCategory !== 'All Categories') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Categories');
                  }}
                  className="text-xs"
                >
                  Reset
                </Button>
              )}
            </div>

          </div>
        </CardHeader>

        {/* Ledger Table Container */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/40 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <th className="py-3.5 px-5">Vendor / Payee</th>
                  <th className="py-3.5 px-5">Category</th>
                  <th className="py-3.5 px-5 text-center">Date</th>
                  <th className="py-3.5 px-5 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Amount</th>
                  <th className="py-3.5 px-5 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map((exp, idx) => {
                    const vendorName = exp.vendor?.name || exp.vendor || exp.user || 'Unknown Vendor';
                    const category = exp.category || 'Direct AI';
                    const formattedDate = formatDate(exp.date || exp.createdAt);
                    const amountVal = Number(exp.totalAmount || exp.amount || 0);
                    const status = exp.status || 'Paid';

                    return (
                      <tr 
                        key={exp._id || exp.id || idx} 
                        className="group hover:bg-surface-secondary/40 transition-colors"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-radius bg-surface-secondary border border-border flex items-center justify-center flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                              <Building2 size={15} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs truncate max-w-xs">{vendorName}</p>
                              {exp.invoiceNumber && (
                                <p className="font-mono text-[10px] text-muted-foreground mt-0.5">{exp.invoiceNumber}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <Badge variant="default">
                            {category}
                          </Badge>
                        </td>

                        <td className="py-4 px-5 text-center font-medium text-muted-foreground">
                          {formattedDate}
                        </td>

                        <td className="py-4 px-5 text-center">
                          <Badge variant={status === 'Paid' ? 'success' : 'warning'}>
                            {status}
                          </Badge>
                        </td>

                        <td className="py-4 px-5 text-right font-bold text-destructive">
                          - ₹{amountVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-4 px-5 pr-6 text-right">
                          <button
                            type="button"
                            onClick={() => setItemToDelete(exp)}
                            className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-destructive inline-flex items-center justify-center"
                            title="Delete outflow record"
                            aria-label={`Delete expense for ${vendorName}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center">
                      {expenses.length === 0 ? (
                        <EmptyState 
                          title="No Outflows Recorded" 
                          description="Start tracking company expenditures by logging manual expenses or scanning receipt bills using AI OCR."
                          actionLabel="Record First Outflow"
                          onAction={() => setIsAddModalOpen(true)}
                          secondaryActionLabel="Scan Receipt (AI)"
                          onSecondaryAction={() => navigate('/scan')}
                        />
                      ) : (
                        <EmptyState 
                          title="No Matching Expenses" 
                          description={`No expense records found matching "${searchQuery || selectedCategory}". Try adjusting your filters.`}
                          actionLabel="Reset Search & Filters"
                          onAction={() => {
                            setSearchQuery('');
                            setSelectedCategory('All Categories');
                          }}
                        />
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Ledger Table Footer */}
          {filteredExpenses.length > 0 && (
            <div className="p-4 border-t border-border bg-surface-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Showing <strong className="text-foreground">{filteredExpenses.length}</strong> of{' '}
                <strong className="text-foreground">{expenses.length}</strong> recorded outflows
              </span>
              <span>
                Total Filtered Outflows:{' '}
                <strong className="text-destructive font-bold">
                  {formatCurrency(filteredExpenses.reduce((acc, curr) => acc + (Number(curr.totalAmount) || Number(curr.amount) || 0), 0))}
                </strong>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- MODALS ---------------- */}

      {/* 1. Add Outflow Modal */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-expense-title"
        >
          <div className="bg-surface border border-border rounded-radius shadow-token-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface-secondary/30">
              <div>
                <h3 id="add-expense-title" className="text-base font-bold text-foreground font-display">Record Company Outflow</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Log a vendor bill payment or company expense into the ledger.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-secondary rounded-lg transition-colors"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="p-5 space-y-4">
              <Input 
                label="Vendor or Payee Name *"
                placeholder="e.g. Amazon Web Services, Staples, Office Depot"
                value={expenseForm.vendorName}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, vendorName: e.target.value }))}
                error={formErrors.vendorName}
                leftIcon={Building2}
                autoFocus
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Amount (₹) *"
                  type="number"
                  step="any"
                  placeholder="e.g. 4500"
                  value={expenseForm.totalAmount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                  error={formErrors.totalAmount}
                  leftIcon={IndianRupee}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground font-display tracking-wide">
                    Category *
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-surface text-foreground border border-input rounded-radius px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                  >
                    {CATEGORY_PRESETS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input 
                  label="Transaction Date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                  leftIcon={Calendar}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground font-display tracking-wide">
                    Payment Status
                  </label>
                  <select
                    value={expenseForm.status}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-surface text-foreground border border-input rounded-radius px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring transition-all"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending / Due</option>
                  </select>
                </div>
              </div>

              <Input 
                label="Notes / Line Description (Optional)"
                placeholder="e.g. Q3 hosting charges, monthly subscriptions"
                value={expenseForm.notes}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
              />

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                >
                  Save Outflow
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Monthly Budget Modal */}
      {isBudgetModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-budget-title"
        >
          <div className="bg-surface border border-border rounded-radius shadow-token-lg w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface-secondary/30">
              <div>
                <h3 id="edit-budget-title" className="text-base font-bold text-foreground font-display">Configure Monthly Allowance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Set the monthly ceiling for operating expenditures.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsBudgetModalOpen(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-secondary rounded-lg transition-colors"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-5 space-y-4">
              <Input 
                label="Monthly Allowance (₹) *"
                type="number"
                step="1000"
                min="0"
                value={newBudgetValue}
                onChange={(e) => setNewBudgetValue(e.target.value)}
                leftIcon={IndianRupee}
                autoFocus
                helperText="This limit is saved to your browser preferences."
              />

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Quick Presets:</label>
                <div className="flex flex-wrap gap-2">
                  {[25000, 50000, 75000, 100000, 200000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewBudgetValue(amt)}
                      className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                        Number(newBudgetValue) === amt
                          ? 'bg-primary text-primary-foreground border-primary font-bold'
                          : 'bg-surface-secondary border-border text-foreground hover:bg-surface'
                      }`}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Calculation */}
              <div className="p-3.5 bg-surface-secondary border border-border/80 rounded-radius text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Current Outflows:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(totalSpent)}</span>
                </div>
                <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/60">
                  <span>New Available Balance:</span>
                  <span className={Number(newBudgetValue) - totalSpent >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-destructive'}>
                    {formatCurrency(Number(newBudgetValue || 0) - totalSpent)}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsBudgetModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                >
                  Save Allowance
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {itemToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-surface border border-border rounded-radius shadow-token-lg w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-150 p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-sm font-bold text-foreground font-display">Delete Outflow Record?</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Are you sure you want to delete the expense of{' '}
                  <strong className="text-foreground">
                    ₹{Number(itemToDelete.totalAmount || itemToDelete.amount || 0).toLocaleString('en-IN')}
                  </strong>{' '}
                  for <strong className="text-foreground">{itemToDelete.vendor?.name || itemToDelete.vendor || 'Unknown Vendor'}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteExpense}
                isLoading={isDeleting}
              >
                Delete Record
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Expenses;

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight,
  Scan,
  Plus,
  Scale,
  Layers,
  Filter
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../hooks/useTheme';
import Toast from '../components/Toast';

import {
  TIME_RANGES,
  filterInvoicesByDateRange,
  calculateFinancialMetrics,
  generateCategoryBreakdown,
  generateTrendsData,
  getInvoiceAmount
} from '../utils/analyticsCalculations';

// Theme-Aware Chart Tooltip
const AnalyticsTooltip = ({ active, payload, label, prefix = '₹', isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-3 rounded-radius text-xs shadow-token-md border ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {label && (
          <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            {label}
          </p>
        )}
        <div className="space-y-1.5">
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: item.color || item.fill || item.stroke }} 
                />
                <span className="text-muted-foreground text-[11px] capitalize font-medium">
                  {item.name}:
                </span>
              </div>
              <span className="font-mono font-bold text-foreground">
                {prefix}{Number(item.value || 0).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Stat KPI Card Component
const StatCard = ({ title, value, subValue, icon: Icon, iconBg, badge, badgeVariant = 'default' }) => (
  <Card className="p-5 sm:p-6 transition-all duration-200 hover:shadow-token-md border border-border">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2.5 flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-radius flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <Icon size={18} />
          </div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider truncate">
            {title}
          </p>
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
            <span className="text-[11px] font-medium text-muted-foreground truncate">
              {subValue}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Card>
);

const Analytics = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  // State
  const [invoices, setInvoices] = useState([]);
  const [timeRange, setTimeRange] = useState('All Time');
  const [chartView, setChartView] = useState('expenses'); // 'expenses' | 'cashflow'
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;
    axios.get('/api/v1/invoices', { withCredentials: true })
      .then(response => {
        if (!isMounted) return;
        setInvoices(response.data?.data || []);
        setError(null);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Failed to fetch analytics data:', err);
        setError(err.response?.data?.message || 'Unable to connect to financial ledger. Please try again.');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual Refresh Handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get('/api/v1/invoices', { withCredentials: true });
      setInvoices(response.data?.data || []);
      setError(null);
      setToast({ message: 'Analytics data refreshed successfully', type: 'success' });
    } catch (err) {
      console.error('Failed to refresh analytics data:', err);
      setError(err.response?.data?.message || 'Unable to connect to financial ledger. Please try again.');
      setToast({ message: 'Failed to refresh analytics data', type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Immutable Date-Range Filtering
  const filteredInvoices = useMemo(() => {
    return filterInvoicesByDateRange(invoices, timeRange);
  }, [invoices, timeRange]);

  // Expenses & Income Separation & Financial Metrics (Strict Financial Rules)
  const {
    expenses,
    totalExpenses,
    totalIncome,
    netCashflow,
    avgExpense,
    expenseCount,
    incomeCount
  } = useMemo(() => {
    return calculateFinancialMetrics(filteredInvoices);
  }, [filteredInvoices]);

  // Category Distribution & Reconciliation
  const categoryData = useMemo(() => {
    return generateCategoryBreakdown(expenses, totalExpenses);
  }, [expenses, totalExpenses]);

  // Trends Data Engine: Granular, Chronological, No Truncation
  const trendsData = useMemo(() => {
    return generateTrendsData(filteredInvoices, timeRange);
  }, [filteredInvoices, timeRange]);

  // Historical Log Entries
  const recentTransactions = useMemo(() => {
    return [...filteredInvoices]
      .sort((a, b) => {
        const dateA = new Date(a.date || a.createdAt || 0).getTime();
        const dateB = new Date(b.date || b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [filteredInvoices]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      setToast({ message: 'No invoice transactions available to export for this time range.', type: 'error' });
      return;
    }

    const headers = ['Invoice Number', 'Vendor / Counterparty', 'Category', 'Ledger Type', 'Status', 'Amount (INR)', 'Date'];
    const rows = filteredInvoices.map(inv => [
      `"${inv.invoiceNumber || inv._id || 'N/A'}"`,
      `"${(inv.vendor?.name || inv.vendor || 'Unknown').replace(/"/g, '""')}"`,
      `"${(inv.category || 'Other').replace(/"/g, '""')}"`,
      `"${inv.type === 'Scanned' ? 'Expense' : (inv.type || 'Income')}"`,
      `"${inv.status || 'Paid'}"`,
      getInvoiceAmount(inv).toString(),
      `"${inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : 'N/A'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `finflow_analytics_${timeRange.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast({ message: `Exported ${filteredInvoices.length} transactions to CSV`, type: 'success' });
  };

  // Theme-aware Chart Tokens
  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
  const axisColor = isDark ? '#94A3B8' : '#64748B';

  // Empty State Helper
  const renderEmptyChartState = (title, message) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-surface-secondary/40 rounded-radius border border-dashed border-border min-h-[260px]">
      <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground mb-3">
        <AlertCircle size={20} />
      </div>
      <p className="text-sm font-bold text-foreground">No {title} data available</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs font-medium">
        {message || `No financial records found for ${timeRange}. Switch date filter to inspect other periods.`}
      </p>
    </div>
  );

  // 1. Initial Loading State
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-muted rounded-radius animate-pulse" />
            <div className="h-4 w-72 bg-surface-secondary rounded-radius animate-pulse" />
          </div>
          <div className="flex gap-2.5">
            <div className="h-9 w-28 bg-muted rounded-radius animate-pulse" />
            <div className="h-9 w-32 bg-muted rounded-radius animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-surface border border-border rounded-radius p-5 animate-pulse space-y-3">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-7 w-36 bg-surface-secondary rounded" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[380px] bg-surface border border-border rounded-radius p-6 animate-pulse" />
          <div className="h-[380px] bg-surface border border-border rounded-radius p-6 animate-pulse" />
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Card className="p-8 sm:p-12 text-center border-destructive/25 max-w-lg mx-auto shadow-token-md">
          <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-foreground font-display">Connection Error</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {error}
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <Button onClick={handleRefresh} variant="primary" size="md" leftIcon={RefreshCw}>
              Retry Connection
            </Button>
            <Button onClick={() => navigate('/invoices')} variant="secondary" size="md">
              View Invoices
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 3. Complete Empty Database State (Zero total invoices)
  if (invoices.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Card className="p-8 sm:p-12 text-center border-dashed border-border max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} />
          </div>
          <h2 className="text-xl font-bold text-foreground font-display">No Financial Transactions Yet</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            Your expense distribution, outflow timeline, and cashflow analytics will automatically appear once you scan receipts or generate invoices.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <Button onClick={() => navigate('/scan')} variant="primary" size="md" leftIcon={Scan}>
              Scan Receipt
            </Button>
            <Button onClick={() => navigate('/generate')} variant="secondary" size="md" leftIcon={Plus}>
              Create Invoice
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 pb-20 analytics-dashboard-container">
      {/* Header & Global Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-display">
            Financial Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Audit vendor expenditures, category allocations, and cashflow velocity in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto w-full sm:w-auto">
          {/* Time Range Selector */}
          <div className="relative flex-1 sm:flex-initial">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              aria-label="Select date range"
              className="w-full sm:w-auto appearance-none bg-surface text-foreground border border-input hover:border-slate-400 dark:hover:border-slate-600 focus:border-primary focus:ring-2 focus:ring-ring rounded-radius py-2 px-3.5 pr-8 text-xs font-bold outline-none transition-all cursor-pointer shadow-token"
            >
              {TIME_RANGES.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
            <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <Button 
            onClick={handleRefresh}
            variant="secondary"
            size="sm"
            isLoading={isRefreshing}
            leftIcon={RefreshCw}
            aria-label="Refresh analytics data"
            className="h-9 px-3"
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Export CSV Button */}
          <Button 
            onClick={handleExportCSV}
            variant="primary"
            size="sm"
            leftIcon={Download}
            className="h-9 text-xs font-bold shadow-sm"
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Range Notification Banner (when range has 0 matches) */}
      {filteredInvoices.length === 0 && invoices.length > 0 && (
        <Card className="p-4 bg-surface-secondary/60 border-border flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <Filter size={16} className="text-primary flex-shrink-0" />
            <span>No transactions recorded for <strong>{timeRange}</strong>. Displaying empty periods.</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setTimeRange('All Time')}
            className="text-xs h-7 px-2.5"
          >
            Reset to All Time
          </Button>
        </Card>
      )}

      {/* Top Financial KPI Metric Cards (4-column responsive grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Total Outflow"
          value={`₹${totalExpenses.toLocaleString('en-IN')}`}
          subValue={`${expenseCount} recorded expense${expenseCount === 1 ? '' : 's'}`}
          icon={TrendingDown}
          iconBg="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          badge={timeRange}
          badgeVariant="destructive"
        />

        <StatCard 
          title="Total Inflow"
          value={`₹${totalIncome.toLocaleString('en-IN')}`}
          subValue={`${incomeCount} recorded invoice${incomeCount === 1 ? '' : 's'}`}
          icon={TrendingUp}
          iconBg="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          badge={timeRange}
          badgeVariant="success"
        />

        <StatCard 
          title="Net Cash Flow"
          value={`${netCashflow >= 0 ? '+' : '-'}₹${Math.abs(netCashflow).toLocaleString('en-IN')}`}
          subValue={netCashflow >= 0 ? 'Net positive inflow' : 'Outflow exceeds revenue'}
          icon={Wallet}
          iconBg="bg-primary/10 text-primary"
          badge={netCashflow >= 0 ? 'Surplus' : 'Deficit'}
          badgeVariant={netCashflow >= 0 ? 'success' : 'destructive'}
        />

        <StatCard 
          title="Average Outflow"
          value={`₹${avgExpense.toLocaleString('en-IN')}`}
          subValue={expenseCount > 0 ? 'Per expense transaction' : 'No expenses recorded'}
          icon={Scale}
          iconBg="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          badge={`${expenseCount} Trans`}
          badgeVariant="warning"
        />
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        
        {/* Outflow / Cash Flow Timeline Chart (2 Cols on lg) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold font-display flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary" />
                  {chartView === 'expenses' ? 'Outflow Timeline' : 'Cash Flow Velocity'}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {chartView === 'expenses'
                    ? `Sequential expenditure trends over ${timeRange.toLowerCase()}`
                    : `Inflow (revenue) vs Outflow (expenses) reconciliation over ${timeRange.toLowerCase()}`
                  }
                </p>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex p-0.5 bg-surface-secondary border border-border rounded-radius self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setChartView('expenses')}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                    chartView === 'expenses'
                      ? 'bg-surface text-foreground shadow-token'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Expenses Only
                </button>
                <button
                  type="button"
                  onClick={() => setChartView('cashflow')}
                  className={`px-3 py-1.5 font-bold rounded-lg transition-all ${
                    chartView === 'cashflow'
                      ? 'bg-surface text-foreground shadow-token'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cash Flow
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {trendsData.length > 0 ? (
              <div className="h-[320px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={trendsData} 
                    margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorExpenseArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorIncomeArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    
                    <XAxis 
                      dataKey="period" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
                      dy={8}
                    />

                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: axisColor, fontSize: 11, fontWeight: 500 }}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                      dx={-4}
                    />

                    <Tooltip 
                      content={<AnalyticsTooltip isDark={isDark} prefix="₹" />}
                    />

                    {/* Expenses Area */}
                    <Area 
                      type="monotone" 
                      name="Expenses"
                      dataKey="expenses" 
                      stroke="#4F46E5" 
                      fillOpacity={1} 
                      fill="url(#colorExpenseArea)" 
                      strokeWidth={2.5} 
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                    />

                    {/* Income Area (Visible in Cash Flow view) */}
                    {chartView === 'cashflow' && (
                      <Area 
                        type="monotone" 
                        name="Income"
                        dataKey="income" 
                        stroke="#10B981" 
                        fillOpacity={1} 
                        fill="url(#colorIncomeArea)" 
                        strokeWidth={2.5} 
                        activeDot={{ r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              renderEmptyChartState('trend', 'No expenditure transactions recorded in this period.')
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown (Donut Pie Chart with Explicit Legend) */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base sm:text-lg font-bold font-display flex items-center gap-2">
              <Layers size={18} className="text-primary" />
              Category Breakdown
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Expense distribution across verified categories
            </p>
          </CardHeader>

          <CardContent className="pt-2 space-y-4">
            {categoryData.length > 0 ? (
              <>
                <div className="h-[200px] w-full min-w-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={categoryData} 
                        dataKey="value" 
                        nameKey="name"
                        cx="50%" 
                        cy="50%" 
                        innerRadius={55} 
                        outerRadius={78} 
                        paddingAngle={3}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#111827' : '#FFFFFF'} strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={<AnalyticsTooltip isDark={isDark} prefix="₹" />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Accessible Category Legend Table */}
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {categoryData.map((cat, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-secondary/50 border border-border/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span 
                          className="w-3 h-3 rounded-full flex-shrink-0" 
                          style={{ backgroundColor: cat.color }} 
                          aria-hidden="true"
                        />
                        <span className="font-semibold text-foreground truncate max-w-[110px]" title={cat.name}>
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">({cat.count})</span>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0 font-mono">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                          {cat.percentage}%
                        </Badge>
                        <span className="font-bold text-foreground">
                          ₹{cat.value.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              renderEmptyChartState('category', 'No categorized expense transactions found.')
            )}
          </CardContent>
        </Card>

      </div>

      {/* Historical Log Entries Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold font-display">
                Period Transaction Log
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Detailed ledger entries within the active <strong className="text-foreground">{timeRange}</strong> timeframe
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/invoices')}
              rightIcon={ArrowRight}
              className="text-xs self-start sm:self-auto"
            >
              All Invoices
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-1">
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-3">Vendor / Counterparty</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Date</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((inv, idx) => {
                    const isExpense = inv.type === 'Expense' || inv.type === 'Scanned';
                    const amt = getInvoiceAmount(inv);
                    const vendorName = inv.vendor?.name || inv.vendor || 'Unknown Vendor';
                    const statusText = inv.status || 'Paid';
                    const isPaid = statusText.toLowerCase() === 'paid';

                    return (
                      <tr 
                        key={inv._id || inv.id || idx} 
                        className="hover:bg-surface-secondary/40 transition-colors"
                      >
                        <td className="py-3.5 px-3 font-semibold text-foreground max-w-[180px] truncate" title={vendorName}>
                          {vendorName}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="text-[10px] font-bold text-muted-foreground bg-surface-secondary border border-border px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {inv.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <Badge 
                            variant={isExpense ? 'destructive' : 'success'} 
                            className="text-[10px] font-bold"
                          >
                            {isExpense ? 'Expense' : 'Income'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3">
                          <Badge 
                            variant={isPaid ? 'success' : 'warning'} 
                            className="text-[10px]"
                          >
                            {statusText}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3 text-center text-muted-foreground font-medium font-mono text-[11px]">
                          {inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-3.5 px-3 text-right font-bold font-mono text-sm">
                          <span className={isExpense ? 'text-foreground' : 'text-emerald-600 dark:text-emerald-400'}>
                            {isExpense ? '' : '+'}₹{amt.toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-xs text-muted-foreground italic">
                      No transaction entries recorded for {timeRange}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

export default Analytics;

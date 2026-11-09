import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  FileText, 
  IndianRupee, 
  Wallet, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Scan,
  Eye,
  RefreshCw,
  Plus,
  Scale
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useTheme } from '../hooks/useTheme';

const Sparkline = ({ type, color }) => {
  const points = type === 'up' 
    ? "0,15 15,11 30,13 45,7 60,9 75,3" 
    : type === 'down' 
      ? "0,3 15,9 30,7 45,13 60,11 75,16"
      : "0,10 15,10 30,10 45,10 60,10 75,10";
  return (
    <svg className="w-16 h-8 opacity-80 flex-shrink-0" viewBox="0 0 75 18" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

const CustomChartTooltip = ({ active, payload, label, prefix = '₹', resolvedTheme }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const isDark = resolvedTheme === 'dark';
    return (
      <div className={`p-3 rounded-radius text-xs shadow-token-md border ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {label && <p className="font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>}
        {item.name && item.name !== 'revenue' && (
          <p className="font-semibold text-muted-foreground text-[11px]">{item.name}</p>
        )}
        <p className="font-black text-primary text-sm mt-0.5">
          {prefix}{Number(item.value || 0).toLocaleString('en-IN')}
        </p>
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, subValue, icon: Icon, iconBg, trend, trendType, sparkColor }) => (
  <Card className="p-5 sm:p-6 transition-all duration-200 hover:shadow-token-md border border-border">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-3 flex-1 min-w-0">
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
            {trend && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 ${
                trendType === 'up' 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' 
                  : trendType === 'down'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-primary/10 text-primary border border-primary/20'
              }`}>
                {trendType === 'up' ? <ArrowUpRight size={12} /> : trendType === 'down' ? <ArrowDownRight size={12} /> : null}
                {trend}
              </span>
            )}
            <span className="text-[11px] font-medium text-muted-foreground truncate">{subValue}</span>
          </div>
        </div>
      </div>
      <div className="hidden sm:block pt-2">
        <Sparkline type={trendType} color={sparkColor} />
      </div>
    </div>
  </Card>
);

const EmptyStateCard = ({ title, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-surface-secondary/40 border border-dashed border-border rounded-radius p-8 my-auto w-full">
    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-muted-foreground mb-3.5 shadow-sm">
      <AlertCircle size={22} />
    </div>
    <p className="text-sm font-bold text-foreground">No {title} records found</p>
    <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed font-medium">
      Your parsed invoice transactions and expense analytics will auto-populate here.
    </p>
    {actionLabel && (
      <Button 
        onClick={onAction}
        size="sm"
        className="mt-4"
        rightIcon={ArrowRight}
      >
        {actionLabel}
      </Button>
    )}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [stats, setStats] = useState({
    invoicesCount: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    netCashflow: 0
  });
  const [revenueData, setRevenueData] = useState([]);
  const [expenseCategoryData, setExpenseCategoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const processInvoiceData = useCallback((data) => {
    setRecentInvoices(data.slice(0, 5));
    
    // 1. Calculate Stats (Revenue, Expenses, Net Cashflow)
    const revenue = data
      .filter(inv => (inv.type || 'Income') === 'Income')
      .reduce((acc, inv) => acc + (Number(inv.totalAmount) || Number(inv.amount?.toString().replace(/,/g, '')) || 0), 0);
    
    const expenses = data
      .filter(inv => inv.type === 'Expense' || inv.type === 'Scanned')
      .reduce((acc, inv) => acc + (Number(inv.totalAmount) || Number(inv.amount?.toString().replace(/,/g, '')) || 0), 0);

    const netCashflow = revenue - expenses;

    setStats({
      invoicesCount: data.length,
      totalRevenue: revenue,
      totalExpenses: expenses,
      netCashflow
    });

    // 2. Generate Revenue Trend (Last 6 Months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyRevenue = {};
    
    data.filter(inv => (inv.type || 'Income') === 'Income').forEach(inv => {
      const date = new Date(inv.createdAt || inv.date || Date.now());
      const month = monthNames[date.getMonth()];
      const amt = (Number(inv.totalAmount) || Number(inv.amount?.toString().replace(/,/g, '')) || 0);
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + amt;
    });

    const revTrend = Object.keys(monthlyRevenue).map(month => ({
      month,
      revenue: monthlyRevenue[month]
    }));
    setRevenueData(revTrend);

    // 3. Generate Expense Breakdown (By Vendor)
    const vendorExpenses = {};
    const colors = ['#6366F1', '#06B6D4', '#10B981', '#F43F5E', '#8B5CF6'];
    
    data.filter(inv => inv.type === 'Expense' || inv.type === 'Scanned').forEach(inv => {
      const vendor = inv.vendor?.name || inv.vendor || 'Other';
      const amt = (Number(inv.totalAmount) || Number(inv.amount?.toString().replace(/,/g, '')) || 0);
      vendorExpenses[vendor] = (vendorExpenses[vendor] || 0) + amt;
    });

    const totalSpent = Object.values(vendorExpenses).reduce((a, b) => a + b, 0);

    const expBreakdown = Object.keys(vendorExpenses).map((vendor, idx) => ({
      name: vendor,
      value: vendorExpenses[vendor],
      color: colors[idx % colors.length],
      percentage: totalSpent > 0 ? Math.round((vendorExpenses[vendor] / totalSpent) * 100) : 0
    }));
    setExpenseCategoryData(expBreakdown);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await axios.get('/api/v1/invoices', { withCredentials: true });
      processInvoiceData(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh dashboard data:', err);
      setError(err.response?.data?.message || 'Unable to connect to financial ledger. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [processInvoiceData]);

  useEffect(() => {
    let isSubscribed = true;
    axios.get('/api/v1/invoices', { withCredentials: true })
      .then(response => {
        if (!isSubscribed) return;
        processInvoiceData(response.data.data || []);
      })
      .catch(err => {
        if (!isSubscribed) return;
        console.error('Failed to fetch dashboard data:', err);
        setError(err.response?.data?.message || 'Unable to connect to financial ledger. Please try again.');
      })
      .finally(() => {
        if (!isSubscribed) return;
        setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [processInvoiceData]);

  if (isLoading) {
    return (
      <div className="space-y-8 pb-10">
        {/* Skeleton Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 w-56 bg-muted rounded-radius animate-pulse" />
            <div className="h-4 w-72 bg-surface-secondary rounded-radius animate-pulse" />
          </div>
          <div className="h-10 w-36 bg-muted rounded-radius animate-pulse" />
        </div>

        {/* Skeleton Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-20 bg-surface border border-border rounded-radius animate-pulse" />
          <div className="h-20 bg-surface border border-border rounded-radius animate-pulse" />
          <div className="h-20 bg-surface border border-border rounded-radius animate-pulse" />
        </div>

        {/* Skeleton Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="h-32 bg-surface border border-border rounded-radius animate-pulse" />
          <div className="h-32 bg-surface border border-border rounded-radius animate-pulse" />
          <div className="h-32 bg-surface border border-border rounded-radius animate-pulse" />
          <div className="h-32 bg-surface border border-border rounded-radius animate-pulse" />
        </div>

        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[430px] bg-surface border border-border rounded-radius animate-pulse" />
          <div className="h-[430px] bg-surface border border-border rounded-radius animate-pulse" />
        </div>

        {/* Skeleton Table */}
        <div className="h-64 bg-surface border border-border rounded-radius animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Dashboard Overview</h1>
          <p className="section-subtitle">Real-time ledger statements, AI data captures, and cashflow analytics.</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            leftIcon={RefreshCw}
            title="Refresh data"
            className="flex-1 sm:flex-none"
          >
            Sync
          </Button>
          <Button 
            onClick={() => navigate('/scan')}
            variant="primary"
            size="md"
            leftIcon={Scan}
            className="flex-1 sm:flex-none shadow-sm"
          >
            Scan AI Invoice
          </Button>
        </div>
      </div>

      {/* Error Alert Banner if fetch fails */}
      {error && (
        <div className="p-4 rounded-radius bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 flex items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleRefresh}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => navigate('/scan')}
          type="button"
          className="flex items-center justify-between p-4 bg-surface hover:bg-surface-secondary border border-border hover:border-primary/30 rounded-radius transition-all duration-200 group shadow-token text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-radius flex items-center justify-center group-hover:scale-105 transition-transform">
              <Scan size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Scan AI Invoice</p>
              <p className="text-[11px] text-muted-foreground font-medium">Vision OCR auto-ledger</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </button>

        <button 
          onClick={() => navigate('/generate')}
          type="button"
          className="flex items-center justify-between p-4 bg-surface hover:bg-surface-secondary border border-border hover:border-emerald-500/30 rounded-radius transition-all duration-200 group shadow-token text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-radius flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Write Invoice</p>
              <p className="text-[11px] text-muted-foreground font-medium">Generate draft PDF</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </button>

        <button 
          onClick={() => navigate('/expenses')}
          type="button"
          className="flex items-center justify-between p-4 bg-surface hover:bg-surface-secondary border border-border hover:border-rose-500/30 rounded-radius transition-all duration-200 group shadow-token text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-radius flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Outflows Tracker</p>
              <p className="text-[11px] text-muted-foreground font-medium">Manage monthly budget</p>
            </div>
          </div>
          <ArrowRight size={15} className="text-muted-foreground group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Financial Summary KPI Cards (4 Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹ ${stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} 
          subValue="Gross inflow" 
          icon={IndianRupee} 
          iconBg="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" 
          trendType="up"
          sparkColor="#10B981"
        />
        <StatCard 
          title="Total Expenses" 
          value={`₹ ${stats.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} 
          subValue="Ledger outflows" 
          icon={Wallet} 
          iconBg="bg-rose-500/10 text-rose-700 dark:text-rose-400" 
          trendType="down"
          sparkColor="#F43F5E"
        />
        <StatCard 
          title="Net Cashflow" 
          value={`${stats.netCashflow >= 0 ? '+' : '-'} ₹ ${Math.abs(stats.netCashflow).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} 
          subValue="Operating balance" 
          icon={Scale} 
          iconBg="bg-primary/10 text-primary" 
          trend={stats.netCashflow >= 0 ? 'Surplus' : 'Deficit'}
          trendType={stats.netCashflow >= 0 ? 'up' : 'down'}
          sparkColor="#6366F1"
        />
        <StatCard 
          title="Total Invoices" 
          value={stats.invoicesCount} 
          subValue="Recorded bills" 
          icon={FileText} 
          iconBg="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" 
          trendType="up"
          sparkColor="#6366F1"
        />
      </div>

      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Revenue Trend */}
        <Card className="flex flex-col h-[440px] border border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Monthly Revenue Overview</CardTitle>
                <CardDescription>Income trend captured from validated invoices</CardDescription>
              </div>
              <Badge variant="primary" className="text-[10px]">6 Months</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4 sm:p-6 pt-2">
            {revenueData.length > 0 ? (
              <div className="w-full h-full min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="finflowRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.28}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      vertical={false} 
                      stroke={resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.08)'} 
                    />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 500 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11, fontWeight: 500 }} 
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip 
                      content={<CustomChartTooltip resolvedTheme={resolvedTheme} />}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4F46E5" 
                      fillOpacity={1} 
                      fill="url(#finflowRevenue)" 
                      strokeWidth={2.5} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyStateCard 
                title="revenue trend" 
                actionLabel="Create First Invoice" 
                onAction={() => navigate('/generate')} 
              />
            )}
          </CardContent>
        </Card>

        {/* Expenses by Vendor Breakdown */}
        <Card className="flex flex-col h-[440px] border border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Expenses by Vendor</CardTitle>
                <CardDescription>Top outflow allocation and vendor distribution</CardDescription>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                ₹ {stats.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-4 sm:p-6 pt-2">
            {expenseCategoryData.length > 0 ? (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-52 h-52 relative flex items-center justify-center flex-shrink-0">
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Spent</p>
                    <p className="text-base sm:text-lg font-black text-foreground mt-1 font-display">
                      ₹{stats.totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={expenseCategoryData} 
                        dataKey="value" 
                        innerRadius={65} 
                        outerRadius={85} 
                        paddingAngle={3}
                      >
                        {expenseCategoryData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={<CustomChartTooltip resolvedTheme={resolvedTheme} />}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend list with clean percentage bars */}
                <div className="space-y-2.5 w-full sm:max-w-[210px] overflow-y-auto max-h-[220px] pr-1">
                  {expenseCategoryData.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground truncate max-w-[95px]" title={entry.name}>
                        {entry.name}
                      </span>
                      <span className="text-foreground ml-auto font-bold">
                        ₹{entry.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyStateCard 
                title="expense breakdown" 
                actionLabel="Scan bills via AI" 
                onAction={() => navigate('/scan')} 
              />
            )}
          </CardContent>
        </Card>

      </div>

      {/* Recent Activity / Ledger Table */}
      <Card className="border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Recent Ledger Transactions</CardTitle>
            <CardDescription>Most recent invoices captured and verified</CardDescription>
          </div>
          <Link 
            to="/invoices" 
            className="text-primary text-xs font-bold hover:underline transition-colors flex items-center gap-1 group"
          >
            All Ledger Records 
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <th className="py-3 px-5">Invoice ID</th>
                  <th className="py-3 px-5">Billing Contact</th>
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5 text-center">Date</th>
                  <th className="py-3 px-5 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((inv, idx) => {
                    const isExpense = inv.type === 'Expense' || inv.type === 'Scanned';
                    const status = inv.status || 'Unpaid';
                    const statusLabel = status === 'Unpaid' ? 'Pending' : status;
                    const invoiceId = inv.invoiceNumber || (inv._id || inv.id || "").toString().slice(-8).toUpperCase();
                    const vendorName = inv.vendor?.name || inv.vendor || inv.user || 'Acme Partner';
                    const formattedDate = inv.date ? new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

                    return (
                      <tr 
                        key={inv._id || inv.id || idx} 
                        className="group hover:bg-surface-secondary/40 transition-colors"
                      >
                        <td className="py-4 px-5">
                          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                            {invoiceId}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-semibold text-foreground">
                          {vendorName}
                        </td>
                        <td className="py-4 px-5">
                          <Badge variant={isExpense ? 'destructive' : 'success'}>
                            {inv.type === 'Scanned' ? 'Expense' : (inv.type || 'Income')}
                          </Badge>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <Badge 
                            variant={
                              status === 'Paid' 
                                ? 'success' 
                                : status === 'Overdue' 
                                  ? 'destructive' 
                                  : 'warning'
                            }
                          >
                            {statusLabel}
                          </Badge>
                        </td>
                        <td className={`py-4 px-5 font-bold text-right ${
                          isExpense ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {isExpense ? '-' : '+'} ₹{Number(inv.totalAmount || inv.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-5 text-muted-foreground text-center font-medium">
                          {formattedDate}
                        </td>
                        <td className="py-4 px-5 pr-6 text-right">
                          <button 
                            type="button"
                            onClick={() => navigate('/invoices', { state: { viewInvoiceId: inv._id || inv.id } })}
                            className="p-1.5 hover:bg-surface-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title="View Details"
                            aria-label={`View details for invoice ${invoiceId}`}
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center">
                      <EmptyStateCard 
                        title="recent ledger logs" 
                        actionLabel="Secure first upload" 
                        onAction={() => navigate('/scan')} 
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default Dashboard;

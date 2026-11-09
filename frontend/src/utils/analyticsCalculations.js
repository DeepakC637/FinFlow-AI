/**
 * FinFlow Analytics Calculation Engine
 * 
 * Strict immutable date-range semantics, financial metrics calculation,
 * and reconciliation algorithms.
 */

export const CATEGORY_COLORS = [
  '#4F46E5', // Indigo
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#F43F5E'  // Rose
];

export const TIME_RANGES = [
  'All Time',
  'This Week',
  'This Month',
  'This Quarter',
  'This Year'
];

/**
 * Parses a date value into an immutable Date object in the local calendar.
 * Supports ISO strings, YYYY-MM-DD, timestamps, and Date objects.
 */
export const parseLocalDate = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : new Date(dateVal.getTime());
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    // YYYY-MM-DD format parsed directly in local time to avoid UTC day-shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Formats a Date object as YYYY-MM-DD key.
 */
export const formatDateKey = (d) => {
  if (!d || isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a Date object as short date (e.g., '15 Oct').
 */
export const formatShortDate = (d) => {
  if (!d || isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/**
 * Returns exact start and end boundaries for each supported time range.
 * All calculations are immutable and preserve local timezone conventions.
 */
export const getDateRangeBoundaries = (timeRange, referenceDate = new Date()) => {
  const ref = parseLocalDate(referenceDate) || new Date();
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const date = ref.getDate();

  switch (timeRange) {
    case 'This Week': {
      // Exactly 7 calendar days inclusive: from 6 days ago 00:00:00 to reference date 23:59:59.999
      const startDate = new Date(year, month, date - 6, 0, 0, 0, 0);
      const endDate = new Date(year, month, date, 23, 59, 59, 999);
      return { startDate, endDate };
    }

    case 'This Month': {
      // Established 30 calendar days inclusive: from 29 days ago 00:00:00 to reference date 23:59:59.999
      const startDate = new Date(year, month, date - 29, 0, 0, 0, 0);
      const endDate = new Date(year, month, date, 23, 59, 59, 999);
      return { startDate, endDate };
    }

    case 'This Quarter': {
      // Current calendar quarter start to end
      // Q1: Jan 1 - Mar 31, Q2: Apr 1 - Jun 30, Q3: Jul 1 - Sep 30, Q4: Oct 1 - Dec 31
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const startDate = new Date(year, quarterStartMonth, 1, 0, 0, 0, 0);
      // Day 0 of next quarter's start month is the last day of this quarter
      const endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999);
      return { startDate, endDate };
    }

    case 'This Year': {
      // Full calendar year: Jan 1 00:00:00 to Dec 31 23:59:59.999
      const startDate = new Date(year, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
      return { startDate, endDate };
    }

    case 'All Time':
    default:
      return { startDate: null, endDate: null };
  }
};

/**
 * Filters invoice array based on the specified time range and reference date.
 * Guarantees immutability and precise boundary inclusion.
 */
export const filterInvoicesByDateRange = (invoices, timeRange, referenceDate = new Date()) => {
  if (!Array.isArray(invoices)) return [];
  if (timeRange === 'All Time') return [...invoices];

  const { startDate, endDate } = getDateRangeBoundaries(timeRange, referenceDate);
  if (!startDate || !endDate) return [...invoices];

  const startMs = startDate.getTime();
  const endMs = endDate.getTime();

  return invoices.filter((inv) => {
    if (!inv) return false;
    const rawDate = inv.date || inv.createdAt;
    const invDate = parseLocalDate(rawDate);
    if (!invDate) return false;
    const invMs = invDate.getTime();
    return invMs >= startMs && invMs <= endMs;
  });
};

/**
 * Extracts and sums numerical amount from an invoice record safely.
 */
export const getInvoiceAmount = (inv) => {
  if (!inv) return 0;
  const raw = inv.totalAmount ?? inv.amount ?? 0;
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
  const cleaned = String(raw).replace(/,/g, '').trim();
  const parsed = Number(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Calculates core financial KPIs from invoice records according to FinFlow's ledger rules.
 */
export const calculateFinancialMetrics = (invoices) => {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    return {
      expenses: [],
      incomeInvoices: [],
      totalExpenses: 0,
      totalIncome: 0,
      netCashflow: 0,
      avgExpense: 0,
      expenseCount: 0,
      incomeCount: 0,
    };
  }

  const expenses = [];
  const incomeInvoices = [];

  for (const inv of invoices) {
    if (!inv) continue;
    const type = inv.type || 'Income';
    if (type === 'Expense' || type === 'Scanned') {
      expenses.push(inv);
    } else {
      incomeInvoices.push(inv);
    }
  }

  const totalExpenses = expenses.reduce((sum, inv) => sum + getInvoiceAmount(inv), 0);
  const totalIncome = incomeInvoices.reduce((sum, inv) => sum + getInvoiceAmount(inv), 0);
  const netCashflow = totalIncome - totalExpenses;
  const expenseCount = expenses.length;
  const incomeCount = incomeInvoices.length;

  // Average Outflow: total outflow divided by the number of expense transactions
  const avgExpense = expenseCount > 0 ? Math.round(totalExpenses / expenseCount) : 0;

  return {
    expenses,
    incomeInvoices,
    totalExpenses,
    totalIncome,
    netCashflow,
    avgExpense,
    expenseCount,
    incomeCount,
  };
};

/**
 * Generates category breakdown with totals, counts, and reconciled percentages.
 */
export const generateCategoryBreakdown = (expenses, totalExpenses) => {
  if (!Array.isArray(expenses) || expenses.length === 0) return [];

  const categoryMap = new Map();

  for (const inv of expenses) {
    const cat = inv.category || 'Other';
    const amt = getInvoiceAmount(inv);
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { name: cat, value: 0, count: 0 });
    }
    const entry = categoryMap.get(cat);
    entry.value += amt;
    entry.count += 1;
  }

  const entries = Array.from(categoryMap.values())
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  return entries.map((entry, idx) => ({
    ...entry,
    color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    percentage: totalExpenses > 0 ? ((entry.value / totalExpenses) * 100).toFixed(1) : '0.0',
  }));
};

/**
 * Generates timeline data for area charts.
 * 
 * Annual view shows intended elapsed/active periods without implying future months contain activity.
 * All other views show complete chronological data without arbitrary truncation.
 */
export const generateTrendsData = (filteredInvoices, timeRange, referenceDate = new Date()) => {
  if (!Array.isArray(filteredInvoices) || filteredInvoices.length === 0) return [];

  const ref = parseLocalDate(referenceDate) || new Date();
  const year = ref.getFullYear();
  const month = ref.getMonth();
  const date = ref.getDate();

  if (timeRange === 'This Week') {
    // 7 consecutive chronological daily slots
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(year, month, date - i);
      days.push({
        key: formatDateKey(d),
        period: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        expenses: 0,
        income: 0,
      });
    }

    const map = new Map(days.map((item) => [item.key, item]));
    filteredInvoices.forEach((inv) => {
      const d = parseLocalDate(inv.date || inv.createdAt);
      if (!d) return;
      const key = formatDateKey(d);
      const target = map.get(key);
      if (target) {
        const amt = getInvoiceAmount(inv);
        if (inv.type === 'Expense' || inv.type === 'Scanned') {
          target.expenses += amt;
        } else {
          target.income += amt;
        }
      }
    });

    return days.map((d) => ({
      ...d,
      amount: d.expenses,
    }));
  }

  if (timeRange === 'This Month') {
    // 30 consecutive chronological daily slots
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(year, month, date - i);
      days.push({
        key: formatDateKey(d),
        period: formatShortDate(d),
        expenses: 0,
        income: 0,
      });
    }

    const map = new Map(days.map((item) => [item.key, item]));
    filteredInvoices.forEach((inv) => {
      const d = parseLocalDate(inv.date || inv.createdAt);
      if (!d) return;
      const key = formatDateKey(d);
      const target = map.get(key);
      if (target) {
        const amt = getInvoiceAmount(inv);
        if (inv.type === 'Expense' || inv.type === 'Scanned') {
          target.expenses += amt;
        } else {
          target.income += amt;
        }
      }
    });

    return days.map((d) => ({
      ...d,
      amount: d.expenses,
    }));
  }

  if (timeRange === 'This Year') {
    // Display annual periods without implying future months contain actual activity.
    // Display months up to current elapsed month, or up to the latest month containing actual transactions.
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let maxMonthIndex = month; // at least up to reference month

    filteredInvoices.forEach((inv) => {
      const d = parseLocalDate(inv.date || inv.createdAt);
      if (d && d.getFullYear() === year && d.getMonth() > maxMonthIndex) {
        maxMonthIndex = d.getMonth();
      }
    });

    const activeMonthNames = monthNames.slice(0, maxMonthIndex + 1);
    const months = activeMonthNames.map((name) => ({
      period: name,
      expenses: 0,
      income: 0,
    }));

    filteredInvoices.forEach((inv) => {
      const d = parseLocalDate(inv.date || inv.createdAt);
      if (!d || d.getFullYear() !== year) return;
      const mIdx = d.getMonth();
      if (mIdx <= maxMonthIndex && months[mIdx]) {
        const amt = getInvoiceAmount(inv);
        if (inv.type === 'Expense' || inv.type === 'Scanned') {
          months[mIdx].expenses += amt;
        } else {
          months[mIdx].income += amt;
        }
      }
    });

    return months.map((m) => ({
      ...m,
      amount: m.expenses,
    }));
  }

  // All Time & This Quarter: Complete chronological timeline without truncation
  const dateMap = new Map();
  filteredInvoices.forEach((inv) => {
    const d = parseLocalDate(inv.date || inv.createdAt);
    if (!d) return;
    const key = formatDateKey(d);
    if (!dateMap.has(key)) {
      dateMap.set(key, {
        date: d,
        key,
        period: formatShortDate(d),
        expenses: 0,
        income: 0,
      });
    }
    const item = dateMap.get(key);
    const amt = getInvoiceAmount(inv);
    if (inv.type === 'Expense' || inv.type === 'Scanned') {
      item.expenses += amt;
    } else {
      item.income += amt;
    }
  });

  const sorted = Array.from(dateMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  return sorted.map((item) => ({
    period: item.period,
    expenses: item.expenses,
    income: item.income,
    amount: item.expenses,
  }));
};

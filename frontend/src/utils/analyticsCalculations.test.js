import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLocalDate,
  formatDateKey,
  formatShortDate,
  getDateRangeBoundaries,
  filterInvoicesByDateRange,
  getInvoiceAmount,
  calculateFinancialMetrics,
  generateCategoryBreakdown,
  generateTrendsData
} from './analyticsCalculations.js';

// Deterministic Reference Date: 2026-10-22T12:00:00 (Q4 of 2026)
const REF_DATE = new Date(2026, 9, 22, 12, 0, 0, 0); // Month 9 is October (0-indexed)

test('1. Date Parsing & Formatting', async (t) => {
  await t.test('parses YYYY-MM-DD in local time without UTC day shift', () => {
    const d = parseLocalDate('2026-10-22');
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 9); // October
    assert.equal(d.getDate(), 22);
  });

  await t.test('parses ISO timestamps', () => {
    const d = parseLocalDate('2026-10-22T10:30:00.000Z');
    assert.ok(d instanceof Date);
    assert.equal(isNaN(d.getTime()), false);
  });

  await t.test('handles invalid dates and nulls gracefully', () => {
    assert.equal(parseLocalDate(null), null);
    assert.equal(parseLocalDate(''), null);
    assert.equal(parseLocalDate('invalid-date'), null);
  });

  await t.test('formats date keys and short dates', () => {
    const d = new Date(2026, 9, 5);
    assert.equal(formatDateKey(d), '2026-10-05');
    assert.ok(formatShortDate(d).includes('5') && formatShortDate(d).includes('Oct'));
  });

  await t.test('safely extracts and sanitizes invoice amount', () => {
    assert.equal(getInvoiceAmount({ totalAmount: 5000 }), 5000);
    assert.equal(getInvoiceAmount({ totalAmount: '12,500' }), 12500);
    assert.equal(getInvoiceAmount({ amount: '3,200.50' }), 3200.5);
    assert.equal(getInvoiceAmount(null), 0);
    assert.equal(getInvoiceAmount({}), 0);
  });
});

test('2. Date-Range Boundaries & Semantics', async (t) => {
  await t.test('This Week produces exactly 7 calendar days inclusive', () => {
    const { startDate, endDate } = getDateRangeBoundaries('This Week', REF_DATE);
    // Reference is 2026-10-22. 6 days before is 2026-10-16.
    assert.equal(startDate.getFullYear(), 2026);
    assert.equal(startDate.getMonth(), 9);
    assert.equal(startDate.getDate(), 16);
    assert.equal(startDate.getHours(), 0);
    assert.equal(startDate.getMinutes(), 0);

    assert.equal(endDate.getFullYear(), 2026);
    assert.equal(endDate.getMonth(), 9);
    assert.equal(endDate.getDate(), 22);
    assert.equal(endDate.getHours(), 23);
    assert.equal(endDate.getMinutes(), 59);

    const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 7);
  });

  await t.test('This Month produces exactly 30 calendar days inclusive', () => {
    const { startDate, endDate } = getDateRangeBoundaries('This Month', REF_DATE);
    // Reference is 2026-10-22. 29 days before is 2026-09-23.
    assert.equal(startDate.getFullYear(), 2026);
    assert.equal(startDate.getMonth(), 8); // September
    assert.equal(startDate.getDate(), 23);

    assert.equal(endDate.getFullYear(), 2026);
    assert.equal(endDate.getMonth(), 9); // October
    assert.equal(endDate.getDate(), 22);

    const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
    assert.equal(diffDays, 30);
  });

  await t.test('This Quarter produces correct calendar quarter start/end boundaries (Q4)', () => {
    const { startDate, endDate } = getDateRangeBoundaries('This Quarter', REF_DATE);
    // Q4 is October 1 to December 31
    assert.equal(startDate.getFullYear(), 2026);
    assert.equal(startDate.getMonth(), 9); // October
    assert.equal(startDate.getDate(), 1);
    assert.equal(startDate.getHours(), 0);
    assert.equal(startDate.getMinutes(), 0);

    assert.equal(endDate.getFullYear(), 2026);
    assert.equal(endDate.getMonth(), 11); // December
    assert.equal(endDate.getDate(), 31);
    assert.equal(endDate.getHours(), 23);
    assert.equal(endDate.getMinutes(), 59);
  });

  await t.test('This Quarter produces correct boundaries for Q1 including leap year calculation', () => {
    const leapQ1Ref = new Date(2024, 1, 15); // Feb 15, 2024 (leap year)
    const { startDate, endDate } = getDateRangeBoundaries('This Quarter', leapQ1Ref);
    assert.equal(startDate.getMonth(), 0); // January 1
    assert.equal(startDate.getDate(), 1);
    assert.equal(endDate.getMonth(), 2); // March 31
    assert.equal(endDate.getDate(), 31);
  });

  await t.test('This Year produces full calendar year boundaries', () => {
    const { startDate, endDate } = getDateRangeBoundaries('This Year', REF_DATE);
    assert.equal(startDate.getFullYear(), 2026);
    assert.equal(startDate.getMonth(), 0); // Jan
    assert.equal(startDate.getDate(), 1);

    assert.equal(endDate.getFullYear(), 2026);
    assert.equal(endDate.getMonth(), 11); // Dec
    assert.equal(endDate.getDate(), 31);
  });
});

test('3. Test Item: Date outside current quarter vs inside All-Time', () => {
  const sampleInvoices = [
    { _id: '1', invoiceNumber: 'INV-01', totalAmount: 5000, type: 'Expense', date: '2026-08-15' }, // Q3 (outside Q4)
    { _id: '2', invoiceNumber: 'INV-02', totalAmount: 12000, type: 'Expense', date: '2026-10-10' }, // Q4 (inside Q4)
  ];

  const quarterFiltered = filterInvoicesByDateRange(sampleInvoices, 'This Quarter', REF_DATE);
  assert.equal(quarterFiltered.length, 1);
  assert.equal(quarterFiltered[0]._id, '2');

  const allTimeFiltered = filterInvoicesByDateRange(sampleInvoices, 'All Time', REF_DATE);
  assert.equal(allTimeFiltered.length, 2);
});

test('4. Test Item: Transactions on the quarter\'s first and last dates', () => {
  const sampleInvoices = [
    { _id: 'q-first', totalAmount: 1000, type: 'Expense', date: '2026-10-01T00:00:00.000' },
    { _id: 'q-last', totalAmount: 2000, type: 'Expense', date: '2026-12-31T23:59:59.999' },
  ];

  const filtered = filterInvoicesByDateRange(sampleInvoices, 'This Quarter', REF_DATE);
  assert.equal(filtered.length, 2);
  assert.equal(filtered.some(i => i._id === 'q-first'), true);
  assert.equal(filtered.some(i => i._id === 'q-last'), true);
});

test('5. Test Item: Transactions at quarter boundaries (inclusive / exclusive)', () => {
  const sampleInvoices = [
    { _id: 'q3-last-ms', totalAmount: 500, type: 'Expense', date: '2026-09-30T23:59:59.999' }, // Q3 boundary
    { _id: 'q4-first-ms', totalAmount: 1500, type: 'Expense', date: '2026-10-01T00:00:00.000' }, // Q4 start
    { _id: 'q4-last-ms', totalAmount: 2500, type: 'Expense', date: '2026-12-31T23:59:59.999' }, // Q4 end
    { _id: 'q1-next-ms', totalAmount: 3500, type: 'Expense', date: '2027-01-01T00:00:00.000' }, // Next year start
  ];

  const filtered = filterInvoicesByDateRange(sampleInvoices, 'This Quarter', REF_DATE);
  assert.equal(filtered.length, 2);
  assert.deepEqual(filtered.map(i => i._id), ['q4-first-ms', 'q4-last-ms']);
});

test('6. Test Item: Current-year future months handling', () => {
  // REF_DATE is October 2026 (month 9)
  // When no future months contain transactions, trends should only show Jan - Oct (not Nov/Dec with flat 0s)
  const pastInvoices = [
    { _id: 'jan', totalAmount: 1000, type: 'Expense', date: '2026-01-10' },
    { _id: 'oct', totalAmount: 3000, type: 'Expense', date: '2026-10-05' },
  ];

  const trendsNoFuture = generateTrendsData(pastInvoices, 'This Year', REF_DATE);
  assert.equal(trendsNoFuture.length, 10); // Jan through Oct (10 months)
  assert.equal(trendsNoFuture[0].period, 'Jan');
  assert.equal(trendsNoFuture[9].period, 'Oct');
  assert.equal(trendsNoFuture.some(m => m.period === 'Nov'), false);
  assert.equal(trendsNoFuture.some(m => m.period === 'Dec'), false);

  // If a future invoice is booked for November 2026, it should be displayed up to November
  const withNovInvoice = [
    ...pastInvoices,
    { _id: 'nov', totalAmount: 4000, type: 'Expense', date: '2026-11-15' }
  ];

  const trendsWithNov = generateTrendsData(withNovInvoice, 'This Year', REF_DATE);
  assert.equal(trendsWithNov.length, 11); // Jan through Nov (11 months)
  assert.equal(trendsWithNov[10].period, 'Nov');
  assert.equal(trendsWithNov[10].expenses, 4000);
  assert.equal(trendsWithNov.some(m => m.period === 'Dec'), false); // December still not padded
});

test('7. Test Item: Zero transactions and zero outflow', () => {
  const metrics = calculateFinancialMetrics([]);
  assert.equal(metrics.totalExpenses, 0);
  assert.equal(metrics.totalIncome, 0);
  assert.equal(metrics.netCashflow, 0);
  assert.equal(metrics.avgExpense, 0);
  assert.equal(metrics.expenseCount, 0);
  assert.equal(metrics.incomeCount, 0);

  const categories = generateCategoryBreakdown([], 0);
  assert.deepEqual(categories, []);

  const trends = generateTrendsData([], 'This Month', REF_DATE);
  assert.deepEqual(trends, []);
});

test('8. Test Item: Paid, unpaid, and pending invoice statuses', () => {
  const mixedStatusInvoices = [
    { _id: '1', totalAmount: 2000, type: 'Expense', status: 'Paid', date: '2026-10-02' },
    { _id: '2', totalAmount: 3500, type: 'Expense', status: 'Unpaid', date: '2026-10-05' },
    { _id: '3', totalAmount: 1500, type: 'Expense', status: 'Pending', date: '2026-10-10' },
    { _id: '4', totalAmount: 5000, type: 'Expense', status: 'Overdue', date: '2026-10-12' },
    { _id: '5', totalAmount: 10000, type: 'Income', status: 'Paid', date: '2026-10-15' },
  ];

  const metrics = calculateFinancialMetrics(mixedStatusInvoices);
  // All expense invoices (2000 + 3500 + 1500 + 5000) = 12000
  assert.equal(metrics.totalExpenses, 12000);
  assert.equal(metrics.totalIncome, 10000);
  assert.equal(metrics.netCashflow, -2000);
  assert.equal(metrics.expenseCount, 4);
  // Average per expense transaction: 12000 / 4 = 3000
  assert.equal(metrics.avgExpense, 3000);
});

test('9. Test Item: Reconciliation between filtered records and displayed totals', () => {
  const complexLedger = [
    { _id: '1', totalAmount: '4,500', type: 'Expense', category: 'Software & SaaS', date: '2026-10-05' },
    { _id: '2', amount: 1500, type: 'Scanned', category: 'Meals & Entertainment', date: '2026-10-08' },
    { _id: '3', totalAmount: 8000, type: 'Income', category: 'Consulting', date: '2026-10-10' },
    { _id: '4', totalAmount: 2000, type: 'Expense', category: 'Software & SaaS', date: '2026-10-14' },
  ];

  const metrics = calculateFinancialMetrics(complexLedger);
  assert.equal(metrics.totalExpenses, 8000); // 4500 + 1500 + 2000
  assert.equal(metrics.totalIncome, 8000);
  assert.equal(metrics.netCashflow, 0);
  assert.equal(metrics.avgExpense, Math.round(8000 / 3)); // 2667

  const categories = generateCategoryBreakdown(metrics.expenses, metrics.totalExpenses);
  const categorySum = categories.reduce((sum, c) => sum + c.value, 0);
  assert.equal(categorySum, metrics.totalExpenses);

  const saasCat = categories.find(c => c.name === 'Software & SaaS');
  assert.ok(saasCat);
  assert.equal(saasCat.value, 6500);
  assert.equal(saasCat.count, 2);
  assert.equal(saasCat.percentage, ((6500 / 8000) * 100).toFixed(1));
});

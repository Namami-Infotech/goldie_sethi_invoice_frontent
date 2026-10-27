import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Search,
  RefreshCw,
  TrendingUp,
  Receipt,
  Layers,
  IndianRupee,
  Filter,
  ExternalLink
} from 'lucide-react';
import { invoiceService } from '../services/api';

// Indian GST State Code mapping
const STATE_CODES = {
  'jammu and kashmir': '01',
  'jammu & kashmir': '01',
  'himachal pradesh': '02',
  'punjab': '03',
  'chandigarh': '04',
  'uttarakhand': '05',
  'haryana': '06',
  'delhi': '07',
  'rajasthan': '08',
  'uttar pradesh': '09',
  'bihar': '10',
  'sikkim': '11',
  'arunachal pradesh': '12',
  'nagaland': '13',
  'manipur': '14',
  'mizoram': '15',
  'tripura': '16',
  'meghalaya': '17',
  'assam': '18',
  'west bengal': '19',
  'jharkhand': '20',
  'odisha': '21',
  'chhattisgarh': '22',
  'madhya pradesh': '23',
  'gujarat': '24',
  'dadra and nagar haveli and daman and diu': '26',
  'maharashtra': '27',
  'andhra pradesh': '28',
  'karnataka': '29',
  'goa': '30',
  'lakshadweep': '31',
  'kerala': '32',
  'tamil nadu': '33',
  'puducherry': '34',
  'andaman and nicobar islands': '35',
  'telangana': '36',
  'andhra pradesh (new)': '37',
  'ladakh': '38'
};

function getStateWithCode(stateName) {
  if (!stateName) return '—';
  const clean = String(stateName).trim().toLowerCase();
  const code = STATE_CODES[clean] || '';
  return code ? `${stateName} (${code})` : stateName;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const yr = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${yr}`;
  } catch {
    return String(dateStr);
  }
}

function formatCurrency(num) {
  const n = Number(num) || 0;
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function GstReports({ companySetting, onSelectInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('hsn'); // 'sales' | 'hsn' | 'summary'
  const [period, setPeriod] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceService.getAll('', '');
      if (res.data?.success) {
        setInvoices(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load invoices for GST reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filter invoices by Period and Search
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return invoices.filter((inv) => {
      // Period filter
      if (inv.invoiceDate) {
        const invDate = new Date(inv.invoiceDate);
        if (!isNaN(invDate.getTime())) {
          if (period === 'this_month') {
            if (invDate.getFullYear() !== currentYear || invDate.getMonth() !== currentMonth) {
              return false;
            }
          } else if (period === 'last_month') {
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
            if (invDate.getFullYear() !== lastMonthYear || invDate.getMonth() !== lastMonth) {
              return false;
            }
          } else if (period === 'this_quarter') {
            const currentQuarter = Math.floor(currentMonth / 3);
            const invQuarter = Math.floor(invDate.getMonth() / 3);
            if (invDate.getFullYear() !== currentYear || invQuarter !== currentQuarter) {
              return false;
            }
          } else if (period === 'this_fy') {
            const fyStartYear = currentMonth >= 3 ? currentYear : currentYear - 1;
            const fyStart = new Date(fyStartYear, 3, 1);
            const fyEnd = new Date(fyStartYear + 1, 2, 31, 23, 59, 59);
            if (invDate < fyStart || invDate > fyEnd) {
              return false;
            }
          } else if (period === 'custom') {
            if (customStart) {
              const start = new Date(customStart);
              if (invDate < start) return false;
            }
            if (customEnd) {
              const end = new Date(customEnd);
              end.setHours(23, 59, 59, 999);
              if (invDate > end) return false;
            }
          }
        }
      }

      // Search filter
      if (search.trim()) {
        const term = search.toLowerCase().trim();
        const numMatch = (inv.invoiceNumber || '').toLowerCase().includes(term);
        const custMatch = (inv.customerName || '').toLowerCase().includes(term);
        const stateMatch = (inv.customerState || '').toLowerCase().includes(term);
        const gstinMatch = (inv.customerGstin || '').toLowerCase().includes(term);
        const itemMatch = (inv.items || []).some(
          (it) =>
            (it.hsnSac || '').toLowerCase().includes(term) ||
            (it.itemName || '').toLowerCase().includes(term)
        );
        return numMatch || custMatch || stateMatch || gstinMatch || itemMatch;
      }

      return true;
    });
  }, [invoices, period, customStart, customEnd, search]);

  // Overall Sales Metrics Calculation
  const metrics = useMemo(() => {
    let taxable = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let totalTax = 0;
    let grandTotal = 0;

    filteredInvoices.forEach((inv) => {
      taxable += Number(inv.subtotal) || 0;
      cgst += Number(inv.totalCgst) || 0;
      sgst += Number(inv.totalSgst) || 0;
      igst += Number(inv.totalIgst) || 0;
      totalTax += Number(inv.totalTax) || 0;
      grandTotal += Number(inv.grandTotal) || 0;
    });

    return {
      count: filteredInvoices.length,
      taxable,
      cgst,
      sgst,
      igst,
      totalTax,
      grandTotal
    };
  }, [filteredInvoices]);

  // HSN Aggregation (Table 12)
  const hsnSummary = useMemo(() => {
    const map = {};

    filteredInvoices.forEach((inv) => {
      const isSameState = Boolean(inv.isSameState);

      (inv.items || []).forEach((item) => {
        const code = (item.hsnSac || 'OTHER').trim() || 'OTHER';
        if (!map[code]) {
          map[code] = {
            hsnSac: code,
            itemName: item.itemName || 'Goods / Service',
            unit: (item.unit || 'PCS').toUpperCase(),
            qty: 0,
            totalValue: 0,
            taxableValue: 0,
            igst: 0,
            cgst: 0,
            sgst: 0,
            totalTax: 0
          };
        }

        const qty = Number(item.qty) || 0;
        const taxable = Number(item.taxableAmount) || 0;
        const cgstAmt = Number(item.cgstAmount) || 0;
        const sgstAmt = Number(item.sgstAmount) || 0;
        const igstAmt = Number(item.igstAmount) || 0;
        const tot = Number(item.totalAmount) || (taxable + cgstAmt + sgstAmt + igstAmt);

        map[code].qty += qty;
        map[code].taxableValue += taxable;
        map[code].cgst += cgstAmt;
        map[code].sgst += sgstAmt;
        map[code].igst += igstAmt;
        map[code].totalTax += cgstAmt + sgstAmt + igstAmt;
        map[code].totalValue += tot;
      });
    });

    return Object.values(map).sort((a, b) => b.taxableValue - a.taxableValue);
  }, [filteredInvoices]);

  // HSN Totals for Summary Cards & Table Footer
  const hsnTotals = useMemo(() => {
    let uniqueCount = hsnSummary.length;
    let totalQty = 0;
    let totalValue = 0;
    let taxableValue = 0;
    let igst = 0;
    let cgst = 0;
    let sgst = 0;
    let totalTax = 0;

    hsnSummary.forEach((h) => {
      totalQty += h.qty;
      totalValue += h.totalValue;
      taxableValue += h.taxableValue;
      igst += h.igst;
      cgst += h.cgst;
      sgst += h.sgst;
      totalTax += h.totalTax;
    });

    return {
      uniqueCount,
      totalQty,
      totalValue,
      taxableValue,
      igst,
      cgst,
      sgst,
      totalTax
    };
  }, [hsnSummary]);

  // Rate Slabs Segregation (5%, 12%, 18%, 28%)
  const rateSlabs = useMemo(() => {
    const standardRates = [5, 12, 18, 28];
    const map = {};

    standardRates.forEach((rate) => {
      map[rate] = {
        rate,
        label: `${rate}% GST`,
        intraTaxable: 0,
        cgst: 0,
        sgst: 0,
        interTaxable: 0,
        igst: 0,
        totalTaxable: 0,
        totalLiability: 0
      };
    });

    filteredInvoices.forEach((inv) => {
      const isSameState = Boolean(inv.isSameState);

      (inv.items || []).forEach((item) => {
        const rate = Number(item.gstRate) || 0;
        if (!map[rate]) {
          map[rate] = {
            rate,
            label: `${rate}% GST`,
            intraTaxable: 0,
            cgst: 0,
            sgst: 0,
            interTaxable: 0,
            igst: 0,
            totalTaxable: 0,
            totalLiability: 0
          };
        }

        const taxable = Number(item.taxableAmount) || 0;
        const cgstAmt = Number(item.cgstAmount) || 0;
        const sgstAmt = Number(item.sgstAmount) || 0;
        const igstAmt = Number(item.igstAmount) || 0;

        if (isSameState) {
          map[rate].intraTaxable += taxable;
          map[rate].cgst += cgstAmt;
          map[rate].sgst += sgstAmt;
        } else {
          map[rate].interTaxable += taxable;
          map[rate].igst += igstAmt;
        }

        map[rate].totalTaxable += taxable;
        map[rate].totalLiability += cgstAmt + sgstAmt + igstAmt;
      });
    });

    return Object.values(map).sort((a, b) => a.rate - b.rate);
  }, [filteredInvoices]);

  const rateSlabsTotal = useMemo(() => {
    let intraTaxable = 0;
    let cgst = 0;
    let sgst = 0;
    let interTaxable = 0;
    let igst = 0;
    let totalTaxable = 0;
    let totalLiability = 0;

    rateSlabs.forEach((s) => {
      intraTaxable += s.intraTaxable;
      cgst += s.cgst;
      sgst += s.sgst;
      interTaxable += s.interTaxable;
      igst += s.igst;
      totalTaxable += s.totalTaxable;
      totalLiability += s.totalLiability;
    });

    return {
      intraTaxable,
      cgst,
      sgst,
      interTaxable,
      igst,
      totalTaxable,
      totalLiability
    };
  }, [rateSlabs]);

  // CSV Export Handler
  const handleExportCSV = () => {
    let rows = [];
    let filename = `GST_Report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeSubTab === 'sales') {
      filename = `GST_Sales_Register_${new Date().toISOString().slice(0, 10)}.csv`;
      rows.push([
        'SL',
        'Invoice No',
        'Date',
        'Customer Name',
        'GSTIN',
        'POS State',
        'Taxable (INR)',
        'CGST (INR)',
        'SGST (INR)',
        'IGST (INR)',
        'Total Tax (INR)',
        'Invoice Total (INR)',
        'Status'
      ]);

      filteredInvoices.forEach((inv, idx) => {
        rows.push([
          idx + 1,
          `"${inv.invoiceNumber || ''}"`,
          `"${formatDate(inv.invoiceDate)}"`,
          `"${(inv.customerName || '').replace(/"/g, '""')}"`,
          `"${inv.customerGstin || ''}"`,
          `"${(inv.customerState || '').replace(/"/g, '""')}"`,
          (Number(inv.subtotal) || 0).toFixed(2),
          (Number(inv.totalCgst) || 0).toFixed(2),
          (Number(inv.totalSgst) || 0).toFixed(2),
          (Number(inv.totalIgst) || 0).toFixed(2),
          (Number(inv.totalTax) || 0).toFixed(2),
          (Number(inv.grandTotal) || 0).toFixed(2),
          inv.status || 'PAID'
        ]);
      });

      rows.push([
        'TOTAL',
        '',
        '',
        '',
        '',
        '',
        metrics.taxable.toFixed(2),
        metrics.cgst.toFixed(2),
        metrics.sgst.toFixed(2),
        metrics.igst.toFixed(2),
        metrics.totalTax.toFixed(2),
        metrics.grandTotal.toFixed(2),
        ''
      ]);
    } else if (activeSubTab === 'hsn') {
      filename = `Table_12_HSN_Summary_${new Date().toISOString().slice(0, 10)}.csv`;
      rows.push([
        'SL',
        'HSN / SAC',
        'DESCRIPTION OF GOODS',
        'UQC / UNIT',
        'TOTAL QTY',
        'TOTAL VALUE (INR)',
        'TAXABLE VALUE (INR)',
        'IGST (INR)',
        'CGST (INR)',
        'SGST (INR)',
        'TOTAL TAX (INR)'
      ]);

      hsnSummary.forEach((h, idx) => {
        rows.push([
          idx + 1,
          `"${h.hsnSac}"`,
          `"${(h.itemName || '').replace(/"/g, '""')}"`,
          `"${h.unit}"`,
          h.qty,
          h.totalValue.toFixed(2),
          h.taxableValue.toFixed(2),
          h.igst.toFixed(2),
          h.cgst.toFixed(2),
          h.sgst.toFixed(2),
          h.totalTax.toFixed(2)
        ]);
      });

      rows.push([
        'TOTAL',
        '',
        '',
        '',
        hsnTotals.totalQty,
        hsnTotals.totalValue.toFixed(2),
        hsnTotals.taxableValue.toFixed(2),
        hsnTotals.igst.toFixed(2),
        hsnTotals.cgst.toFixed(2),
        hsnTotals.sgst.toFixed(2),
        hsnTotals.totalTax.toFixed(2)
      ]);
    } else {
      filename = `GST_Tax_Liability_${new Date().toISOString().slice(0, 10)}.csv`;
      rows.push([
        'GST Rate Slab',
        'Intra Taxable (INR)',
        'CGST (INR)',
        'SGST (INR)',
        'Inter Taxable (INR)',
        'IGST (INR)',
        'Total Taxable Turnover (INR)',
        'Total Tax Liability (INR)'
      ]);

      rateSlabs.forEach((s) => {
        rows.push([
          `"${s.label}"`,
          s.intraTaxable.toFixed(2),
          s.cgst.toFixed(2),
          s.sgst.toFixed(2),
          s.interTaxable.toFixed(2),
          s.igst.toFixed(2),
          s.totalTaxable.toFixed(2),
          s.totalLiability.toFixed(2)
        ]);
      });

      rows.push([
        'TOTAL LIABILITY',
        rateSlabsTotal.intraTaxable.toFixed(2),
        rateSlabsTotal.cgst.toFixed(2),
        rateSlabsTotal.sgst.toFixed(2),
        rateSlabsTotal.interTaxable.toFixed(2),
        rateSlabsTotal.igst.toFixed(2),
        rateSlabsTotal.totalTaxable.toFixed(2),
        rateSlabsTotal.totalLiability.toFixed(2)
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* Printable Report Header */}
      <div className="hidden print:block border-b border-slate-300 pb-3 mb-3">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {companySetting?.companyName || 'Goldie Sethi'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {companySetting?.fullAddress || ''}{' '}
              {companySetting?.city ? `${companySetting.city}, ` : ''}
              {companySetting?.state || ''}
            </p>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              GSTIN: {companySetting?.gstin || 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-indigo-700 uppercase">
              {activeSubTab === 'sales'
                ? 'GST Sales Register'
                : activeSubTab === 'hsn'
                ? 'Table 12: HSN-Wise Summary'
                : 'GST Summary & Tax Liability'}
            </span>
            <p className="text-xs text-slate-500 mt-1">Generated: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Top Header Pill Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 no-print">
        {/* Subtabs Button Group */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('sales')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'sales'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
            <span>1. GST Sales Report</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSubTab === 'sales'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {filteredInvoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('hsn')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'hsn'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5 flex-shrink-0" />
            <span>2. HSN/SAC Summary</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSubTab === 'hsn'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {hsnSummary.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('summary')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'summary'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
            <span>3. GST Summary / Tax Liability</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 h-8 px-2.5 rounded-lg border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-700 text-[11px] font-semibold transition-all shadow-2xs hover:border-emerald-400 cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3 h-3 text-emerald-600" />
            <span>
              {activeSubTab === 'hsn'
                ? 'Export Table 12 CSV'
                : activeSubTab === 'summary'
                ? 'Export Liability CSV'
                : 'Export Sales CSV'}
            </span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center space-x-1.5 h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-all shadow-2xs cursor-pointer"
            title="Print GST Report"
          >
            <Printer className="w-3 h-3" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Period, Search, and Refresh */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2.5 no-print">
        {/* Period Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
            <Filter className="w-3 h-3 text-indigo-500" />
            <span>Period:</span>
          </div>

          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-8 pl-2.5 pr-7 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
            >
              <option value="all">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_quarter">This Quarter</option>
              <option value="this_fy">This Financial Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {period === 'custom' && (
            <div className="flex items-center space-x-1.5">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="From"
              />
              <span className="text-[11px] text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 px-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="To"
              />
            </div>
          )}
        </div>

        {/* Search Bar & Refresh */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inv #, customer, HSN..."
              className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={fetchInvoices}
            disabled={loading}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS BASED ON ACTIVE TAB */}
      {activeSubTab === 'hsn' ? (
        /* 4 Cards for HSN/SAC Summary (Matching Screenshot) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Unique HSN Codes
            </p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">
              {hsnTotals.uniqueCount}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Categories reported</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Total Quantity Sold
            </p>
            <p className="text-xl font-extrabold text-indigo-600 mt-0.5">
              {hsnTotals.totalQty}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Units aggregated</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Total Taxable Value
            </p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">
              ₹ {formatCurrency(hsnTotals.taxableValue)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Net taxable base</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-emerald-200/90 shadow-2xs ring-1 ring-emerald-500/15">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
              Total Tax Amount
            </p>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
              ₹ {formatCurrency(hsnTotals.totalTax)}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Total GST on HSN</p>
          </div>
        </div>
      ) : activeSubTab === 'summary' ? (
        /* 4 Cards for Tax Liability (Matching Screenshot) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Output CGST Liability
            </p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">
              ₹ {formatCurrency(metrics.cgst)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Central tax payable</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Output SGST Liability
            </p>
            <p className="text-xl font-extrabold text-slate-800 mt-0.5">
              ₹ {formatCurrency(metrics.sgst)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">State / UT tax payable</p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Output IGST Liability
            </p>
            <p className="text-xl font-extrabold text-indigo-600 mt-0.5">
              ₹ {formatCurrency(metrics.igst)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Integrated tax payable</p>
          </div>

          <div className="bg-indigo-50/40 p-3.5 sm:p-4 rounded-xl border border-indigo-200/80 shadow-2xs ring-1 ring-indigo-500/10">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-600">
              Gross Output Tax Liability
            </p>
            <p className="text-xl font-extrabold text-indigo-700 mt-0.5">
              ₹ {formatCurrency(metrics.totalTax)}
            </p>
            <p className="text-[10px] text-indigo-500 font-medium mt-0.5">Total tax on sales</p>
          </div>
        </div>
      ) : (
        /* 6 Cards for Sales Register */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Invoices Count
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-800 mt-0.5">
              {metrics.count}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Total bills issued</p>
          </div>

          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Taxable Sales
            </p>
            <p className="text-base sm:text-lg font-extrabold text-indigo-600 mt-0.5 truncate">
              ₹ {formatCurrency(metrics.taxable)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Base turnover</p>
          </div>

          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Output CGST
            </p>
            <p className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5 truncate">
              ₹ {formatCurrency(metrics.cgst)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Central tax</p>
          </div>

          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Output SGST
            </p>
            <p className="text-base sm:text-lg font-extrabold text-slate-800 mt-0.5 truncate">
              ₹ {formatCurrency(metrics.sgst)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">State / UT tax</p>
          </div>

          <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
              Output IGST
            </p>
            <p className="text-base sm:text-lg font-extrabold text-indigo-600 mt-0.5 truncate">
              ₹ {formatCurrency(metrics.igst)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Inter-state tax</p>
          </div>

          <div className="bg-indigo-50/50 p-3 sm:p-3.5 rounded-xl border border-indigo-200 shadow-2xs ring-1 ring-indigo-500/10">
            <p className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-600">
              Total Invoice Value
            </p>
            <p className="text-base sm:text-lg font-extrabold text-emerald-600 mt-0.5 truncate">
              ₹ {formatCurrency(metrics.grandTotal)}
            </p>
            <p className="text-[10px] text-indigo-500 font-medium mt-0.5 truncate">
              Incl. ₹ {formatCurrency(metrics.totalTax)} Tax
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 1: GST SALES REGISTER */}
      {activeSubTab === 'sales' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <h2 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight">
                GST Sales Register
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chronological record of invoices with state-wise GST breakup
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Showing <span className="text-indigo-600 font-bold">{filteredInvoices.length}</span> invoices
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)] min-h-[180px]">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-2xs">
                <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2 px-2.5 text-center w-8 sticky top-0 bg-slate-50 z-20">SL</th>
                  <th className="py-2 px-2.5 sticky top-0 bg-slate-50 z-20">Invoice No.</th>
                  <th className="py-2 px-2.5 sticky top-0 bg-slate-50 z-20">Date</th>
                  <th className="py-2 px-2.5 sticky top-0 bg-slate-50 z-20">Customer / Buyer</th>
                  <th className="py-2 px-2.5 sticky top-0 bg-slate-50 z-20">POS State</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">Taxable (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">CGST (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">SGST (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">IGST (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">Total Tax (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">Invoice Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="py-10 text-center text-slate-400">
                      <Receipt className="w-7 h-7 mx-auto mb-1.5 opacity-40" />
                      <p className="text-xs font-medium">No invoices found for this selection</p>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv, idx) => (
                    <tr
                      key={inv.id || idx}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-2 px-2.5 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 font-bold">
                        <button
                          type="button"
                          onClick={() => onSelectInvoice && onSelectInvoice(inv)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline flex items-center space-x-1 cursor-pointer font-mono"
                        >
                          <span>{inv.invoiceNumber}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td className="py-2 px-2.5 text-slate-600 whitespace-nowrap">
                        {formatDate(inv.invoiceDate)}
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="font-semibold text-slate-800 max-w-[170px] truncate" title={inv.customerName}>
                          {inv.customerName}
                        </div>
                        {inv.customerGstin && (
                          <div className="text-[9.5px] text-slate-400 font-mono tracking-tight">
                            {inv.customerGstin}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-slate-600">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                          {getStateWithCode(inv.customerState)}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-right font-medium text-slate-700">
                        {formatCurrency(inv.subtotal)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-600">
                        {formatCurrency(inv.totalCgst)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-600">
                        {formatCurrency(inv.totalSgst)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-indigo-600 font-medium">
                        {formatCurrency(inv.totalIgst)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-semibold text-slate-800">
                        {formatCurrency(inv.totalTax)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                        ₹ {formatCurrency(inv.grandTotal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredInvoices.length > 0 && (
                <tfoot className="sticky bottom-0 z-20 bg-slate-100 shadow-xs border-t-2 border-slate-200">
                  <tr className="bg-slate-100 font-extrabold text-slate-900">
                    <td colSpan="5" className="py-2.5 px-2.5 uppercase tracking-wider text-right sticky bottom-0 bg-slate-100 z-20 text-[10.5px]">
                      Total Summary:
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-indigo-700 sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(metrics.taxable)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(metrics.cgst)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(metrics.sgst)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-indigo-700 sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(metrics.igst)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-900 sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(metrics.totalTax)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-emerald-700 text-xs font-black sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(metrics.grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: HSN/SAC SUMMARY (TABLE 12 - EXACT SCREENSHOT DESIGN) */}
      {activeSubTab === 'hsn' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <h2 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight uppercase">
                TABLE 12: HSN-WISE SUMMARY OF OUTWARD SUPPLIES
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Compliant with official GST Form GSTR-1 Table 12 requirements
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              <span className="font-bold text-slate-800">{hsnSummary.length}</span> records
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)] min-h-[180px]">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-2xs">
                <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2 px-2.5 text-center w-8 sticky top-0 bg-slate-50 z-20">SL</th>
                  <th className="py-2 px-2.5 font-mono sticky top-0 bg-slate-50 z-20">HSN / SAC</th>
                  <th className="py-2 px-2.5 sticky top-0 bg-slate-50 z-20">DESCRIPTION OF GOODS</th>
                  <th className="py-2 px-2.5 text-center sticky top-0 bg-slate-50 z-20">UQC / UNIT</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">TOTAL QTY</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">TOTAL VALUE (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">TAXABLE VALUE (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">IGST (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">CGST (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">SGST (₹)</th>
                  <th className="py-2 px-2.5 text-right font-bold sticky top-0 bg-slate-50 z-20">TOTAL TAX (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {hsnSummary.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="py-10 text-center text-slate-400">
                      <Layers className="w-7 h-7 mx-auto mb-1.5 opacity-40" />
                      <p className="text-xs font-medium">No HSN data found in this selection</p>
                    </td>
                  </tr>
                ) : (
                  hsnSummary.map((h, idx) => (
                    <tr key={h.hsnSac || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-2.5 text-center text-slate-400 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5 font-bold font-mono text-indigo-700">
                        {h.hsnSac}
                      </td>
                      <td className="py-2 px-2.5 font-semibold text-slate-800 max-w-[200px] truncate" title={h.itemName}>
                        {h.itemName}
                      </td>
                      <td className="py-2 px-2.5 text-center text-slate-500 font-medium uppercase text-[10px]">
                        {h.unit}
                      </td>
                      <td className="py-2 px-2.5 text-right font-medium text-slate-800">
                        {h.qty}
                      </td>
                      <td className="py-2 px-2.5 text-right font-medium text-slate-800">
                        {formatCurrency(h.totalValue)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-semibold text-slate-900">
                        {formatCurrency(h.taxableValue)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-indigo-600 font-medium">
                        {formatCurrency(h.igst)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-600">
                        {formatCurrency(h.cgst)}
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-600">
                        {formatCurrency(h.sgst)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-bold text-emerald-700">
                        {formatCurrency(h.totalTax)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {hsnSummary.length > 0 && (
                <tfoot className="sticky bottom-0 z-20 bg-slate-100 shadow-xs border-t-2 border-slate-200">
                  <tr className="bg-slate-100 font-extrabold text-slate-900">
                    <td colSpan="4" className="py-2.5 px-2.5 uppercase tracking-wider text-right sticky bottom-0 bg-slate-100 z-20 text-[10.5px]">
                      Table 12 Total:
                    </td>
                    <td className="py-2.5 px-2.5 text-right sticky bottom-0 bg-slate-100 z-20">
                      {hsnTotals.totalQty}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-slate-900 sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(hsnTotals.totalValue)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-indigo-700 sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(hsnTotals.taxableValue)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-indigo-700 sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(hsnTotals.igst)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(hsnTotals.cgst)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(hsnTotals.sgst)}
                    </td>
                    <td className="py-2.5 px-2.5 text-right text-emerald-700 text-xs font-black sticky bottom-0 bg-slate-100 z-20">
                      ₹ {formatCurrency(hsnTotals.totalTax)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: GST SUMMARY & TAX LIABILITY */}
      {activeSubTab === 'summary' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100">
            <h2 className="text-xs sm:text-[13px] font-bold text-slate-900 tracking-tight uppercase">
              Tax Liability by GST Rate Slabs
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Segregation of turnover and taxes into Intra-State (CGST + SGST) and Inter-State (IGST)
            </p>
          </div>

          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-360px)] min-h-[180px]">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 shadow-2xs">
                <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2 px-3 sticky top-0 bg-slate-50 z-20">GST Rate Slab</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">Intra Taxable (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">CGST (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">SGST (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">Inter Taxable (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">IGST (₹)</th>
                  <th className="py-2 px-2.5 text-right sticky top-0 bg-slate-50 z-20">Total Taxable Turnover (₹)</th>
                  <th className="py-2 px-3 text-right sticky top-0 bg-slate-50 z-20">Total Tax Liability (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {rateSlabs.map((slab) => (
                  <tr key={slab.rate} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 text-[10.5px] font-mono">
                        {slab.label}
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-right text-slate-700">
                      {formatCurrency(slab.intraTaxable)}
                    </td>
                    <td className="py-2 px-2.5 text-right text-slate-600">
                      {formatCurrency(slab.cgst)}
                    </td>
                    <td className="py-2 px-2.5 text-right text-slate-600">
                      {formatCurrency(slab.sgst)}
                    </td>
                    <td className="py-2 px-2.5 text-right text-slate-700">
                      {formatCurrency(slab.interTaxable)}
                    </td>
                    <td className="py-2 px-2.5 text-right text-indigo-600 font-medium">
                      {formatCurrency(slab.igst)}
                    </td>
                    <td className="py-2 px-2.5 text-right font-semibold text-slate-800">
                      {formatCurrency(slab.totalTaxable)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(slab.totalLiability)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/90 font-extrabold text-slate-900 border-t-2 border-slate-200">
                  <td className="py-2.5 px-3 uppercase tracking-wider sticky bottom-0 bg-slate-100 z-20 text-[10.5px]">
                    Total Liability
                  </td>
                  <td className="py-2.5 px-2.5 text-right font-bold sticky bottom-0 bg-slate-100 z-20">
                    {formatCurrency(rateSlabsTotal.intraTaxable)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right sticky bottom-0 bg-slate-100 z-20">
                    {formatCurrency(rateSlabsTotal.cgst)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right sticky bottom-0 bg-slate-100 z-20">
                    {formatCurrency(rateSlabsTotal.sgst)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right sticky bottom-0 bg-slate-100 z-20">
                    {formatCurrency(rateSlabsTotal.interTaxable)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-indigo-700 sticky bottom-0 bg-slate-100 z-20">
                    {formatCurrency(rateSlabsTotal.igst)}
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-slate-900 sticky bottom-0 bg-slate-100 z-20">
                    {formatCurrency(rateSlabsTotal.totalTaxable)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-indigo-700 text-xs font-black sticky bottom-0 bg-slate-100 z-20">
                    ₹ {formatCurrency(rateSlabsTotal.totalLiability)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useRef, useState, useEffect } from 'react';
import {
  Printer,
  FileDown,
  X,
  CheckCircle,
  Loader2,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { settingService } from '../services/api';
import { formatDateDDMMYYYY } from '../utils/date';

// Number to Indian words converter for GST invoices
function numberToWords(num) {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n) {
    if (n < 20) return a[n];
    const digit = n % 10;
    return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : ' ');
  }

  const integerPart = Math.floor(num || 0);
  const decimalPart = Math.round(((num || 0) - integerPart) * 100);

  if (integerPart === 0) return 'Zero Rupees Only';

  let str = '';
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const hundred = Math.floor((integerPart % 1000) / 100);
  const remainder = integerPart % 100;

  if (crore) str += inWords(crore) + 'Crore ';
  if (lakh) str += inWords(lakh) + 'Lakh ';
  if (thousand) str += inWords(thousand) + 'Thousand ';
  if (hundred) str += inWords(hundred) + 'Hundred ';
  if (remainder) str += inWords(remainder);

  let result = str.trim() + ' Rupees';
  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart).trim() + ' Paise';
  }
  return result + ' only';
}

export default function InvoiceViewModal({ invoice, companySetting, onClose, onStatusChange }) {
  const invoiceRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [currentSetting, setCurrentSetting] = useState(companySetting || null);

  useEffect(() => {
    if (!companySetting || !companySetting.companyName) {
      settingService
        .get()
        .then((res) => {
          if (res.data?.success && res.data.data) {
            setCurrentSetting(res.data.data);
          }
        })
        .catch((err) => {
          console.error('Failed to load company settings in modal:', err);
        });
    } else {
      setCurrentSetting(companySetting);
    }
  }, [companySetting]);

  if (!invoice) return null;

  const setting = currentSetting || {};

  const company = {
    name: setting.companyName || invoice.companyName || 'Company Name',
    address: setting.fullAddress || invoice.companyAddress || '',
    city: setting.city || '',
    state: setting.state || invoice.companyState || '',
    pincode: setting.pincode || '',
    gstin: setting.gstin || invoice.companyGstin || '',
    phone: setting.phoneNo || invoice.companyPhone || '',
    email: setting.email || '',
    hsa: setting.hsa || '',
    bankName: setting.bankName || '',
    accountHolderName: setting.accountHolderName || setting.companyName || invoice.companyName || '',
    accountNumber: setting.accountNumber || '',
    ifscCode: setting.ifscCode || ''
  };

  const isSame = invoice.isSameState;
  const items = invoice.items || [];

  // Totals calculations
  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalGstAmount = items.reduce(
    (sum, item) =>
      sum +
      (Number(item.cgstAmount || 0) +
        Number(item.sgstAmount || 0) +
        Number(item.igstAmount || 0)),
    0
  );
  const totalItemAmount = items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);

  const isPaid = invoice.status === 'PAID';
  const receivedAmount = isPaid ? invoice.grandTotal : 0;
  const balanceAmount = isPaid ? 0 : invoice.grandTotal;

  // Native A4 Browser Print Dialog
  const handlePrint = () => {
    window.print();
  };

  // High-Quality A4 PDF Generation & Direct Download
  const handleDownloadPdf = async () => {
    const element = invoiceRef.current;
    if (!element) return;

    try {
      setDownloading(true);

      // Canonical A4 rendering width in px for sharp, proportional layout
      const renderWidth = 800;

      const canvas = await html2canvas(element, {
        scale: 2, // 2x Retina resolution for sharp text and clean lines
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: renderWidth,
        windowWidth: renderWidth,
        onclone: (clonedDoc) => {
          const clonedElement =
            clonedDoc.getElementById('printable-tax-invoice') ||
            clonedDoc.querySelector('.invoice-a4-sheet');

          if (clonedElement) {
            // Remove padding, margins, and shifts from all ancestor modal wrappers
            let parent = clonedElement.parentElement;
            while (parent && parent !== clonedDoc.body) {
              parent.style.padding = '0';
              parent.style.margin = '0';
              parent.style.border = 'none';
              parent.style.boxShadow = 'none';
              parent.style.width = '100%';
              parent.style.maxWidth = '100%';
              parent.style.display = 'block';
              parent = parent.parentElement;
            }

            if (clonedDoc.body) {
              clonedDoc.body.style.padding = '0';
              clonedDoc.body.style.margin = '0';
              clonedDoc.body.style.width = `${renderWidth}px`;
              clonedDoc.body.style.backgroundColor = '#ffffff';
            }

            // Lock cloned sheet to renderWidth with completely balanced left & right padding
            clonedElement.style.width = `${renderWidth}px`;
            clonedElement.style.maxWidth = `${renderWidth}px`;
            clonedElement.style.minWidth = `${renderWidth}px`;
            clonedElement.style.margin = '0 auto';
            clonedElement.style.padding = '20px 24px';
            clonedElement.style.boxSizing = 'border-box';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const fileName = `${invoice.invoiceNumber || 'Tax-Invoice'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Could not generate PDF directly. Please use "Print A4" and choose "Save as PDF".');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      id="invoice-modal-root"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static"
    >
      <div className="bg-white rounded-lg max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden my-auto print:shadow-none print:border-none print:w-full print:max-w-full print:rounded-none">
        {/* Action Header Bar (Hidden during Print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="p-1 rounded bg-indigo-600/30 text-indigo-400">
              <FileText className="w-4 h-4" />
            </span>
            <span className="font-bold text-sm tracking-wide">Standard GST Tax Invoice</span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                isPaid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {invoice.status}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onStatusChange && !isPaid && (
              <button
                onClick={() => onStatusChange(invoice.id, 'PAID')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs flex items-center space-x-1 cursor-pointer"
                title="Mark this invoice as Paid"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark Paid</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs cursor-pointer"
              title="Print directly in A4 size"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 cursor-pointer ml-1"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            PRINTABLE TAX INVOICE - 100% SEAMLESS SINGLE MASTER TABLE (ZERO OVERLAP)
            ========================================================================= */}
        <div className="overflow-x-auto w-full flex justify-center bg-slate-100/60 p-2 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
          <div
            ref={invoiceRef}
            id="printable-tax-invoice"
            className="p-6 sm:p-8 bg-white text-black font-sans invoice-a4-sheet shadow-sm print:shadow-none"
            style={{
              width: '100%',
              maxWidth: '800px',
              margin: '0 auto',
              color: '#000000',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box'
            }}
          >
            {/* Top Title: Tax Invoice (Centered) */}
            <div className="text-center pb-2">
              <h1 className="text-lg font-bold tracking-normal uppercase text-black">Tax Invoice</h1>
            </div>

            {/* SINGLE MASTER TABLE WITH FULLY COLLAPSED CONTINUOUS BORDERS */}
            <table
              className="w-full text-xs text-black border-collapse font-sans bg-white"
              style={{
                borderCollapse: 'collapse',
                border: '1px solid #000000',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
            <tbody>
              {/* ROW 1: COMPANY / SUPPLIER HEADER */}
              <tr>
                <td
                  colSpan={8}
                  className="p-3 text-black align-top"
                  style={{ borderBottom: '1px solid #000000' }}
                >
                  <h2 className="text-xl font-black uppercase tracking-wide text-black text-center pb-1">
                    {company.name}
                  </h2>
                  <div className="flex justify-between items-start text-xs text-black mt-1">
                    <div className="space-y-0.5">
                      <p>
                        {company.address}
                        {company.city ? `, ${company.city}` : ''}
                        {company.pincode ? `-${company.pincode}` : ''}
                      </p>
                      <p>
                        <span className="font-semibold">Phone:</span> {company.phone}
                      </p>
                      <p>
                        <span className="font-semibold">GSTIN:</span>{' '}
                        <span className="font-mono font-bold">{company.gstin}</span>
                      </p>
                      {company.hsa && (
                        <p>
                          <span className="font-semibold">HSN/HSA:</span> {company.hsa}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-0.5">
                      <p>
                        <span className="font-semibold">Email:</span> {company.email}
                      </p>
                      <p>
                        <span className="font-semibold">State:</span>{' '}
                        <span className="font-bold">{company.state}</span>
                      </p>
                    </div>
                  </div>
                </td>
              </tr>

              {/* ROW 2: BILL TO (LEFT 4 COLS) & INVOICE DETAILS (RIGHT 4 COLS) */}
              <tr>
                {/* Bill To */}
                <td
                  colSpan={4}
                  className="p-3 text-black align-top w-1/2"
                  style={{
                    borderRight: '1px solid #000000',
                    borderBottom: '1px solid #000000'
                  }}
                >
                  <span className="font-bold text-black block mb-1">Bill To:</span>
                  <p className="font-bold text-sm text-black">{invoice.customerName}</p>
                  <p className="text-black text-xs mt-0.5 whitespace-pre-line leading-relaxed">
                    {invoice.customerAddress || 'Address on file'}
                    {invoice.customerCity ? `, ${invoice.customerCity}` : ''}
                  </p>
                  <p className="text-black text-xs">India</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-xs">
                    {invoice.customerPhone && (
                      <p>
                        <span className="font-semibold">Contact No:</span> {invoice.customerPhone}
                      </p>
                    )}
                    {invoice.customerEmail && (
                      <p>
                        <span className="font-semibold">Email:</span> {invoice.customerEmail}
                      </p>
                    )}
                  </div>
                  <p className="mt-0.5">
                    <span className="font-semibold">State:</span>{' '}
                    <span className="font-bold">{invoice.customerState}</span>
                  </p>
                  {invoice.customerGstin && (
                    <p className="mt-0.5">
                      <span className="font-semibold">GSTIN:</span>{' '}
                      <span className="font-mono font-bold">{invoice.customerGstin}</span>
                    </p>
                  )}
                </td>

                {/* Invoice Details */}
                <td
                  colSpan={4}
                  className="p-3 text-black align-top w-1/2 space-y-1"
                  style={{ borderBottom: '1px solid #000000' }}
                >
                  <span className="font-bold text-black block mb-1">Invoice Details:</span>
                  <p>
                    <span className="font-semibold">No:</span>{' '}
                    <span className="font-bold font-mono">{invoice.invoiceNumber}</span>
                  </p>
                  <p>
                    <span className="font-semibold">Date:</span> {formatDateDDMMYYYY(invoice.invoiceDate)}
                  </p>
                  <p>
                    <span className="font-semibold">Place Of Supply:</span>{' '}
                    <span className="font-bold">{invoice.customerState}</span>
                  </p>
                  {invoice.dueDate && (
                    <p>
                      <span className="font-semibold">Due Date:</span> {formatDateDDMMYYYY(invoice.dueDate)}
                    </p>
                  )}
                </td>
              </tr>

              {/* ROW 3: ITEMS TABLE HEADERS */}
              <tr
                className="bg-slate-50 font-bold text-center text-xs"
                style={{ borderBottom: '1px solid #000000' }}
              >
                <th
                  className="py-2 px-1 text-center w-8"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  #
                </th>
                <th
                  className="py-2 px-3 text-left"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  Item name
                </th>
                <th
                  className="py-2 px-2 text-center w-20"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  HSN/ SAC
                </th>
                <th
                  className="py-2 px-2 text-center w-16"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  Quantity
                </th>
                <th
                  className="py-2 px-2 text-center w-14"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  Unit
                </th>
                <th
                  className="py-2 px-2 text-right w-24"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  Price/ Unit(₹)
                </th>
                <th
                  className="py-2 px-2 text-right w-24"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  GST(₹)
                </th>
                <th className="py-2 px-3 text-right w-28">Amount(₹)</th>
              </tr>

              {/* ROW 4+: ITEMS ROWS */}
              {items.map((item, idx) => {
                const itemGst =
                  (Number(item.cgstAmount) || 0) +
                  (Number(item.sgstAmount) || 0) +
                  (Number(item.igstAmount) || 0);

                return (
                  <tr
                    key={item.id || idx}
                    className="text-center text-xs"
                    style={{ borderBottom: '1px solid #000000' }}
                  >
                    <td
                      className="py-2 px-1 font-mono text-center"
                      style={{ borderRight: '1px solid #000000' }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      className="py-2 px-3 text-left font-semibold"
                      style={{ borderRight: '1px solid #000000' }}
                    >
                      {item.itemName}
                    </td>
                    <td
                      className="py-2 px-2 font-mono text-center"
                      style={{ borderRight: '1px solid #000000' }}
                    >
                      {item.hsnSac || '—'}
                    </td>
                    <td
                      className="py-2 px-2 text-center"
                      style={{ borderRight: '1px solid #000000' }}
                    >
                      {item.qty}
                    </td>
                    <td
                      className="py-2 px-2 text-center"
                      style={{ borderRight: '1px solid #000000' }}
                    >
                      {item.unit || 'Nos'}
                    </td>
                    <td
                      className="py-2 px-2 text-right font-mono"
                      style={{ borderRight: '1px solid #000000' }}
                    >
                      ₹{Number(item.pricePerUnit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className="py-2 px-2 text-right font-mono"
                      style={{ borderRight: '1px solid #000000' }}
                    >
                      <div>₹{itemGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                      <span className="text-[10px] text-slate-600">({item.gstRate || 0}%)</span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold">
                      ₹{Number(item.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}

              {/* ROW: ITEMS TOTAL ROW */}
              <tr
                className="font-bold text-center bg-slate-50 text-xs"
                style={{ borderBottom: '1px solid #000000' }}
              >
                <td
                  colSpan={3}
                  className="py-1.5 px-3 text-left font-bold"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  Total
                </td>
                <td
                  className="py-1.5 px-2 text-center"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  {totalQty}
                </td>
                <td className="py-1.5 px-2" style={{ borderRight: '1px solid #000000' }}></td>
                <td className="py-1.5 px-2" style={{ borderRight: '1px solid #000000' }}></td>
                <td
                  className="py-1.5 px-2 text-right font-mono"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  ₹{totalGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-1.5 px-3 text-right font-mono font-bold">
                  ₹{totalItemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* ROW: DUAL SECTION (TAX SUMMARY ON LEFT & INVOICE TOTALS ON RIGHT) */}
              <tr>
                {/* Left Side: Tax Summary (Spans 5 Columns) */}
                <td
                  colSpan={5}
                  className="p-2.5 align-top"
                  style={{
                    borderRight: '1px solid #000000',
                    borderBottom: '1px solid #000000'
                  }}
                >
                  <span className="font-bold text-black block mb-1 text-xs">Tax Summary:</span>
                  <table
                    className="w-full text-[11px] text-center border-collapse"
                    style={{
                      borderCollapse: 'collapse',
                      border: '1px solid #000000'
                    }}
                  >
                    <thead>
                      <tr
                        className="bg-slate-50 font-bold"
                        style={{ borderBottom: '1px solid #000000' }}
                      >
                        <th className="py-1 px-1" style={{ borderRight: '1px solid #000000' }}>
                          HSN/ SAC
                        </th>
                        <th className="py-1 px-1" style={{ borderRight: '1px solid #000000' }}>
                          Taxable amount (₹)
                        </th>
                        {isSame ? (
                          <>
                            <th
                              className="py-1 px-1"
                              colSpan={2}
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              CGST
                            </th>
                            <th
                              className="py-1 px-1"
                              colSpan={2}
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              SGST
                            </th>
                          </>
                        ) : (
                          <th
                            className="py-1 px-1"
                            colSpan={2}
                            style={{ borderRight: '1px solid #000000' }}
                          >
                            IGST
                          </th>
                        )}
                        <th className="py-1 px-1">Total Tax (₹)</th>
                      </tr>
                      <tr
                        className="bg-slate-50 text-[10px]"
                        style={{ borderBottom: '1px solid #000000' }}
                      >
                        <th style={{ borderRight: '1px solid #000000' }}></th>
                        <th style={{ borderRight: '1px solid #000000' }}></th>
                        {isSame ? (
                          <>
                            <th
                              className="py-0.5 px-1"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              Rate (%)
                            </th>
                            <th
                              className="py-0.5 px-1"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              Amt (₹)
                            </th>
                            <th
                              className="py-0.5 px-1"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              Rate (%)
                            </th>
                            <th
                              className="py-0.5 px-1"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              Amt (₹)
                            </th>
                          </>
                        ) : (
                          <>
                            <th
                              className="py-0.5 px-1"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              Rate (%)
                            </th>
                            <th
                              className="py-0.5 px-1"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              Amt (₹)
                            </th>
                          </>
                        )}
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => {
                        const lineTax =
                          (Number(it.cgstAmount) || 0) +
                          (Number(it.sgstAmount) || 0) +
                          (Number(it.igstAmount) || 0);

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #000000' }}>
                            <td
                              className="py-1 px-1 font-mono"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              {it.hsnSac || '—'}
                            </td>
                            <td
                              className="py-1 px-1 font-mono text-right"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              {Number(it.taxableAmount).toLocaleString('en-IN', {
                                minimumFractionDigits: 2
                              })}
                            </td>

                            {isSame ? (
                              <>
                                <td
                                  className="py-1 px-1 font-mono"
                                  style={{ borderRight: '1px solid #000000' }}
                                >
                                  {it.cgstRate || 0}
                                </td>
                                <td
                                  className="py-1 px-1 font-mono text-right"
                                  style={{ borderRight: '1px solid #000000' }}
                                >
                                  {Number(it.cgstAmount).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2
                                  })}
                                </td>
                                <td
                                  className="py-1 px-1 font-mono"
                                  style={{ borderRight: '1px solid #000000' }}
                                >
                                  {it.sgstRate || 0}
                                </td>
                                <td
                                  className="py-1 px-1 font-mono text-right"
                                  style={{ borderRight: '1px solid #000000' }}
                                >
                                  {Number(it.sgstAmount).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2
                                  })}
                                </td>
                              </>
                            ) : (
                              <>
                                <td
                                  className="py-1 px-1 font-mono"
                                  style={{ borderRight: '1px solid #000000' }}
                                >
                                  {it.igstRate || 0}
                                </td>
                                <td
                                  className="py-1 px-1 font-mono text-right"
                                  style={{ borderRight: '1px solid #000000' }}
                                >
                                  {Number(it.igstAmount).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2
                                  })}
                                </td>
                              </>
                            )}

                            <td className="py-1 px-1 font-mono text-right font-semibold">
                              {lineTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Tax Summary Total Row */}
                      <tr className="font-bold bg-slate-50">
                        <td
                          className="py-1 px-1 text-left"
                          style={{ borderRight: '1px solid #000000' }}
                        >
                          TOTAL
                        </td>
                        <td
                          className="py-1 px-1 font-mono text-right"
                          style={{ borderRight: '1px solid #000000' }}
                        >
                          {Number(invoice.subtotal).toLocaleString('en-IN', {
                            minimumFractionDigits: 2
                          })}
                        </td>

                        {isSame ? (
                          <>
                            <td style={{ borderRight: '1px solid #000000' }}></td>
                            <td
                              className="py-1 px-1 font-mono text-right"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              {Number(invoice.totalCgst).toLocaleString('en-IN', {
                                minimumFractionDigits: 2
                              })}
                            </td>
                            <td style={{ borderRight: '1px solid #000000' }}></td>
                            <td
                              className="py-1 px-1 font-mono text-right"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              {Number(invoice.totalSgst).toLocaleString('en-IN', {
                                minimumFractionDigits: 2
                              })}
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ borderRight: '1px solid #000000' }}></td>
                            <td
                              className="py-1 px-1 font-mono text-right"
                              style={{ borderRight: '1px solid #000000' }}
                            >
                              {Number(invoice.totalIgst).toLocaleString('en-IN', {
                                minimumFractionDigits: 2
                              })}
                            </td>
                          </>
                        )}

                        <td className="py-1 px-1 font-mono text-right font-bold">
                          {Number(invoice.totalTax).toLocaleString('en-IN', {
                            minimumFractionDigits: 2
                          })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>

                {/* Right Side: Totals & Balance (Spans 3 Columns) */}
                <td
                  colSpan={3}
                  className="p-2.5 align-top text-xs space-y-2"
                  style={{ borderBottom: '1px solid #000000' }}
                >
                  <div className="space-y-1">
                    <div
                      className="flex justify-between items-center text-xs pb-1"
                      style={{ borderBottom: '1px solid #000000' }}
                    >
                      <span className="font-semibold">Sub Total :</span>
                      <span className="font-mono font-bold">
                        ₹{Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div
                      className="flex justify-between items-center text-xs pb-1"
                      style={{ borderBottom: '1px solid #000000' }}
                    >
                      <span className="font-bold">Total :</span>
                      <span className="font-mono font-bold">
                        ₹{Number(invoice.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Amount in words */}
                  <div className="pt-1" style={{ borderTop: '1px solid #000000' }}>
                    <span className="font-bold text-[11px] block">Invoice Amount in Words:</span>
                    <p className="text-xs font-semibold italic mt-0.5 leading-tight">
                      {numberToWords(invoice.grandTotal)}
                    </p>
                  </div>

                  {/* Received & Balance */}
                  <div
                    className="space-y-0.5 pt-1 text-xs"
                    style={{ borderTop: '1px solid #000000' }}
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold">Received :</span>
                      <span className="font-mono">
                        ₹{Number(receivedAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Balance :</span>
                      <span className="font-mono">
                        ₹{Number(balanceAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>

              {/* ROW: TERMS & CONDITIONS */}
              <tr>
                <td
                  colSpan={8}
                  className="p-2.5 text-xs"
                  style={{ borderBottom: '1px solid #000000' }}
                >
                  <span className="font-bold block mb-0.5">Terms & Conditions:</span>
                  <p className="text-black text-[11px] leading-relaxed">
                    {invoice.notes || 'Thanks for doing business with us!'}
                  </p>
                </td>
              </tr>

              {/* ROW: BANK DETAILS (LEFT 4) & SIGNATORY (RIGHT 4) */}
              <tr>
                {/* Bank Details */}
                <td
                  colSpan={4}
                  className="p-3 align-top text-xs w-1/2 space-y-1"
                  style={{ borderRight: '1px solid #000000' }}
                >
                  <span className="font-bold block mb-1">Bank Details:</span>
                  <p>
                    <span className="font-semibold">Name :</span> {company.bankName}
                  </p>
                  <p>
                    <span className="font-semibold">Account No. :</span>{' '}
                    <span className="font-mono font-bold">{company.accountNumber}</span>
                  </p>
                  <p>
                    <span className="font-semibold">IFSC code :</span>{' '}
                    <span className="font-mono font-bold">{company.ifscCode}</span>
                  </p>
                  <p>
                    <span className="font-semibold">Account holder's name :</span>{' '}
                    {company.accountHolderName}
                  </p>
                </td>

                {/* Authorized Signatory */}
                <td colSpan={4} className="p-3 align-top text-xs w-1/2 text-right">
                  <span className="font-bold text-xs uppercase block">
                    For {company.name}:
                  </span>
                  <div className="pt-14">
                    <span className="text-xs font-semibold block">Authorized Signatory</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
}

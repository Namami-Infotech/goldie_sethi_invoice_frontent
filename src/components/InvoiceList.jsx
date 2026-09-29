import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Ban,
  RefreshCw,
  IndianRupee,
  Filter,
  Printer
} from 'lucide-react';
import { invoiceService } from '../services/api';
import Pagination from './Pagination';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function InvoiceList({ onSelectInvoice, onCreateNew, companyState }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceService.getAll(statusFilter, search);
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [statusFilter, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search]);

  const totalItems = invoices.length;
  const paginatedInvoices = invoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await invoiceService.updateStatus(id, newStatus);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await invoiceService.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Receipt className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Invoices Directory</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track and manage all issued GST invoices with tax breakdown.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          
          <button
            onClick={onCreateNew}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto overflow-x-auto">
          {['', 'PENDING', 'PAID', 'CANCELLED', 'INACTIVE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === '' ? 'Active Invoices' : st === 'INACTIVE' ? 'Inactive' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice #, customer, state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">State & GST Rule</th>
                <th className="py-3.5 px-4 text-right">Taxable (₹)</th>
                <th className="py-3.5 px-4 text-right">Tax (₹)</th>
                <th className="py-3.5 px-4 text-right font-bold">Total (₹)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    No invoices generated yet. Click "Create New Invoice" to start!
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-xs text-indigo-600">
                        {inv.invoiceNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {inv.invoiceDate}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{inv.customerName}</div>
                      <div className="text-xs text-slate-400">{inv.customerCity || ''}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-medium text-slate-800">{inv.customerState}</span>
                      <div className="mt-0.5">
                        {inv.isSameState ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            CGST + SGST
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            IGST
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700">
                      ₹{Number(inv.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-600">
                      ₹{Number(inv.totalTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{Number(inv.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.status === 'CANCELLED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : inv.status === 'INACTIVE'
                            ? 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="CANCELLED">CANCELLED</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="flex items-center space-x-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          title="View / Print / Download A4 PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print / PDF</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: inv.id, invoiceNumber: inv.invoiceNumber })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Invoice"
        itemType="invoice"
        itemName={deleteTarget?.invoiceNumber}
        message="Are you sure you want to delete this invoice? The status will be marked as INACTIVE and hidden from active invoices."
        confirmText="Mark Inactive"
      />
    </div>
  );
}

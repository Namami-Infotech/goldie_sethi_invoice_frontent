import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  IndianRupee,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { itemService } from '../services/api';
import { UNITS, GST_RATES } from '../utils/states';
import Pagination from './Pagination';
import DeleteConfirmModal from './DeleteConfirmModal';

export default function ItemModule() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    hsnSac: '',
    qty: 1,
    unit: 'Pcs',
    pricePerUnit: '',
    gstRate: 18
  });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await itemService.getAll(search);
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalItems = items.length;
  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      hsnSac: '',
      qty: 1,
      unit: 'Pcs',
      pricePerUnit: '',
      gstRate: 18
    });
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      hsnSac: item.hsnSac || '',
      qty: item.qty,
      unit: item.unit || 'Pcs',
      pricePerUnit: item.pricePerUnit,
      gstRate: item.gstRate
    });
    setError('');
    setModalOpen(true);
  };

  // Real-time computed amounts for the modal form
  const calcTaxable = (Number(formData.qty) || 0) * (Number(formData.pricePerUnit) || 0);
  const calcGstAmount = Number(((calcTaxable * (Number(formData.gstRate) || 0)) / 100).toFixed(2));
  const calcTotalAmount = Number((calcTaxable + calcGstAmount).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Item Name is required');
      return;
    }
    if (formData.pricePerUnit === '' || Number(formData.pricePerUnit) < 0) {
      setError('Price per unit must be 0 or greater');
      return;
    }

    try {
      if (editingItem) {
        await itemService.update(editingItem.id, formData);
      } else {
        await itemService.create(formData);
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving item');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await itemService.delete(deleteTarget.id);
      setDeleteTarget(null);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Package className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Item / Product Module</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage your inventory, HSN/SAC classifications, GST slabs, and Unit pricing.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* <button
            onClick={fetchItems}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button> */}
          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by item name, HSN/SAC code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium w-full sm:w-auto text-right">
          Total Items: <span className="font-bold text-slate-900">{items.length}</span>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Item Name</th>
                <th className="py-3.5 px-4">HSN / SAC</th>
                <th className="py-3.5 px-4 text-center">Qty & Unit</th>
                <th className="py-3.5 px-4 text-right">Price / Unit (₹)</th>
                <th className="py-3.5 px-4 text-center">GST Rate</th>
                <th className="py-3.5 px-4 text-right">GST (₹)</th>
                <th className="py-3.5 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading items catalog...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-500">
                    No items found. Click "Add New Item" to create one.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {item.hsnSac ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.hsnSac}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-slate-800">{item.qty}</span>{' '}
                      <span className="text-xs text-slate-500">{item.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                      ₹{Number(item.pricePerUnit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.gstRate}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-emerald-700">
                      ₹{Number(item.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{Number(item.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      </div>

      {/* Add / Edit Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 transform transition-all">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Barcode Scanner"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    HSN / SAC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 847190"
                    value={formData.hsnSac}
                    onChange={(e) => setFormData({ ...formData, hsnSac: e.target.value })}
                    className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                    className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm text-center font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Price / Unit (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="0.00"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                    className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full h-10 px-2.5 border border-slate-200 rounded-xl text-sm bg-white font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                  >
                    {GST_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Preview Calculation Box */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Amount (Qty × Rate):</span>
                  <span className="font-semibold text-slate-800">
                    ₹{calcTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>GST in Rupees ({formData.gstRate}%):</span>
                  <span className="font-semibold">
                    ₹{calcGstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 text-slate-900 font-bold text-sm">
                  <span>Total Amount in Rupees:</span>
                  <span className="text-indigo-600">
                    ₹{calcTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  {editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Item"
        itemType="item"
        itemName={deleteTarget?.name}
        message="Are you sure you want to delete this catalog item? The status will be set to INACTIVE and removed from active item catalogs."
        confirmText="Mark Inactive"
      />
    </div>
  );
}

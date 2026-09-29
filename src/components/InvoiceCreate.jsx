import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Building,
  User,
  Calendar,
  IndianRupee,
  Save,
  ArrowRight,
  Sparkles,
  Info,
  Search,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import { invoiceService, itemService, userService } from '../services/api';
import { INDIAN_STATES, UNITS, GST_RATES } from '../utils/states';

// Single Searchable Dropdown Component for Catalog Items
function SearchableItemSelect({ row, index, allItems, catalogItems, onSelectItem, onChangeName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = React.useRef(null);
  const searchInputRef = React.useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Check if item is already picked in another row
  const isItemAlreadySelected = (ci) => {
    return (allItems || []).some(
      (it, idx) =>
        idx !== index &&
        ((it.itemId && String(it.itemId) === String(ci.id)) ||
          (it.itemName &&
            ci.name &&
            it.itemName.trim().toLowerCase() === ci.name.trim().toLowerCase()))
    );
  };

  const filteredItems = (catalogItems || []).filter((ci) => {
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return true;
    const nameMatch = (ci.name || '').toLowerCase().includes(q);
    const hsnMatch = (ci.hsnSac || '').toLowerCase().includes(q);
    return nameMatch || hsnMatch;
  });

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Single Field for Display & Direct Input */}
      <div className="relative flex items-center">
        <input
          type="text"
          required
          placeholder="Search or select item..."
          value={row.itemName || ''}
          onChange={(e) => {
            onChangeName(index, e.target.value);
          }}
          onClick={() => setIsOpen(true)}
          className="w-full h-9 pl-2.5 pr-8 text-xs border border-slate-200 rounded-lg font-medium text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="absolute right-1 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          title="Browse & search items"
          tabIndex={-1}
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-indigo-600' : ''
            }`}
          />
        </button>
      </div>

      {/* Searchable Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden text-xs">
          {/* Search box inside dropdown */}
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by item name or HSN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Catalog Items List */}
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
            {filteredItems.length > 0 ? (
              filteredItems.map((ci) => {
                const isSelected =
                  String(row.itemId) === String(ci.id) ||
                  (row.itemName && row.itemName.trim().toLowerCase() === (ci.name || '').trim().toLowerCase());
                const alreadySelected = isItemAlreadySelected(ci);

                return (
                  <div
                    key={ci.id}
                    onClick={() => {
                      if (alreadySelected) return;
                      onSelectItem(index, ci.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`p-2.5 transition-colors flex items-center justify-between ${
                      alreadySelected
                        ? 'opacity-40 bg-slate-100/70 cursor-not-allowed select-none'
                        : isSelected
                        ? 'bg-indigo-50/70 font-semibold cursor-pointer'
                        : 'hover:bg-indigo-50/70 cursor-pointer'
                    }`}
                    title={alreadySelected ? `"${ci.name}" is already added in another row` : ''}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-slate-900 font-medium truncate flex items-center space-x-1.5">
                        <span className={`truncate ${alreadySelected ? 'text-slate-500 line-through decoration-slate-300' : ''}`}>
                          {ci.name}
                        </span>
                        {alreadySelected ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 flex-shrink-0">
                            Already Added
                          </span>
                        ) : (
                          ci.hsnSac && (
                            <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded flex-shrink-0">
                              HSN: {ci.hsnSac}
                            </span>
                          )
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Rate: <strong className="text-slate-800">₹{ci.pricePerUnit}</strong> / {ci.unit || 'Pcs'} • GST:{' '}
                        <strong className="text-indigo-600">{ci.gstRate}%</strong>
                      </div>
                    </div>
                    {alreadySelected ? (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        Added
                      </span>
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="p-3 text-center text-slate-400 text-xs">
                No catalog items match "{searchTerm}"
              </div>
            )}
          </div>

          {/* Option to apply typed search as custom item */}
          {searchTerm.trim() &&
            !filteredItems.some(
              (ci) => (ci.name || '').toLowerCase() === searchTerm.trim().toLowerCase()
            ) && (
              (() => {
                const customAlreadyUsed = (allItems || []).some(
                  (it, idx) =>
                    idx !== index &&
                    (it.itemName || '').trim().toLowerCase() === searchTerm.trim().toLowerCase()
                );

                if (customAlreadyUsed) {
                  return (
                    <div className="p-2 border-t border-slate-100 bg-amber-50/60 text-amber-800 text-[11px] flex items-center space-x-1.5 cursor-not-allowed">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="truncate">"{searchTerm.trim()}" is already added on another line</span>
                    </div>
                  );
                }

                return (
                  <div
                    onClick={() => {
                      onChangeName(index, searchTerm.trim());
                      setIsOpen(false);
                    }}
                    className="p-2 border-t border-slate-100 bg-slate-50 hover:bg-slate-100 cursor-pointer text-indigo-600 font-medium text-xs flex items-center space-x-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Use "{searchTerm.trim()}" as item name</span>
                  </div>
                );
              })()
            )}
        </div>
      )}
    </div>
  );
}

export default function InvoiceCreate({ companySetting, onInvoiceCreated, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userList, setUserList] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState('');

  // Invoice header state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [notes, setNotes] = useState('Payment is requested within 15 days of invoice date. Thank you for your business.');

  // Invoice Items
  const [items, setItems] = useState([
    {
      id: Date.now(),
      itemId: '',
      itemName: '',
      hsnSac: '',
      qty: 1,
      unit: 'Pcs',
      pricePerUnit: 0,
      gstRate: 18
    }
  ]);

  // Load initial data (users, catalog items, next number)
  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, itemsRes, nextNumRes] = await Promise.all([
          userService.getAll(),
          itemService.getAll(),
          invoiceService.getNextNumber()
        ]);

        if (usersRes.data.success) {
          setUserList(usersRes.data.data);
          // If users exist, default to first client
          if (usersRes.data.data.length > 0) {
            handleSelectUser(usersRes.data.data[0]);
          }
        }

        if (itemsRes.data.success) {
          setCatalogItems(itemsRes.data.data);
        }

        if (nextNumRes.data.success) {
          setNextInvoiceNumber(nextNumRes.data.data.nextInvoiceNumber);
        }
      } catch (err) {
        console.error('Failed to load invoice creation prerequisites:', err);
      }
    }
    loadData();
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUserId(user.id);
    setCustomerName(user.name);
    setCustomerState(user.state || '');
    setCustomerCity(user.city || '');
    setCustomerAddress(user.fullAddress || '');
    setCustomerPhone(user.contactNumber || '');
    setCustomerEmail(user.email || '');
  };

  // Determine State Match
  const companyStateClean = (companySetting?.state || '').trim().toLowerCase();
  const customerStateClean = (customerState || '').trim().toLowerCase();
  const isSameState = Boolean(companyStateClean && customerStateClean && companyStateClean === customerStateClean);

  // Compute row-level calculations
  const computedRows = items.map((row) => {
    const qty = Number(row.qty) || 0;
    const price = Number(row.pricePerUnit) || 0;
    const taxable = Number((qty * price).toFixed(2));
    const rate = Number(row.gstRate) || 0;

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isSameState) {
      cgstRate = Number((rate / 2).toFixed(2));
      sgstRate = Number((rate / 2).toFixed(2));
      cgstAmount = Number(((taxable * cgstRate) / 100).toFixed(2));
      sgstAmount = Number(((taxable * sgstRate) / 100).toFixed(2));
    } else {
      igstRate = rate;
      igstAmount = Number(((taxable * igstRate) / 100).toFixed(2));
    }

    const rowTax = Number((cgstAmount + sgstAmount + igstAmount).toFixed(2));
    const rowTotal = Number((taxable + rowTax).toFixed(2));

    return {
      ...row,
      taxable,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      rowTax,
      rowTotal
    };
  });

  // Calculate totals
  const subtotal = Number(computedRows.reduce((sum, r) => sum + r.taxable, 0).toFixed(2));
  const totalCgst = Number(computedRows.reduce((sum, r) => sum + r.cgstAmount, 0).toFixed(2));
  const totalSgst = Number(computedRows.reduce((sum, r) => sum + r.sgstAmount, 0).toFixed(2));
  const totalIgst = Number(computedRows.reduce((sum, r) => sum + r.igstAmount, 0).toFixed(2));
  const totalTax = Number((totalCgst + totalSgst + totalIgst).toFixed(2));
  const grandTotal = Number((subtotal + totalTax).toFixed(2));

  // Item row operations
  const handleItemSelect = (index, catalogItemId) => {
    const found = catalogItems.find((ci) => String(ci.id) === String(catalogItemId));
    if (!found) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        itemId: '',
        itemName: '',
        hsnSac: '',
        pricePerUnit: 0
      };
      setItems(newItems);
      return;
    }

    // Check if this item is already selected in another row
    const duplicateRowIndex = items.findIndex(
      (it, idx) =>
        idx !== index &&
        (String(it.itemId) === String(found.id) ||
          (it.itemName && it.itemName.trim().toLowerCase() === found.name.trim().toLowerCase()))
    );

    if (duplicateRowIndex !== -1) {
      setError(
        `"${found.name}" is already selected on row ${duplicateRowIndex + 1}. Please increase its quantity instead of adding it again.`
      );
      return;
    }

    setError('');
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      itemId: found.id,
      itemName: found.name,
      hsnSac: found.hsnSac || '',
      unit: found.unit || 'Pcs',
      pricePerUnit: found.pricePerUnit,
      gstRate: found.gstRate
    };
    setItems(newItems);
  };

  const handleRowChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addRow = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        itemId: '',
        itemName: '',
        hsnSac: '',
        qty: 1,
        unit: 'Pcs',
        pricePerUnit: 0,
        gstRate: 18
      }
    ]);
  };

  const removeRow = (index) => {
    if (items.length === 1) {
      alert('Invoice must contain at least one item');
      return;
    }
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!customerState.trim()) {
      setError('Customer state is required for tax calculation');
      return;
    }

    // Validate rows
    for (let i = 0; i < items.length; i++) {
      if (!items[i].itemName.trim()) {
        setError(`Please enter or select an item name on line ${i + 1}`);
        return;
      }
      if (Number(items[i].qty) <= 0) {
        setError(`Quantity must be greater than 0 on line ${i + 1}`);
        return;
      }
    }

    // Prevent duplicate items across rows
    const seenNames = new Map();
    for (let i = 0; i < items.length; i++) {
      const clean = items[i].itemName.trim().toLowerCase();
      if (seenNames.has(clean)) {
        setError(`"${items[i].itemName}" is added more than once (lines ${seenNames.get(clean) + 1} and ${i + 1}). Please adjust the quantity instead of adding duplicate rows.`);
        return;
      }
      seenNames.set(clean, i);
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        invoiceNumber: nextInvoiceNumber,
        invoiceDate,
        dueDate: dueDate || null,
        userId: selectedUserId || null,
        customerName,
        customerState,
        customerCity,
        customerAddress,
        customerPhone,
        customerEmail,
        status,
        notes,
        items: computedRows.map((r) => ({
          itemId: r.itemId || null,
          itemName: r.itemName,
          hsnSac: r.hsnSac,
          qty: Number(r.qty),
          unit: r.unit,
          pricePerUnit: Number(r.pricePerUnit),
          gstRate: Number(r.gstRate)
        }))
      };

      const res = await invoiceService.create(payload);
      if (res.data.success) {
        if (onInvoiceCreated) {
          onInvoiceCreated(res.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error generating invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Generate GST Tax Invoice</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dynamic Dual-GST calculation based on buyer state vs company state.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs bg-slate-100 px-3 py-2 rounded-xl text-slate-700 border border-slate-200">
          <span className="text-slate-400">Invoice No:</span>
          <span className="font-bold text-indigo-600">{nextInvoiceNumber || 'Auto-generated'}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* DYNAMIC SELLER / COMPANY PROFILE CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Seller / Supplier
              </span>
              <span className="font-bold text-slate-900 truncate">
                {companySetting?.companyName || 'Company Profile'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              {companySetting?.fullAddress ? `${companySetting.fullAddress}${companySetting.city ? `, ${companySetting.city}` : ''}` : (companySetting?.city || 'Address on file')}
              {companySetting?.state ? ` • State: ${companySetting.state}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[11px] flex-shrink-0">
          {companySetting?.gstin && (
            <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-semibold">
              GSTIN: {companySetting.gstin}
            </span>
          )}
          {companySetting?.phoneNo && (
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              Tel: {companySetting.phoneNo}
            </span>
          )}
        </div>
      </div>

      {/* STATE MATCH ENGINE LIVE BANNER (Compact Low-Profile) */}
      <div
        className={`px-4 py-3 rounded-xl border transition-all shadow-2xs ${
          !customerState
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : isSameState
            ? 'bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border-blue-200 text-blue-900'
            : 'bg-gradient-to-r from-amber-50/90 to-orange-50/90 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className={`p-1.5 rounded-lg flex-shrink-0 ${
                !customerState
                  ? 'bg-slate-200 text-slate-600'
                  : isSameState
                  ? 'bg-blue-600 text-white'
                  : 'bg-amber-600 text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap text-xs">
                <span className="font-bold">Live GST Rule:</span>
                <span className="text-[11px] font-semibold text-slate-700">
                  Company (<strong>{companySetting?.state || 'Not Set'}</strong>) &rarr; Customer (<strong>{customerState || 'Select State'}</strong>)
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-white/90 border border-current shadow-2xs">
                  {isSameState ? 'CGST (50%) + SGST (50%)' : 'IGST (100%)'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 self-end sm:self-center">
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-lg border bg-white shadow-2xs ${
                isSameState
                  ? 'text-blue-700 border-blue-200'
                  : 'text-amber-700 border-amber-200'
              }`}
            >
              {isSameState ? 'Central + State GST' : 'Integrated GST'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Invoice Meta Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Selection Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Customer / Buyer Details</h3>
              </div>

              {/* Quick User Picker */}
              <div className="flex items-center space-x-2">
                <label className="text-xs text-slate-500 font-medium">Quick Select:</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => {
                    const u = userList.find((usr) => String(usr.id) === e.target.value);
                    if (u) handleSelectUser(u);
                  }}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select Existing Customer</option>
                  {userList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.state})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp / Rajesh Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer State (Triggers CGST/SGST vs IGST) *
                </label>
                <select
                  required
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st} {companySetting?.state === st ? '(Same State - CGST+SGST)' : '(Different - IGST)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  placeholder="+91 98250 00000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="buyer@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Billing Address
              </label>
              <textarea
                rows="2"
                placeholder="Full address of the buyer..."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Invoice Dates & Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Invoice Metadata</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              >
                <option value="PENDING">PENDING (Unpaid)</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-sm">Invoice Items & GST Calculation</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-white text-indigo-700 border border-indigo-200">
                {items.length} line {items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <button
              type="button"
              onClick={addRow}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="overflow-x-auto min-h-[300px] pb-28">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 w-10">#</th>
                  <th className="py-3 px-3 min-w-[240px]">Item Description</th>
                  <th className="py-3 px-3 w-28">HSN/SAC</th>
                  <th className="py-3 px-3 w-20 text-center">Qty</th>
                  <th className="py-3 px-3 w-24">Unit</th>
                  <th className="py-3 px-3 w-28 text-right">Price/Unit (₹)</th>
                  <th className="py-3 px-3 w-28 text-right">Taxable (₹)</th>
                  <th className="py-3 px-3 w-24 text-center">GST %</th>
                  {/* Dynamic Tax Columns based on state match */}
                  {isSameState ? (
                    <>
                      <th className="py-3 px-3 w-28 text-right bg-blue-50/50 text-blue-800">
                        CGST (₹)
                      </th>
                      <th className="py-3 px-3 w-28 text-right bg-blue-50/50 text-blue-800">
                        SGST (₹)
                      </th>
                    </>
                  ) : (
                    <th className="py-3 px-3 w-32 text-right bg-amber-50/50 text-amber-800">
                      IGST (₹)
                    </th>
                  )}
                  <th className="py-3 px-3 w-32 text-right font-bold">Total (₹)</th>
                  <th className="py-3 px-2 w-12 text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {computedRows.map((row, index) => (
                  <tr key={row.id || index} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-slate-400 text-xs font-mono">{index + 1}</td>

                    {/* Single Searchable Item Selector */}
                    <td className="py-2.5 px-3">
                      <SearchableItemSelect
                        row={row}
                        index={index}
                        allItems={items}
                        catalogItems={catalogItems}
                        onSelectItem={handleItemSelect}
                        onChangeName={(idx, val) => handleRowChange(idx, 'itemName', val)}
                      />
                    </td>

                    {/* HSN/SAC */}
                    <td className="py-2.5 px-3">
                      <input
                        type="text"
                        placeholder="HSN Code"
                        value={row.hsnSac}
                        onChange={(e) => handleRowChange(index, 'hsnSac', e.target.value)}
                        className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* Qty */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required
                        value={row.qty}
                        onChange={(e) => handleRowChange(index, 'qty', e.target.value)}
                        className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg text-center font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2.5 px-3">
                      <select
                        value={row.unit}
                        onChange={(e) => handleRowChange(index, 'unit', e.target.value)}
                        className="w-full h-9 px-2 text-xs border border-slate-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Price/Unit */}
                    <td className="py-2.5 px-3 text-right">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={row.pricePerUnit}
                        onChange={(e) => handleRowChange(index, 'pricePerUnit', e.target.value)}
                        className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg text-right font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </td>

                    {/* Taxable */}
                    <td className="py-2.5 px-3 text-right font-mono text-xs font-semibold text-slate-800">
                      ₹{row.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* GST Rate */}
                    <td className="py-2.5 px-3 text-center">
                      <select
                        value={row.gstRate}
                        onChange={(e) => handleRowChange(index, 'gstRate', Number(e.target.value))}
                        className="w-full h-9 px-1.5 text-xs border border-slate-200 rounded-lg bg-white font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        {GST_RATES.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}%
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Dynamic Tax Breakdown */}
                    {isSameState ? (
                      <>
                        <td className="py-3 px-3 text-right font-mono text-xs bg-blue-50/40 text-blue-900">
                          <div>₹{row.cgstAmount.toFixed(2)}</div>
                          <span className="text-[10px] text-blue-600 font-sans">({row.cgstRate}%)</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs bg-blue-50/40 text-blue-900">
                          <div>₹{row.sgstAmount.toFixed(2)}</div>
                          <span className="text-[10px] text-blue-600 font-sans">({row.sgstRate}%)</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-3 px-3 text-right font-mono text-xs bg-amber-50/40 text-amber-900">
                        <div>₹{row.igstAmount.toFixed(2)}</div>
                        <span className="text-[10px] text-amber-600 font-sans">({row.igstRate}%)</span>
                      </td>
                    )}

                    {/* Row Total */}
                    <td className="py-3 px-3 text-right font-mono text-xs font-bold text-slate-900">
                      ₹{row.rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Delete */}
                    <td className="py-3 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Remove line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes & Summary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notes Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Terms & Customer Notes</h3>
            <textarea
              rows="4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Terms, payment conditions, or notes to buyer..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <div className="text-[11px] text-slate-400">
              * Bank details configured in Settings will automatically print on the bottom of this tax invoice.
            </div>
          </div>

          {/* Grand Calculation Summary Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Tax Summary Calculation</span>
              <span className="text-xs font-medium text-slate-500">
                Rule: {isSameState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
              </span>
            </h3>

            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Total Taxable Amount (Subtotal):</span>
                <span className="font-mono font-medium text-slate-900">
                  ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {isSameState ? (
                <>
                  <div className="flex justify-between text-blue-700 bg-blue-50/50 p-2 rounded-lg">
                    <span className="font-medium">Central GST (CGST 50% of GST):</span>
                    <span className="font-mono font-semibold">
                      ₹{totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-700 bg-blue-50/50 p-2 rounded-lg">
                    <span className="font-medium">State GST (SGST 50% of GST):</span>
                    <span className="font-mono font-semibold">
                      ₹{totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-amber-700 bg-amber-50/50 p-2 rounded-lg">
                  <span className="font-medium">Integrated GST (IGST 100% of GST):</span>
                  <span className="font-mono font-semibold">
                    ₹{totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-700 pt-1">
                <span>Total Tax Collected:</span>
                <span className="font-mono font-medium">
                  ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t-2 border-slate-100 text-slate-900">
                <span className="font-bold text-base">Grand Total (Rupees):</span>
                <span className="font-mono font-extrabold text-xl text-indigo-600">
                  ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Generating Invoice...' : 'Generate & Save Invoice'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

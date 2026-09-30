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

// Single Searchable Combobox Component for Customers / Clients
function SearchableCustomerSelect({
  customerName,
  selectedUserId,
  userList,
  onSelectUser,
  onChangeCustomerName,
  onClear
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef(null);

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

  // Filter users based on input value
  const selectedUser = (userList || []).find((u) => String(u.id) === String(selectedUserId));
  const isExactSelected = selectedUser && selectedUser.name.toLowerCase() === (customerName || '').trim().toLowerCase();

  const filteredUsers = (userList || []).filter((u) => {
    // If the input matches the currently selected user exactly, show all clients so user can easily switch
    if (isExactSelected) return true;
    const q = (customerName || '').trim().toLowerCase();
    if (!q) return true;
    const nameMatch = (u.name || '').toLowerCase().includes(q);
    const stateMatch = (u.state || '').toLowerCase().includes(q);
    const cityMatch = (u.city || '').toLowerCase().includes(q);
    const phoneMatch = (u.contactNumber || '').includes(q);
    const gstinMatch = (u.gstNumber || u.gstin || (u.pincode && u.pincode.length > 6 ? u.pincode : '') || '').toLowerCase().includes(q);
    return nameMatch || stateMatch || cityMatch || phoneMatch || gstinMatch;
  });

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Main Combobox Input */}
      <div className="relative flex items-center">
        <input
          type="text"
          required
          placeholder="Search or select client..."
          value={customerName || ''}
          onChange={(e) => {
            onChangeCustomerName(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          className="w-full h-10 pl-3.5 pr-14 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-400 shadow-2xs transition-all"
        />

        <div className="absolute right-1.5 flex items-center space-x-0.5">
          {customerName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
            title="Browse clients"
            tabIndex={-1}
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-indigo-600' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sleek Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Clients ({filteredUsers.length})</span>
            {customerName && !isExactSelected && (
              <span className="text-indigo-600 lowercase font-medium">filter: "{customerName}"</span>
            )}
          </div>

          {/* Client List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((u) => {
                const isSelected =
                  (selectedUserId && String(selectedUserId) === String(u.id)) ||
                  (customerName && customerName.trim().toLowerCase() === (u.name || '').trim().toLowerCase());

                return (
                  <div
                    key={u.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectUser(u);
                      setIsOpen(false);
                    }}
                    className={`p-2.5 transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/90 font-semibold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-slate-900 font-semibold truncate flex items-center space-x-2">
                        <span className="truncate text-xs">{u.name}</span>
                        {u.state && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 flex-shrink-0">
                            {u.state}
                          </span>
                        )}
                        {u.city && (
                          <span className="text-[10px] text-slate-500 font-normal">
                            ({u.city})
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-3 truncate">
                        {u.contactNumber && (
                          <span>Phone: <strong className="text-slate-700">{u.contactNumber}</strong></span>
                        )}
                        {(u.gstNumber || u.gstin || (u.pincode && u.pincode.length > 6 ? u.pincode : '')) && (
                          <span className="font-mono">GSTIN: <strong className="text-slate-700">{u.gstNumber || u.gstin || u.pincode}</strong></span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="p-1 rounded-full bg-indigo-600 text-white flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-500 space-y-1">
                <p className="text-xs">No saved clients match "{customerName}"</p>
                <p className="text-[11px] text-slate-400">
                  You can proceed with "{customerName}" as a custom client name.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [customerGstin, setCustomerGstin] = useState('');

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
    setCustomerGstin(user.gstNumber || user.gstin || (user.pincode && user.pincode.length > 6 ? user.pincode : '') || '');
  };

  const handleClearUser = () => {
    setSelectedUserId('');
    setCustomerName('');
    setCustomerState('');
    setCustomerCity('');
    setCustomerAddress('');
    setCustomerPhone('');
    setCustomerEmail('');
    setCustomerGstin('');
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
        customerGstin,
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
      {/* Sleek Integrated Header & Seller Card */}
      <div className="bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100/70">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Generate Tax Invoice</h1>
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold uppercase tracking-wider border border-indigo-100">
                Dual-GST
              </span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5 truncate">
              <span className="font-semibold text-slate-700 truncate">{companySetting?.companyName || 'Company Profile'}</span>
              <span>•</span>
              <span className="truncate">{companySetting?.city || ''}{companySetting?.state ? `, ${companySetting.state}` : ''}</span>
              {companySetting?.gstin && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <span className="font-mono text-slate-600 hidden sm:inline">GSTIN: <strong className="text-slate-700">{companySetting.gstin}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 font-mono text-xs bg-slate-50 px-3 py-1.5 rounded-xl text-slate-700 border border-slate-200 self-start lg:self-auto flex-shrink-0">
          <span className="text-slate-400 font-sans text-[10px] uppercase tracking-wider font-semibold">Invoice No:</span>
          <span className="font-bold text-indigo-600">{nextInvoiceNumber || 'Auto-generated'}</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer / Business Name *
                </label>
                <SearchableCustomerSelect
                  customerName={customerName}
                  selectedUserId={selectedUserId}
                  userList={userList}
                  onSelectUser={handleSelectUser}
                  onChangeCustomerName={setCustomerName}
                  onClear={handleClearUser}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Customer GSTIN
                </label>
                <input
                  type="text"
                  placeholder="e.g. 24AAACN1234F1Z8"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm uppercase font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
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
            className="flex items-center space-x-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>{loading ? 'Saving...' : 'Save Invoice'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

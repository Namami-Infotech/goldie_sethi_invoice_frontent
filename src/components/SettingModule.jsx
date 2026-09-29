import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Landmark,
  Save,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldAlert
} from 'lucide-react';
import { settingService } from '../services/api';
import { INDIAN_STATES } from '../utils/states';

export default function SettingModule({ onSettingsUpdated }) {
  const [formData, setFormData] = useState({
    companyName: '',
    fullAddress: '',
    state: 'Gujarat',
    city: '',
    pincode: '',
    phoneNo: '',
    gstin: '',
    hsa: '',
    email: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingService.get();
      if (res.data.success && res.data.data) {
        setFormData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setSavedSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const res = await settingService.update(formData);
      if (res.data.success) {
        setSavedSuccess(true);
        if (onSettingsUpdated) {
          onSettingsUpdated(res.data.data);
        }
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header (Single Unified Card) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Settings className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Company & Bank Settings</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure your registered business details, tax identity, and default bank account for invoice generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tax Origin State Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500">Tax Origin:</span>
            <strong className="text-slate-800">{formData.state || 'Not Set'}</strong>
            {formData.gstin && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono text-[10px] font-semibold border border-indigo-100">
                {formData.gstin}
              </span>
            )}
          </div>

          {savedSuccess && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings saved!</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Company Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                GSTIN (15-digit GST Number) *
              </label>
              <input
                type="text"
                placeholder="24AAACN1234F1Z8"
                value={formData.gstin}
                onChange={(e) => handleChange('gstin', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State (Tax Benchmark) *
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Address *
            </label>
            <textarea
              rows="2"
              required
              value={formData.fullAddress}
              onChange={(e) => handleChange('fullAddress', e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phoneNo}
                onChange={(e) => handleChange('phoneNo', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                HSA Code / Identifier
              </label>
              <input
                type="text"
                value={formData.hsa}
                onChange={(e) => handleChange('hsa', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Bank Details Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-100">
            <Landmark className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Bank Details (Printed on Invoices)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g. State Bank of India"
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="e.g. Namami Enterprises Pvt Ltd"
                value={formData.accountHolderName}
                onChange={(e) => handleChange('accountHolderName', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Account Number
              </label>
              <input
                type="text"
                placeholder="e.g. 50200012345678"
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                IFSC Code
              </label>
              <input
                type="text"
                placeholder="e.g. SBIN0001234"
                value={formData.ifscCode}
                onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

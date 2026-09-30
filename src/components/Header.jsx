import React from 'react';
import {
  Menu,
  Building2,
  Plus,
  Receipt,
  Sparkles,
  ShieldCheck,
  User
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  companySetting,
  setMobileOpen
}) {
  const titles = {
    invoices: { title: 'Invoices Directory', subtitle: 'Manage, search and print issued GST invoices' },
    'create-invoice': { title: 'Generate Tax Invoice', subtitle: 'Automated Dual-GST calculation based on state' },
    items: { title: 'Items Catalog', subtitle: 'Products, services, HSN/SAC codes and rates' },
    users: { title: 'Users & Roles', subtitle: 'Manage USER (clients) and ADMIN profiles' },
    settings: { title: 'Company Settings', subtitle: 'Business profile, GSTIN, HSA and bank details' }
  };

  const current = titles[activeTab] || { title: 'Invoicing Suite', subtitle: '' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 no-print shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
            {current.title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden sm:block leading-none mt-0.5">
            {current.subtitle}
          </p>
        </div>
      </div>

      {/* Right Actions & Status Badges */}
      <div className="flex items-center space-x-2.5">
        {/* Dynamic Company Details Badge */}
        <div
          onClick={() => setActiveTab('settings')}
          className="hidden sm:flex items-center space-x-2 h-9 px-3 rounded-lg bg-indigo-50 border border-indigo-100 hover:bg-indigo-100/70 transition-colors cursor-pointer text-xs group"
          title="Click to manage Company Settings"
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <div className="text-left leading-none max-w-[180px]">
            <span className="text-[9px] text-indigo-500 uppercase font-bold tracking-wider block">
              Company
            </span>
            <span className="font-bold text-slate-800 text-xs truncate block mt-0.5">
              {companySetting?.companyName || 'Set Company'}
            </span>
          </div>
        </div>

        {/* Origin State Badge */}
        <div className="hidden sm:flex items-center space-x-2 h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
          <div className="text-left leading-none">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
              Tax Origin
            </span>
            <span className="font-bold text-slate-800 ml-1">
              {companySetting?.state || 'Not Set'}
            </span>
          </div>
        </div>

        {/* Admin Workspace Badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              AD
            </div>
            <div className="hidden md:block text-left text-xs leading-none">
              <div className="font-bold text-slate-800 text-[11px] truncate max-w-[120px]">
                Administrator
              </div>
              <div className="text-[9px] text-emerald-600 font-semibold mt-0.5 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

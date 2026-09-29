import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50]
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safePage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (safePage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-white px-4 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 rounded-b-2xl">
      {/* Left: Summary & Rows Per Page */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-slate-500">
          Showing <strong className="text-slate-800 font-semibold">{startItem}</strong> to{' '}
          <strong className="text-slate-800 font-semibold">{endItem}</strong> of{' '}
          <strong className="text-slate-800 font-semibold">{totalItems}</strong> entries
        </span>

        {onPageSizeChange && (
          <div className="flex items-center space-x-1.5 pl-3 border-l border-slate-200">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="h-7 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Navigation Controls */}
      <div className="flex items-center space-x-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={safePage === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Prev Page */}
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center space-x-1 px-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-bold select-none">
                  ...
                </span>
              );
            }

            const isActive = p === safePage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-7 h-7 px-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/30'
                    : 'text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages || totalItems === 0}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={safePage === totalPages || totalItems === 0}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

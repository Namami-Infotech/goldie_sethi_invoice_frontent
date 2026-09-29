import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  itemName,
  itemType = 'record',
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  loading = false
}) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200 no-print"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          {/* Danger Icon Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3
                id="delete-modal-title"
                className="text-base font-bold text-slate-900 tracking-tight"
              >
                {title}
              </h3>
              <p className="text-xs text-rose-600 font-semibold tracking-wide uppercase mt-0.5">
                Irreversible Action
              </p>
            </div>
          </div>

          {/* Description Message */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {message || `Are you sure you want to delete this ${itemType}? This action cannot be undone.`}
          </p>

          {/* Item Identification Badge */}
          {itemName && (
            <div className="mt-3.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium capitalize">{itemType}:</span>
              <span className="font-mono font-bold text-slate-800 truncate max-w-[240px]">
                {itemName}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

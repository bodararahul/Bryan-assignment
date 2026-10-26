import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

export type ConfirmationVariant = 'danger' | 'warning' | 'primary';

export interface ConfirmationItemDetails {
  label?: string;
  name: string;
  subtext?: string;
  avatarIcon?: ReactNode;
  avatarText?: string;
}

export interface ConfirmationModalProps {
  isOpen?: boolean;
  title: string;
  subtitle?: string;
  message?: ReactNode;
  itemDetails?: ConfirmationItemDetails;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  icon?: ReactNode;
  confirmIcon?: ReactNode;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Reusable Confirmation Modal Component
 * Used for high-stakes actions: Lead Deletion, Workspace Sign Out, and State Resets.
 * Rendered via createPortal to guarantee proper stacking over any container or drawer.
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen = true,
  title,
  subtitle,
  message,
  itemDetails,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  confirmIcon,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  // Determine variant styling tokens
  const accentBarClass =
    variant === 'warning'
      ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent'
      : variant === 'primary'
      ? 'bg-gradient-to-r from-transparent via-indigo-500 to-transparent'
      : 'bg-gradient-to-r from-transparent via-rose-500 to-transparent';

  const iconBadgeClass =
    variant === 'warning'
      ? 'w-14 h-14 rounded-2xl bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-500/35 flex items-center justify-center text-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)] ring-4 ring-amber-500/10'
      : variant === 'primary'
      ? 'w-14 h-14 rounded-2xl bg-gradient-to-b from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/35 flex items-center justify-center text-indigo-400 shadow-[0_0_24px_rgba(99,102,241,0.25)] ring-4 ring-indigo-500/10'
      : 'delete-modal-icon-badge';

  const confirmBtnClass =
    variant === 'warning'
      ? 'btn confirm-btn-warning'
      : variant === 'primary'
      ? 'btn btn-primary min-h-[42px]'
      : 'btn delete-btn-confirm';

  const defaultIcon =
    variant === 'warning' ? (
      <AlertTriangle size={24} strokeWidth={2.3} className="text-amber-400" />
    ) : (
      <AlertTriangle size={24} strokeWidth={2.3} className="text-rose-400" />
    );

  const modalContent = (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        className="delete-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top ambient glowing accent line */}
        <div className={`delete-modal-accent-bar ${accentBarClass}`} />

        {/* Close Button */}
        <button
          className="modal-close-btn"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Central Icon Badge with glowing halo */}
        <div className="delete-modal-badge-wrapper">
          <div className={iconBadgeClass}>
            {icon || defaultIcon}
          </div>
        </div>

        {/* Modal Title & Subtitle */}
        <div className="delete-modal-header">
          <h2 className="delete-modal-title" id="confirm-modal-title">
            {title}
          </h2>
          {subtitle && (
            <p className="delete-modal-subtitle">
              {subtitle}
            </p>
          )}
        </div>

        {/* Optional Target Item Details Box */}
        {itemDetails && (
          <div className="delete-lead-target-box">
            <div className="delete-target-avatar">
              {itemDetails.avatarIcon ? (
                itemDetails.avatarIcon
              ) : itemDetails.avatarText ? (
                <span className="text-xs font-bold text-rose-300">
                  {itemDetails.avatarText}
                </span>
              ) : (
                <AlertTriangle size={15} className="text-rose-400" />
              )}
            </div>
            <div className="delete-target-meta">
              {itemDetails.label && (
                <span className="delete-target-label">
                  {itemDetails.label}
                </span>
              )}
              <span className="delete-target-name" title={itemDetails.name}>
                {itemDetails.name}
              </span>
              {itemDetails.subtext && (
                <span className="text-[11px] text-slate-400 truncate mt-0.5" title={itemDetails.subtext}>
                  {itemDetails.subtext}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Informative Warning Message */}
        {message && (
          <p className="delete-modal-warning-text">
            {message}
          </p>
        )}

        {/* Action Buttons: Cancel vs Confirm */}
        <div className="delete-modal-actions">
          <button
            type="button"
            className="btn delete-btn-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={confirmBtnClass}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" style={{ borderTopColor: '#ffffff' }} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {confirmIcon}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default ConfirmationModal;

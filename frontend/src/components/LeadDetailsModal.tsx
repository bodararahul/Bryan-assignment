import React from 'react';
import {
  X,
  Mail,
  Phone,
  Calendar,
  Clock,
  FileText,
  User,
  Copy,
  Check,
  Edit3,
} from 'lucide-react';
import type { Lead } from '../types/lead';
import toast from 'react-hot-toast';

interface LeadDetailsModalProps {
  lead: Lead | null;
  onClose: () => void;
  onOpenEdit?: (lead: Lead) => void;
}

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({
  lead,
  onClose,
  onOpenEdit,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  if (!lead) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="lead-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className="lead-detail-header pr-8">
          <div className="lead-avatar-lg">
            {lead.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="lead-detail-title truncate" title={lead.name}>{lead.name}</h2>
            <div className="lead-detail-meta">
              {/* <span>ID: {lead.id.slice(0, 8)}...</span>
              <span>•</span> */}
              <span className={`status-pill status-${lead.status}`}>
                {/* <span className={`status-dot status-dot-${lead.status.toLowerCase()}`} /> */}
                {lead.status}
              </span>
            </div>
          </div>
        </div>

        <div className="lead-detail-body">
          {/* Read-Only Pipeline Stage */}
          <div className="detail-section">
            <label className="detail-label">Pipeline Stage (Read-Only View)</label>
            <div className={`read-only-stage-pill status-${lead.status}`}>
              <span className={`status-dot status-dot-${lead.status.toLowerCase()}`} />
              <span className="stage-name-bold">{lead.status}</span>
              <span className="stage-readonly-sub">• Current Active Stage</span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="detail-section">
            <label className="detail-label">Contact Details</label>
            <div className="contact-card-grid">
              <div className="contact-item-card">
                <div className="contact-item-icon">
                  <Mail size={16} />
                </div>
                <div className="contact-item-info">
                  <span className="contact-item-lbl">Email Address</span>
                  <a href={`mailto:${lead.email}`} className="contact-item-val">
                    {lead.email}
                  </a>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => copyToClipboard(lead.email, 'Email')}
                  title="Copy email"
                >
                  {copiedField === 'Email' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                </button>
              </div>

              <div className="contact-item-card">
                <div className="contact-item-icon">
                  <Phone size={16} />
                </div>
                <div className="contact-item-info">
                  <span className="contact-item-lbl">Phone Number</span>
                  <span className="contact-item-val">
                    {lead.phone || 'Not provided'}
                  </span>
                </div>
                {lead.phone && (
                  <button
                    className="copy-btn"
                    onClick={() => copyToClipboard(lead.phone!, 'Phone')}
                    title="Copy phone"
                  >
                    {copiedField === 'Phone' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="detail-section">
            <label className="detail-label">
              <FileText size={13} />
              Lead Notes & Discovery Context
            </label>
            <div className="notes-box">
              {lead.notes ? (
                <p>{lead.notes}</p>
              ) : (
                <p className="no-notes-text">No notes provided for this lead.</p>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="detail-footer-grid">
            <div className="timestamp-item">
              <Calendar size={13} />
              <span>Created: {formatDate(lead.created_at)}</span>
            </div>
            <div className="timestamp-item">
              <Clock size={13} />
              <span>Last Updated: {formatDate(lead.updated_at)}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="lead-detail-actions">
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
            {onOpenEdit && (
              <button
                className="btn btn-primary"
                onClick={() => onOpenEdit(lead)}
                title="Edit this lead"
              >
                <Edit3 size={15} />
                <span>Edit Lead</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadDetailsModal;

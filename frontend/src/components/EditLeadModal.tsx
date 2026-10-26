import React, { useState, useEffect } from 'react';
import {
  X,
  Edit3,
  User,
  Mail,
  Phone,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import type { Lead, LeadStatus, UpdateLeadForm } from '../types/lead';
import { leadsApi } from '../api/leadsApi';
import {
  COUNTRY_CODES,
  parsePhoneNumber,
  validateEmail,
  validatePhone,
} from '../utils/countryCodes';
import toast from 'react-hot-toast';

interface EditLeadModalProps {
  lead: Lead | null;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
}

const STATUSES: { value: LeadStatus; label: string; desc: string }[] = [
  { value: 'New', label: 'New', desc: 'Recently captured' },
  { value: 'Contacted', label: 'Contacted', desc: 'Reached out' },
  { value: 'Qualified', label: 'Qualified', desc: 'High conversion intent' },
  { value: 'Closed', label: 'Closed', desc: 'Finalized / Converted' },
];

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  lead,
  onClose,
  onLeadUpdated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setEmail(lead.email || '');
      const parsed = parsePhoneNumber(lead.phone);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.number);
      setNotes(lead.notes || '');
      setStatus(lead.status || 'New');
      setErrors({});
      setSubmitting(false);
    }

    return () => {
      setName('');
      setEmail('');
      setPhoneNumber('');
      setNotes('');
      setErrors({});
      setSubmitting(false);
    };
  }, [lead?.id]);

  const handleClose = () => {
    setName('');
    setEmail('');
    setPhoneNumber('');
    setNotes('');
    setErrors({});
    setSubmitting(false);
    onClose();
  };

  if (!lead) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only numbers allowed, maximum 10 digits
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(digitsOnly);
    if (errors.phone) {
      const err = validatePhone(digitsOnly);
      setErrors((prev) => ({ ...prev, phone: err || '' }));
    }
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (errors.email) {
      const err = validateEmail(val);
      setErrors((prev) => ({ ...prev, email: err || '' }));
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!name.trim()) {
      errs.name = 'Full name is required';
    } else if (name.trim().length > 255) {
      errs.name = 'Name must be under 255 characters';
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      errs.email = emailErr;
    }

    const phoneErr = validatePhone(phoneNumber);
    if (phoneErr) {
      errs.phone = phoneErr;
    }

    if (notes.trim().length > 5000) {
      errs.notes = 'Notes must be under 5000 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fullPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
      const payload: UpdateLeadForm = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: fullPhone,
        notes: notes.trim(),
        status,
      };

      const updated = await leadsApi.updateLead(lead.id, payload);
      toast.success(`Lead "${updated.name}" updated successfully! 🎉`);
      onLeadUpdated(updated);
      handleClose();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to update lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleClose}>
      <div className="edit-lead-modal modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose} aria-label="Close">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="edit-modal-header pr-8">
          <div className="edit-modal-icon-badge">
            <Edit3 size={20} />
          </div>
          <div className="edit-modal-title-block">
            <h2 className="edit-modal-title">Edit Lead Details</h2>
            <p className="edit-modal-desc">
              Modify customer information, contact details, or pipeline stage.
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="edit-lead-form">
          {/* Full Name & Email Grid */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-lead-name">
                Full Name <span className="required">*</span>
              </label>
              <div className="input-with-icon">
                <User size={15} className="input-field-icon" />
                <input
                  id="edit-lead-name"
                  type="text"
                  className={`form-input has-icon ${errors.name ? 'error' : ''}`}
                  placeholder="e.g. Sarah Connor"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                />
              </div>
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-lead-email">
                Email Address <span className="required">*</span>
              </label>
              <div className="input-with-icon">
                <Mail size={15} className="input-field-icon" />
                <input
                  id="edit-lead-email"
                  type="email"
                  className={`form-input has-icon ${errors.email ? 'error' : ''}`}
                  placeholder="e.g. sarah@cyberdyne.io"
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
          </div>

          {/* Phone Number - Full Width for ample space */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-lead-phone">
              Phone Number <span className="required">*</span>
            </label>
            <div className="phone-input-row">
              <div className="country-code-wrapper">
                <select
                  id="edit-country-code"
                  className="country-code-select"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  aria-label="Select country code"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} className="country-code-chevron" />
              </div>

              <div className="phone-number-field-wrapper">
                <Phone size={15} className="input-field-icon" />
                <input
                  id="edit-lead-phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  className={`form-input has-icon ${errors.phone ? 'error' : ''}`}
                  placeholder="10-digit number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  onKeyDown={handlePhoneKeyDown}
                />
              </div>
            </div>
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          {/* Pipeline Stage Select */}
          <div className="form-group">
            <label className="form-label">
              Pipeline Stage <span className="required">*</span>
            </label>
            <div className="status-radio-options">
              {STATUSES.map((s) => (
                <div
                  key={s.value}
                  className={`status-option-card ${status === s.value ? 'selected' : ''}`}
                  onClick={() => setStatus(s.value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') setStatus(s.value);
                  }}
                >
                  <span className={`status-dot status-dot-${s.value.toLowerCase()}`} />
                  <div className="option-text">
                    <span className="option-name">{s.label}</span>
                    <span className="option-desc">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discovery Notes */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-lead-notes">
              Discovery Notes & Requirements
            </label>
            <div className="input-with-icon">
              <textarea
                id="edit-lead-notes"
                className={`form-textarea ${errors.notes ? 'error' : ''}`}
                rows={3}
                placeholder="Key requirements, conversation notes, timeline..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  if (errors.notes) setErrors((prev) => ({ ...prev, notes: '' }));
                }}
              />
            </div>
            {errors.notes && <span className="form-error">{errors.notes}</span>}
          </div>

          {/* Modal Actions */}
          <div className="edit-modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="spin-anim" />
                  <span>Saving Changes…</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Update Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeadModal;

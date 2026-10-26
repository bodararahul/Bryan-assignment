import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  User,
  Mail,
  Phone,
  FileText,
  Plus,
  AlertCircle,
  Loader2,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Eye,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import type { CreateLeadForm, LeadStatus } from '../types/lead';
import { leadsApi } from '../api/leadsApi';
import { COUNTRY_CODES, validateEmail, validatePhone } from '../utils/countryCodes';
import toast from 'react-hot-toast';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

interface CreateLeadViewProps {
  onLeadCreated: () => void;
  onViewLeads: () => void;
}

interface FormState {
  name: string;
  email: string;
  notes: string;
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  notes: '',
};

const SAMPLE_LEADS = [
  {
    name: 'Sarah Connor',
    email: 'sarah.connor@cyberdyne.io',
    countryCode: '+1',
    phoneNumber: '4155558392',
    notes: 'CTO evaluating enterprise migration from Salesforce. Requested demo next Tuesday.',
  },
  {
    name: 'Rajesh Verma',
    email: 'rajesh.v@fintechinnovations.in',
    countryCode: '+91',
    phoneNumber: '9820012345',
    notes: 'VP of Product. Looking for 50-seat CRM with PostgreSQL backend & SOC2 compliance.',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.r@nordiclogistics.se',
    countryCode: '+44',
    phoneNumber: '7911123456',
    notes: 'Met at SaaStr Europe. Interested in automated lead status pipelines.',
  },
  {
    name: 'Tariq Al-Mansoor',
    email: 'tariq.mansoor@gulftech.ae',
    countryCode: '+971',
    phoneNumber: '5012345671',
    notes: 'Managing Director interested in multi-regional sales pipeline automation.',
  },
];

const validate = (form: FormState, phoneDigits: string): FormErrors => {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = 'Full name is required';
  } else if (form.name.trim().length > 255) {
    errors.name = 'Name must be under 255 characters';
  }

  const emailErr = validateEmail(form.email);
  if (emailErr) {
    errors.email = emailErr;
  }

  const phoneErr = validatePhone(phoneDigits);
  if (phoneErr) {
    errors.phone = phoneErr;
  }

  if (form.notes.trim().length > 5000) {
    errors.notes = 'Notes must be under 5000 characters';
  }

  return errors;
};

export const CreateLeadView: React.FC<CreateLeadViewProps> = ({
  onLeadCreated,
  onViewLeads,
}) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus>('New');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form to pristine state on mount and clean up on unmount/tab switch
  useEffect(() => {
    setForm(INITIAL_FORM);
    setCountryCode('+91');
    setPhoneNumber('');
    setSelectedStatus('New');
    setErrors({});
    setTouched({});
    setSubmitting(false);

    return () => {
      setForm(INITIAL_FORM);
      setCountryCode('+91');
      setPhoneNumber('');
      setSelectedStatus('New');
      setErrors({});
      setTouched({});
      setSubmitting(false);
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    if (touched[name]) {
      setErrors(validate(updated, phoneNumber));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(form, phoneNumber));
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow Backspace, Delete, Arrow keys, Tab, Enter, Home, End
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    // Block non-digit characters
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(digitsOnly);

    if (touched.phone || errors.phone) {
      const err = validatePhone(digitsOnly);
      setErrors((prev) => ({ ...prev, phone: err || undefined }));
    }
  };

  const handleFillSample = () => {
    const randomSample = SAMPLE_LEADS[Math.floor(Math.random() * SAMPLE_LEADS.length)];
    setForm({
      name: randomSample.name,
      email: randomSample.email,
      notes: randomSample.notes,
    });
    setCountryCode(randomSample.countryCode);
    setPhoneNumber(randomSample.phoneNumber);
    setErrors({});
    setTouched({});
    toast.success('Sample lead populated! ✨');
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setCountryCode('+91');
    setPhoneNumber('');
    setErrors({});
    setTouched({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(form, phoneNumber);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched({ name: true, email: true, phone: true, notes: true });
      return;
    }

    setSubmitting(true);
    try {
      const fullPhone = phoneNumber ? `${countryCode} ${phoneNumber}` : '';
      const payload: CreateLeadForm = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: fullPhone,
        notes: form.notes.trim(),
      };

      const created = await leadsApi.createLead(payload);
      if (selectedStatus !== 'New') {
        await leadsApi.updateLeadStatus(created.id, selectedStatus);
      }
      toast.success(`Lead "${payload.name}" created successfully! 🎉`);
      setForm(INITIAL_FORM);
      setCountryCode('+91');
      setPhoneNumber('');
      setErrors({});
      setTouched({});
      onLeadCreated();
    } catch (err: unknown) {
      const error = err as Error & { details?: { field: string; message: string }[] };
      if (error.details?.length) {
        toast.error(`Validation: ${error.details[0].message}`);
      } else {
        toast.error(error.message || 'Failed to create lead');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const previewName = form.name.trim() || 'Prospective Client';
  const previewEmail = form.email.trim() || 'client@enterprise.com';
  const previewPhone = phoneNumber
    ? `${countryCode} ${phoneNumber}`
    : '+91 98765 43210';
  const previewNotes = form.notes.trim() || 'No initial notes provided yet.';
  const previewInitials = previewName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'PC';

  return (
    <div className="create-view-layout">
      {/* Form Column */}
      <div className="card create-form-card">
        <div className="create-form-header">
          <div className="create-header-title-group">
            <div className="card-title-icon">
              <UserPlus size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="create-header-title">Lead Intake Form</h2>
              <p className="create-header-sub">
                Complete all required fields below to register an incoming opportunity.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm sample-fill-btn"
            onClick={handleFillSample}
            title="Auto-fill with realistic demo data"
          >
            <Sparkles size={14} className="text-amber" />
            <span>Fill Sample Data</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Section 1: Contact Details */}
          <div className="form-section-block">
            <h3 className="form-section-title">
              <User size={14} /> Contact Information
            </h3>

            <div className="form-grid-2">
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="name">
                  Full Name <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <User size={15} className="input-field-icon" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={`form-input has-icon ${errors.name ? 'error' : ''}`}
                    placeholder="e.g. Jane Smith"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="name"
                  />
                </div>
                {errors.name && (
                  <span className="form-error">
                    <AlertCircle size={13} strokeWidth={2.2} />
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Email Address <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <Mail size={15} className="input-field-icon" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-input has-icon ${errors.email ? 'error' : ''}`}
                    placeholder="e.g. jane@company.com"
                    value={form.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <span className="form-error">
                    <AlertCircle size={13} strokeWidth={2.2} />
                    {errors.email}
                  </span>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label className="form-label" htmlFor="phone">
                Phone Number <span className="required">*</span>
              </label>
              <div className="phone-input-row">
                <div className="country-code-wrapper">
                  <select
                    id="create-country-code"
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
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    className={`form-input has-icon ${errors.phone ? 'error' : ''}`}
                    placeholder="10-digit number"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyDown={handlePhoneKeyDown}
                    onBlur={() => {
                      setTouched((prev) => ({ ...prev, phone: true }));
                      const err = validatePhone(phoneNumber);
                      setErrors((prev) => ({ ...prev, phone: err || undefined }));
                    }}
                    autoComplete="tel-national"
                  />
                </div>
              </div>
              {errors.phone && (
                <span className="form-error">
                  <AlertCircle size={13} strokeWidth={2.2} />
                  {errors.phone}
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Pipeline State Selection */}
          <div className="form-section-block">
            <h3 className="form-section-title">
              <ShieldCheck size={14} /> Initial Lead Status
            </h3>

            <div className="status-radio-options">
              {(['New', 'Contacted', 'Qualified', 'Closed'] as LeadStatus[]).map((status) => (
                <button
                  type="button"
                  key={status}
                  className={`status-option-card ${selectedStatus === status ? 'selected' : ''} status-${status}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  <span className={`status-dot status-dot-${status.toLowerCase()}`} />
                  <div className="option-text">
                    <strong className="option-name">{status}</strong>
                    <span className="option-desc">
                      {status === 'New' && 'Fresh inquiry'}
                      {status === 'Contacted' && 'Outreach started'}
                      {status === 'Qualified' && 'Fits criteria'}
                      {status === 'Closed' && 'Finalized'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Notes & Context */}
          <div className="form-section-block">
            <h3 className="form-section-title">
              <FileText size={14} /> Notes & Context
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="notes">
                Discovery Notes & Customer Requirements
              </label>
              <textarea
                id="notes"
                name="notes"
                className={`form-textarea ${errors.notes ? 'error' : ''}`}
                placeholder="Describe business interest, deal size, key decision makers, timeline, or notes..."
                value={form.notes}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={4}
              />
              {errors.notes && (
                <span className="form-error">
                  <AlertCircle size={13} strokeWidth={2.2} />
                  {errors.notes}
                </span>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="create-form-actions">
            <button
              id="create-lead-btn"
              type="submit"
              className="btn btn-primary submit-lead-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin-anim" />
                  Saving to Supabase...
                </>
              ) : (
                <>
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Create & Save Lead</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleReset}
              disabled={submitting}
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ marginLeft: 'auto' }}
              onClick={() => {
                handleReset();
                onViewLeads();
              }}
            >
              <span>View Leads Table →</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Column */}
      <div className="create-preview-col">
        <div className="card preview-card">
          <div className="preview-header">
            <div className="preview-label">
              <Eye size={13} />
              <span>Live CRM Card Preview</span>
            </div>
            <span className="preview-badge-live">Realtime</span>
          </div>

          <div className="preview-body">
            <div className="preview-avatar-row">
              <div className="preview-avatar-circle">{previewInitials}</div>
              <div className="preview-names">
                <h4 className="preview-name">{previewName}</h4>
                <div className="preview-stage-row">
                  <span className={`status-pill-badge status-${selectedStatus}`}>
                    <span className={`status-dot status-dot-${selectedStatus.toLowerCase()}`} />
                    {selectedStatus}
                  </span>
                  <span className="preview-meta-time">Just now</span>
                </div>
              </div>
            </div>

            <div className="preview-divider" />

            <div className="preview-contact-rows">
              <div className="preview-contact-item">
                <Mail size={14} className="preview-icon text-indigo" />
                <span className="preview-val">{previewEmail}</span>
              </div>
              <div className="preview-contact-item">
                <Phone size={14} className="preview-icon text-amber" />
                <span className="preview-val">{previewPhone}</span>
              </div>
            </div>

            <div className="preview-notes-block">
              <span className="preview-notes-lbl">Notes & Discovery Context:</span>
              <p className="preview-notes-txt">{previewNotes}</p>
            </div>

            <div className="preview-footer">
              <CheckCircle2 size={14} className="text-emerald" />
              <span>Stored securely in Supabase PostgreSQL</span>
            </div>
          </div>
        </div>

        {/* Security & Validation Notice */}
        <div className="security-notice-card">
          <ShieldCheck size={18} className="security-shield-icon" />
          <div>
            <strong>Data Integrity Assured</strong>
            <p>
              Inputs are sanitized against XSS attacks and executed through parameterized PostgreSQL statements to prevent SQL injections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLeadView;

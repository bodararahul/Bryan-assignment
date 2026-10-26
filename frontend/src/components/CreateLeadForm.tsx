import React, { useState } from 'react';
import {
  UserPlus,
  User,
  Mail,
  Phone,
  FileText,
  Plus,
  AlertCircle,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import type { CreateLeadForm } from '../types/lead';
import { leadsApi } from '../api/leadsApi';
import { COUNTRY_CODES, validateEmail, validatePhone } from '../utils/countryCodes';
import toast from 'react-hot-toast';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

interface CreateLeadFormProps {
  onLeadCreated: () => void;
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

const CreateLeadFormComponent: React.FC<CreateLeadFormProps> = ({ onLeadCreated }) => {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
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
      await leadsApi.createLead(payload);
      toast.success('Lead created successfully! 🎉');
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

  return (
    <div className="card">
      <div className="card-title">
        <span className="card-title-icon">
          <UserPlus size={17} strokeWidth={2.2} />
        </span>
        Add New Lead
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="create-comp-name">
              <span className="label-with-icon">
                <User size={13} strokeWidth={2} className="field-icon" />
                Full Name
              </span>
              <span className="required">*</span>
            </label>
            <input
              id="create-comp-name"
              name="name"
              type="text"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Jane Smith"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="name"
            />
            {errors.name && (
              <span className="form-error">
                <AlertCircle size={13} strokeWidth={2.2} />
                {errors.name}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="create-comp-email">
              <span className="label-with-icon">
                <Mail size={13} strokeWidth={2} className="field-icon" />
                Email Address
              </span>
              <span className="required">*</span>
            </label>
            <input
              id="create-comp-email"
              name="email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="jane@example.com"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
            />
            {errors.email && (
              <span className="form-error">
                <AlertCircle size={13} strokeWidth={2.2} />
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="create-comp-phone">
              <span className="label-with-icon">
                <Phone size={13} strokeWidth={2} className="field-icon" />
                Phone Number
              </span>
              <span className="required">*</span>
            </label>
            <div className="phone-input-row">
              <div className="country-code-wrapper">
                <select
                  id="create-comp-cc"
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
                  id="create-comp-phone"
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

          <div className="form-group">
            <label className="form-label" htmlFor="create-comp-notes">
              <span className="label-with-icon">
                <FileText size={13} strokeWidth={2} className="field-icon" />
                Notes
              </span>
            </label>
            <textarea
              id="create-comp-notes"
              name="notes"
              className={`form-textarea ${errors.notes ? 'error' : ''}`}
              placeholder="Interested in enterprise plan, spoke at TechConf..."
              value={form.notes}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
            />
            {errors.notes && (
              <span className="form-error">
                <AlertCircle size={13} strokeWidth={2.2} />
                {errors.notes}
              </span>
            )}
          </div>

          <button
            id="create-lead-btn"
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="spin-anim" />
                Creating Lead...
              </>
            ) : (
              <>
                <Plus size={16} strokeWidth={2.5} />
                Create Lead
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLeadFormComponent;

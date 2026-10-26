export interface CountryCode {
  code: string;
  name: string;
  label: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', name: 'India', label: '+91 (India)', flag: '🇮🇳' },
  { code: '+1', name: 'USA / Canada', label: '+1 (USA/Canada)', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', label: '+44 (UK)', flag: '🇬🇧' },
  { code: '+971', name: 'UAE', label: '+971 (UAE)', flag: '🇦🇪' },
  { code: '+61', name: 'Australia', label: '+61 (Australia)', flag: '🇦🇺' },
  { code: '+65', name: 'Singapore', label: '+65 (Singapore)', flag: '🇸🇬' },
  { code: '+49', name: 'Germany', label: '+49 (Germany)', flag: '🇩🇪' },
  { code: '+33', name: 'France', label: '+33 (France)', flag: '🇫🇷' },
  { code: '+81', name: 'Japan', label: '+81 (Japan)', flag: '🇯🇵' },
  { code: '+86', name: 'China', label: '+86 (China)', flag: '🇨🇳' },
  { code: '+966', name: 'Saudi Arabia', label: '+966 (Saudi)', flag: '🇸🇦' },
  { code: '+55', name: 'Brazil', label: '+55 (Brazil)', flag: '🇧🇷' },
  { code: '+7', name: 'Russia', label: '+7 (Russia)', flag: '🇷🇺' },
  { code: '+27', name: 'South Africa', label: '+27 (South Africa)', flag: '🇿🇦' },
];

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Parses existing raw phone string into countryCode and exactly up to 10 digits
 */
export const parsePhoneNumber = (rawPhone?: string | null): { countryCode: string; number: string } => {
  if (!rawPhone) return { countryCode: '+91', number: '' };
  const trimmed = rawPhone.trim();

  // Check known country code prefixes
  for (const item of COUNTRY_CODES) {
    if (trimmed.startsWith(item.code)) {
      const rest = trimmed.slice(item.code.length).replace(/\D/g, '').slice(0, 10);
      return { countryCode: item.code, number: rest };
    }
  }

  // Check any +country prefix
  const genericMatch = trimmed.match(/^(\+\d{1,4})\s*(.*)$/);
  if (genericMatch) {
    return {
      countryCode: genericMatch[1],
      number: genericMatch[2].replace(/\D/g, '').slice(0, 10),
    };
  }

  // Strip non-digits
  const digits = trimmed.replace(/\D/g, '');
  // If 11 digits starting with 0, strip leading 0
  const clean = digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits.slice(0, 10);

  return { countryCode: '+91', number: clean };
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): string | null => {
  if (!email || !email.trim()) {
    return 'Email address is required';
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address with a valid domain (e.g. name@company.com)';
  }
  return null;
};

/**
 * Validates 10-digit phone number (Required)
 */
export const validatePhone = (number: string, isRequired = true): string | null => {
  const clean = number.replace(/\D/g, '');
  if (!clean) {
    return isRequired ? 'Phone number is required' : null;
  }
  if (clean.length !== 10) {
    return `Phone number must be exactly 10 digits (currently ${clean.length} digits)`;
  }
  return null;
};

/**
 * Pure validation utility functions.
 * These are the same rules used by express-validator in leadValidators.ts,
 * extracted as pure functions so they can be unit-tested without a running server.
 */

/**
 * Returns true if the value is a valid email address.
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Returns true if the value is a valid phone number.
 * Accepts: 10-digit numeric, or international format with + prefix.
 * Minimum 7 digits, maximum 15 digits (ITU-T E.164 standard).
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  // Strip spaces, dashes, and parentheses for digit-counting
  const digitsOnly = phone.replace(/[\s\-().]/g, '');
  // Must start with + or digit, contain only digits after stripping
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(digitsOnly);
};

export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  errors: string[];
}

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special symbol (!@#$%^&*...)
 */
export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      hasMinLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumber: false,
      hasSymbol: false,
      errors: ['Password is required.'],
    };
  }

  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('Password must be at least 8 characters long.');
  if (!hasUpperCase) errors.push('Password must include at least one uppercase letter (A-Z).');
  if (!hasLowerCase) errors.push('Password must include at least one lowercase letter (a-z).');
  if (!hasNumber) errors.push('Password must include at least one number (0-9).');
  if (!hasSymbol) errors.push('Password must include at least one special symbol (!@#$%^&*...).');

  return {
    isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSymbol,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSymbol,
    errors,
  };
};


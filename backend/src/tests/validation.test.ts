import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEmail, validatePhone, validatePasswordStrength } from '../utils/validators';

// ─── Unit Tests: Input Validation Utilities ────────────────────────────────────
// These tests verify the core validation logic used by express-validator
// middleware without requiring a running server or database.

describe('Email Validation', () => {
  const validEmails = [
    'user@example.com',
    'USER@EXAMPLE.COM',
    'user.name+tag@sub.example.org',
    'user123@domain.io',
  ];

  const invalidEmails = [
    '',
    'not-an-email',
    'missing@',
    '@nodomain.com',
    'spaces in@email.com',
    'user@',
  ];

  it.each(validEmails)('accepts valid email: %s', (email: string) => {
    expect(validateEmail(email)).toBe(true);
  });

  it.each(invalidEmails)('rejects invalid email: %s', (email: string) => {
    expect(validateEmail(email)).toBe(false);
  });
});

describe('Phone Validation', () => {
  const validPhones = [
    '9876543210',       // plain 10-digit
    '+919876543210',    // international with +
    '+1 555 123 4567',  // US with spaces
    '+44 20 7946 0958', // UK format
  ];

  const invalidPhones = [
    '12345',            // too short
    'abcdefghij',       // letters
    '123456789012345678901', // too long
  ];

  it.each(validPhones)('accepts valid phone: %s', (phone: string) => {
    expect(validatePhone(phone)).toBe(true);
  });

  it.each(invalidPhones)('rejects invalid phone: %s', (phone: string) => {
    expect(validatePhone(phone)).toBe(false);
  });
});

describe('Password Strength Validation', () => {
  it('accepts strong passwords meeting all 5 requirements', () => {
    const res = validatePasswordStrength('SecurePass@123');
    expect(res.isValid).toBe(true);
    expect(res.hasMinLength).toBe(true);
    expect(res.hasUpperCase).toBe(true);
    expect(res.hasLowerCase).toBe(true);
    expect(res.hasNumber).toBe(true);
    expect(res.hasSymbol).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejects passwords shorter than 8 characters', () => {
    const res = validatePasswordStrength('Ab1@xyz');
    expect(res.isValid).toBe(false);
    expect(res.hasMinLength).toBe(false);
    expect(res.errors).toContain('Password must be at least 8 characters long.');
  });

  it('rejects passwords without uppercase letter', () => {
    const res = validatePasswordStrength('lowercase@123');
    expect(res.isValid).toBe(false);
    expect(res.hasUpperCase).toBe(false);
    expect(res.errors).toContain('Password must include at least one uppercase letter (A-Z).');
  });

  it('rejects passwords without lowercase letter', () => {
    const res = validatePasswordStrength('UPPERCASE@123');
    expect(res.isValid).toBe(false);
    expect(res.hasLowerCase).toBe(false);
    expect(res.errors).toContain('Password must include at least one lowercase letter (a-z).');
  });

  it('rejects passwords without number', () => {
    const res = validatePasswordStrength('SecurePass@NoNum');
    expect(res.isValid).toBe(false);
    expect(res.hasNumber).toBe(false);
    expect(res.errors).toContain('Password must include at least one number (0-9).');
  });

  it('rejects passwords without special symbol', () => {
    const res = validatePasswordStrength('SecurePass1234');
    expect(res.isValid).toBe(false);
    expect(res.hasSymbol).toBe(false);
    expect(res.errors).toContain('Password must include at least one special symbol (!@#$%^&*...).');
  });
});


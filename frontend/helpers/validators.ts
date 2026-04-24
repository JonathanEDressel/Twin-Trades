const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
const USERNAME_REGEX = /^[A-Za-z0-9_]{3,30}$/;
const TICKER_REGEX = /^[A-Z]{1,5}$/;

export function validateEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(value: string): PasswordValidation {
  const errors: string[] = [];
  if (value.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(value)) errors.push('One uppercase letter');
  if (!/[a-z]/.test(value)) errors.push('One lowercase letter');
  if (!/[0-9]/.test(value)) errors.push('One digit');
  if (!/[!@#$%^&*]/.test(value)) errors.push('One special character (!@#$%^&*)');
  return { isValid: errors.length === 0, errors };
}

export function validateUsername(value: string): boolean {
  return USERNAME_REGEX.test(value);
}

export function validateTicker(value: string): boolean {
  return TICKER_REGEX.test(value);
}
